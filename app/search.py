"""Talmud search: exact word, attached-prefix, exact phrase, and KWIC context.

Three ways a query can match a word in the corpus:

1. **Exact** — the query, normalized, equals the word exactly.
2. **With an attached prefix** — the word *ends with* the query. Hebrew and
   Aramaic clitics (ו/ה/ב/כ/ל/מ/ש, and combinations of them) attach to the
   *front* of a word, so "אביי" also has to find "דאביי", "לאביי", "ואביי":
   the query is a suffix of the word, not a prefix of it, despite the
   traditional name for this ("prefix search") describing the grammar being
   matched rather than the string operation used to match it.
3. **Exact phrase** — a query of more than one word matches only that exact
   consecutive sequence.

A comma separates independent queries (OR), each one searched and reported
as its own group — mirroring how משמע/פסוק לשם's search box works, but
without that app's letter-matching custom, which the Talmud has no
equivalent tradition for.
"""

from __future__ import annotations

from dataclasses import dataclass

from .corpus import Corpus, Tractate
from .hebrew import daf_citation, has_hebrew, words

DEFAULT_LIMIT = 50
MAX_LIMIT = 200

DEFAULT_CONTEXT = 5
MIN_CONTEXT = 1
MAX_CONTEXT = 50

# Sefaria's ref-slug convention: spaces in a multi-word title become
# underscores, e.g. "Bava Kamma" -> "Bava_Kamma.5a". Sefaria's own site is
# unreachable from this build environment to verify directly; this matches
# their documented convention -- worth a spot-check once deployed.
def sefaria_url(tractate_en: str, daf: int, amud: str) -> str:
    slug = tractate_en.replace(" ", "_")
    return f"https://www.sefaria.org/{slug}.{daf}{amud}"


@dataclass
class Query:
    """One parsed search term: a word, or a phrase of several."""

    raw: str
    words_norm: tuple[str, ...]

    @classmethod
    def parse(cls, raw: str) -> "Query":
        text = raw.strip()
        if not has_hebrew(text):
            raise ValueError(f"'{raw}' does not contain Hebrew letters")
        normalized = tuple(words(text))
        if not normalized:
            raise ValueError(f"'{raw}' does not contain Hebrew letters")
        return cls(raw=text, words_norm=normalized)

    @property
    def is_phrase(self) -> bool:
        return len(self.words_norm) > 1


@dataclass
class Match:
    """One place in the corpus where a query matched."""

    tractate: Tractate
    start: int    # token position, inclusive
    length: int   # number of tokens the match itself spans
    kind: str     # "exact" | "withPrefix"


# --- Finding matches ---------------------------------------------------------


def find_exact_word(corpus: Corpus, word_norm: str) -> list[Match]:
    return [
        Match(tractate=tr, start=pos, length=1, kind="exact")
        for tr in corpus.tractates
        for pos in tr.by_word.get(word_norm, [])
    ]


def find_with_prefix(corpus: Corpus, word_norm: str) -> list[Match]:
    """Words that end with the query but aren't the query outright.

    A linear scan over each tractate's distinct vocabulary (tens of thousands
    of words, not the ~1.9M-token corpus itself) -- measured at ~18ms across
    the whole corpus for a real query, fast enough to run inline.
    """
    matches = []
    for tr in corpus.tractates:
        for candidate, positions in tr.by_word.items():
            if candidate != word_norm and candidate.endswith(word_norm):
                matches.extend(Match(tractate=tr, start=p, length=1, kind="withPrefix") for p in positions)
    return matches


def find_phrase(corpus: Corpus, words_norm: tuple[str, ...]) -> list[Match]:
    """Consecutive-word matches for a multi-word query."""
    first, rest = words_norm[0], words_norm[1:]
    matches = []
    for tr in corpus.tractates:
        for pos in tr.by_word.get(first, []):
            end = pos + len(words_norm)
            if end > len(tr):
                continue
            if all(tr.tokens[pos + offset] == rest[offset - 1] for offset in range(1, len(words_norm))):
                matches.append(Match(tractate=tr, start=pos, length=len(words_norm), kind="exact"))
    return matches


# --- Proximity (bonus) -------------------------------------------------------


def find_proximity(corpus: Corpus, word_a: str, word_b: str, within: int) -> list[dict]:
    """Pairs of positions where ``word_a`` and ``word_b`` occur within
    ``within`` tokens of each other, in the same tractate, either order.
    """
    results = []
    for tr in corpus.tractates:
        positions_a = tr.by_word.get(word_a, [])
        positions_b = tr.by_word.get(word_b, [])
        if not positions_a or not positions_b:
            continue
        for pa in positions_a:
            for pb in positions_b:
                if pa != pb and abs(pa - pb) <= within:
                    results.append({"tractate": tr, "posA": pa, "posB": pb})
    return results


# --- Context window (KWIC) ---------------------------------------------------


def serialize_match(corpus: Corpus, match: Match, before: int, after: int) -> dict:
    """Shape one match into a KWIC result: context, citation, deep link."""
    tr = match.tractate
    start, end = match.start, match.start + match.length

    context_before = " ".join(tr.tokens_raw[max(0, start - before):start])
    matched_text = " ".join(tr.tokens_raw[start:end])
    context_after = " ".join(tr.tokens_raw[end:end + after])

    daf, amud = tr.token_daf[start], tr.token_amud[start]
    segment = tr.segment_at(start)

    return {
        "kind": match.kind,
        "before": context_before,
        "match": matched_text,
        "after": context_after,
        "tractate": {"he": tr.he, "en": tr.en},
        "seder": {"he": tr.seder_he, "en": tr.seder_en},
        "daf": daf,
        "amud": amud,
        "citation": f"{tr.he} {daf_citation(daf, amud)}",
        "citationEn": f"{tr.en} {daf}{amud}",
        "sefariaUrl": sefaria_url(tr.en, daf, amud),
        "fullParagraph": segment.text,
    }


# --- Entry point -------------------------------------------------------------


def search_one(
    corpus: Corpus,
    query: Query,
    before: int,
    after: int,
    limit: int,
    tractate_filter: str | None = None,
) -> dict:
    """Run one query (a word or a phrase) and shape its result group."""
    if query.is_phrase:
        matches = find_phrase(corpus, query.words_norm)
    else:
        word = query.words_norm[0]
        matches = find_exact_word(corpus, word) + find_with_prefix(corpus, word)

    if tractate_filter:
        matches = [m for m in matches if m.tractate.he == tractate_filter]

    # Exact matches first, then attached-prefix forms; stable within each tier
    # so results read in a consistent order across repeated searches.
    matches.sort(key=lambda m: 0 if m.kind == "exact" else 1)

    total = len(matches)
    shown = matches[:limit]
    return {
        "query": query.raw,
        "isPhrase": query.is_phrase,
        "total": total,
        "exactTotal": sum(1 for m in matches if m.kind == "exact"),
        "prefixTotal": sum(1 for m in matches if m.kind == "withPrefix"),
        "results": [serialize_match(corpus, m, before, after) for m in shown],
    }


def search(
    corpus: Corpus,
    queries: list[Query],
    before: int = DEFAULT_CONTEXT,
    after: int = DEFAULT_CONTEXT,
    limit: int = DEFAULT_LIMIT,
    tractate_filter: str | None = None,
) -> dict:
    """Run every comma-separated query independently (OR)."""
    before = max(MIN_CONTEXT, min(before, MAX_CONTEXT))
    after = max(MIN_CONTEXT, min(after, MAX_CONTEXT))
    limit = max(1, min(limit, MAX_LIMIT))
    return {
        "before": before,
        "after": after,
        "groups": [search_one(corpus, q, before, after, limit, tractate_filter) for q in queries],
    }
