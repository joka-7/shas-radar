"""AI-assisted analysis: find connections across a set of search-result groups.

Optional feature layered on top of the plain-concordance search engine (see
``search.py``) via ModelDispatcher (github.com/joka-7/ModelDispatcher) -- the
same gateway/router pattern used elsewhere: strategy providers, cost-tiered
routing, transparent fallback between them, and a per-tenant token quota.

This is the *one* code path in the app that makes an outbound network call.
Everything else runs off the bundled, offline corpus (see corpus.py), and
that stays true here too: with no provider API key configured in the
environment, ``get_gateway()`` returns ``None`` and the feature quietly
disables itself (``/api/analyze`` answers 503) rather than crash a fresh
clone that hasn't set any AI keys.

Providers are registered one per vendor whose key is actually set --
``GEMINI_API_KEY`` / ``OPENAI_API_KEY`` / ``ANTHROPIC_API_KEY``, any subset,
zero or more of them. Each provider keeps its library-default cost tier
(Gemini=CHEAP, OpenAI=STANDARD, Anthropic=PREMIUM), so the router already
tries the cheaper models first and only escalates on failure -- no extra
wiring needed here for that.
"""

from __future__ import annotations

import functools
import os
from dataclasses import dataclass

from model_dispatcher import (
    CompletionRequest,
    GatewaySettings,
    Message,
    ModelGateway,
    ModelTier,
    ProviderRegistry,
    Role,
    RoutingPolicy,
    TaskComplexity,
    TenantContext,
    TenantId,
    TenantQuota,
)
from model_dispatcher.providers import AnthropicProvider, GeminiProvider, OpenAIProvider

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

# One shared tenant for the whole app -- there's no per-user auth here, so
# quota is a single app-wide budget rather than scoped per visitor.
TENANT_ID = TenantId("shas-radar")

# ModelDispatcher's default routing floor reserves STANDARD+ tier models for
# anything triaged above SIMPLE -- tuned for general agentic/coding work.
# This feature's own prompts are short and capped (MAX_GROUPS x
# MAX_RESULTS_PER_GROUP snippets) and the task itself is modest ("suggest a
# plausible connection"), not premium-only reasoning -- so whichever single
# vendor key an operator happens to set (even just the CHEAP-tier Gemini
# default) should be able to serve it. Only a request the scorer calls
# outright COMPLEX steps up to requiring at least a CHEAP-tier candidate;
# escalation to a pricier registered provider on failure still applies
# on top of this, unaffected by how low the floor is set.
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
    "ran a concordance search for up to {max_groups} separate words or "
    "phrases and is looking at the results side by side. Given only the "
    "excerpts below (a citation plus the words immediately around each "
    "match), suggest what connects the search terms across their "
    "occurrences: a shared sugya, a halachic theme, amoraim/tannaim who "
    "appear together, a recurring dispute, a cross-reference, or a "
    "plausible reason someone would search these together. Be concrete and "
    "point to the tractate/daf you mean. If the excerpts genuinely show no "
    "connection, say so plainly rather than inventing one. Keep the whole "
    "answer under roughly 180 words. The Talmud text itself stays in "
    "Hebrew/Aramaic exactly as given; write your own analysis in {language}."
)


@dataclass(frozen=True, slots=True)
class AnalyzeResult:
    """The model's answer, plus enough provenance to show/debug it."""

    text: str
    provider: str


def _quota() -> TenantQuota:
    """App-wide budget, tunable via env without a code change or redeploy."""
    return TenantQuota(
        requests_per_min=int(os.environ.get("AI_REQUESTS_PER_MIN", "10")),
        tokens_per_min=int(os.environ.get("AI_TOKENS_PER_MIN", "20000")),
        tokens_per_day=int(os.environ.get("AI_TOKENS_PER_DAY", "200000")),
    )


def _build_registry() -> ProviderRegistry:
    """Register one provider per vendor whose API key is actually set.

    A missing key just means that vendor is absent from the registry --
    nothing raises, so the app degrades to "AI feature not configured"
    instead of failing at import/startup time.
    """
    registry = ProviderRegistry()
    if api_key := os.environ.get("GEMINI_API_KEY"):
        registry.register(
            GeminiProvider(model=os.environ.get("GEMINI_MODEL", "gemini-2.5-flash"), api_key=api_key)
        )
    if api_key := os.environ.get("OPENAI_API_KEY"):
        registry.register(
            OpenAIProvider(model=os.environ.get("OPENAI_MODEL", "gpt-4o-mini"), api_key=api_key)
        )
    if api_key := os.environ.get("ANTHROPIC_API_KEY"):
        registry.register(
            AnthropicProvider(model=os.environ.get("ANTHROPIC_MODEL", "claude-opus-4-8"), api_key=api_key)
        )
    return registry


@functools.lru_cache(maxsize=1)
def get_gateway() -> ModelGateway | None:
    """Build the gateway once, on first use -- ``None`` if no key is configured.

    Cached the same way ``corpus.load_corpus()`` is: built once, reused for
    every request, rather than re-registering providers on every call.
    """
    registry = _build_registry()
    if not len(registry):
        return None
    return ModelGateway.create(registry, settings=GatewaySettings(routing=_ROUTING))


def is_configured() -> bool:
    """Whether at least one AI provider is registered."""
    return get_gateway() is not None


def _cap_words(text: str, limit: int = SNIPPET_WORD_CAP) -> str:
    return " ".join(text.split()[:limit])


def _format_groups(groups: list[dict]) -> str:
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
    groups: list[dict], locale: str = "he", *, gateway: ModelGateway | None = None
) -> AnalyzeResult:
    """Ask the configured model what connects ``groups``' search results.

    ``gateway`` is an injection seam for tests (a ``MockProvider``-backed
    gateway); real callers leave it unset and get the app-wide singleton.

    Raises:
        RuntimeError: If no gateway is configured -- callers should check
            ``is_configured()`` first and answer a clean 503 instead.
        model_dispatcher.exceptions.ModelDispatcherError: Any dispatch failure
            (quota, all providers exhausted, etc.) -- these already carry the
            right HTTP status for a web layer to surface as-is.
    """
    active_gateway = gateway if gateway is not None else get_gateway()
    if active_gateway is None:
        raise RuntimeError("no AI provider configured")

    language = _LANGUAGE_NAMES.get(locale, _LANGUAGE_NAMES["he"])
    system = _SYSTEM_PROMPT.format(max_groups=MAX_GROUPS, language=language)

    tenant = TenantContext(tenant_id=TENANT_ID, quota=_quota())
    request = CompletionRequest(
        messages=(
            Message(role=Role.SYSTEM, content=system),
            Message(role=Role.USER, content=_format_groups(groups)),
        ),
        tenant=tenant.tenant_id,
        max_tokens=500,
    )
    result = active_gateway.dispatch(request, tenant)

    served_by = "unknown"
    for step in reversed(result.steps):
        served = next((a.provider_name for a in step.attempts if a.error_class is None), None)
        if served:
            served_by = served
            break

    return AnalyzeResult(text=result.final_message.content or "", provider=served_by)
