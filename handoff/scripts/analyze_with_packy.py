#!/usr/bin/env python3
"""Analyze prepared public content with PackyAPI without fetching X data."""

import argparse
import json
import os
import tempfile
from datetime import datetime, timezone
from pathlib import Path

import requests

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_INPUT = PROJECT_ROOT / "scripts" / "packy_sample_posts.json"
DEFAULT_OUTPUT = PROJECT_ROOT / "tmp" / "packy-preview.json"


def load_local_env() -> None:
    env_path = PROJECT_ROOT / ".env"
    if not env_path.exists():
        return

    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def load_posts(path: Path, limit: int) -> list[dict]:
    data = json.loads(path.read_text(encoding="utf-8"))
    posts = data.get("posts")
    if not isinstance(posts, list) or not posts:
        raise ValueError("input must contain a non-empty 'posts' array")

    selected = posts[:limit]
    required = {"id", "author", "text", "source_url"}
    for index, post in enumerate(selected):
        missing = required - post.keys()
        if missing:
            raise ValueError(f"post {index} missing fields: {', '.join(sorted(missing))}")
    return selected


def parse_model_json(content: str) -> dict:
    text = content.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        text = "\n".join(lines[1:-1]).strip()
    result = json.loads(text)
    items = result.get("items")
    if not isinstance(items, list):
        raise ValueError("model response must contain an 'items' array")

    required = {"id", "summary", "analysis", "topics"}
    for index, item in enumerate(items):
        missing = required - item.keys()
        if missing:
            raise ValueError(f"result item {index} missing fields: {', '.join(sorted(missing))}")
        if not isinstance(item["topics"], list):
            raise ValueError(f"result item {index} topics must be an array")
    return result


def analyze(posts: list[dict]) -> dict:
    base_url = os.environ.get("PACKY_API_BASE", "").rstrip("/")
    api_key = os.environ.get("PACKY_API_KEY", "")
    model = os.environ.get("PACKY_MODEL", "")
    if not base_url or not api_key or not model:
        raise RuntimeError("PACKY_API_BASE, PACKY_API_KEY and PACKY_MODEL are required")

    prompt = {
        "task": "分析公开内容并用中文输出严格 JSON，不要使用 Markdown 代码块，不补充输入中不存在的事实。",
        "output_schema": {
            "items": [
                {
                    "id": "保持输入 id",
                    "summary": "一句话摘要",
                    "analysis": "2-3 句影响分析",
                    "topics": ["主题标签"],
                }
            ]
        },
        "posts": posts,
    }
    response = requests.post(
        f"{base_url}/chat/completions",
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        json={
            "model": model,
            "messages": [
                {"role": "system", "content": "你是谨慎的 AI 资讯编辑，只依据输入内容分析。"},
                {"role": "user", "content": json.dumps(prompt, ensure_ascii=False)},
            ],
            "temperature": 0.2,
            "max_tokens": 2000,
        },
        timeout=120,
    )
    response.raise_for_status()
    payload = response.json()
    return parse_model_json(payload["choices"][0]["message"]["content"])


def write_atomically(path: Path, data: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile("w", encoding="utf-8", dir=path.parent, delete=False) as handle:
        json.dump(data, handle, ensure_ascii=False, indent=2)
        handle.write("\n")
        temp_path = Path(handle.name)
    temp_path.replace(path)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--limit", type=int, default=3)
    parser.add_argument("--dry-run", action="store_true", help="validate input and configuration without calling PackyAPI")
    args = parser.parse_args()
    if args.limit < 1:
        parser.error("--limit must be at least 1")

    load_local_env()
    posts = load_posts(args.input, args.limit)
    required_env = ["PACKY_API_BASE", "PACKY_API_KEY", "PACKY_MODEL"]
    missing_env = [name for name in required_env if not os.environ.get(name)]
    if missing_env:
        raise RuntimeError(f"missing environment variables: {', '.join(missing_env)}")

    if args.dry_run:
        print(f"Dry run OK: {len(posts)} posts, model={os.environ['PACKY_MODEL']}, no API request sent")
        return

    result = analyze(posts)
    output = {
        "meta": {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "model": os.environ["PACKY_MODEL"],
            "input_count": len(posts),
        },
        **result,
    }
    write_atomically(args.output, output)
    print(f"Wrote {len(result['items'])} items to {args.output}")


if __name__ == "__main__":
    main()
