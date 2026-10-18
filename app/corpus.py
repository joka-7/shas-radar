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

Memory matters here in a way it didn't for פסוק לשם: ~1.86M tokens is enough
that the naive version of this -- four plain Python lists, one entry per
token -- overran a 512MB deploy target well before uvicorn even finished
starting (measured: ~557MB for the corpus alone). Two things get that back
under budget, both keyed off the same fact: a token stream is enormously
repetitive (fewer than 7% of raw forms, and fewer than 5% of normalized
forms, are actually distinct):

- ``sys.intern()`` on every token string, so the ~1.86M entries in ``tokens``
  and ``tokens_raw`` collapse to sharing ~125k/~91k actual string objects
  instead of allocating one per occurrence.
- ``array.array`` instead of a plain list for the purely-numeric columns
  (each paragraph's packed location in ``segment_refs``; word positions in
  ``by_word`` fit in an unsigned int), trading a Python object + pointer per
  entry for a few raw bytes.

Together this holds the same corpus in a bit over a third of the memory,
confirmed by measuring ``resource.getrusage`` before and after.
"""

from __future__ import annotations

import array
import bisect
import functools
import gzip
import json
import sys
from pathlib import Path
from typing import Any

from .citation import CITATION_SCHEMES, CitationScheme, Ref, pack_ref, unpack_ref
from .hebrew import tokenize

DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "shas.json.gz"


class Segment:
    """One paragraph of running text and its token range in the tractate's stream."""

    __slots__ = ("end", "start", "text")

    def __init__(self, text: str, start: int, end: int):
        self.text = text
        self.start = start  # token position, inclusive
        self.end = end  # token position, exclusive


class Tractate:
    """One tractate's full token stream, plus the indexes built over it."""

    __slots__ = (
        "by_word",
        "en",
        "he",
        "scheme",
        "seder_en",
        "seder_he",
        "sefaria_title",
        "segment_refs",
        "segment_starts",
        "segments",
        "tokens",
        "tokens_raw",
    )

    def __init__(
        self,
        he: str,
        en: str,
        seder_he: str,
        seder_en: str,
        sefaria_title: str,
        scheme: CitationScheme,
    ):
        self.he = he
        self.en = en
        self.seder_he = seder_he
        self.seder_en = seder_en
        self.sefaria_title = sefaria_title
        self.scheme = scheme

        self.tokens: list[str] = []  # normalized (finals folded), interned
        self.tokens_raw: list[str] = []  # as printed, for display, interned
        self.segments: list[Segment] = []
        # Parallel to `segments`: each paragraph's location, packed (see citation.pack_ref).
        self.segment_refs: array.array[int] = array.array("Q")
        # Parallel to `segments`, kept sorted for bisect: start-position lookup.
        self.segment_starts: list[int] = []

        # word -> sorted array of token positions where it occurs. Built as
        # plain lists in build_index() below, then frozen into array.array.
        self.by_word: dict[str, array.array[int]] = {}

    def __len__(self) -> int:
        return len(self.tokens)

    def add_segment(self, ref: Ref, text: str) -> None:
        """Tokenize one segment and append it to the tractate's stream.

        Raises:
            ValueError: If ``ref`` does not fit this tractate's citation scheme.
        """
        packed = pack_ref(ref, self.scheme.arity)
        start = len(self.tokens)
        for raw, normalized in tokenize(text):
            self.tokens.append(sys.intern(normalized))
            self.tokens_raw.append(sys.intern(raw))
        end = len(self.tokens)
        if end > start:
            self.segments.append(Segment(text, start, end))
            self.segment_starts.append(start)
            self.segment_refs.append(packed)

    def build_index(self) -> None:
        positions: dict[str, list[int]] = {}
        for position, word in enumerate(self.tokens):
            positions.setdefault(word, []).append(position)
        self.by_word = {word: array.array("I", where) for word, where in positions.items()}

    def _segment_index(self, position: int) -> int:
        return max(0, bisect.bisect_right(self.segment_starts, position) - 1)

    def segment_at(self, position: int) -> Segment:
        """The segment (paragraph) containing token `position`."""
        return self.segments[self._segment_index(position)]

    def ref_at(self, position: int) -> Ref:
        """The location of the token at `position`, in this book's own numbering."""
        packed = self.segment_refs[self._segment_index(position)]
        return unpack_ref(packed, self.scheme.arity)

    def ref_fields(self, position: int) -> dict[str, int | str]:
        """Result fields describing the location of the token at `position`."""
        return self.scheme.fields(self.ref_at(position))

    def citation(self, position: int) -> str:
        """The traditional printed citation for the token at `position`."""
        return self.scheme.hebrew(self.he, self.ref_at(position))

    def citation_en(self, position: int) -> str:
        """The English citation for the token at `position`."""
        return self.scheme.english(self.en, self.ref_at(position))

    def sefaria_url(self, position: int) -> str:
        """The Sefaria deep link for the token at `position`."""
        return self.scheme.sefaria_url(self.sefaria_title, self.ref_at(position))


class Corpus:
    """All 37 tractates, indexed for search."""

    def __init__(self, dataset: dict[str, Any]):
        self.source: str = dataset["source"]
        self.license: str = dataset["license"]
        self.word_count: int = dataset["wordCount"]

        scheme_name = dataset["citationScheme"]
        if scheme_name not in CITATION_SCHEMES:
            raise ValueError(f"unknown citation scheme {scheme_name!r}")
        scheme = CITATION_SCHEMES[scheme_name]

        self.tractates: list[Tractate] = []
        for entry in dataset["tractates"]:
            tractate = Tractate(
                entry["he"],
                entry["en"],
                entry["sederHe"],
                entry["seder"],
                entry["sefariaTitle"],
                scheme,
            )
            for section in entry["sections"]:
                ref = tuple(section["ref"])
                for segment_text in section["segments"]:
                    tractate.add_segment(ref, segment_text)
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
