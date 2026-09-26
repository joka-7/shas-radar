"""Tests for app/ai.py -- the optional "find connections" AI feature.

Uses ModelDispatcher's keyless ``MockProvider`` throughout, the same way
ModelDispatcher's own test suite does, so this runs in CI with no API key
and no network call. The "no credential anywhere" path (the state CI itself
is actually in -- no *_API_KEY env vars set, and no BYOK credentials sent)
is covered separately at the API level, right here.
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
    """Build a gateway the same way ai.analyze_connections() does internally
    (routing floor included).

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


@pytest.fixture
def no_server_keys(monkeypatch):
    """Clear every provider's server-side key env var, deterministically.

    CI itself already runs with none of these set, but a real dev machine
    might have one exported -- clearing explicitly makes "no server key"
    tests correct regardless of the ambient environment.
    """
    for env_var in ("GEMINI_API_KEY", "OPENAI_API_KEY", "ANTHROPIC_API_KEY", "GROQ_API_KEY"):
        monkeypatch.delenv(env_var, raising=False)


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

        provider = RecordingProvider(
            "mock:free", tier=ModelTier.FREE, reply="Connected via Rava's teaching."
        )
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

    def test_history_turns_are_appended_after_the_groups_message_in_order(self):
        captured: dict[str, object] = {}

        class RecordingProvider(MockProvider):
            def complete(self, request, *, api_key=None):  # type: ignore[override]
                captured["request"] = request
                return super().complete(request, api_key=api_key)

        provider = RecordingProvider("mock:free", tier=ModelTier.FREE, reply="עוד תשובה.")
        gateway = _make_gateway(provider)
        history = [
            {"role": "assistant", "content": "אביי ורבא נחלקו כאן."},
            {"role": "user", "content": "מה עוד קשור לזה?"},
        ]

        result = ai.analyze_connections(_sample_groups(), gateway=gateway, history=history)

        assert result.text == "עוד תשובה."
        request = captured["request"]
        # system, groups, then the two history turns in order.
        assert [m.role for m in request.messages] == [
            Role.SYSTEM,
            Role.USER,
            Role.ASSISTANT,
            Role.USER,
        ]
        assert request.messages[2].content == "אביי ורבא נחלקו כאן."
        assert request.messages[3].content == "מה עוד קשור לזה?"

    def test_history_is_capped_at_max_history_turns(self):
        captured: dict[str, object] = {}

        class RecordingProvider(MockProvider):
            def complete(self, request, *, api_key=None):  # type: ignore[override]
                captured["request"] = request
                return super().complete(request, api_key=api_key)

        provider = RecordingProvider("mock:free", tier=ModelTier.FREE)
        gateway = _make_gateway(provider)
        history = [
            {"role": "user" if i % 2 else "assistant", "content": f"turn {i}"}
            for i in range(ai.MAX_HISTORY_TURNS + 10)
        ]

        ai.analyze_connections(_sample_groups(), gateway=gateway, history=history)

        request = captured["request"]
        # 2 for system+groups, plus at most MAX_HISTORY_TURNS history messages.
        assert len(request.messages) == 2 + ai.MAX_HISTORY_TURNS

    def test_byok_credentials_are_pooled_into_tenant_metadata(self):
        assert ai._credential_metadata(
            {"gemini": ["k1", "k2"], "openai": [], "anthropic": ["k3"]}
        ) == {
            "user_key:gemini": "k1,k2",
            "user_key:anthropic": "k3",
        }

    def test_byok_key_is_actually_the_one_the_provider_receives(self):
        """End-to-end: a BYOK key for the *matching* vendor family reaches the
        provider's ``complete(api_key=...)`` -- not just present in metadata,
        but actually resolved and threaded through by CredentialResolver."""
        provider = MockProvider("gemini:mock-model", tier=ModelTier.FREE)
        gateway = _make_gateway(provider)

        ai.analyze_connections(
            _sample_groups(), credentials={"gemini": ["user-key-1", "user-key-2"]}, gateway=gateway
        )

        assert provider.received_api_keys == ["user-key-1"]

    def test_quota_exhaustion_raises_the_libraries_own_error(self):
        provider = MockProvider("mock:free", tier=ModelTier.FREE)
        gateway = _make_gateway(provider)

        with pytest.raises(QuotaExceededError):
            for _ in range(50):
                ai.analyze_connections(_sample_groups(), gateway=gateway)

    def test_raises_timeout_error_when_the_dispatch_hangs(self, monkeypatch):
        """ModelDispatcher's provider adapters set no HTTP timeout of their
        own (checked directly against the library's source) -- a stuck
        connection could otherwise hang for as long as the vendor SDK's own
        default allows. This is the ai.py-level guard against that: a slow
        provider.complete() must not out-wait a short deadline."""
        import time

        class SlowProvider(MockProvider):
            def complete(self, request, *, api_key=None):  # type: ignore[override]
                time.sleep(0.5)
                return super().complete(request, api_key=api_key)

        monkeypatch.setenv("AI_REQUEST_DEADLINE_SECONDS", "0.05")
        provider = SlowProvider("mock:free", tier=ModelTier.FREE)
        gateway = _make_gateway(provider)

        with pytest.raises(ai.RequestTimeoutError):
            ai.analyze_connections(_sample_groups(), gateway=gateway)

    def test_raises_no_credential_error_with_nothing_configured(self, no_server_keys):
        with pytest.raises(ai.NoCredentialError):
            ai.analyze_connections(_sample_groups())

    def test_byok_credential_alone_is_enough_without_any_server_key(self, no_server_keys):
        # No gateway injected, no server key -- only a BYOK credential. This
        # exercises the real _build_registry() path (not the test helper
        # above), so it doubles as an integration check that a visitor's own
        # key is sufficient on its own. The real vendor SDK call itself will
        # fail (the key is fake and there's no network in this sandbox), but
        # that's a *different* exception than NoCredentialError -- proving
        # the registry wasn't empty and a real dispatch was attempted.
        with pytest.raises(Exception) as exc_info:
            ai.analyze_connections(_sample_groups(), credentials={"gemini": ["fake-key-not-real"]})
        assert not isinstance(exc_info.value, ai.NoCredentialError)


class TestBuildRegistry:
    def test_raises_with_no_server_key_and_no_credentials(self, no_server_keys):
        # model_dispatcher.byok.build_registry raises rather than handing back
        # an empty registry -- a keyless registry is never valid to dispatch
        # against, so failing here (fail loudly, at the source) replaces what
        # used to be a separate emptiness check in analyze_connections itself.
        with pytest.raises(ai.NoCredentialError):
            ai._build_registry({})

    def test_only_vendors_with_a_key_get_registered(self, no_server_keys, monkeypatch):
        monkeypatch.setenv("OPENAI_API_KEY", "server-side-key")
        registry = ai._build_registry({"anthropic": ["byok-key"]})
        names = {p.name.split(":", 1)[0] for p in registry.all()}
        assert names == {"openai", "anthropic"}
        assert "gemini" not in names

    def test_a_vendor_with_only_a_byok_credential_is_included(self, no_server_keys):
        registry = ai._build_registry({"gemini": ["byok-key"]})
        assert len(registry) == 1
        assert registry.all()[0].name.startswith("gemini:")

    def test_groq_registers_from_a_byok_credential(self, no_server_keys):
        """Groq rides ModelDispatcher's OpenAI-compatible adapter, so its
        provider name still has to start with the family the credential map
        is keyed by -- that is what CredentialResolver matches a BYOK key on."""
        registry = ai._build_registry({"groq": ["byok-key"]})
        assert len(registry) == 1
        assert registry.all()[0].name.startswith("groq:")


class TestServerConfiguredProviders:
    def test_empty_with_no_env_vars_set(self, no_server_keys):
        assert ai.server_configured_providers() == frozenset()

    def test_reflects_whichever_env_vars_are_set(self, no_server_keys, monkeypatch):
        monkeypatch.setenv("GEMINI_API_KEY", "k")
        monkeypatch.setenv("ANTHROPIC_API_KEY", "k")
        assert ai.server_configured_providers() == frozenset({"gemini", "anthropic"})


class TestAnalyzeEndpoint:
    @pytest.fixture
    def client(self):
        return TestClient(app)

    def test_returns_400_no_credential_with_nothing_configured(self, client, no_server_keys):
        response = client.post("/api/analyze", json={"groups": [{"query": "אביי", "results": []}]})

        assert response.status_code == 400
        assert response.json()["code"] == "no_credential"

    def test_maps_timeout_to_504(self, client, monkeypatch):
        def fake_analyze(groups, locale="he", **kw):
            raise ai.RequestTimeoutError("the AI provider did not respond within 30s")

        monkeypatch.setattr(ai, "analyze_connections", fake_analyze)

        response = client.post("/api/analyze", json={"groups": [{"query": "אביי", "results": []}]})

        assert response.status_code == 504
        assert response.json()["code"] == "timeout"

    def test_rejects_more_groups_than_a_search_can_produce(self, client):
        body = {"groups": [{"query": f"q{i}", "results": []} for i in range(6)]}

        response = client.post("/api/analyze", json=body)

        assert response.status_code == 422  # pydantic's own max_length validation

    def test_rejects_an_unknown_credential_provider(self, client):
        body = {
            "groups": [{"query": "a", "results": []}],
            "credentials": [{"provider": "not-a-real-vendor", "apiKeys": ["x"]}],
        }

        response = client.post("/api/analyze", json=body)

        assert response.status_code == 422  # pydantic's Literal validation

    def test_happy_path_end_to_end(self, client, monkeypatch):
        # The endpoint's own wiring (request validation, credential shaping,
        # response shaping) is what's under test here -- ai.analyze_connections
        # itself (prompt building, gateway dispatch) is covered directly by
        # TestAnalyzeConnections above, so it's stubbed out rather than routed
        # through a real MockProvider gateway again.
        captured: dict[str, object] = {}

        def fake_analyze(groups, locale="he", **kw):
            captured.update(kw)
            return ai.AnalyzeResult(text="הקשר: שניהם מדברים על אותה סוגיה.", provider="mock:free")

        monkeypatch.setattr(ai, "analyze_connections", fake_analyze)

        response = client.post(
            "/api/analyze",
            json={
                "groups": _sample_groups(),
                "locale": "he",
                "credentials": [{"provider": "gemini", "apiKeys": ["k1", " k2 ", ""]}],
            },
        )

        assert response.status_code == 200
        body = response.json()
        assert body["connection"] == "הקשר: שניהם מדברים על אותה סוגיה."
        assert body["provider"] == "mock:free"
        # Blank keys dropped, surrounding whitespace trimmed.
        assert captured["credentials"] == {"gemini": ["k1", "k2"]}

    def test_history_is_forwarded_to_analyze_connections(self, client, monkeypatch):
        captured: dict[str, object] = {}

        def fake_analyze(groups, locale="he", **kw):
            captured.update(kw)
            return ai.AnalyzeResult(text="עוד תשובה.", provider="mock:free")

        monkeypatch.setattr(ai, "analyze_connections", fake_analyze)

        response = client.post(
            "/api/analyze",
            json={
                "groups": _sample_groups(),
                "history": [
                    {"role": "assistant", "content": "אביי ורבא נחלקו כאן."},
                    {"role": "user", "content": "מה עוד קשור לזה?"},
                ],
            },
        )

        assert response.status_code == 200
        assert captured["history"] == [
            {"role": "assistant", "content": "אביי ורבא נחלקו כאן."},
            {"role": "user", "content": "מה עוד קשור לזה?"},
        ]

    def test_rejects_more_history_turns_than_a_chat_can_produce(self, client):
        body = {
            "groups": [{"query": "a", "results": []}],
            "history": [{"role": "user", "content": "x"} for _ in range(ai.MAX_HISTORY_TURNS + 1)],
        }

        response = client.post("/api/analyze", json=body)

        assert response.status_code == 422  # pydantic's own max_length validation

    def test_rejects_an_unknown_history_role(self, client):
        body = {
            "groups": [{"query": "a", "results": []}],
            "history": [{"role": "system", "content": "x"}],
        }

        response = client.post("/api/analyze", json=body)

        assert response.status_code == 422  # pydantic's Literal validation


class TestAiStatusEndpoint:
    @pytest.fixture
    def client(self):
        return TestClient(app)

    def test_reports_which_vendors_have_a_server_key(self, client, no_server_keys, monkeypatch):
        monkeypatch.setenv("OPENAI_API_KEY", "k")

        response = client.get("/api/ai-status")

        assert response.status_code == 200
        assert response.json() == {
            "providers": {"gemini": False, "openai": True, "anthropic": False, "groq": False}
        }
