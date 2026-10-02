import json
import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import requests

from analyze_with_packy import analyze, parse_model_json
from fetch_public_sources import parse_feed
from update_news import publish_news, related_handles


PEOPLE = [{"name": "Sam Altman", "handle": "sama", "category": "openai"},
          {"name": "Jie Tang (唐杰)", "handle": "jietang", "category": "leaders"}]
CONFIG = {"influencers": PEOPLE, "categories": {"openai": {}, "leaders": {}}}
ENV = {"PACKY_API_BASE": "https://example.test/v1", "PACKY_API_KEY": "test", "PACKY_MODEL": "test-model"}


def posts(count=1):
    return [{"id": str(i), "title": "Model training", "text": "Sam Altman discusses model training",
             "source_name": "OpenAI News", "author": "", "source_url": f"https://example.test/{i}",
             "category": "official_blog", "published_at": "2026-10-02"} for i in range(count)]


def analyzed(batch):
    return {"items": [{"id": p["id"], "summary": "摘要", "analysis": "分析", "topics": ["LLM"]} for p in batch]}


def response(status, payload):
    result = requests.Response()
    result.status_code = status
    result._content = json.dumps(payload).encode()
    return result


class NewsPipelineTests(unittest.TestCase):
    def test_feed_keeps_real_author_separate_from_source(self):
        feed = '<feed xmlns="http://www.w3.org/2005/Atom"><entry><id>one</id><title>Training</title><author><name>Sam Altman</name></author><link href="https://example.test/one"/><summary>Models</summary></entry></feed>'
        result = parse_feed(feed, {"name": "OpenAI News", "category": "official_blog"}, 1)
        self.assertEqual(result[0]["author"], "Sam Altman")
        self.assertEqual(result[0]["source_name"], "OpenAI News")
        self.assertEqual(result[0]["id"], parse_feed(feed, {"name": "OpenAI News", "category": "official_blog"}, 1)[0]["id"])

    def test_institution_is_not_attributed_to_its_leaders(self):
        self.assertEqual(related_handles({"text": "OpenAI releases a model", "author": "OpenAI News"}, PEOPLE), [])

    def test_explicit_names_and_handles_are_matched(self):
        for text, expected in [("Sam Altman discusses GPUs", ["sama"]), ("@SAMA discusses GPUs", ["sama"]), ("唐杰介绍训练方法", ["jietang"]), ("Sam Altmann discusses GPUs", [])]:
            self.assertEqual(related_handles({"text": text, "author": ""}, PEOPLE), expected)

    def test_invalid_model_results_are_rejected(self):
        valid = analyzed(posts())
        invalid = [{"items": []}, {"items": valid["items"] * 2}, analyzed(posts(2)),
                   {"items": [{"id": "0", "summary": 12, "analysis": None, "topics": []}]},
                   {"items": [{"id": "0", "summary": "摘要", "analysis": "", "topics": [1]}]}]
        for result in invalid:
            with self.subTest(result=result), self.assertRaises(ValueError):
                parse_model_json(json.dumps(result), {"0"})

    def test_success_publishes_source_links_and_people(self):
        raw = {"meta": {"fetched_at": "2026-10-02", "errors": []}, "posts": posts(4)}
        with tempfile.TemporaryDirectory() as directory, patch("update_news.analyze", side_effect=analyzed) as model:
            output = Path(directory) / "news.json"
            result = publish_news(raw, CONFIG, output, "test-model")
            self.assertEqual(model.call_count, 2)
            self.assertEqual(json.loads(output.read_text()), result)
            self.assertEqual(len(result["items"]), 4)
            self.assertEqual(result["items"][0]["related_handles"], ["sama"])
            self.assertEqual(result["items"][0]["source_url"], raw["posts"][0]["source_url"])
            self.assertEqual(result["influencers"], PEOPLE)

    def test_later_batch_failure_preserves_existing_file(self):
        raw = {"meta": {"fetched_at": "2026-10-02", "errors": []}, "posts": posts(4)}
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "news.json"
            output.write_text('{"previous":true}')
            with patch("update_news.analyze", side_effect=[analyzed(posts(3)), requests.HTTPError("failed")]):
                with self.assertRaises(requests.HTTPError):
                    publish_news(raw, CONFIG, output, "test-model")
            self.assertEqual(output.read_text(), '{"previous":true}')

    def test_feed_failure_prevents_model_calls_and_publication(self):
        raw = {"meta": {"fetched_at": "2026-10-02", "errors": [{"source": "failed"}]}, "posts": posts()}
        with tempfile.TemporaryDirectory() as directory, patch("update_news.analyze") as model:
            output = Path(directory) / "news.json"
            with self.assertRaises(ValueError):
                publish_news(raw, CONFIG, output, "test-model")
            model.assert_not_called()
            self.assertFalse(output.exists())

    def test_duplicate_feed_entries_are_analyzed_once(self):
        raw = {"meta": {"fetched_at": "2026-10-02", "errors": []}, "posts": posts() * 2}
        with tempfile.TemporaryDirectory() as directory, patch("update_news.analyze", side_effect=analyzed) as model:
            result = publish_news(raw, CONFIG, Path(directory) / "news.json", "test-model")
            self.assertEqual(len(model.call_args.args[0]), 1)
            self.assertEqual(len(result["items"]), 1)

    def test_transient_error_is_retried(self):
        payload = {"choices": [{"message": {"content": json.dumps(analyzed(posts()))}}]}
        with patch.dict(os.environ, ENV), patch("analyze_with_packy.requests.post", side_effect=[response(503, {}), response(200, payload)]) as post, patch("analyze_with_packy.time.sleep"):
            self.assertEqual(analyze(posts()), analyzed(posts()))
            self.assertEqual(post.call_count, 2)

    def test_permanent_error_is_not_retried(self):
        for status in [400, 401, 403]:
            with self.subTest(status=status), patch.dict(os.environ, ENV), patch("analyze_with_packy.requests.post", return_value=response(status, {})) as post:
                with self.assertRaises(requests.HTTPError):
                    analyze(posts())
                self.assertEqual(post.call_count, 1)


if __name__ == "__main__":
    unittest.main()
