"""Tests for app/ai.py -- the optional "find connections" AI feature.

Uses ModelDispatcher's keyless ``MockProvider`` throughout, the same way
ModelDispatcher's own test suite does, so this runs in CI with no API key
and no network call. The "no provider configured" path (the state CI itself
is actually in -- no *_API_KEY env vars set) is covered separately at the
API level in test_search.py-style fashion, right here.
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient
from model_dispatcher import GatewaySettings, ModelGateway, ModelTier, ProviderRegistry, Role
from model_dispatcher.exceptions import QuotaExceededError
from model_dispatcher.providers import MockProvider

from app import ai
from app.main import app


def _make_gateway(provider) -> ModelGateway:
    """Build a gateway the same way ai.get_gateway() does (routing floor included).

    Using the app's own lowered-floor routing policy here too -- not the
    library's out-of-the-box default -- matters: the library's default floor
    reserves anything above SIMPLE for STANDARD+ tier models, and these tests
    exercise a FREE-tier MockProvider, so a bare ``ModelGateway.create``
    would route zero candidates for ai.py's own (fairly long) system prompt.
    """
    registry = ProviderRegistry()
    registry.register(provider)
    return ModelGateway.create(registry, settings=GatewaySettings(routing=ai._ROUTING))


def _sample_groups() -> list[dict]:
    return [
        {
            "query": "אביי",
            "results": [
                {"citation": "ברכות ג:", "before": "אמר רב יוסף אמר", "match": "אביי", "after": "אמר מאי טעמא"},
            ],
        },
        {
            "query": "רבא",
            "results": [
                {"citation": "ברכות ג:", "before": "ואיתימא", "match": "רבא", "after": "אמר קרא"},
            ],
        },
    ]


class TestAnalyzeConnections:
    def test_returns_the_mock_models_answer(self):
        provider = MockProvider("mock:free", tier=ModelTier.FREE, reply="אביי ורבא נחלקו כאן.")
        gateway = _make_gateway(provider)

        result = ai.analyze_connections(_sample_groups(), locale="he", gateway=gateway)

        assert result.text == "אביי ורבא נחלקו כאן."
        assert result.provider == "mock:free"

    def test_prompt_asks_for_the_requested_language(self):
        captured: dict[str, object] = {}

        class RecordingProvider(MockProvider):
            def complete(self, request, *, api_key=None):  # type: ignore[override]
                captured["request"] = request
                return super().complete(request, api_key=api_key)

        provider = RecordingProvider("mock:free", tier=ModelTier.FREE, reply="Connected via Rava's teaching.")
        gateway = _make_gateway(provider)

        result = ai.analyze_connections(_sample_groups(), locale="en", gateway=gateway)

        assert result.text == "Connected via Rava's teaching."
        request = captured["request"]
        system_message = next(m for m in request.messages if m.role is Role.SYSTEM)
        assert "write your own analysis in English" in system_message.content

    def test_caps_groups_and_results_fed_into_the_prompt(self):
        captured: dict[str, object] = {}

        class RecordingProvider(MockProvider):
            def complete(self, request, *, api_key=None):  # type: ignore[override]
                captured["request"] = request
                return super().complete(request, api_key=api_key)

        # More groups/results than the module's own caps allow.
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
        provider = RecordingProvider("mock:free", tier=ModelTier.FREE)
        gateway = _make_gateway(provider)

        ai.analyze_connections(many_groups, gateway=gateway)

        request = captured["request"]
        user_message = next(m for m in request.messages if m.role is Role.USER)
        assert user_message.content.count("Query:") == ai.MAX_GROUPS
        # Each result line starts with " - (" -- count them for the first group.
        first_block = user_message.content.split("\n\n")[0]
        assert first_block.count("\n- (") == ai.MAX_RESULTS_PER_GROUP

    def test_quota_exhaustion_raises_the_libraries_own_error(self):
        provider = MockProvider("mock:free", tier=ModelTier.FREE)
        gateway = _make_gateway(provider)

        with pytest.raises(QuotaExceededError):
            for _ in range(50):
                ai.analyze_connections(_sample_groups(), gateway=gateway)

    def test_raises_when_no_gateway_is_configured(self):
        with pytest.raises(RuntimeError):
            ai.analyze_connections(_sample_groups(), gateway=None)


class TestIsConfigured:
    def test_false_with_no_provider_api_keys_set(self, monkeypatch):
        for env_var in ("GEMINI_API_KEY", "OPENAI_API_KEY", "ANTHROPIC_API_KEY"):
            monkeypatch.delenv(env_var, raising=False)
        ai.get_gateway.cache_clear()
        try:
            assert ai.is_configured() is False
        finally:
            ai.get_gateway.cache_clear()


class TestAnalyzeEndpoint:
    @pytest.fixture
    def client(self):
        return TestClient(app)

    def test_returns_503_when_unconfigured(self, client, monkeypatch):
        monkeypatch.setattr(ai, "is_configured", lambda: False)

        response = client.post("/api/analyze", json={"groups": [{"query": "אביי", "results": []}]})

        assert response.status_code == 503
        assert response.json()["code"] == "ai_not_configured"

    def test_rejects_more_groups_than_a_search_can_produce(self, client):
        body = {"groups": [{"query": f"q{i}", "results": []} for i in range(6)]}

        response = client.post("/api/analyze", json=body)

        assert response.status_code == 422  # pydantic's own max_length validation

    def test_happy_path_end_to_end(self, client, monkeypatch):
        # The endpoint's own wiring (is_configured() gate, request validation,
        # response shaping) is what's under test here -- ai.analyze_connections
        # itself (prompt building, gateway dispatch) is covered directly by
        # TestAnalyzeConnections above, so it's stubbed out rather than routed
        # through a real MockProvider gateway again.
        monkeypatch.setattr(ai, "is_configured", lambda: True)
        monkeypatch.setattr(
            ai,
            "analyze_connections",
            lambda groups, locale="he", **kw: ai.AnalyzeResult(
                text="הקשר: שניהם מדברים על אותה סוגיה.", provider="mock:free"
            ),
        )

        response = client.post(
            "/api/analyze",
            json={"groups": _sample_groups(), "locale": "he"},
        )

        assert response.status_code == 200
        body = response.json()
        assert body["connection"] == "הקשר: שניהם מדברים על אותה סוגיה."
        assert body["provider"] == "mock:free"
