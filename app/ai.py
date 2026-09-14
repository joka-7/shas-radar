"""AI-assisted analysis: find connections across a set of search-result groups.

Optional feature layered on top of the plain-concordance search engine (see
``search.py``) via ModelDispatcher (github.com/joka-7/ModelDispatcher) -- the
same gateway/router pattern used elsewhere: strategy providers, cost-tiered
routing, transparent fallback between them, and a per-tenant token quota.

This is the *one* code path in the app that makes an outbound network call.
Everything else runs off the bundled, offline corpus (see corpus.py), and
that stays true here too: a fresh clone with no keys set anywhere still runs
the whole app -- this feature just answers ``no_credential`` on that one
endpoint instead of crashing (see ``analyze_connections``).

Two independent sources of credentials, either sufficient on its own:

* **Server keys** -- ``GEMINI_API_KEY`` / ``OPENAI_API_KEY`` /
  ``ANTHROPIC_API_KEY`` env vars, any subset, shared across every visitor
  (this app has no per-user auth, so quota is one app-wide budget, not
  scoped per visitor -- see ``_quota()``).
* **A visitor's own key(s)** ("bring your own key"), pasted into the AI
  settings panel in the UI, sent with the request and never persisted
  server-side.

Registering only the vendors with an available key, mapping BYOK keys onto
tenant metadata, and bounding the dispatch with a hard deadline (no built-in
provider adapter sets a network timeout of its own) are all
``model_dispatcher.byok``'s job now, not this app's -- that wiring used to
be hand-written here; it's exactly the same wiring every other single-backend
BYOK app on top of ModelDispatcher needs, so it now lives in the library
instead. ``_build_registry``/``_credential_metadata``/``NoCredentialError``/
``RequestTimeoutError`` stay as this module's own names (and this module's
public API, per its tests) but delegate straight through.
"""

from __future__ import annotations

import concurrent.futures
import os
from dataclasses import dataclass
from typing import Any

from model_dispatcher import (
    CompletionRequest,
    GatewaySettings,
    Message,
    ModelGateway,
    ModelTier,
    Role,
    RoutingPolicy,
    TaskComplexity,
    TenantContext,
    TenantId,
    TenantQuota,
)
from model_dispatcher.byok import ProviderSpec, dispatch_with_timeout
from model_dispatcher.byok import build_registry as _build_registry_for
from model_dispatcher.byok import configured_providers as _configured_providers
from model_dispatcher.byok import credential_metadata as _credential_metadata
from model_dispatcher.exceptions import DispatchTimeoutError, NoProviderAvailableError
from model_dispatcher.providers import (
    AnthropicProvider,
    GeminiProvider,
    GroqProvider,
    OpenAIProvider,
    ProviderRegistry,
)
from model_dispatcher.quota.store import InMemoryQuotaStore

# Mirrors app/main.py's own MAX_QUERIES -- an analysis request can never cover
# more groups than a single search can produce in the first place. Enforced
# again here (not just trusted from the request body) as defense in depth,
# the same belt-and-suspenders style search.py uses for before/after/limit.
MAX_GROUPS = 5

# Per-group and per-result caps keep the prompt -- and the bill -- small: the
# model only needs enough of each KWIC window to spot a connection, not the
# full page of hits a human would page through in the UI.
MAX_RESULTS_PER_GROUP = 6
SNIPPET_WORD_CAP = 40

# One shared tenant identity for the whole app -- individual visitors are
# distinguished by which credentials *they* supplied (see analyze_connections),
# not by a separate tenant id each, since there's no per-user auth here.
TENANT_ID = TenantId("shas-radar")

# One vendor per entry: the ModelDispatcher provider adapter, the env vars a
# server operator can set (a key, and an optional model override), and the
# default model if no override is given. The dict key doubles as the "family"
# name ModelDispatcher's own CredentialResolver derives from a provider's
# ``name`` (the part before the first ":") -- match it exactly, since that's
# also what a BYOK request's ``credentials[*].provider`` value must equal.
_PROVIDER_SPECS: dict[str, ProviderSpec] = {
    "gemini": ProviderSpec(GeminiProvider, "GEMINI_API_KEY", "GEMINI_MODEL", "gemini-2.5-flash"),
    "openai": ProviderSpec(OpenAIProvider, "OPENAI_API_KEY", "OPENAI_MODEL", "gpt-4o-mini"),
    "anthropic": ProviderSpec(
        AnthropicProvider, "ANTHROPIC_API_KEY", "ANTHROPIC_MODEL", "claude-opus-4-8"
    ),
    # Groq speaks the OpenAI chat-completions shape, so ModelDispatcher's
    # adapter is a thin OpenAIProvider subclass and no extra dependency is
    # needed beyond the `openai` extra already required above. Its free tier
    # is generous enough to be a realistic default for a visitor's own key.
    "groq": ProviderSpec(GroqProvider, "GROQ_API_KEY", "GROQ_MODEL", "openai/gpt-oss-120b"),
}

# Shared across every request (module-level, built once) so the app-wide
# quota actually accumulates across requests rather than resetting whenever
# a fresh registry/gateway is built -- the registry changes per request
# (see _build_registry), the quota bookkeeping does not.
_QUOTA_STORE = InMemoryQuotaStore()

# None of ModelDispatcher's provider adapters set an HTTP timeout on the
# vendor client they construct (checked directly against the library's
# source -- there's no `timeout` knob anywhere in it), so a stuck TCP
# connection or a slow vendor API can otherwise hang for as long as that
# SDK's own default allows (observed live: ~2 minutes before Render's own
# proxy finally cut it, not this app choosing to give up). A dispatch is
# run on this small dedicated pool and bounded with dispatch_with_timeout
# instead, so a hang always surfaces here, fast and on our own terms,
# rather than the visitor just watching a spinner. This still leaves the
# one worker thread running in the background until the underlying socket
# itself eventually errors or completes -- acceptable for this app's
# traffic, not something worth an async rewrite to avoid.
_DEFAULT_DEADLINE_SECONDS = 30.0
_DISPATCH_EXECUTOR = concurrent.futures.ThreadPoolExecutor(
    max_workers=4, thread_name_prefix="ai-dispatch"
)

# Same classes model_dispatcher.byok itself raises -- aliased under the
# names this module (and its tests) have always used, so nothing downstream
# had to change when the registry-building/dispatch wiring moved into the
# library.
NoCredentialError = NoProviderAvailableError
RequestTimeoutError = DispatchTimeoutError


def _deadline_seconds() -> float:
    raw = os.environ.get("AI_REQUEST_DEADLINE_SECONDS")
    if not raw:
        return _DEFAULT_DEADLINE_SECONDS
    try:
        return float(raw)
    except ValueError:
        return _DEFAULT_DEADLINE_SECONDS


# ModelDispatcher's default routing floor reserves STANDARD+ tier models for
# anything triaged above SIMPLE -- tuned for general agentic/coding work.
# This feature's own prompts are short and capped (MAX_GROUPS x
# MAX_RESULTS_PER_GROUP snippets) and the task itself is modest ("suggest a
# plausible connection"), not premium-only reasoning -- so whichever single
# vendor key ends up available (server or BYOK, even just the CHEAP-tier
# Gemini default) should be able to serve it. Only a request the scorer
# calls outright COMPLEX steps up to requiring at least a CHEAP-tier
# candidate; escalation to a pricier available provider on failure still
# applies on top of this, unaffected by how low the floor is set.
_ROUTING = RoutingPolicy(
    complexity_floor={
        TaskComplexity.TRIVIAL: ModelTier.FREE,
        TaskComplexity.SIMPLE: ModelTier.FREE,
        TaskComplexity.MODERATE: ModelTier.FREE,
        TaskComplexity.COMPLEX: ModelTier.CHEAP,
    }
)

_LANGUAGE_NAMES = {"he": "Hebrew", "en": "English", "fr": "French"}

_SYSTEM_PROMPT = (
    "You are a study companion for the Babylonian Talmud (Shas). The user "
    "ran a concordance search for one or more words/phrases (up to "
    "{max_groups} at once) and is looking at the results. Given only the "
    "excerpts below (a citation plus the words immediately around each "
    "match), find what connects them. If there is more than one search "
    "term, suggest what links the terms across their occurrences: a shared "
    "sugya, a halachic theme, amoraim/tannaim who appear together, a "
    "recurring dispute, a cross-reference, or a plausible reason someone "
    "would search these together. If there is only **one** search term, "
    "look instead for a pattern across its own different occurrences below "
    "-- a recurring context it keeps appearing in, a halachic theme, a "
    "particular group of sages who use it a specific way, or a notable "
    "shift in how it's used across tractates. Be concrete and point to the "
    "tractate/daf you mean. If the excerpts genuinely show no connection or "
    "pattern, say so plainly rather than inventing one. Keep the whole "
    "answer under roughly 180 words. The Talmud text itself stays in "
    "Hebrew/Aramaic exactly as given; write your own analysis in {language}."
)


@dataclass(frozen=True, slots=True)
class AnalyzeResult:
    """The model's answer, plus enough provenance to show/debug it."""

    text: str
    provider: str


def server_configured_providers() -> frozenset[str]:
    """Vendor names backed by a server-side key (env var), regardless of BYOK.

    Used by ``GET /api/ai-status`` so the settings UI can tell a visitor
    "no key needed for this one" versus "bring your own" per vendor.
    """
    return _configured_providers(_PROVIDER_SPECS)


def _quota() -> TenantQuota:
    """App-wide budget, tunable via env without a code change or redeploy.

    Applies uniformly regardless of whether a request rides the shared
    server key or a visitor's own -- this protects the *server's* key from
    a runaway client, and BYOK requests are cheap to let through the same
    gate since they cost the app nothing extra to route.
    """
    return TenantQuota(
        requests_per_min=int(os.environ.get("AI_REQUESTS_PER_MIN", "10")),
        tokens_per_min=int(os.environ.get("AI_TOKENS_PER_MIN", "20000")),
        tokens_per_day=int(os.environ.get("AI_TOKENS_PER_DAY", "200000")),
    )


def _build_registry(credentials: dict[str, list[str]]) -> ProviderRegistry:
    """Register only vendors with *some* usable key for this request.

    Thin wrapper over ``model_dispatcher.byok.build_registry`` bound to this
    app's own ``_PROVIDER_SPECS`` -- see that function for what "usable"
    means and why a keyless vendor is left out entirely rather than included
    and left to fail.

    Raises:
        NoCredentialError: If no vendor in ``_PROVIDER_SPECS`` has a server
            key or a visitor-supplied credential.
    """
    return _build_registry_for(_PROVIDER_SPECS, credentials)


def _cap_words(text: str, limit: int = SNIPPET_WORD_CAP) -> str:
    return " ".join(text.split()[:limit])


def _format_groups(groups: list[dict[str, Any]]) -> str:
    """Render each group's query and top results as plain text for the prompt."""
    blocks = []
    for group in groups[:MAX_GROUPS]:
        lines = [f"Query: {group.get('query', '')}"]
        for result in group.get("results", [])[:MAX_RESULTS_PER_GROUP]:
            citation = result.get("citation", "")
            before = _cap_words(result.get("before", ""))
            match = result.get("match", "")
            after = _cap_words(result.get("after", ""))
            lines.append(f"- ({citation}) {before} **{match}** {after}".strip())
        blocks.append("\n".join(lines))
    return "\n\n".join(blocks)


def analyze_connections(
    groups: list[dict[str, Any]],
    locale: str = "he",
    *,
    credentials: dict[str, list[str]] | None = None,
    gateway: ModelGateway | None = None,
) -> AnalyzeResult:
    """Ask the configured model what connects ``groups``' search results.

    ``credentials`` is ``{vendor: [key, ...]}`` for a visitor's own,
    bring-your-own keys (any subset of ``gemini``/``openai``/``anthropic``,
    each optionally pooling more than one key) -- omit or pass ``{}`` to
    rely solely on whatever the server has configured.

    ``gateway`` is an injection seam for tests (a ``MockProvider``-backed
    gateway); real callers leave it unset and get a gateway built fresh from
    ``credentials`` plus whatever the server has configured.

    Raises:
        NoCredentialError: Neither the server nor ``credentials`` has a key
            for any vendor -- callers should answer a fast, cheap error
            instead of letting a doomed request reach a vendor's API.
        RequestTimeoutError: The dispatch didn't finish within
            ``AI_REQUEST_DEADLINE_SECONDS`` (default 30s).
        model_dispatcher.exceptions.ModelDispatcherError: Any dispatch
            failure (quota, bad key, all providers exhausted, etc.) --
            these already carry the right HTTP status for a web layer to
            surface as-is.
    """
    credentials = credentials or {}

    active_gateway = gateway
    if active_gateway is None:
        registry = _build_registry(credentials)
        active_gateway = ModelGateway.create(
            registry, settings=GatewaySettings(routing=_ROUTING), quota_store=_QUOTA_STORE
        )

    language = _LANGUAGE_NAMES.get(locale, _LANGUAGE_NAMES["he"])
    system = _SYSTEM_PROMPT.format(max_groups=MAX_GROUPS, language=language)

    tenant = TenantContext(
        tenant_id=TENANT_ID,
        quota=_quota(),
        metadata=_credential_metadata(credentials),
    )
    request = CompletionRequest(
        messages=(
            Message(role=Role.SYSTEM, content=system),
            Message(role=Role.USER, content=_format_groups(groups)),
        ),
        tenant=tenant.tenant_id,
        max_tokens=500,
    )
    result = dispatch_with_timeout(
        active_gateway,
        request,
        tenant,
        executor=_DISPATCH_EXECUTOR,
        timeout_seconds=_deadline_seconds(),
    )

    served_by = "unknown"
    for step in reversed(result.steps):
        served = next((a.provider_name for a in step.attempts if a.error_class is None), None)
        if served:
            served_by = served
            break

    return AnalyzeResult(text=result.final_message.content or "", provider=served_by)
