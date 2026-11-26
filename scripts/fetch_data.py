#!/usr/bin/env python3
"""
AI Pulse - Data Fetcher
Calls Grok API (Responses API) with X Search to fetch and analyze tweets from AI influencers.
Outputs JSON data files for the static frontend.
Runs once daily at 07:00 Beijing time via GitHub Actions.
"""

import argparse
import hashlib
import json
import os
import re
import sys
import tempfile
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path

import requests

# Configuration
XAI_API_KEY = os.environ.get("XAI_API_KEY", "")
API_BASE = os.environ.get("XAI_API_BASE", "https://api.x.ai/v1").strip().rstrip("/")
MODEL = os.environ.get("XAI_MODEL", "grok-4.7").strip()
OUTPUT_DIR = Path(__file__).parent.parent / "client" / "public" / "data"
SCRIPT_DIR = Path(__file__).resolve().parent
PREVIEW_DIR = SCRIPT_DIR.parent / "handoff" / "output"
POST_URL = re.compile(
    r"https://(?:www\.)?(?:x|twitter)\.com/([A-Za-z0-9_]{1,15}|i/web)"
    r"/status/([1-9][0-9]{14,18})(?:[?#].*)?"
)
X_EPOCH_MS = 1288834974657

# Load influencers config
with open(SCRIPT_DIR / "influencers.json", "r", encoding="utf-8") as f:
    CONFIG = json.load(f)

INFLUENCERS = CONFIG["influencers"]
CATEGORIES = CONFIG["categories"]


def request_grok(endpoint: str, payload: dict, timeout: int) -> dict:
    headers = {"Authorization": f"Bearer {XAI_API_KEY}"}
    for attempt in range(3):
        try:
            response = requests.post(
                f"{API_BASE}/{endpoint}", headers=headers, json=payload,
                timeout=timeout, allow_redirects=False,
            )
        except (requests.Timeout, requests.ConnectionError):
            error = "Grok request timed out or could not connect"
        else:
            status = response.status_code
            if status == 200:
                try:
                    data = response.json()
                except ValueError as exc:
                    raise ValueError("Grok returned invalid JSON") from exc
                if not isinstance(data, dict) or data.get("error"):
                    raise ValueError("Grok returned an error or an invalid response")
                return data
            error = f"Grok {endpoint} returned HTTP {status}"
            if status not in {429, 500, 502, 503, 504}:
                raise RuntimeError(error)
        if attempt == 2:
            raise RuntimeError(error)
        time.sleep(5 * (attempt + 1))


def call_grok(prompt: str, x_handles: list[str] | None = None) -> tuple[str, set[str]]:
    """Return Grok's answer and the X post IDs cited by the search response."""
    tool = {"type": "x_search"}
    if x_handles:
        tool["allowed_x_handles"] = x_handles
    data = request_grok("responses", {
        "model": MODEL,
        "input": prompt,
        "tools": [tool],
        "tool_choice": "required",
        "store": False,
    }, timeout=180)
    output = data.get("output", [])
    if data.get("status", "completed") != "completed" or not any(
        item.get("type") == "x_search_call"
        or (item.get("type") == "custom_tool_call" and (item.get("name") or "").startswith("x_"))
        for item in output
    ):
        raise ValueError("Grok did not complete X Search")
    messages = [
        part for item in output if item.get("type") == "message"
        for part in item.get("content", []) if part.get("type") == "output_text"
    ]
    text = "".join(part.get("text", "") for part in messages).strip()
    if not text:
        raise ValueError("Grok X Search returned no text")
    citations = set()
    for part in messages:
        for source in part.get("annotations") or []:
            match = POST_URL.fullmatch(source.get("url") or "")
            if source.get("type") == "url_citation" and match:
                citations.add(match[2])
    return text, citations


def call_grok_basic(prompt: str) -> str:
    """Format an X Search answer without making another search."""
    data = request_grok("chat/completions", {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": "只按输入整理 JSON，保留已给出的链接，不补充内容。"},
            {"role": "user", "content": prompt},
        ],
    }, timeout=120)
    return data["choices"][0]["message"]["content"]


def parse_json_response(text: str) -> dict | list | None:
    """Try to parse JSON from a response that may contain markdown code blocks."""
    if not isinstance(text, str) or not text:
        return None
    try:
        json_str = text
        if "```json" in json_str:
            json_str = json_str.split("```json")[1].split("```")[0]
        elif "```" in json_str:
            parts = json_str.split("```")
            if len(parts) >= 3:
                json_str = parts[1]
        return json.loads(json_str.strip())
    except json.JSONDecodeError:
        # Try to find JSON object or array in the text
        for start_char, end_char in [("{", "}"), ("[", "]")]:
            start = text.find(start_char)
            if start >= 0:
                depth = 0
                for i in range(start, len(text)):
                    if text[i] == start_char:
                        depth += 1
                    elif text[i] == end_char:
                        depth -= 1
                        if depth == 0:
                            try:
                                return json.loads(text[start:i+1])
                            except json.JSONDecodeError:
                                break
        return None


def make_tweet_id(handle: str, content: str, index: int) -> str:
    """Generate a stable ID for a tweet."""
    return hashlib.md5(f"{handle}_{content}_{index}".encode()).hexdigest()[:12]


def normalize_posts(posts: list, handle: str, citations: set[str], limit: int, top: bool = False) -> list[dict]:
    if not isinstance(posts, list):
        raise ValueError(f"Grok did not return a post list for @{handle}")
    if not limit:
        return []
    verified = {}
    for post in posts:
        if not isinstance(post, dict):
            raise ValueError(f"Grok returned an invalid post for @{handle}")
        url = post.get("tweet_url")
        match = POST_URL.fullmatch(url) if isinstance(url, str) else None
        if not match or match[1].casefold() != handle.casefold() or match[2] not in citations:
            raise ValueError(f"Grok returned a post without a matching account and citation for @{handle}")
        if not all(isinstance(post.get(field), str) and post[field].strip() for field in ("content_summary", "ai_analysis", "engagement")):
            raise ValueError(f"Grok returned an incomplete post for @{handle}")
        topics = post.get("topics")
        if not isinstance(topics, list) or not all(isinstance(topic, str) for topic in topics):
            raise ValueError(f"Grok returned invalid topics for @{handle}")
        post_id = match[2]
        published = datetime.fromtimestamp(((int(post_id) >> 22) + X_EPOCH_MS) / 1000, timezone.utc)
        verified[post_id] = {
            **post,
            "tweet_url": f"https://x.com/{handle}/status/{post_id}",
            "posted_at": published.isoformat(),
        }
    ids = list(verified) if top else sorted(verified, key=int, reverse=True)
    result = []
    for index, post_id in enumerate(ids[:limit]):
        post = verified[post_id]
        summary = post["content_summary"] + ("_top" if top else "")
        result.append({**post, "id": make_tweet_id(handle, summary, index)})
    return result


def fetch_batch_tweets(batch: list[dict], limit: int = 6, top_limit: int = 3) -> dict:
    """Fetch verified recent and top X posts in the original website format."""
    handles = [inf["handle"] for inf in batch]
    names_info = ", ".join(f"@{inf['handle']} ({inf['name']}, {inf['role']})" for inf in batch)
    print(f"  Fetching: {', '.join(handles)}")
    prompt = f"""使用 X Search 搜索这些账号本人发布的帖子：{names_info}。
每个账号最多返回最近 {limit} 条 recent_posts（按时间降序），以及过去六个月内最多 {top_limit} 条最重要的 top_posts（按影响力排序）。
从来源核实发帖人，包含本人回复和引用，排除单纯转发。只使用 X Search 已证实的原帖链接和事实。
保留每个指定账号的条目；确实没有可核实的帖子时，对应列表返回空数组。
用中文写摘要和解读。仅返回 JSON 对象，别在 JSON 文本中插入引用标记。
格式：
{{
  "people": {{
    "<handle>": {{
      "person_summary": "人物近期动态概述",
      "recent_posts": [{{"tweet_url": "https://x.com/<handle>/status/<id>", "content_summary": "内容概述",
        "ai_analysis": "技术背景与影响", "topics": ["话题"], "engagement": "高、中或低"}}],
      "top_posts": [{{"tweet_url": "https://x.com/<handle>/status/<id>", "content_summary": "内容概述",
        "ai_analysis": "技术背景与影响", "topics": ["话题"], "engagement": "高、中或低", "why_top": "重要原因"}}]
    }}
  }}
}}"""
    text, citations = call_grok(prompt, x_handles=handles)
    data = parse_json_response(text)
    if data is None:
        data = parse_json_response(call_grok_basic(f"按以下要求整理已有搜索结果。\n{prompt}\n搜索结果：\n{text}"))
    if not isinstance(data, dict) or not isinstance(data.get("people"), dict):
        raise ValueError("Grok did not return a people object")
    people = {key.lstrip("@").casefold(): value for key, value in data["people"].items()}
    result = {}
    for handle in handles:
        entry = people.get(handle.casefold())
        if not isinstance(entry, dict) or not isinstance(entry.get("person_summary"), str):
            raise ValueError(f"Grok omitted data for @{handle}")
        recent = normalize_posts(entry.get("recent_posts"), handle, citations, limit)
        top_posts = normalize_posts(entry.get("top_posts"), handle, citations, top_limit, top=True)
        result[handle] = {
            "person_summary": entry["person_summary"],
            "recent_posts": recent,
            "top_posts": top_posts,
            "tweets": recent,
        }
    return result


def fetch_academic_projects() -> list:
    """Fetch latest academic AI projects from academic Twitter accounts."""
    academic_handles = [p["handle"] for p in INFLUENCERS if p["category"] == "academic"][:10]

    print("Fetching academic projects...")

    prompt = """请搜索AI学术领域最新的重要论文、开源项目和技术突破。重点关注以下推特账号的分享：指定的学术信源账号

请按以下JSON格式返回结果（直接返回JSON，不要加markdown代码块标记）：
{
  "projects": [
    {
      "title": "项目/论文标题",
      "summary": "项目简要描述（1-2句话）",
      "ai_analysis": "深度解读（3-5句话，解决什么问题、核心创新点、应用场景）",
      "category": "分类（从以下选择：LLM与NLP, 计算机视觉, 图像生成, 视频生成, 音频与语音, 3D视觉, 多模态学习, AI Agent, 具身智能, AI基础设施, AI for Science, 其他）",
      "source_url": "论文/项目链接",
      "arxiv_url": "arXiv链接（如有）",
      "github_url": "GitHub链接（如有）",
      "shared_by": "分享者推特handle（不含@）",
      "published_at": "发布日期",
      "impact_level": "影响力（高/中/低）"
    }
  ]
}

请尽量获取20-30个最新的重要项目，覆盖尽可能多的分类领域。"""

    text, _ = call_grok(prompt, x_handles=academic_handles)
    parsed = parse_json_response(text)
    projects = parsed.get("projects") if isinstance(parsed, dict) else parsed
    if not isinstance(projects, list) or not all(
        isinstance(p, dict) and isinstance(p.get("title"), str) and p["title"].strip()
        for p in projects
    ):
        raise ValueError("Grok returned invalid academic projects")
    for i, proj in enumerate(projects):
        if not proj.get("id"):
            proj["id"] = hashlib.md5(f"academic_{proj['title']}_{i}".encode()).hexdigest()[:12]
    return projects


def fetch_trending_summary() -> dict:
    """Fetch a trending summary of AI news."""
    print("Fetching trending AI summary...")

    prompt = """请搜索过去24小时内AI领域最重要的新闻和趋势动态。

请按以下JSON格式返回结果（直接返回JSON，不要加markdown代码块标记）：
{
  "headline": "今日AI领域最重要的一条新闻标题",
  "summary": "今日AI领域整体动态概述（3-5句话）",
  "hot_topics": [
    {
      "topic": "热门话题名称",
      "description": "话题简述",
      "related_people": ["相关人物handle"]
    }
  ],
  "key_developments": [
    {
      "title": "重要进展标题",
      "description": "进展描述（2-3句话）",
      "source_url": "来源链接（如有）"
    }
  ]
}"""

    text, _ = call_grok(prompt)
    parsed = parse_json_response(text)
    if not isinstance(parsed, dict) or not (
        isinstance(parsed.get("headline"), str) and isinstance(parsed.get("summary"), str)
        and isinstance(parsed.get("hot_topics"), list) and isinstance(parsed.get("key_developments"), list)
    ):
        raise ValueError("Grok returned an invalid trending summary")
    return parsed


def write_json_files(files: dict[Path, dict]) -> None:
    """Stage every JSON file before replacing existing data."""
    directory = next(iter(files)).parent
    directory.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(dir=directory) as temporary:
        staging = Path(temporary)
        for target, data in files.items():
            (staging / target.name).write_text(
                json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
            )
        for target in files:
            (staging / target.name).replace(target)


def main() -> None:
    parser = argparse.ArgumentParser(description="Fetch and analyze X posts with Grok.")
    parser.add_argument("--handle", help="Fetch one configured X account")
    parser.add_argument("--limit", type=int, help="Recent posts per account (default: 1 for preview, 6 for full refresh)")
    parser.add_argument("--output", type=Path, help="Preview JSON file with --handle, otherwise an output directory")
    args = parser.parse_args()
    if args.limit is not None and not 1 <= args.limit <= 10:
        parser.error("--limit must be between 1 and 10")

    people = {}
    for person in INFLUENCERS:
        handle = person["handle"]
        if not re.fullmatch(r"[A-Za-z0-9_]{1,15}", handle) or handle.casefold() in people or person["category"] not in CATEGORIES:
            raise ValueError(f"Invalid or duplicate influencer configuration for @{handle}")
        people[handle.casefold()] = person
    if not people:
        raise ValueError("No influencers are configured")
    if not XAI_API_KEY or not API_BASE or not MODEL:
        raise ValueError("Set XAI_API_KEY and configure XAI_API_BASE and XAI_MODEL as needed")

    now = datetime.now(timezone.utc)
    timestamp = now.isoformat()
    if args.handle:
        person = people.get(args.handle.removeprefix("@").casefold())
        if person is None:
            parser.error("--handle must be listed in scripts/influencers.json")
        handle = person["handle"]
        output = args.output or PREVIEW_DIR / f"{handle}.json"
        if output.resolve().is_relative_to(OUTPUT_DIR.resolve()):
            parser.error("single-account previews need a path outside client/public/data/")
        result = fetch_batch_tweets([person], limit=args.limit or 1, top_limit=0)[handle]
        preview = {**person, **result, "fetched_at": timestamp}
        write_json_files({output: preview})
        print(f"Wrote {len(preview['recent_posts'])} recent posts for @{handle} to {output}")
        return

    output = args.output or OUTPUT_DIR
    roster = list(people.values())
    trending = fetch_trending_summary()
    trending["fetched_at"] = timestamp
    tweets = {}
    for offset in range(0, len(roster), 3):
        batch = roster[offset:offset + 3]
        fetched = fetch_batch_tweets(batch, limit=args.limit or 6)
        for person in batch:
            handle = person["handle"]
            tweets[handle] = {**person, **fetched[handle], "fetched_at": timestamp}
        if offset + 3 < len(roster):
            time.sleep(3)

    if not any(person["recent_posts"] or person["top_posts"] for person in tweets.values()):
        raise ValueError("X Search returned no posts for any configured account")
    academic = fetch_academic_projects()
    write_json_files({
        output / "trending.json": trending,
        output / "tweets.json": {
            "meta": {
                "fetched_at": timestamp,
                "next_update": (now + timedelta(days=1)).isoformat(),
                "total_influencers": len(roster),
                "version": "3.0",
            },
            "categories": CATEGORIES,
            "influencers": tweets,
        },
        output / "academic.json": {
            "meta": {"fetched_at": timestamp, "total_projects": len(academic)},
            "projects": academic,
        },
    })
    print(f"Updated {len(tweets)} influencer entries in {output}")


if __name__ == "__main__":
    try:
        main()
    except (KeyError, OSError, RuntimeError, ValueError) as error:
        sys.exit(f"ERROR: {error}")
