"""The Daf Yomi calendar: which daf of the Bavli the worldwide cycle reaches on a date.

The 14th cycle began on 2020-01-05 and every cycle since the 13th has run for the same
2,711 days, one daf a day, so the daf of a date is its position in that cycle.
"""

from __future__ import annotations

import calendar
from dataclasses import dataclass
from datetime import date, timedelta

CYCLE_START = date(2020, 1, 5)  # Berakhot 2, the first day of the 14th cycle
FIRST_SUPPORTED_DAY = date(2012, 8, 3)  # the first day of the 13th cycle


@dataclass(frozen=True)
class CycleTractate:
    """One tractate in the cycle: its names and the dafim the cycle reads of it."""

    he: str
    en: str
    first_daf: int
    last_daf: int

    @property
    def days(self) -> int:
        """How many days the cycle spends on this tractate."""
        return self.last_daf - self.first_daf + 1


# Shekalim is the Yerushalmi's, and Kinnim and Midot have no Bavli of their own: the cycle
# reads all three, but only the Bavli's tractates exist as pages in this app.
CYCLE: tuple[CycleTractate, ...] = (
    CycleTractate("ברכות", "Berakhot", 2, 64),
    CycleTractate("שבת", "Shabbat", 2, 157),
    CycleTractate("עירובין", "Eruvin", 2, 105),
    CycleTractate("פסחים", "Pesachim", 2, 121),
    CycleTractate("שקלים", "Shekalim", 2, 22),
    CycleTractate("יומא", "Yoma", 2, 88),
    CycleTractate("סוכה", "Sukkah", 2, 56),
    CycleTractate("ביצה", "Beitzah", 2, 40),
    CycleTractate("ראש השנה", "Rosh Hashanah", 2, 35),
    CycleTractate("תענית", "Taanit", 2, 31),
    CycleTractate("מגילה", "Megillah", 2, 32),
    CycleTractate("מועד קטן", "Moed Katan", 2, 29),
    CycleTractate("חגיגה", "Chagigah", 2, 27),
    CycleTractate("יבמות", "Yevamot", 2, 122),
    CycleTractate("כתובות", "Ketubot", 2, 112),
    CycleTractate("נדרים", "Nedarim", 2, 91),
    CycleTractate("נזיר", "Nazir", 2, 66),
    CycleTractate("סוטה", "Sotah", 2, 49),
    CycleTractate("גיטין", "Gittin", 2, 90),
    CycleTractate("קידושין", "Kiddushin", 2, 82),
    CycleTractate("בבא קמא", "Bava Kamma", 2, 119),
    CycleTractate("בבא מציעא", "Bava Metzia", 2, 119),
    CycleTractate("בבא בתרא", "Bava Batra", 2, 176),
    CycleTractate("סנהדרין", "Sanhedrin", 2, 113),
    CycleTractate("מכות", "Makkot", 2, 24),
    CycleTractate("שבועות", "Shevuot", 2, 49),
    CycleTractate("עבודה זרה", "Avodah Zarah", 2, 76),
    CycleTractate("הוריות", "Horayot", 2, 14),
    CycleTractate("זבחים", "Zevachim", 2, 120),
    CycleTractate("מנחות", "Menachot", 2, 110),
    CycleTractate("חולין", "Chullin", 2, 142),
    CycleTractate("בכורות", "Bekhorot", 2, 61),
    CycleTractate("ערכין", "Arakhin", 2, 34),
    CycleTractate("תמורה", "Temurah", 2, 34),
    CycleTractate("כריתות", "Keritot", 2, 28),
    CycleTractate("מעילה", "Meilah", 2, 22),
    CycleTractate("קנים", "Kinnim", 23, 25),
    CycleTractate("תמיד", "Tamid", 26, 33),
    CycleTractate("מידות", "Middot", 34, 37),
    CycleTractate("נדה", "Niddah", 2, 73),
)
CYCLE_DAYS = sum(tractate.days for tractate in CYCLE)


@dataclass(frozen=True)
class DafYomiDay:
    """The daf the cycle reaches on one date."""

    date: date
    tractate: CycleTractate
    daf: int


def daf_for(day: date) -> DafYomiDay:
    """The daf the Daf Yomi cycle reaches on ``day``.

    Args:
        day: A date, from 2012-08-03 (the 13th cycle) on.

    Raises:
        ValueError: If ``day`` is before the 13th cycle, whose length is not the current one.
    """
    if day < FIRST_SUPPORTED_DAY:
        raise ValueError(f"Daf Yomi is only calculated from {FIRST_SUPPORTED_DAY}, not {day}")
    position = (day - CYCLE_START).days % CYCLE_DAYS
    for tractate in CYCLE:
        if position < tractate.days:
            return DafYomiDay(day, tractate, tractate.first_daf + position)
        position -= tractate.days
    raise AssertionError("the position is inside the cycle")  # pragma: no cover


def month_days(year: int, month: int) -> list[DafYomiDay]:
    """The daf of every day of a Gregorian month.

    Raises:
        ValueError: If the month is not 1 to 12, or begins before the 13th cycle.
    """
    last = calendar.monthrange(year, month)[1]
    first = date(year, month, 1)
    return [daf_for(first + timedelta(days=offset)) for offset in range(last)]
