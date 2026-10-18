"""Tests for app/citation.py: ref packing and the folio citation scheme."""

import pytest

from app.citation import CITATION_SCHEMES, DafScheme, pack_ref, unpack_ref


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
