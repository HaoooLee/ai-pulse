#!/usr/bin/env python3
"""
Retry fetching data for influencers with empty post lists.
"""
import json
import sys
import time
from datetime import datetime, timezone

from fetch_data import API_BASE, INFLUENCERS, MODEL, OUTPUT_DIR, XAI_API_KEY, fetch_batch_tweets, write_json_files

def main():
    if not XAI_API_KEY or not API_BASE or not MODEL:
        raise ValueError("Set XAI_API_KEY and configure XAI_API_BASE and XAI_MODEL as needed")

    # Load current data
    tweets_path = OUTPUT_DIR / "tweets.json"
    with open(tweets_path, encoding="utf-8") as f:
        data = json.load(f)

    # Find empty influencers
    empty_influencers = []
    for inf in INFLUENCERS:
        previous = data["influencers"].get(inf["handle"])
        if previous and not previous.get("recent_posts") and not previous.get("top_posts"):
            empty_influencers.append(inf)

    print(f"Found {len(empty_influencers)} influencers with no data")
    if not empty_influencers:
        print("All influencers have data, nothing to retry")
        return

    now = datetime.now(timezone.utc)
    timestamp = now.isoformat()

    # Process in batches of 2 (smaller batches to avoid rate limits)
    batches = []
    for i in range(0, len(empty_influencers), 2):
        batches.append(empty_influencers[i:i+2])

    for i, batch in enumerate(batches):
        print(f"\nRetry Batch {i+1}/{len(batches)}: {[b['handle'] for b in batch]}")
        # Wait between batches to avoid rate limiting
        if i > 0:
            print("  Waiting 60s to avoid rate limits...")
            time.sleep(60)
        
        batch_results = fetch_batch_tweets(batch)
        for handle, posts in batch_results.items():
            if posts["recent_posts"] or posts["top_posts"]:
                data["influencers"][handle].update({**posts, "fetched_at": timestamp})
                print(f"  Got data for @{handle}")
            else:
                print(f"  Still no data for @{handle}")

    write_json_files({tweets_path: data})
    has_data = sum(1 for inf in data["influencers"].values() 
                   if inf.get("recent_posts") or inf.get("top_posts"))
    print(f"\nFinal: {has_data}/{len(data['influencers'])} influencers have data")

if __name__ == "__main__":
    try:
        main()
    except (KeyError, OSError, RuntimeError, ValueError) as error:
        sys.exit(f"ERROR: {error}")
