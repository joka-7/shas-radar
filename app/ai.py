"""AI-assisted analysis: the prompt for finding connections across search results.

Optional feature layered on top of the plain-concordance search engine (see
``search.py``). This server never calls an AI model and never holds a key:
the visitor's browser asks ``POST /api/analyze/prompt`` for the prompt built
here, then sends it to the vendor with the visitor's own key
(frontend/src/browserAi.ts, on modeldispatcher-browser-agent). A visitor
with no key gets the "ask an external AI" links instead. So the operator
never sees a visitor's key or the model's answer, and the prompt stays
defined in one place.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

# Mirrors app/main.py's own MAX_QUERIES -- an analysis request can never cover
# more groups than a single search can produce in the first place. Enforced
# again here (not just trusted from the request body) as defense in depth,
# the same belt-and-suspenders style search.py uses for before/after/limit.
MAX_GROUPS = 5

# Per-group and per-result caps keep the prompt -- and the visitor's bill --
# small: the model only needs enough of each KWIC window to spot a
# connection, not the full page of hits a human would page through.
MAX_RESULTS_PER_GROUP = 6
SNIPPET_WORD_CAP = 40

# Re-checked here too (not just trusted from AnalyzeBody.history's own
# max_length in app/main.py), same belt-and-suspenders reasoning as
# MAX_GROUPS above -- a follow-up conversation in the "continue chatting"
# dialog is resent in full on every turn, so this bounds how much of it
# keeps growing with the prompt.
MAX_HISTORY_TURNS = 20

_LANGUAGE_NAMES = {"he": "Hebrew", "en": "English", "fr": "French"}

_SYSTEM_PROMPT = (
    "You are a study companion for Talmud and Mishnah texts. The user "
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
    "tractate/section you mean. If the excerpts genuinely show no connection or "
    "pattern, say so plainly rather than inventing one. Keep the whole "
    "answer under roughly 180 words. The Talmud text itself stays in "
    "Hebrew/Aramaic exactly as given; write your own analysis in {language}. "
    "Plain prose only -- the app displays this as plain text verbatim, so "
    "no markdown (no **bold**, no *; or -/1. list markers, no # headings)."
)


@dataclass(frozen=True, slots=True)
class AnalysisPrompt:
    """Everything a model needs for one analysis turn, vendor-neutral.

    ``messages`` is the conversation after the system prompt: the formatted
    search groups as the first user turn, then any follow-up history, each
    ``{"role": "user"|"assistant", "content": ...}``.
    """

    system: str
    messages: list[dict[str, str]]


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


def build_prompt(
    groups: list[dict[str, Any]],
    locale: str = "he",
    history: list[dict[str, str]] | None = None,
) -> AnalysisPrompt:
    """Build the analysis prompt for ``groups``, with the same caps either path uses.

    Pure: no keys, no network. ``POST /api/analyze/prompt`` returns this to
    the browser, which sends it to the vendor with the visitor's own key.

    ``history`` is the "continue chatting" follow-up on a prior answer:
    ``[{"role": "assistant"|"user", "content": ...}, ...]``, starting with
    the assistant's own first answer, capped at ``MAX_HISTORY_TURNS``. Any
    role other than ``"assistant"`` is sent as ``"user"``.
    """
    language = _LANGUAGE_NAMES.get(locale, _LANGUAGE_NAMES["he"])
    messages = [{"role": "user", "content": _format_groups(groups)}]
    messages.extend(
        {
            "role": "assistant" if turn.get("role") == "assistant" else "user",
            "content": turn.get("content", ""),
        }
        for turn in (history or [])[:MAX_HISTORY_TURNS]
    )
    return AnalysisPrompt(
        system=_SYSTEM_PROMPT.format(max_groups=MAX_GROUPS, language=language),
        messages=messages,
    )
