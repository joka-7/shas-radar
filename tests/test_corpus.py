"""Tests for app/corpus.py: the compact word index."""

import pytest

from app.corpus import WordIndex

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
