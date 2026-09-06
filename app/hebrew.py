"""Hebrew/Aramaic text normalization primitives.

The Sefaria "merged" version used here turned out to be niqqud-vocalized (no
cantillation trope, since the Talmud isn't chanted with Torah trope, but full
vowel points) rather than the plain unpointed print originally assumed --
confirmed against the real corpus, not assumed. So there is real Masoretic-
style apparatus to handle after all: niqqud is kept in the raw/display form
of a word (the text should read exactly as printed) and stripped only from
the normalized form used for matching -- the same raw/normalized split the
Tanakh app uses, for the same reason.
"""

from __future__ import annotations

import re

# The 22 Hebrew consonants, including the five final forms.
HEBREW_LETTERS = r"א-ת"
NON_LETTERS = re.compile(f"[^{HEBREW_LETTERS}]+")

# Niqqud (vowel points). No cantillation range (U+0591-U+05AF) has actually
# been seen in this corpus -- the Talmud isn't chanted with Torah trope -- but
# stripping it too costs nothing and guards against a future source that has it.
_MARK_CHARS = r"֑-ֽֿ-ׇׅ"
MARKS = re.compile(f"[{_MARK_CHARS}]")

# A word "as printed": a run of Hebrew letters and the niqqud marks attached
# to them. Matching letters alone would fragment a vocalized word into one
# piece per letter, splitting at every vowel point in between.
WORD_RUN = re.compile(f"[{HEBREW_LETTERS}{_MARK_CHARS}]+")

# אותיות מנצפ"ך סופיות — final forms mapped onto their regular counterparts,
# so a query for "אביי" matches text however its neighbours' finals fall.
FINALS = {
    "ך": "כ",
    "ם": "מ",
    "ן": "נ",
    "ף": "פ",
    "ץ": "צ",
}
_FINALS_TABLE = str.maketrans(FINALS)


def normalize_finals(text: str) -> str:
    """Rewrite final letter forms as their regular forms (ם -> מ, ן -> נ, …)."""
    return text.translate(_FINALS_TABLE)


def has_hebrew(text: str) -> bool:
    """True if the text contains at least one Hebrew consonant."""
    return bool(NON_LETTERS.sub("", text))


def words(text: str) -> list[str]:
    """Split text into normalized words.

    Maqaf (־) and all other non-letter characters split the words around
    them, matching how the text is actually read: אשר־אמר is two words.
    """
    return [normalize_finals(w) for w in NON_LETTERS.split(text) if w]


def tokenize(text: str) -> list[tuple[str, str]]:
    """Split text into (raw, normalized) word pairs, in reading order.

    ``raw`` keeps niqqud, exactly as printed -- for display.
    ``normalized`` has niqqud stripped and finals folded -- for matching.

    Works directly off runs of Hebrew letters (with their attached niqqud)
    rather than off whitespace, for two reasons: a maqaf joining two words
    within what looks like a single whitespace-delimited chunk (אשר־אמר)
    still yields two separate tokens instead of one fused word; and a
    vocalized word's vowel points sit *between* its letters, so a run of
    letters alone would fragment the word at every niqqud mark rather than
    treating the whole thing as one token.
    """
    tokens = []
    for match in WORD_RUN.finditer(text):
        raw = match.group()
        normalized = normalize_finals(MARKS.sub("", raw))
        if normalized:
            tokens.append((raw, normalized))
    return tokens


# --- Hebrew numerals (gematria), for daf citations ---------------------------

_GEMATRIA = [
    (400, "ת"), (300, "ש"), (200, "ר"), (100, "ק"),
    (90, "צ"), (80, "פ"), (70, "ע"), (60, "ס"), (50, "נ"),
    (40, "מ"), (30, "ל"), (20, "כ"), (10, "י"),
    (9, "ט"), (8, "ח"), (7, "ז"), (6, "ו"), (5, "ה"),
    (4, "ד"), (3, "ג"), (2, "ב"), (1, "א"),
]


def he_number(value: int) -> str:
    """Format an integer as a Hebrew numeral: 2 -> ב, 15 -> ט״ו, 96 -> צ״ו.

    15 and 16 are traditionally written ט״ו / ט״ז rather than spelling out
    the divine name. A single letter takes no gershayim; two or more take one
    before the last letter (קס״ג, not קסג).
    """
    if value <= 0:
        return str(value)

    letters: list[str] = []
    remainder = value
    while remainder > 0:
        if remainder == 15:
            letters.append("טו")
            break
        if remainder == 16:
            letters.append("טז")
            break
        for number, letter in _GEMATRIA:
            if remainder >= number:
                letters.append(letter)
                remainder -= number
                break

    text = "".join(letters)
    if len(text) == 1:
        return text
    return f"{text[:-1]}״{text[-1]}"


def daf_citation(daf: int, amud: str) -> str:
    """The traditional printed-page citation suffix: ב. for 2a, ל: for 30b."""
    return he_number(daf) + ("." if amud == "a" else ":")
