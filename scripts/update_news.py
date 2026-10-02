#!/usr/bin/env python3
"""Collect official feeds, analyze with PackyAPI, and publish validated news."""

import argparse
import json
import os
import re
import unicodedata
from pathlib import Path

from analyze_with_packy import analyze, load_local_env, parse_model_json
from fetch_public_sources import collect_sources, write_atomically

PROJECT_ROOT = Path(__file__).resolve().parent.parent


def related_handles(post: dict, people: list[dict]) -> list[str]:
    def normalize(text: str) -> str:
        return "".join(c for c in unicodedata.normalize("NFKD", text.casefold()) if not unicodedata.combining(c))

    text = normalize(post["text"])
    author = normalize(post.get("author", ""))
    related = []
    for person in people:
        names = [normalize(name.strip()) for name in re.split(r"[()]", person["name"]) if name.strip()]
        names = [name for name in names if len(name) >= 4 or re.search(r"[\u4e00-\u9fff]{2}", name)]
        mentioned = any(
            name in text if re.search(r"[\u4e00-\u9fff]", name)
            else re.search(r"(?<!\w)" + re.escape(name) + r"(?!\w)", text)
            for name in names
        )
        handle = normalize(person["handle"])
        if author in names or author.lstrip("@") == handle or mentioned or re.search(r"(?<!\w)@" + re.escape(handle) + r"(?!\w)", text):
            related.append(person["handle"])
    return related


def validate_inputs(posts: list[dict], config: dict) -> None:
    if not posts or len({p["id"] for p in posts}) != len(posts):
        raise ValueError("input must contain unique, non-empty posts")
    people = config["influencers"]
    handles = [p["handle"].casefold() for p in people]
    if len(handles) != len(set(handles)) or any(p["category"] not in config["categories"] for p in people):
        raise ValueError("invalid influencer configuration")
    for post in posts:
        if not all(isinstance(post.get(k), str) and post[k].strip() for k in ["id", "title", "text", "source_name", "source_url"]):
            raise ValueError("post is missing required source fields")
        if not post["source_url"].startswith(("https://", "http://")):
            raise ValueError("source URL must be HTTP or HTTPS")


def build_news(posts: list[dict], analysis: dict, config: dict, fetched_at: str, model: str) -> dict:
    validate_inputs(posts, config)
    parse_model_json(json.dumps(analysis), {p["id"] for p in posts})
    analyzed = {item["id"]: item for item in analysis["items"]}
    people = config["influencers"]
    items = []
    for post in posts:
        item = analyzed[post["id"]]
        items.append({
            "id": post["id"], "title": post["title"],
            "source_name": post["source_name"], "source_url": post["source_url"],
            "author": post.get("author", ""), "published_at": post.get("published_at", ""),
            "category": post["category"], "summary": item["summary"],
            "analysis": item["analysis"], "topics": list(dict.fromkeys(item["topics"])),
            "related_handles": related_handles(post, people),
        })
    return {
        "meta": {"fetched_at": fetched_at, "model": model, "total_items": len(items), "total_influencers": len(people)},
        "categories": config["categories"], "influencers": people, "items": items,
    }


def publish_news(raw: dict, config: dict, output: Path, model: str, batch_size: int = 3) -> dict:
    # Deduplicate feed entries without changing the stable IDs or source attribution.
    posts = []
    seen_ids, seen_urls = set(), set()
    for post in raw["posts"]:
        if post["id"] not in seen_ids and post["source_url"] not in seen_urls:
            posts.append(post)
            seen_ids.add(post["id"])
            seen_urls.add(post["source_url"])
    if raw["meta"].get("errors"):
        raise ValueError("one or more feeds failed; previous news was preserved")
    if not posts:
        raise ValueError("no valid posts; previous news was preserved")
    validate_inputs(posts, config)
    items = []
    for start in range(0, len(posts), batch_size):
        batch = posts[start:start + batch_size]
        result = analyze(batch)
        parse_model_json(json.dumps(result), {p["id"] for p in batch})
        items.extend(result["items"])
    result = build_news(posts, {"items": items}, config, raw["meta"]["fetched_at"], model)
    write_atomically(output, result)
    return result


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, help="reuse a previously collected RSS JSON")
    parser.add_argument("--output", type=Path, default=PROJECT_ROOT / "client/public/data/news.json")
    parser.add_argument("--per-source", type=int, default=3)
    parser.add_argument("--dry-run", action="store_true", help="collect feeds and validate configuration without calling the model or publishing")
    args = parser.parse_args()
    if args.per_source < 1:
        parser.error("--per-source must be positive")
    load_local_env()
    if any(not os.environ.get(k) for k in ["PACKY_API_BASE", "PACKY_API_KEY", "PACKY_MODEL"]):
        raise RuntimeError("PACKY_API_BASE, PACKY_API_KEY and PACKY_MODEL are required")
    config = json.loads((PROJECT_ROOT / "scripts/influencers.json").read_text(encoding="utf-8"))
    raw = json.loads(args.input.read_text(encoding="utf-8")) if args.input else collect_sources(PROJECT_ROOT / "scripts/public_sources.json", args.per_source)
    write_atomically(PROJECT_ROOT / "tmp/public-sources.json", raw)
    validate_inputs(raw["posts"], config)
    if args.dry_run:
        print(f"Dry run: {len(raw['posts'])} posts, {len(config['influencers'])} influencers; no model call or publication")
        return
    result = publish_news(raw, config, args.output, os.environ["PACKY_MODEL"])
    print(f"Published {len(result['items'])} news items to {args.output}")


if __name__ == "__main__":
    import requests
    try:
        main()
    except requests.HTTPError as error:
        raise SystemExit(f"PackyAPI HTTP {error.response.status_code}; previous news was preserved")
