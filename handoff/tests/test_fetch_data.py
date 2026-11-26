import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import Mock, patch

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "scripts"))
import fetch_data as pulse


POST_ID = "2118001280048345450"
POST_URL = f"https://x.com/jietang/status/{POST_ID}"
TWEET = {
    "tweet_url": POST_URL,
    "content_summary": "GLM-5.3 已上线 T-Systems",
    "ai_analysis": "模型现在可通过该云平台访问。",
    "topics": ["推理部署"],
    "engagement": "中",
}
FILES = ["tweets.json", "trending.json", "academic.json"]
TRENDING = {"headline": "今日动态", "summary": "摘要", "hot_topics": [], "key_developments": []}


def grok_response(content, citations=()):
    return {
        "status": "completed",
        "output": [
            {"type": "custom_tool_call", "name": "x_keyword_search"},
            {"type": "message", "content": [{
                "type": "output_text",
                "text": json.dumps(content),
                "annotations": [
                    {"type": "url_citation", "url": f"https://x.com/i/status/{post_id}"}
                    for post_id in citations
                ],
            }]},
        ],
    }


def person_result(recent=()):
    return {"person_summary": "近期动态", "recent_posts": list(recent), "top_posts": []}


class NativeFetchTests(unittest.TestCase):
    def test_preview_uses_configured_endpoint_and_verified_post(self):
        reply = Mock(status_code=200)
        reply.json.return_value = grok_response({"people": {"@JIETANG": person_result([TWEET])}}, [POST_ID])
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory) / "jietang.json"
            argv = ["fetch_data.py", "--handle", "jietang", "--limit", "1", "--output", str(target)]
            with patch.object(sys, "argv", argv), patch.multiple(
                pulse, XAI_API_KEY="test-key", API_BASE="https://example.test", MODEL="test-model"
            ), patch("fetch_data.requests.post", return_value=reply) as post:
                pulse.main()
            result = json.loads(target.read_text(encoding="utf-8"))
        self.assertEqual(post.call_count, 1)
        self.assertEqual(post.call_args.args, ("https://example.test/v1/responses",))
        request = post.call_args.kwargs["json"]
        self.assertEqual(request["model"], "test-model")
        self.assertEqual(request["tools"], [{"type": "x_search", "allowed_x_handles": ["jietang"]}])
        self.assertEqual(result["handle"], "jietang")
        self.assertEqual(result["recent_posts"][0]["tweet_url"], POST_URL)
        self.assertEqual(result["recent_posts"][0]["posted_at"], "2026-11-04T15:23:50.381000+00:00")
        self.assertEqual(result["tweets"], result["recent_posts"])

    def test_rejects_uncited_or_wrong_account_posts(self):
        for url, citations in [(POST_URL, set()), (POST_URL.replace("jietang", "other"), {POST_ID})]:
            with self.subTest(url=url, citations=citations):
                with self.assertRaisesRegex(ValueError, "matching account and citation"):
                    pulse.normalize_posts([{**TWEET, "tweet_url": url}], "jietang", citations, 1)

    def test_api_auth_failure_is_reported_without_retrying(self):
        with patch("fetch_data.requests.post", return_value=Mock(status_code=403)) as post:
            with self.assertRaisesRegex(RuntimeError, "HTTP 403"):
                pulse.call_grok("test", ["jietang"])
        post.assert_called_once()

    def test_rejects_an_endpoint_url_before_sending_credentials(self):
        with patch.object(pulse, "API_BASE", "https://example.test/v1/responses"), patch(
            "fetch_data.requests.post"
        ) as post:
            with self.assertRaisesRegex(ValueError, "XAI_API_BASE"):
                pulse.call_grok("test", ["jietang"])
        post.assert_not_called()

    def test_batch_retries_only_the_missing_account(self):
        batch = [p for p in pulse.INFLUENCERS if p["handle"] in {"jietang", "sama"}]
        replies = [grok_response({"people": {"sama": person_result()}}),
                   grok_response({"people": {"jietang": person_result([TWEET])}}, [POST_ID])]
        with patch("fetch_data.request_grok", side_effect=replies) as request:
            result = pulse.fetch_batch_tweets(batch, limit=1, top_limit=0)
        self.assertEqual(set(result), {"sama", "jietang"})
        self.assertEqual(result["jietang"]["recent_posts"][0]["tweet_url"], POST_URL)
        self.assertEqual(request.call_args.args[1]["tools"][0]["allowed_x_handles"], ["jietang"])

    def test_a_new_configured_account_can_be_selected(self):
        person = {"handle": "NewResearcher", "name": "New Researcher",
                  "category": "llm_research", "role": "Research", "highlight": False}
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory) / "preview.json"
            argv = ["fetch_data.py", "--handle", "newresearcher", "--output", str(target)]
            with patch.object(sys, "argv", argv), patch.multiple(
                pulse, XAI_API_KEY="test", INFLUENCERS=[*pulse.INFLUENCERS, person]
            ), patch("fetch_data.fetch_batch_tweets", return_value={"NewResearcher": {
                **person_result(), "tweets": [],
            }}) as fetch:
                pulse.main()
            self.assertEqual(json.loads(target.read_text(encoding="utf-8"))["handle"], "NewResearcher")
        self.assertEqual(fetch.call_args.args, ([person],))

    def test_full_refresh_batches_all_people_and_preserves_original_format(self):
        with tempfile.TemporaryDirectory() as directory, patch.object(
            sys, "argv", ["fetch_data.py"]
        ), patch.multiple(pulse, OUTPUT_DIR=Path(directory), XAI_API_KEY="test"):
            with patch("fetch_data.request_grok", side_effect=self.full_response) as model, patch("fetch_data.time.sleep"):
                pulse.main()
            documents = {name: json.loads((Path(directory) / name).read_text(encoding="utf-8")) for name in FILES}
        data = documents["tweets.json"]
        self.assertEqual(model.call_count, 27)
        self.assertEqual(data["meta"]["total_influencers"], 75)
        self.assertEqual(len(data["influencers"]), 75)
        self.assertEqual(data["influencers"]["jietang"]["tweets"][0]["tweet_url"], POST_URL)
        self.assertIn("headline", documents["trending.json"])
        self.assertEqual(documents["academic.json"]["meta"]["total_projects"], 1)

    def test_late_failure_does_not_replace_any_file(self):
        with tempfile.TemporaryDirectory() as directory, patch.object(
            sys, "argv", ["fetch_data.py", "--output", directory]
        ), patch.multiple(pulse, OUTPUT_DIR=Path(directory), XAI_API_KEY="test"):
            for name in FILES:
                (Path(directory) / name).write_text("previous", encoding="utf-8")
            with patch("fetch_data.request_grok", side_effect=self.full_response), patch(
                "fetch_data.fetch_academic_projects", side_effect=RuntimeError("academic search failed")
            ), patch("fetch_data.time.sleep"):
                with self.assertRaisesRegex(RuntimeError, "academic search failed"):
                    pulse.main()
            for name in FILES:
                self.assertEqual((Path(directory) / name).read_text(encoding="utf-8"), "previous")

    @staticmethod
    def full_response(endpoint, payload, timeout):
        prompt = payload["input"]
        if "最新的重要论文" in prompt:
            return grok_response({"projects": [{"title": "Example"}]})
        if "过去24小时" in prompt:
            return grok_response(TRENDING)
        handles = payload["tools"][0]["allowed_x_handles"]
        result = {handle: person_result([TWEET] if handle == "jietang" else []) for handle in handles}
        return grok_response({"people": result}, [POST_ID] if "jietang" in handles else [])


if __name__ == "__main__":
    unittest.main()
