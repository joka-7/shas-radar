"""Commentaries shown beside a page but never searched: Steinsaltz and Tosafot.

Rashi is a book in its own right. It is held in memory with a word index so that it
can be searched, which costs several times its text. A commentary that is only ever
read beside a page needs no index, so it is kept as one zip, a member per tractate
(``scripts/build_dataset.py``, ``write_archive``), and a tractate is read from it
when a page of that tractate is first asked for. Only the last few stay in memory.
"""

from __future__ import annotations

import json
import threading
import zipfile
from collections import OrderedDict
from collections.abc import Mapping, Sequence
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from .books import DATA_DIR, BookConfigError, BookError

DEFAULT_CACHE_SIZE = 4


class UnknownCommentaryError(BookError, LookupError):
    """A request named a commentary that does not exist or is not enabled."""


@dataclass(frozen=True)
class StoredCommentary:
    """One display-only commentary: who it is, which book it is on, where its data is."""

    id: str
    he: str
    en: str
    data_file: str  # under data/
    commentary_on: str  # the id of the book whose pages it comments on
    title_prefix: str  # put before a base tractate's English name to get this one's

    @property
    def data_path(self) -> Path:
        """Where the archive is, under ``data/``."""
        return DATA_DIR / self.data_file


KNOWN_COMMENTARIES: tuple[StoredCommentary, ...] = (
    StoredCommentary(
        "steinsaltz", "ביאור שטיינזלץ", "Steinsaltz", "steinsaltz.zip", "bavli", "Steinsaltz on "
    ),
    StoredCommentary("tosafot", "תוספות", "Tosafot", "tosafot.zip", "bavli", "Tosafot on "),
)


@dataclass(frozen=True)
class StoredTractate:
    """One tractate's commentary, by page."""

    he: str
    en: str
    license: str | None
    # (daf, amud) -> the commentary's paragraphs on that page, as (number, text),
    # where number is the 1-based paragraph of the Gemara the text explains.
    pages: Mapping[tuple[int, int], Sequence[tuple[int, str]]]
    # (daf, amud) -> how many paragraph slots the commentary has on that page, empty
    # ones included: what to compare with the Gemara's own paragraph count. Empty for a
    # commentary that records none (Tosafot's lists are trimmed, so a count means nothing).
    slots: Mapping[tuple[int, int], int]


def parse_tractate(member: Mapping[str, Any], default_license: str | None) -> StoredTractate:
    """Shape one tractate member of the archive.

    Args:
        member: The member's JSON, as written by ``write_archive``.
        default_license: The book's license, for a tractate that names none of its own.
    """
    pages: dict[tuple[int, int], list[tuple[int, str]]] = {}
    for section in member["sections"]:
        daf, amud, paragraph, *_ = section["ref"]
        pages.setdefault((daf, amud), []).append((paragraph, section["segments"][0]))
    slots = {(daf, amud): count for daf, amud, count in member.get("slots", [])}
    return StoredTractate(
        he=member["he"],
        en=member["en"],
        license=member.get("license", default_license),
        pages=pages,
        slots=slots,
    )


class CommentaryStore:
    """One commentary's archive, read a tractate at a time."""

    def __init__(
        self, info: StoredCommentary, path: Path | None = None, cache_size: int = DEFAULT_CACHE_SIZE
    ):
        """Open a commentary's archive and read its header.

        Args:
            info: The commentary this archive holds.
            path: The archive; ``info.data_path`` unless a test supplies another.
            cache_size: How many tractates to keep in memory.
        """
        self.info = info
        self._path = path or info.data_path
        self._cache_size = cache_size
        self._lock = threading.Lock()
        self._cache: OrderedDict[str, StoredTractate] = OrderedDict()
        with zipfile.ZipFile(self._path) as archive:
            self.header: dict[str, Any] = json.loads(archive.read("header.json"))
        self._members = {t["en"] for t in self.header["tractates"]}

    def tractate(self, base_en: str) -> StoredTractate | None:
        """The commentary on a base book's tractate, or ``None`` if it has none.

        Args:
            base_en: The base tractate's English name, e.g. ``"Berakhot"``.
        """
        name = self.info.title_prefix + base_en
        if name not in self._members:
            return None
        with self._lock:
            if name in self._cache:
                self._cache.move_to_end(name)
                return self._cache[name]
        # Read outside the lock, so a request for a cached tractate never waits on this
        # read. Two first requests for one tractate may each read it; the second keeps
        # the first's copy.
        with zipfile.ZipFile(self._path) as archive:
            member = json.loads(archive.read(f"{name}.json"))
        tractate = parse_tractate(member, self.header.get("license"))
        with self._lock:
            tractate = self._cache.setdefault(name, tractate)
            self._cache.move_to_end(name)
            while len(self._cache) > self._cache_size:
                self._cache.popitem(last=False)
        return tractate


class CommentaryStores:
    """The enabled display-only commentaries."""

    def __init__(self, enabled: Sequence[StoredCommentary], cache_size: int = DEFAULT_CACHE_SIZE):
        """Open each enabled commentary's archive.

        Args:
            enabled: The commentaries to serve, in the order they should be listed.
            cache_size: How many tractates each keeps in memory.

        Raises:
            BookConfigError: If one is listed twice or its data file is missing.
        """
        ids = [info.id for info in enabled]
        if len(set(ids)) != len(ids):
            raise BookConfigError("a commentary is listed more than once")
        for info in enabled:
            if not info.data_path.is_file():
                raise BookConfigError(f"data file for {info.id!r} is missing: {info.data_path}")
        self._stores = {info.id: CommentaryStore(info, cache_size=cache_size) for info in enabled}

    @classmethod
    def from_environ(cls, environ: Mapping[str, str]) -> CommentaryStores:
        """Build the registry from ``ENABLED_COMMENTARIES`` (comma-separated ids).

        Unset or empty means none.

        Raises:
            BookConfigError: If a listed id is not a known commentary, or the
                resulting set is invalid (see ``__init__``).
        """
        known = {info.id: info for info in KNOWN_COMMENTARIES}
        ids = [part.strip() for part in environ.get("ENABLED_COMMENTARIES", "").split(",")]
        ids = [commentary_id for commentary_id in ids if commentary_id]
        unknown = [commentary_id for commentary_id in ids if commentary_id not in known]
        if unknown:
            raise BookConfigError(
                f"ENABLED_COMMENTARIES names unknown commentaries {unknown}; known: {sorted(known)}"
            )
        return cls([known[commentary_id] for commentary_id in ids])

    def ids(self) -> list[str]:
        """The enabled commentaries' ids, in configured order."""
        return list(self._stores)

    def store(self, commentary_id: str) -> CommentaryStore:
        """The enabled commentary with this id.

        Raises:
            UnknownCommentaryError: If there is no such enabled commentary.
        """
        try:
            return self._stores[commentary_id]
        except KeyError:
            raise UnknownCommentaryError(commentary_id) from None

    def for_book(self, book_id: str) -> list[StoredCommentary]:
        """The enabled commentaries on a book's pages."""
        return [
            store.info for store in self._stores.values() if store.info.commentary_on == book_id
        ]
