#!/usr/bin/env python3
"""Collect public AI content from official RSS and Atom feeds."""

import argparse
import hashlib
import html
import json
import re
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from xml.etree import ElementTree

import requests

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_CONFIG = PROJECT_ROOT / "scripts" / "public_sources.json"
DEFAULT_OUTPUT = PROJECT_ROOT / "tmp" / "public-sources.json"
TAG_RE = re.compile(r"<[^>]+>")


def local_name(tag: str) -> str:
    return tag.rsplit("}", 1)[-1].lower()


def first_text(element: ElementTree.Element, names: set[str]) -> str:
    for child in element.iter():
        if local_name(child.tag) in names and child.text:
            return child.text.strip()
    return ""


def entry_link(entry: ElementTree.Element) -> str:
    for child in entry.iter():
        if local_name(child.tag) != "link":
            continue
        href = child.attrib.get("href", "").strip()
        rel = child.attrib.get("rel", "alternate")
        if href and rel in {"alternate", ""}:
            return href
        if child.text and child.text.strip():
            return child.text.strip()
    return ""


def clean_text(value: str) -> str:
    without_tags = TAG_RE.sub(" ", value)
    return " ".join(html.unescape(without_tags).split())


def parse_feed(xml_text: str, source: dict, limit: int) -> list[dict]:
    root = ElementTree.fromstring(xml_text)
    entries = [element for element in root.iter() if local_name(element.tag) in {"item", "entry"}]
    posts = []
    for entry in entries:
        title = clean_text(first_text(entry, {"title"}))
        summary = clean_text(first_text(entry, {"description", "summary", "content"}))
        link = entry_link(entry)
        published = first_text(entry, {"pubdate", "published", "updated"})
        author = first_text(entry, {"creator"})
        for child in entry:
            if local_name(child.tag) == "author":
                author = first_text(child, {"name"}) or (child.text or "").strip() or author
        if not title or not link:
            continue
        raw_id = first_text(entry, {"guid", "id"}) or link
        post_id = hashlib.sha256(f"{source['name']}:{raw_id}".encode()).hexdigest()[:16]
        posts.append(
            {
                "id": post_id,
                "author": author,
                "source_name": source["name"],
                "title": title,
                "text": f"{title}\n\n{summary}".strip()[:6000],
                "source_url": link,
                "published_at": published,
                "category": source["category"],
            }
        )
        if len(posts) >= limit:
            break
    return posts


def fetch_source(source: dict, limit: int) -> list[dict]:
    response = requests.get(
        source["url"],
        headers={"User-Agent": "AI-Pulse/1.0 (+https://github.com/HaoooLee/ai-pulse)"},
        timeout=30,
    )
    response.raise_for_status()
    return parse_feed(response.text, source, limit)


def write_atomically(path: Path, data: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile("w", encoding="utf-8", dir=path.parent, delete=False) as handle:
        json.dump(data, handle, ensure_ascii=False, indent=2)
        handle.write("\n")
        temp_path = Path(handle.name)
    temp_path.replace(path)


def collect_sources(config_path: Path, per_source: int) -> dict:
    config = json.loads(config_path.read_text(encoding="utf-8"))
    sources = config.get("sources")
    if not isinstance(sources, list) or not sources:
        raise ValueError("config must contain a non-empty 'sources' array")

    posts = []
    errors = []
    for source in sources:
        try:
            collected = fetch_source(source, per_source)
            if not collected:
                raise ValueError("feed contains no valid entries")
            posts.extend(collected)
            print(f"{source['name']}: {len(collected)} items")
        except Exception as error:
            errors.append({"source": source.get("name", "unknown"), "error": str(error)})
            print(f"{source.get('name', 'unknown')}: failed: {error}")

    if not posts:
        raise RuntimeError("all public sources failed; previous output was preserved")

    return {
        "meta": {
            "fetched_at": datetime.now(timezone.utc).isoformat(),
            "source_count": len(sources),
            "success_count": len(sources) - len(errors),
            "item_count": len(posts),
            "errors": errors,
        },
        "posts": posts,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--config", type=Path, default=DEFAULT_CONFIG)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--per-source", type=int, default=3)
    args = parser.parse_args()
    if args.per_source < 1:
        parser.error("--per-source must be at least 1")
    output = collect_sources(args.config, args.per_source)
    write_atomically(args.output, output)
    print(f"Wrote {len(output['posts'])} items to {args.output}")


if __name__ == "__main__":
    main()
