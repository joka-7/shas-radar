"""Tests for app/corpus.py: the compact word index."""

import pytest

from app.citation import CITATION_SCHEMES
from app.corpus import Tractate, WordIndex

# positions:   0     1     2     3     4     5     6
TOKENS = ["אמר", "רבא", "אמר", "דאביי", "רבא", "אביי", "ואביי"]


class TestWordIndexGet:
    @pytest.mark.parametrize(
        ("word", "positions"),
        [
            ("אמר", [0, 2]),  # ascending
            ("רבא", [1, 4]),
            ("אביי", [5]),
            ("דאביי", [3]),
        ],
    )
    def test_gives_every_position_of_a_word_in_ascending_order(self, word, positions):
        assert list(WordIndex(TOKENS).get(word)) == positions

    @pytest.mark.parametrize("word", ["", "אבי", "אביייי", "זzz", "תתת"])
    def test_a_word_that_never_occurs_gives_the_default(self, word):
        index = WordIndex(TOKENS)
        assert list(index.get(word)) == []
        assert index.get(word, None) is None

    def test_an_empty_index_finds_nothing(self):
        assert list(WordIndex(()).get("אמר")) == []


class TestWordIndexSuffixMatches:
    def test_finds_words_ending_with_the_suffix_but_not_the_suffix_itself(self):
        found = {
            word: list(positions) for word, positions in WordIndex(TOKENS).suffix_matches("אביי")
        }
        assert found == {"דאביי": [3], "ואביי": [6]}

    def test_reports_words_in_order_of_first_appearance(self):
        # "דאביי" appears before "ואביי" in the text, though it sorts after it.
        assert [word for word, _ in WordIndex(TOKENS).suffix_matches("אביי")] == ["דאביי", "ואביי"]

    def test_no_match_gives_nothing(self):
        assert list(WordIndex(TOKENS).suffix_matches("תתת")) == []


def make_commentary() -> Tractate:
    tractate = Tractate("רש", "Rashi", "סדר", "Seder", "Rashi", CITATION_SCHEMES["daf-comment"])
    for ref, text in [
        ((2, 0, 1, 1), "אמר רבא"),
        ((2, 0, 1, 2), "אמר אביי"),
        ((2, 1, 1, 1), "דבר אחר"),
        ((3, 0, 1, 1), "עוד דבר"),
    ]:
        tractate.add_segment(ref, text)
    return tractate


class TestTractateSegmentsUnder:
    @pytest.mark.parametrize(
        ("prefix", "refs"),
        [
            ((2, 0), [(2, 0, 1, 1), (2, 0, 1, 2)]),  # one side of a daf
            ((2,), [(2, 0, 1, 1), (2, 0, 1, 2), (2, 1, 1, 1)]),  # both sides
            ((2, 1, 1, 1), [(2, 1, 1, 1)]),  # one exact comment
            ((3, 1), []),  # a side with nothing on it
            ((9,), []),  # past the end
        ],
    )
    def test_gives_the_segments_whose_location_starts_with_the_prefix(self, prefix, refs):
        assert [ref for ref, _ in make_commentary().segments_under(prefix)] == refs

    def test_gives_each_segment_with_its_text(self):
        (ref, segment), *_ = make_commentary().segments_under((2, 0))
        assert (ref, segment.text) == ((2, 0, 1, 1), "אמר רבא")

    @pytest.mark.parametrize("prefix", [(), (1, 2, 3, 4, 5)])
    def test_rejects_a_prefix_that_does_not_fit_the_scheme(self, prefix):
        with pytest.raises(ValueError):
            make_commentary().segments_under(prefix)


class TestTractateAddSegment:
    def test_rejects_a_segment_that_comes_before_the_previous_one(self):
        tractate = make_commentary()
        with pytest.raises(ValueError, match="out of order"):
            tractate.add_segment((2, 0, 1, 1), "מאוחר מדי")

    def test_accepts_a_segment_at_the_same_location(self):
        tractate = make_commentary()
        tractate.add_segment((3, 0, 1, 1), "עוד קטע")
        assert len(tractate.segments_under((3, 0))) == 2
