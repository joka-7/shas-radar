"""Tests for app/books.py: the book registry, configuration, and lazy loading."""

import gzip
import threading

import pytest

import app.books as books_module
from app.books import (
    DEFAULT_BOOK,
    KNOWN_BOOKS,
    Book,
    BookConfigError,
    BookLibrary,
    UnknownBookError,
    read_header,
)

BAVLI = KNOWN_BOOKS[0]
MISSING_FILE = Book("ghost", "רוח", "Ghost", "does-not-exist.json.gz")


class TestReadHeader:
    def test_reads_the_real_datasets_descriptive_fields_without_its_tractates(self):
        header = read_header(BAVLI.data_path)
        assert header["book"] == "bavli"
        assert header["citationScheme"] == "daf"
        assert header["tractateCount"] == 37
        assert "tractates" not in header

    def test_rejects_a_file_with_no_header_ahead_of_tractates(self, tmp_path):
        path = tmp_path / "bad.json.gz"
        with gzip.open(path, "wb") as handle:
            handle.write(b'{"book":"x"}')
        with pytest.raises(BookConfigError):
            read_header(path)


class TestBookLibraryConfiguration:
    @pytest.mark.parametrize(
        ("enabled", "default"),
        [
            ([], DEFAULT_BOOK),  # nothing enabled
            ([BAVLI, BAVLI], DEFAULT_BOOK),  # a book listed twice
            ([BAVLI], "mishnah"),  # default is not among the enabled books
            ([BAVLI, MISSING_FILE], DEFAULT_BOOK),  # data file is missing
        ],
    )
    def test_rejects_an_invalid_set_of_books(self, enabled, default):
        with pytest.raises(BookConfigError):
            BookLibrary(enabled, default)

    @pytest.mark.parametrize(
        ("environ", "expected_ids"),
        [
            ({}, ["bavli"]),
            ({"ENABLED_BOOKS": "bavli"}, ["bavli"]),
            ({"ENABLED_BOOKS": " bavli , "}, ["bavli"]),
        ],
    )
    def test_from_environ_reads_enabled_books(self, environ, expected_ids):
        library = BookLibrary.from_environ(environ)
        assert [book.id for book in library.books()] == expected_ids
        assert library.default == DEFAULT_BOOK

    @pytest.mark.parametrize("value", ["nope", "bavli,nope", ""])
    def test_from_environ_rejects_unknown_or_empty_values(self, value):
        with pytest.raises(BookConfigError):
            BookLibrary.from_environ({"ENABLED_BOOKS": value})


class TestBookLibraryLookup:
    def test_unknown_book_raises(self):
        library = BookLibrary([BAVLI])
        with pytest.raises(UnknownBookError):
            library.book("nope")
        with pytest.raises(UnknownBookError):
            library.corpus("nope")

    def test_header_describes_a_book_without_loading_it(self):
        library = BookLibrary([BAVLI])
        assert library.header("bavli")["license"] == "CC-BY-NC"
        assert not library.is_loaded("bavli")


class TestBookLibraryLoading:
    def test_loads_on_first_use_and_returns_the_same_corpus_after(self, monkeypatch):
        loads = []

        def fake_load(path):
            loads.append(path)
            return object()

        monkeypatch.setattr(books_module, "load_corpus", fake_load)
        library = BookLibrary([BAVLI])
        assert not library.is_loaded("bavli")

        first = library.corpus("bavli")

        assert library.is_loaded("bavli")
        assert library.corpus("bavli") is first
        assert loads == [BAVLI.data_path]

    def test_simultaneous_first_requests_load_the_book_once(self, monkeypatch):
        entered = threading.Event()
        release = threading.Event()
        calls = []

        def slow_load(path):
            calls.append(path)
            entered.set()
            release.wait(timeout=5)
            return object()

        monkeypatch.setattr(books_module, "load_corpus", slow_load)
        library = BookLibrary([BAVLI])
        start = threading.Barrier(5)
        seen = []

        def request():
            start.wait()
            seen.append(library.corpus("bavli"))

        threads = [threading.Thread(target=request) for _ in range(4)]
        for thread in threads:
            thread.start()
        start.wait()
        entered.wait(timeout=5)
        release.set()
        for thread in threads:
            thread.join(timeout=5)

        assert len(calls) == 1
        assert len({id(corpus) for corpus in seen}) == 1
