"""Tests for app/commentary.py: a commentary's comments on one page, on the real data."""

import pytest

from app.books import KNOWN_BOOKS, UnknownBookError
from app.commentary import (
    NoCommentaryError,
    PageCommentary,
    StoredPageCommentary,
    UnknownTractateError,
    commentary_for_page,
    commentary_on_page,
    stored_commentary_on_page,
)
from app.commentary_store import UnknownCommentaryError
from app.hebrew import printed_text
from app.main import commentary_stores, library

BERAKHOT = "ברכות"


class TestCommentaryOnPage:
    def test_gives_the_comments_on_that_page_in_reading_order(self):
        page = commentary_on_page(library, "bavli", BERAKHOT, 2, 0)
        assert page.citation == 'רש"י על ברכות ב.'
        assert page.sefaria_url == "https://www.sefaria.org/Rashi_on_Berakhot.2a"
        assert len(page.comments) == 17
        assert all(c.ref[:2] == (2, 0) for c in page.comments)
        assert [c.ref for c in page.comments] == sorted(c.ref for c in page.comments)
        assert page.comments[0].text.startswith("מאימתי קורין את שמע")
        assert page.comments[0].sefaria_url == "https://www.sefaria.org/Rashi_on_Berakhot.2a.1.1"

    def test_the_two_sides_of_a_daf_are_separate(self):
        side_a = commentary_on_page(library, "bavli", BERAKHOT, 2, 0)
        side_b = commentary_on_page(library, "bavli", BERAKHOT, 2, 1)
        assert {c.ref[:2] for c in side_b.comments} == {(2, 1)}
        assert not {c.ref for c in side_a.comments} & {c.ref for c in side_b.comments}

    @pytest.mark.parametrize(
        ("tractate", "daf", "amud", "covered"),
        [
            (BERAKHOT, 900, 1, True),  # past the end of a tractate Rashi covers
            ("תמיד", 2, 0, False),  # not in the export
        ],
    )
    def test_a_page_or_tractate_without_rashi_gives_no_comments_instead_of_an_error(
        self, tractate, daf, amud, covered
    ):
        page = commentary_on_page(library, "bavli", tractate, daf, amud)
        assert page.comments == []
        assert (page.tractate is not None) is covered

    def test_json_shape(self):
        body = commentary_on_page(library, "bavli", BERAKHOT, 2, 0).as_dict()
        assert body["book"] == {
            "id": "rashi",
            "he": "רש״י על הבבלי",
            "en": "Rashi on the Bavli",
        }
        assert body["tractate"] == {"he": 'רש"י על ברכות', "en": "Rashi on Berakhot"}
        assert body["license"] == "Public Domain"
        assert body["comments"][0].keys() == {"ref", "text", "plain", "sefariaUrl"}
        assert body["comments"][0]["ref"] == [2, 0, 1, 1]
        assert body["comments"][0]["plain"] == printed_text(body["comments"][0]["text"])

    @pytest.mark.parametrize(
        ("tractate", "license"),
        [(BERAKHOT, "Public Domain"), ("סנהדרין", "CC-BY-SA"), ("תמיד", None)],
    )
    def test_each_page_reports_the_license_of_the_tractate_it_came_from(self, tractate, license):
        body = commentary_on_page(library, "bavli", tractate, 2, 0).as_dict()
        assert body["license"] == license

    def test_sanhedrin_has_rashi_comments(self):
        page = commentary_on_page(library, "bavli", "סנהדרין", 2, 0)
        assert page.comments and all(c.ref[:2] == (2, 0) for c in page.comments)

    def test_a_tractate_without_rashi_has_null_links_in_the_json(self):
        body = commentary_on_page(library, "bavli", "תמיד", 2, 0).as_dict()
        assert (body["tractate"], body["citation"], body["sefariaUrl"]) == (None, None, None)

    @pytest.mark.parametrize(
        ("book", "tractate", "error"),
        [
            ("nope", BERAKHOT, UnknownBookError),
            ("mishnah", "משנה ברכות", NoCommentaryError),  # nothing comments on it
            ("rashi", 'רש"י על ברכות', NoCommentaryError),
            ("bavli", "not a tractate", UnknownTractateError),
        ],
    )
    def test_rejects_what_it_cannot_answer(self, book, tractate, error):
        with pytest.raises(error):
            commentary_on_page(library, book, tractate, 2, 0)


class TestCommentaryRelationship:
    def test_every_covered_bavli_tractate_has_one_rashi_tractate_and_the_rest_are_known(self):
        bavli = {t.en for t in library.corpus("bavli").tractates}
        rashi = library.book("rashi")
        covered = {t.en.removeprefix(rashi.title_prefix) for t in library.corpus("rashi").tractates}
        assert covered <= bavli
        assert bavli - covered == {"Tamid"}

    def test_only_rashi_comments_on_the_bavli(self):
        assert [b.id for b in KNOWN_BOOKS if b.commentary_on] == ["rashi"]


class TestStoredCommentaryOnPage:
    def test_gives_one_comment_per_paragraph_in_order_with_its_citation(self):
        page = stored_commentary_on_page(
            library, commentary_stores, "steinsaltz", "bavli", BERAKHOT, 2, 0
        )
        assert page.citation == "ביאור שטיינזלץ על ברכות ב."
        assert [c.ref for c in page.comments] == [(2, 0, n) for n in range(1, 15)]
        assert page.comments[1].text.startswith("<b>וחכמים אומרים:</b>")
        assert page.aligned is True

    @pytest.mark.parametrize(
        ("daf", "amud", "comments", "aligned"),
        [
            (2, 0, 14, True),
            (34, 1, 31, False),  # 31 paragraph slots against the Gemara's 32
            (900, 0, 0, True),  # past the end of the tractate: nothing to line up
        ],
    )
    def test_says_whether_a_page_lines_up_with_the_gemaras_paragraphs(
        self, daf, amud, comments, aligned
    ):
        page = stored_commentary_on_page(
            library, commentary_stores, "steinsaltz", "bavli", BERAKHOT, daf, amud
        )
        assert (len(page.comments), page.aligned) == (comments, aligned)

    def test_json_shape(self):
        body = stored_commentary_on_page(
            library, commentary_stores, "steinsaltz", "bavli", BERAKHOT, 2, 0
        ).as_dict()
        assert body.keys() == {
            "book",
            "tractate",
            "citation",
            "sefariaUrl",
            "license",
            "aligned",
            "comments",
        }
        assert body["book"] == {"id": "steinsaltz", "he": "ביאור שטיינזלץ", "en": "Steinsaltz"}
        assert body["tractate"] == {"he": "ביאור שטיינזלץ על ברכות", "en": "Steinsaltz on Berakhot"}
        assert (body["license"], body["sefariaUrl"]) == ("CC-BY-NC", None)
        assert body["comments"][0] == {
            "ref": [2, 0, 1],
            "text": body["comments"][0]["text"],
            "sefariaUrl": None,
        }

    @pytest.mark.parametrize(
        ("commentary", "book", "tractate", "error"),
        [
            ("nope", "bavli", BERAKHOT, UnknownCommentaryError),
            ("steinsaltz", "nope", BERAKHOT, UnknownBookError),
            ("steinsaltz", "mishnah", "משנה ברכות", NoCommentaryError),  # not on that book
            ("steinsaltz", "bavli", "not a tractate", UnknownTractateError),
        ],
    )
    def test_rejects_what_it_cannot_answer(self, commentary, book, tractate, error):
        with pytest.raises(error):
            stored_commentary_on_page(library, commentary_stores, commentary, book, tractate, 2, 0)


class TestCommentaryForPage:
    @pytest.mark.parametrize(
        ("commentary", "kind", "book_id"),
        [
            (None, PageCommentary, "rashi"),  # no commentary named: Rashi, as before
            ("rashi", PageCommentary, "rashi"),
            ("steinsaltz", StoredPageCommentary, "steinsaltz"),
        ],
    )
    def test_serves_the_commentary_asked_for(self, commentary, kind, book_id):
        page = commentary_for_page(library, commentary_stores, "bavli", BERAKHOT, 2, 0, commentary)
        assert isinstance(page, kind)
        assert page.as_dict()["book"]["id"] == book_id

    def test_rejects_a_commentary_that_is_not_enabled(self):
        with pytest.raises(UnknownCommentaryError):
            commentary_for_page(library, commentary_stores, "bavli", BERAKHOT, 2, 0, "nope")
