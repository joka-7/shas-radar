"""Tests for app/reader.py: reading one page of the Bavli, on the real data."""

import pytest
from fastapi.testclient import TestClient

from app.books import UnknownBookError
from app.hebrew import strip_marks, tokenize
from app.main import app, library
from app.reader import (
    HEBREWBOOKS_NUMBERS,
    NotPagedBookError,
    PageNotFoundError,
    TractateNotFoundError,
    page_range,
    page_text,
    print_scan_url,
)

BERAKHOT = "ברכות"


@pytest.fixture(scope="module")
def client():
    return TestClient(app)


class TestPageText:
    def test_gives_the_page_in_reading_order_with_its_citation(self):
        page = page_text(library, "bavli", BERAKHOT, 2, 0)
        assert page.citation == "ברכות ב."
        assert page.sefaria_url == "https://www.sefaria.org/Berakhot.2a"
        opening = [normalized for _, normalized in tokenize(page.segments[0])][:4]
        assert opening == [normalized for _, normalized in tokenize("מאימתי קורין את שמע")]

    def test_the_two_sides_of_a_daf_are_separate(self):
        side_a = page_text(library, "bavli", BERAKHOT, 2, 0)
        side_b = page_text(library, "bavli", BERAKHOT, 2, 1)
        assert set(side_a.segments).isdisjoint(side_b.segments)

    @pytest.mark.parametrize(
        ("tractate", "daf", "amud", "previous", "next"),
        [
            (BERAKHOT, 2, 0, None, (2, 1)),  # the first page has nothing before it
            (BERAKHOT, 2, 1, (2, 0), (3, 0)),  # side b leads on to the next daf
            (BERAKHOT, 3, 0, (2, 1), (3, 1)),  # side a follows the previous daf's side b
            (BERAKHOT, 64, 0, (63, 1), None),  # Berakhot ends at 64a
            ("תמיד", 25, 1, None, (26, 0)),  # a tractate that starts on side b
        ],
    )
    def test_neighbours_are_the_pages_that_have_text(self, tractate, daf, amud, previous, next):
        page = page_text(library, "bavli", tractate, daf, amud)
        assert (page.previous, page.next) == (previous, next)

    @pytest.mark.parametrize(
        ("book", "tractate", "daf", "amud", "error"),
        [
            ("nope", BERAKHOT, 2, 0, UnknownBookError),
            ("bavli", "not a tractate", 2, 0, TractateNotFoundError),
            ("mishnah", "משנה ברכות", 1, 0, NotPagedBookError),
            ("bavli", BERAKHOT, 1, 0, PageNotFoundError),  # before the first page
            ("bavli", BERAKHOT, 64, 1, PageNotFoundError),  # after the last
            ("bavli", BERAKHOT, 900, 0, PageNotFoundError),
        ],
    )
    def test_rejects_what_it_cannot_serve(self, book, tractate, daf, amud, error):
        with pytest.raises(error):
            page_text(library, book, tractate, daf, amud)

    def test_json_shape(self):
        body = page_text(library, "bavli", BERAKHOT, 2, 1).as_dict()
        assert body.keys() == {
            "book",
            "tractate",
            "daf",
            "amud",
            "citation",
            "sefariaUrl",
            "license",
            "segments",
            "plainSegments",
            "printUrl",
            "previous",
            "next",
        }
        assert body["book"] == {"id": "bavli", "he": "תלמוד בבלי", "en": "Babylonian Talmud"}
        assert body["tractate"] == {"he": BERAKHOT, "en": "Berakhot"}
        assert (body["daf"], body["amud"]) == (2, "b")
        assert body["previous"] == {"daf": 2, "amud": "a"}
        assert body["next"] == {"daf": 3, "amud": "a"}
        assert body["plainSegments"] == [strip_marks(segment) for segment in body["segments"]]
        assert body["plainSegments"] != body["segments"]  # the real text has niqqud
        assert body["printUrl"] == "https://hebrewbooks.org/shas.aspx?mesechta=1&daf=2b&format=pdf"

    def test_json_has_null_neighbours_at_the_ends(self):
        first = page_text(library, "bavli", BERAKHOT, 2, 0).as_dict()
        last = page_text(library, "bavli", BERAKHOT, 64, 0).as_dict()
        assert first["previous"] is None
        assert last["next"] is None


class TestPrintScanUrl:
    @pytest.mark.parametrize(
        ("tractate", "daf", "amud", "expected"),
        [
            # The last two are the addresses copied from the site for Sanhedrin 22 and Niddah 2b.
            ("ברכות", 2, 0, "https://hebrewbooks.org/shas.aspx?mesechta=1&daf=2&format=pdf"),
            ("סוכה", 3, 1, "https://hebrewbooks.org/shas.aspx?mesechta=7&daf=3b&format=pdf"),
            ("סנהדרין", 22, 0, "https://hebrewbooks.org/shas.aspx?mesechta=24&daf=22&format=pdf"),
            ("נדה", 2, 1, "https://hebrewbooks.org/shas.aspx?mesechta=37&daf=2b&format=pdf"),
            ("תמיד", 26, 0, None),  # listed on the site, but its pages do not open
        ],
    )
    def test_builds_the_address_with_the_side_in_the_daf_value(self, tractate, daf, amud, expected):
        found = library.corpus("bavli").tractate_by_name(tractate)
        assert found is not None
        assert print_scan_url(found, daf, amud) == expected

    def test_numbers_every_bavli_tractate_but_tamid_once_within_the_sites_range(self):
        tractates = library.corpus("bavli").tractates
        assert {t.en for t in tractates} - HEBREWBOOKS_NUMBERS.keys() == {"Tamid"}
        assert HEBREWBOOKS_NUMBERS.keys() <= {t.en for t in tractates}
        assert len(set(HEBREWBOOKS_NUMBERS.values())) == len(HEBREWBOOKS_NUMBERS)
        assert (
            max(HEBREWBOOKS_NUMBERS.values()) == 37
        )  # mesechta=38 was tried on the site: not found


class TestPageRange:
    @pytest.mark.parametrize(
        ("book", "tractate", "expected"),
        [
            ("bavli", BERAKHOT, ((2, 0), (64, 0))),
            ("bavli", "תמיד", ((25, 1), (33, 1))),  # begins on side b
            ("mishnah", "משנה ברכות", None),  # numbered by chapter, not daf
            ("yerushalmi", "תלמוד ירושלמי ברכות", None),
        ],
    )
    def test_gives_first_and_last_page_of_a_paged_tractate_only(self, book, tractate, expected):
        found = library.corpus(book).tractate_by_name(tractate)
        assert found is not None
        assert page_range(found) == expected


class TestDafEndpoint:
    def test_serves_a_page(self, client):
        response = client.get("/api/daf", params={"tractate": BERAKHOT, "daf": 2, "amud": "a"})
        assert response.status_code == 200
        body = response.json()
        assert body["citation"] == "ברכות ב."
        assert body["segments"] and body["previous"] is None

    @pytest.mark.parametrize(
        ("params", "code"),
        [
            ({"tractate": BERAKHOT, "daf": 2, "amud": "a", "book": "nope"}, "unknown_book"),
            ({"tractate": "nope", "daf": 2, "amud": "a"}, "unknown_tractate"),
            ({"tractate": "משנה ברכות", "daf": 2, "amud": "a", "book": "mishnah"}, "not_paged"),
            ({"tractate": BERAKHOT, "daf": 900, "amud": "a"}, "page_not_found"),
        ],
    )
    def test_reports_what_it_cannot_serve_with_a_code(self, client, params, code):
        response = client.get("/api/daf", params=params)
        assert response.status_code == 400
        assert response.json()["code"] == code

    @pytest.mark.parametrize("amud", ["c", ""])
    def test_rejects_a_side_that_is_not_a_or_b(self, client, amud):
        response = client.get("/api/daf", params={"tractate": BERAKHOT, "daf": 2, "amud": amud})
        assert response.status_code == 422


class TestTractatesEndpointPageRange:
    @pytest.mark.parametrize(
        ("book", "expected"),
        [
            ("bavli", {"first": {"daf": 2, "amud": "a"}, "last": {"daf": 64, "amud": "a"}}),
            ("mishnah", None),
        ],
    )
    def test_lists_the_page_range_of_a_paged_book_only(self, client, book, expected):
        body = client.get("/api/tractates", params={"book": book}).json()
        assert body["tractates"][0]["pageRange"] == expected
