"""Tests for app/books.py: the book registry, configuration, and lazy loading."""

import gzip
import re
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
from app.main import library

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
            (
                {"ENABLED_BOOKS": "bavli,yerushalmi,mishnah,tosefta,rashi"},
                ["bavli", "yerushalmi", "mishnah", "tosefta", "rashi"],
            ),
            ({"ENABLED_BOOKS": "mishnah,bavli"}, ["mishnah", "bavli"]),  # order is kept
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


class TestBookLibraryCommentary:
    RASHI = next(b for b in KNOWN_BOOKS if b.id == "rashi")

    def test_finds_the_enabled_book_that_comments_on_another(self):
        library = BookLibrary([BAVLI, self.RASHI])
        assert library.commentary_for("bavli") is self.RASHI

    @pytest.mark.parametrize("enabled", [[BAVLI], [BAVLI, RASHI]])
    def test_a_book_nothing_comments_on_has_none(self, enabled):
        assert BookLibrary(enabled).commentary_for("rashi") is None

    def test_a_commentary_that_is_not_enabled_is_not_offered(self):
        assert BookLibrary([BAVLI]).commentary_for("bavli") is None


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


class TestDatasets:
    """Every shipped dataset, as loaded by the app, holds up its end of the contract."""

    @pytest.mark.parametrize("book_id", [book.id for book in KNOWN_BOOKS])
    def test_header_matches_the_loaded_corpus(self, book_id):
        header = library.header(book_id)
        corpus = library.corpus(book_id)
        assert corpus.book == book_id == header["book"]
        assert len(corpus.tractates) == header["tractateCount"]
        assert corpus.license == header["license"]

    @pytest.mark.parametrize("book_id", [book.id for book in KNOWN_BOOKS])
    def test_tractate_names_are_unique_within_the_book(self, book_id):
        names = [t.he for t in library.corpus(book_id).tractates]
        assert len(set(names)) == len(names)

    @pytest.mark.parametrize("book_id", [book.id for book in KNOWN_BOOKS])
    def test_no_markup_or_entities_survive_in_the_text(self, book_id):
        leftovers = re.compile(r"<[A-Za-z/]|&[A-Za-z#0-9]+;")
        dirty = [
            (t.he, segment.text[:40])
            for t in library.corpus(book_id).tractates
            for segment in t.segments
            if leftovers.search(segment.text)
        ]
        assert dirty == []


class TestRashi:
    def test_the_tractate_whose_license_is_not_allowed_is_left_out_and_recorded(self):
        names = {t.en for t in library.corpus("rashi").tractates}
        assert "Rashi on Sanhedrin" not in names
        assert len(names) == 35
        assert library.header("rashi")["omitted"] == [
            {"tractate": "Rashi on Sanhedrin", "license": "CC-BY-SA"}
        ]
