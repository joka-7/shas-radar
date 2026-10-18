"""The books the app can search, which are enabled, and which are loaded.

Each book is one dataset file (see ``scripts/build_dataset.py``). Only the
default book is loaded at boot; any other enabled book is read the first time
a request asks for it and then stays in memory. Which books are available is
configuration (``ENABLED_BOOKS``), validated when the library is built so a
typo or a missing data file stops the server at startup instead of failing a
visitor's request.
"""

from __future__ import annotations

import gzip
import json
import threading
from collections.abc import Mapping, Sequence
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from .corpus import Corpus, load_corpus

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DEFAULT_BOOK = "bavli"

# The dataset file writes its descriptive fields first and its (large)
# "tractates" list last, so everything up to this marker is a complete JSON
# object once closed -- enough to describe a book without loading it.
_HEADER_END = b',"tractates":'
_HEADER_READ_BYTES = 4096


class BookError(Exception):
    """Base class for errors about the book library."""


class UnknownBookError(BookError, LookupError):
    """A request named a book that does not exist or is not enabled."""


class BookConfigError(BookError, ValueError):
    """The configured set of books is invalid; raised at startup."""


@dataclass(frozen=True)
class Book:
    """One searchable book: who it is, and where its dataset lives."""

    id: str
    he: str
    en: str
    data_file: str

    @property
    def data_path(self) -> Path:
        return DATA_DIR / self.data_file


KNOWN_BOOKS: tuple[Book, ...] = (Book("bavli", "תלמוד בבלי", "Babylonian Talmud", "shas.json.gz"),)


def read_header(path: Path) -> dict[str, Any]:
    """Read a dataset's descriptive fields without parsing the whole file.

    Args:
        path: A dataset written by ``scripts/build_dataset.py``.

    Returns:
        Every field that precedes the ``tractates`` list.

    Raises:
        BookConfigError: If the file does not start with a header followed by
            ``tractates``.
    """
    with gzip.open(path, "rb") as handle:
        head = handle.read(_HEADER_READ_BYTES)
    end = head.find(_HEADER_END)
    if end < 0:
        raise BookConfigError(f"{path}: no dataset header found ahead of 'tractates'")
    header: dict[str, Any] = json.loads(head[:end] + b"}")
    return header


class BookLibrary:
    """The enabled books, loaded lazily and shared by every request."""

    def __init__(self, enabled: Sequence[Book], default: str = DEFAULT_BOOK):
        """
        Args:
            enabled: The books to serve, in the order they should be listed.
            default: The id of the book used when a request names none.

        Raises:
            BookConfigError: If ``enabled`` is empty or repeats an id, the
                default is not among them, or a data file is missing.
        """
        if not enabled:
            raise BookConfigError("at least one book must be enabled")
        self._books = {book.id: book for book in enabled}
        if len(self._books) != len(enabled):
            raise BookConfigError("a book is listed more than once")
        if default not in self._books:
            raise BookConfigError(f"the default book {default!r} must be enabled")
        for book in enabled:
            if not book.data_path.is_file():
                raise BookConfigError(f"data file for {book.id!r} is missing: {book.data_path}")
        self.default = default
        self._locks = {book_id: threading.Lock() for book_id in self._books}
        self._loaded: dict[str, Corpus] = {}
        self._headers: dict[str, dict[str, Any]] = {}

    @classmethod
    def from_environ(cls, environ: Mapping[str, str]) -> BookLibrary:
        """Build the library from ``ENABLED_BOOKS`` (comma-separated ids).

        Unset means just the default book.

        Raises:
            BookConfigError: If a listed id is not a known book, or the
                resulting set is invalid (see ``__init__``).
        """
        known = {book.id: book for book in KNOWN_BOOKS}
        ids = [part.strip() for part in environ.get("ENABLED_BOOKS", DEFAULT_BOOK).split(",")]
        ids = [book_id for book_id in ids if book_id]
        unknown = [book_id for book_id in ids if book_id not in known]
        if unknown:
            raise BookConfigError(
                f"ENABLED_BOOKS names unknown books {unknown}; known: {sorted(known)}"
            )
        return cls([known[book_id] for book_id in ids])

    def books(self) -> list[Book]:
        """The enabled books, in configured order."""
        return list(self._books.values())

    def book(self, book_id: str) -> Book:
        """The enabled book with this id.

        Raises:
            UnknownBookError: If there is no such enabled book.
        """
        try:
            return self._books[book_id]
        except KeyError:
            raise UnknownBookError(book_id) from None

    def header(self, book_id: str) -> dict[str, Any]:
        """The book's descriptive fields (license, source, ...) without loading it."""
        book = self.book(book_id)
        if book.id not in self._headers:
            self._headers[book.id] = read_header(book.data_path)
        return self._headers[book.id]

    def is_loaded(self, book_id: str) -> bool:
        return book_id in self._loaded

    def corpus(self, book_id: str) -> Corpus:
        """The book's corpus, loading it on first use.

        A lock per book keeps two simultaneous first requests from each
        reading the dataset, which would briefly hold two copies in memory.

        Raises:
            UnknownBookError: If there is no such enabled book.
        """
        book = self.book(book_id)
        loaded = self._loaded.get(book.id)
        if loaded is not None:
            return loaded
        with self._locks[book.id]:
            loaded = self._loaded.get(book.id)
            if loaded is None:
                loaded = load_corpus(book.data_path)
                self._loaded[book.id] = loaded
            return loaded
