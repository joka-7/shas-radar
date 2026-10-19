"""Loading and indexing the Talmud corpus.

Each book's corpus is a dataset file under ``data/``, committed to the
repository and built by ``scripts/build_dataset.py``. It is read once, kept in
memory, and never refetched -- the running application makes no network
calls. ``app.books`` decides which datasets are loaded and when.

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
import gzip
import itertools
import json
import sys
from collections.abc import Iterator, Sequence
from pathlib import Path
from typing import Any

from .citation import (
    CITATION_SCHEMES,
    MAX_PART_VALUE,
    CitationScheme,
    Ref,
    pack_ref,
    unpack_ref,
)
from .hebrew import tokenize


class Segment:
    """One paragraph of running text and its token range in the tractate's stream."""

    __slots__ = ("end", "start", "text")

    def __init__(self, text: str, start: int, end: int):
        self.text = text
        self.start = start  # token position, inclusive
        self.end = end  # token position, exclusive


class WordIndex:
    """Where each word occurs, kept as three flat arrays.

    A dict of one ``array.array`` per distinct word costs about 100 bytes of
    object overhead per word before it holds a single position -- more than
    the positions themselves, since over half of a tractate's distinct words
    occur exactly once. Here the sorted distinct words sit in one list, each
    word's slice of one shared positions array is found through an offsets
    array, and a lookup is a binary search.
    """

    __slots__ = ("_first_seen", "_offsets", "_positions", "_words")

    def __init__(self, tokens: Sequence[str]):
        """
        Args:
            tokens: A tractate's normalized token stream, in reading order.
        """
        self._words: list[str] = sorted(set(tokens))
        word_id = {word: index for index, word in enumerate(self._words)}
        ids = [word_id[token] for token in tokens]
        # A stable sort by id keeps each word's positions ascending.
        self._positions: array.array[int] = array.array(
            "I", sorted(range(len(ids)), key=ids.__getitem__)
        )
        counts = [0] * (len(self._words) + 1)
        for index in ids:
            counts[index + 1] += 1
        self._offsets: array.array[int] = array.array("I", itertools.accumulate(counts))
        # Word ids in order of first appearance: the order suffix_matches reports in,
        # so results page the same way they did when this was a dict built in reading order.
        self._first_seen: array.array[int] = array.array(
            "I", sorted(range(len(self._words)), key=lambda i: self._positions[self._offsets[i]])
        )

    def get(self, word: str, default: Sequence[int] = ()) -> Sequence[int]:
        """The ascending token positions of ``word``, or ``default`` if it never occurs."""
        index = bisect.bisect_left(self._words, word)
        if index == len(self._words) or self._words[index] != word:
            return default
        return self._positions[self._offsets[index] : self._offsets[index + 1]]

    def suffix_matches(self, suffix: str) -> Iterator[tuple[str, Sequence[int]]]:
        """Every distinct word that ends with ``suffix`` but is not ``suffix`` itself.

        Words come in order of first appearance. A linear scan over the distinct
        words, not over the token stream.
        """
        for index in self._first_seen:
            word = self._words[index]
            if word != suffix and word.endswith(suffix):
                yield word, self._positions[self._offsets[index] : self._offsets[index + 1]]


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

        # Where each word occurs; built by build_index() once every segment is in.
        self.by_word = WordIndex(())

    def __len__(self) -> int:
        return len(self.tokens)

    def add_segment(self, ref: Ref, text: str) -> None:
        """Tokenize one segment and append it to the tractate's stream.

        Raises:
            ValueError: If ``ref`` does not fit this tractate's citation scheme, or
                comes before the previous segment's (segments are kept in reading
                order, which :meth:`segments_under` relies on).
        """
        packed = pack_ref(ref, self.scheme.arity)
        if self.segment_refs and packed < self.segment_refs[-1]:
            raise ValueError(f"segment {ref} is out of order in {self.en}")
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
        self.by_word = WordIndex(self.tokens)

    def segments_under(self, prefix: Ref) -> list[tuple[Ref, Segment]]:
        """The segments whose location starts with ``prefix``, in reading order.

        Args:
            prefix: The leading parts of a location, e.g. ``(2, 0)`` for every
                segment on daf 2a.

        Raises:
            ValueError: If ``prefix`` is empty or longer than the scheme's refs.
        """
        arity = self.scheme.arity
        if not 1 <= len(prefix) <= arity:
            raise ValueError(f"expected 1 to {arity} parts, got {prefix!r}")
        pad = arity - len(prefix)
        low = pack_ref((*prefix, *([0] * pad)), arity)
        high = pack_ref((*prefix, *([MAX_PART_VALUE] * pad)), arity)
        first = bisect.bisect_left(self.segment_refs, low)
        end = bisect.bisect_right(self.segment_refs, high)
        return [
            (unpack_ref(self.segment_refs[index], arity), self.segments[index])
            for index in range(first, end)
        ]

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
        self.book: str = dataset["book"]
        self.source: str = dataset["source"]
        self.text_source: str = dataset["textSource"]
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

    def tractate_by_en(self, name_en: str) -> Tractate | None:
        return next((t for t in self.tractates if t.en == name_en), None)


def load_corpus(path: Path) -> Corpus:
    """Read and index one dataset file.

    Not cached: ``app.books.BookLibrary`` owns which corpora are loaded.
    """
    with gzip.open(path, "rt", encoding="utf-8") as handle:
        return Corpus(json.load(handle))
