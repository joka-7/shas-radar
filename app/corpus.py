"""Loading and indexing the Talmud corpus.

The corpus lives in ``data/shas.json.gz``, committed to the repository and
built by ``scripts/build_dataset.py``. It is read once at process start, kept
in memory, and never refetched -- the running application makes no network
calls.

Unlike the Tanakh, where "a verse" is a natural, short, citable unit, the
Talmud is continuous running prose -- a segment can be one sentence or one
word. A context-window search needs to be able to reach past a segment's own
boundary, so each tractate is flattened into one long sequential token
stream; a match's context is just a slice of that stream, regardless of which
segment(s) it crosses. Segment boundaries are kept separately, only to serve
the "show full paragraph" expansion.
"""

from __future__ import annotations

import bisect
import functools
import gzip
import json
from pathlib import Path

from .hebrew import daf_citation, tokenize

DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "shas.json.gz"


class Segment:
    """One paragraph of running text: a daf/amud location and its full text."""

    __slots__ = ("daf", "amud", "text", "start", "end")

    def __init__(self, daf: int, amud: str, text: str, start: int, end: int):
        self.daf = daf
        self.amud = amud
        self.text = text
        self.start = start  # token position, inclusive
        self.end = end      # token position, exclusive


class Tractate:
    """One tractate's full token stream, plus the indexes built over it."""

    __slots__ = (
        "he", "en", "seder_he", "seder_en",
        "tokens", "tokens_raw", "token_daf", "token_amud",
        "segments", "segment_starts", "by_word",
    )

    def __init__(self, he: str, en: str, seder_he: str, seder_en: str):
        self.he = he
        self.en = en
        self.seder_he = seder_he
        self.seder_en = seder_en

        self.tokens: list[str] = []       # normalized (finals folded)
        self.tokens_raw: list[str] = []   # as printed, for display
        self.token_daf: list[int] = []
        self.token_amud: list[str] = []
        self.segments: list[Segment] = []
        # Parallel to `segments`, kept sorted for bisect: start-position lookup.
        self.segment_starts: list[int] = []

        # word -> sorted list of token positions where it occurs.
        self.by_word: dict[str, list[int]] = {}

    def __len__(self) -> int:
        return len(self.tokens)

    def add_segment(self, daf: int, amud: str, text: str) -> None:
        """Tokenize one segment and append it to the tractate's stream."""
        start = len(self.tokens)
        for raw, normalized in tokenize(text):
            self.tokens.append(normalized)
            self.tokens_raw.append(raw)
            self.token_daf.append(daf)
            self.token_amud.append(amud)
        end = len(self.tokens)
        if end > start:
            self.segments.append(Segment(daf, amud, text, start, end))
            self.segment_starts.append(start)

    def build_index(self) -> None:
        for position, word in enumerate(self.tokens):
            self.by_word.setdefault(word, []).append(position)

    def segment_at(self, position: int) -> Segment:
        """The segment (paragraph) containing token `position`."""
        index = bisect.bisect_right(self.segment_starts, position) - 1
        return self.segments[max(0, index)]

    def citation(self, position: int) -> str:
        """The traditional printed citation for the token at `position`."""
        return f"{self.he} {daf_citation(self.token_daf[position], self.token_amud[position])}"


class Corpus:
    """All 37 tractates, indexed for search."""

    def __init__(self, dataset: dict):
        self.source: str = dataset["source"]
        self.license: str = dataset["license"]
        self.word_count: int = dataset["wordCount"]

        self.tractates: list[Tractate] = []
        for entry in dataset["tractates"]:
            tractate = Tractate(entry["he"], entry["en"], entry["sederHe"], entry["seder"])
            for page in entry["pages"]:
                for segment_text in page["segments"]:
                    tractate.add_segment(page["daf"], page["amud"], segment_text)
            tractate.build_index()
            self.tractates.append(tractate)

    def __len__(self) -> int:
        return sum(len(t) for t in self.tractates)

    def tractate_by_name(self, name_he: str) -> Tractate | None:
        return next((t for t in self.tractates if t.he == name_he), None)


@functools.lru_cache(maxsize=1)
def load_corpus(path: Path | None = None) -> Corpus:
    """Load and index the corpus. Cached, so this only happens once per process."""
    with gzip.open(path or DATA_PATH, "rt", encoding="utf-8") as handle:
        return Corpus(json.load(handle))
