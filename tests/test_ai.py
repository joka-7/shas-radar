"""Tests for app/ai.py and POST /api/analyze/prompt -- the optional AI feature.

The server only builds the prompt; the visitor's browser sends it to the
vendor with their own key. So everything here is pure -- no key, no network.
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app import ai
from app.main import app


def _sample_groups() -> list[dict]:
    return [
        {
            "query": "אביי",
            "results": [
                {
                    "citation": "ברכות ג:",
                    "before": "אמר רב יוסף אמר",
                    "match": "אביי",
                    "after": "אמר מאי טעמא",
                },
            ],
        },
        {
            "query": "רבא",
            "results": [
                {"citation": "ברכות ג:", "before": "ואיתימא", "match": "רבא", "after": "אמר קרא"},
            ],
        },
    ]


class TestBuildPrompt:
    @pytest.mark.parametrize(
        ("locale", "language"),
        [("en", "English"), ("fr", "French"), ("he", "Hebrew"), ("xx", "Hebrew")],
    )
    def test_asks_for_the_requested_language(self, locale, language):
        prompt = ai.build_prompt(_sample_groups(), locale)

        assert f"write your own analysis in {language}" in prompt.system

    def test_starts_with_the_groups_as_the_only_user_turn(self):
        prompt = ai.build_prompt(_sample_groups())

        assert [m["role"] for m in prompt.messages] == ["user"]
        assert "Query: אביי" in prompt.messages[0]["content"]
        assert "(ברכות ג:) ואיתימא **רבא** אמר קרא" in prompt.messages[0]["content"]

    def test_caps_groups_and_results(self):
        many_groups = [
            {
                "query": f"query{i}",
                "results": [
                    {"citation": f"c{i}-{j}", "before": "x", "match": "y", "after": "z"}
                    for j in range(ai.MAX_RESULTS_PER_GROUP + 3)
                ],
            }
            for i in range(ai.MAX_GROUPS + 3)
        ]

        content = ai.build_prompt(many_groups).messages[0]["content"]

        first_block = content.split("\n\n")[0]
        assert (content.count("Query:"), first_block.count("\n- (")) == (
            ai.MAX_GROUPS,
            ai.MAX_RESULTS_PER_GROUP,
        )

    def test_caps_each_snippet_side_at_the_word_limit(self):
        long_side = " ".join(f"w{i}" for i in range(ai.SNIPPET_WORD_CAP + 10))
        groups = [
            {
                "query": "q",
                "results": [{"citation": "c", "before": long_side, "match": "m", "after": ""}],
            }
        ]

        line = ai.build_prompt(groups).messages[0]["content"].split("\n")[1]

        assert f"w{ai.SNIPPET_WORD_CAP - 1} **m**" in line
        assert f"w{ai.SNIPPET_WORD_CAP} " not in line

    def test_appends_history_in_order_and_sends_any_unknown_role_as_user(self):
        history = [
            {"role": "assistant", "content": "אביי ורבא נחלקו כאן."},
            {"role": "user", "content": "מה עוד קשור לזה?"},
            {"role": "system", "content": "not a real role"},
        ]

        prompt = ai.build_prompt(_sample_groups(), "he", history)

        assert prompt.messages[1:] == [
            {"role": "assistant", "content": "אביי ורבא נחלקו כאן."},
            {"role": "user", "content": "מה עוד קשור לזה?"},
            {"role": "user", "content": "not a real role"},
        ]

    def test_caps_history_at_max_history_turns(self):
        history = [
            {"role": "user" if i % 2 else "assistant", "content": f"turn {i}"}
            for i in range(ai.MAX_HISTORY_TURNS + 10)
        ]

        prompt = ai.build_prompt(_sample_groups(), history=history)

        assert len(prompt.messages) == 1 + ai.MAX_HISTORY_TURNS


class TestAnalyzePromptEndpoint:
    @pytest.fixture
    def client(self):
        return TestClient(app)

    def test_returns_the_prompt(self, client):
        response = client.post(
            "/api/analyze/prompt",
            json={
                "groups": _sample_groups(),
                "locale": "fr",
                "history": [{"role": "assistant", "content": "première réponse"}],
            },
        )

        assert response.status_code == 200
        body = response.json()
        assert "French" in body["system"]
        assert [m["role"] for m in body["messages"]] == ["user", "assistant"]

    @pytest.mark.parametrize(
        "body",
        [
            pytest.param(
                {
                    "groups": [{"query": "a", "results": []}],
                    "credentials": [{"provider": "gemini", "apiKeys": ["x"]}],
                },
                id="a visitor API key (an unknown field) is rejected, not accepted",
            ),
            pytest.param(
                {"groups": [{"query": f"q{i}", "results": []} for i in range(6)]},
                id="more groups than a search can produce",
            ),
            pytest.param({"groups": []}, id="no groups"),
            pytest.param(
                {
                    "groups": [{"query": "a", "results": []}],
                    "history": [
                        {"role": "user", "content": "x"} for _ in range(ai.MAX_HISTORY_TURNS + 1)
                    ],
                },
                id="more history turns than a chat can produce",
            ),
            pytest.param(
                {
                    "groups": [{"query": "a", "results": []}],
                    "history": [{"role": "system", "content": "x"}],
                },
                id="an unknown history role",
            ),
        ],
    )
    def test_rejects_an_invalid_body(self, client, body):
        response = client.post("/api/analyze/prompt", json=body)

        assert response.status_code == 422

    @pytest.mark.parametrize(
        ("method", "path"), [("post", "/api/analyze"), ("get", "/api/ai-status")]
    )
    def test_server_side_ai_endpoints_are_gone(self, client, method, path):
        # The server no longer calls any model; these must not quietly exist.
        response = getattr(client, method)(path)

        assert response.status_code in (404, 405)
