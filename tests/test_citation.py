"""Tests for app/citation.py: ref packing and the folio citation scheme."""

import pytest

from app.citation import CITATION_SCHEMES, ChapterScheme, DafScheme, pack_ref, unpack_ref


class TestPackRef:
    @pytest.mark.parametrize(
        ("ref", "arity"),
        [
            ((2, 0), 2),
            ((176, 1), 2),
            ((0, 0), 2),
            ((65535, 65535), 2),
            ((1, 2, 3), 3),
            ((7, 0, 65535, 1), 4),
            ((9,), 1),
        ],
    )
    def test_round_trips(self, ref, arity):
        assert unpack_ref(pack_ref(ref, arity), arity) == ref

    @pytest.mark.parametrize(
        ("ref", "arity"),
        [
            ((1,), 2),  # too few parts for the scheme
            ((1, 2, 3), 2),  # too many parts for the scheme
            ((65536, 0), 2),  # part does not fit in 16 bits
            ((-1, 0), 2),  # negative part
            ((1, 2, 3, 4, 5), 5),  # more parts than can be packed
            ((), 0),  # empty
        ],
    )
    def test_rejects_refs_that_do_not_fit(self, ref, arity):
        with pytest.raises(ValueError):
            pack_ref(ref, arity)


class TestDafScheme:
    scheme = DafScheme()

    def test_registered_under_the_name_the_dataset_uses(self):
        assert isinstance(CITATION_SCHEMES["daf"], DafScheme)

    @pytest.mark.parametrize(
        ("ref", "hebrew", "english", "url", "fields"),
        [
            (
                (2, 0),
                "ברכות ב.",
                "Berakhot 2a",
                "https://www.sefaria.org/Berakhot.2a",
                {"daf": 2, "amud": "a"},
            ),
            (
                (30, 1),
                "ברכות ל:",
                "Berakhot 30b",
                "https://www.sefaria.org/Berakhot.30b",
                {"daf": 30, "amud": "b"},
            ),
        ],
    )
    def test_cites_a_folio(self, ref, hebrew, english, url, fields):
        assert self.scheme.hebrew("ברכות", ref) == hebrew
        assert self.scheme.english("Berakhot", ref) == english
        assert self.scheme.sefaria_url("Berakhot", ref) == url
        assert self.scheme.fields(ref) == fields

    def test_multi_word_titles_use_underscores_in_the_link(self):
        assert (
            self.scheme.sefaria_url("Bava Kamma", (5, 0)) == "https://www.sefaria.org/Bava_Kamma.5a"
        )

    def test_arity_is_two(self):
        assert self.scheme.arity == 2


class TestChapterScheme:
    pair = CITATION_SCHEMES["chapter"]
    triple = CITATION_SCHEMES["chapter-segment"]

    @pytest.mark.parametrize(
        ("ref", "hebrew", "english", "url", "fields"),
        [
            (
                (1, 1),
                "משנה ברכות א:א",
                "Mishnah Berakhot 1:1",
                "https://www.sefaria.org/Mishnah_Berakhot.1.1",
                {"chapter": 1, "section": 1},
            ),
            (
                (3, 15),  # 15 is written ט״ו, not יה
                "משנה ברכות ג:ט״ו",
                "Mishnah Berakhot 3:15",
                "https://www.sefaria.org/Mishnah_Berakhot.3.15",
                {"chapter": 3, "section": 15},
            ),
        ],
    )
    def test_cites_a_chapter_and_section(self, ref, hebrew, english, url, fields):
        assert self.pair.hebrew("משנה ברכות", ref) == hebrew
        assert self.pair.english("Mishnah Berakhot", ref) == english
        assert self.pair.sefaria_url("Mishnah Berakhot", ref) == url
        assert self.pair.fields(ref) == fields

    def test_a_third_part_is_in_the_link_but_not_the_printed_citation(self):
        ref = (2, 3, 4)
        assert self.triple.hebrew("תלמוד ירושלמי ברכות", ref) == "תלמוד ירושלמי ברכות ב:ג"
        assert self.triple.english("Jerusalem Talmud Berakhot", ref) == (
            "Jerusalem Talmud Berakhot 2:3"
        )
        assert self.triple.sefaria_url("Jerusalem Talmud Berakhot", ref) == (
            "https://www.sefaria.org/Jerusalem_Talmud_Berakhot.2.3.4"
        )
        assert self.triple.fields(ref) == {"chapter": 2, "section": 3, "segment": 4}

    @pytest.mark.parametrize(("scheme", "arity"), [(pair, 2), (triple, 3)])
    def test_arity(self, scheme, arity):
        assert scheme.arity == arity

    @pytest.mark.parametrize("arity", [0, 1, 4])
    def test_rejects_an_arity_it_has_no_meaning_for(self, arity):
        with pytest.raises(ValueError):
            ChapterScheme(arity)


class TestFolioCommentScheme:
    scheme = CITATION_SCHEMES["daf-comment"]

    def test_cites_the_folio_but_links_to_the_comment(self):
        ref = (2, 0, 1, 3)
        assert self.scheme.hebrew('רש"י על ברכות', ref) == 'רש"י על ברכות ב.'
        assert self.scheme.english("Rashi on Berakhot", ref) == "Rashi on Berakhot 2a"
        assert self.scheme.sefaria_url("Rashi on Berakhot", ref) == (
            "https://www.sefaria.org/Rashi_on_Berakhot.2a.1.3"
        )
        assert self.scheme.fields(ref) == {"daf": 2, "amud": "a", "line": 1, "comment": 3}

    def test_arity_is_four(self):
        assert self.scheme.arity == 4

    @pytest.mark.parametrize("arity", [1, 5])
    def test_rejects_an_arity_it_has_no_meaning_for(self, arity):
        with pytest.raises(ValueError):
            DafScheme(arity)
