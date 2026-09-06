"""Tests for the Hebrew/Aramaic normalization primitives."""

from app.hebrew import daf_citation, has_hebrew, he_number, normalize_finals, tokenize, words


class TestNormalizeFinals:
    def test_finals_fold(self):
        assert normalize_finals("ךםןףץ") == "כמנפצ"

    def test_has_hebrew(self):
        assert has_hebrew("שלום")
        assert not has_hebrew("hello 123")


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
