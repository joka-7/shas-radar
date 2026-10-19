"""Tests for app/commentary.py: a commentary's comments on one page, on the real data."""

import pytest

from app.books import KNOWN_BOOKS, UnknownBookError
from app.commentary import NoCommentaryError, UnknownTractateError, commentary_on_page
from app.main import library

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
        assert body["comments"][0].keys() == {"ref", "text", "sefariaUrl"}
        assert body["comments"][0]["ref"] == [2, 0, 1, 1]

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
