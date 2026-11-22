"""Tests for the Hebrew/Aramaic normalization primitives."""

import pytest

from app.hebrew import (
    daf_citation,
    has_hebrew,
    he_number,
    normalize_finals,
    printed_text,
    strip_marks,
    tokenize,
    words,
)


class TestNormalizeFinals:
    def test_finals_fold(self):
        assert normalize_finals("ךםןףץ") == "כמנפצ"

    def test_has_hebrew(self):
        assert has_hebrew("שלום")
        assert not has_hebrew("hello 123")


class TestStripMarks:
    @pytest.mark.parametrize(
        ("text", "expected"),
        [
            ("\u05e9\u05c1\u05b8\u05dc\u05d5\u05b9\u05dd", "שלום"),  # שָׁלוֹם: shin dot, qamats, holam
            (
                "\u05d0\u05b2\u05e9\u05b6\u05c1\u05e8\u05be\u05d0\u05b8\u05de\u05b7\u05e8",
                "אשר־אמר",
            ),  # maqaf stays
            (
                "\u05d0\u05b8\u05de\u05b7\u05e8: \u05db\u05b8\u05bc\u05da\u05b0?",
                "אמר: כך?",
            ),  # finals and punctuation stay
            ("אמר רבא", "אמר רבא"),  # already plain
            ("", ""),
        ],
    )
    def test_removes_niqqud_and_nothing_else(self, text, expected):
        assert strip_marks(text) == expected


class TestPrintedText:
    @pytest.mark.parametrize(
        ("text", "expected"),
        [
            ("אמר, רבא. מאי? שפיר!", "אמר רבא מאי שפיר"),  # comma, period, ? and !
            ("טעו – לא ישלמו; כל שכן", "טעו לא ישלמו כל שכן"),  # dash and semicolon
            ("רבי — אומר - כך", "רבי אומר כך"),  # em dash and a spaced hyphen
            ("סימן ו-ט א - ב", "סימן ו-ט א ב"),  # a range keeps its hyphen, a spaced one goes
            ("אמר רבא:", "אמר רבא:"),  # the colon is the print's own
            ("רש״י אמר ר׳ יוסי", "רש״י אמר ר׳ יוסי"),  # gershayim and geresh
            ("אשר־אמר (דף ג) [כך]", "אשר־אמר (דף ג) [כך]"),  # maqaf, parentheses, brackets
            (
                "\u05d0\u05b8\u05de\u05b7\u05e8, \u05db\u05b8\u05bc\u05da\u05b0.",
                "אמר כך",
            ),  # niqqud too
            ("אמר   \n רבא", "אמר רבא"),  # spacing is tidied
            ("", ""),
        ],
    )
    def test_removes_niqqud_and_modern_punctuation_only(self, text, expected):
        assert printed_text(text) == expected


class TestWords:
    """words() is for plain, unvocalized query input -- niqqud isn't expected
    here (that's tokenize()'s job, for corpus text)."""

    def test_maqaf_splits_words(self):
        assert words("אשר־אמר") == ["אשר", "אמר"]

    def test_normalizes_finals_within_words(self):
        assert words("שלום") == ["שלומ"]


class TestTokenize:
    """The critical fix: a vocalized word's niqqud sits *between* its
    letters, so a naive letters-only regex fragments the word at every vowel
    point. Caught by testing against the real corpus, not by inspection."""

    def test_vocalized_word_is_one_token_not_fragments(self):
        raw, normalized = tokenize("מֵאֵימָתַי")[0]
        assert raw == "מֵאֵימָתַי"
        assert normalized == "מאימתי"

    def test_raw_keeps_niqqud_normalized_does_not(self):
        pairs = tokenize("קוֹרִין אֶת שְׁמַע")
        assert [p[0] for p in pairs] == ["קוֹרִין", "אֶת", "שְׁמַע"]
        assert [p[1] for p in pairs] == ["קורינ", "את", "שמע"]

    def test_maqaf_still_splits_a_vocalized_pair(self):
        pairs = tokenize("אֲשֶׁר־אָמַר")
        assert len(pairs) == 2
        assert pairs[0][1] == "אשר"
        assert pairs[1][1] == "אמר"

    def test_punctuation_is_dropped_not_fused_into_a_word(self):
        pairs = tokenize("בָּעֲרָבִין? מִשָּׁעָה")
        assert [p[1] for p in pairs] == ["בערבינ", "משעה"]

    def test_final_letters_fold_in_normalized_form_only(self):
        raw, normalized = tokenize("שָׁלוֹם")[0]
        assert raw == "שָׁלוֹם"
        assert normalized == "שלומ"


class TestHeNumber:
    def test_single_letters_have_no_gershayim(self):
        assert he_number(2) == "ב"
        assert he_number(9) == "ט"

    def test_fifteen_and_sixteen_avoid_the_divine_name(self):
        assert he_number(15) == "ט״ו"
        assert he_number(16) == "ט״ז"

    def test_multi_letter_gets_gershayim_before_the_last_letter(self):
        assert he_number(31) == "ל״א"
        assert he_number(96) == "צ״ו"


class TestDafCitation:
    def test_amud_a_is_a_period(self):
        assert daf_citation(2, "a") == "ב."

    def test_amud_b_is_a_colon(self):
        assert daf_citation(30, "b") == "ל:"
