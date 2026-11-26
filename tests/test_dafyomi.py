"""Tests for app/dafyomi.py and /api/dafyomi: the Daf Yomi calendar."""

from datetime import date

import pytest
from fastapi.testclient import TestClient

from app.dafyomi import CYCLE, CYCLE_DAYS, daf_for, month_days
from app.main import app, library


class TestCycle:
    def test_runs_for_the_2711_days_of_a_cycle(self):
        assert CYCLE_DAYS == 2711

    def test_names_match_the_bavli_tractates_the_app_holds(self):
        held = {t.he: t.en for t in library.corpus("bavli").tractates}
        in_cycle = {t.he: t.en for t in CYCLE if t.he in held}
        assert in_cycle == held  # every Bavli tractate is in the cycle, spelled as the app does


class TestDafFor:
    @pytest.mark.parametrize(
        ("day", "tractate", "daf"),
        [
            (date(2020, 1, 5), "ברכות", 2),  # the 14th cycle begins
            (date(2020, 1, 4), "נדה", 73),  # the 13th ends
            (date(2012, 8, 3), "ברכות", 2),  # the 13th begins
            (date(2019, 12, 31), "נדה", 69),
            (date(2026, 11, 26), "ערכין", 9),
            (date(2027, 6, 7), "נדה", 73),  # the 14th ends
            (date(2027, 6, 8), "ברכות", 2),  # the 15th begins
            (date(2027, 6, 9), "ברכות", 3),
        ],
    )
    def test_matches_the_published_cycle(self, day, tractate, daf):
        found = daf_for(day)
        assert (found.tractate.he, found.daf) == (tractate, daf)

    def test_rejects_a_day_before_the_13th_cycle(self):
        with pytest.raises(ValueError, match="only calculated from"):
            daf_for(date(2012, 8, 2))


class TestMonthDays:
    @pytest.mark.parametrize(
        ("year", "month", "length"), [(2026, 11, 30), (2028, 2, 29), (2026, 12, 31)]
    )
    def test_has_a_day_for_each_date_of_the_month(self, year, month, length):
        days = month_days(year, month)
        assert [day.date.day for day in days] == list(range(1, length + 1))

    def test_rejects_a_month_that_is_not_one_to_twelve(self):
        with pytest.raises(ValueError, match="bad month number"):
            month_days(2026, 13)


class TestDafyomiEndpoint:
    def test_json_shape(self):
        body = TestClient(app).get("/api/dafyomi", params={"month": "2026-11"}).json()
        assert body.keys() == {"month", "days"}
        assert body["days"][25] == {
            "date": "2026-11-26",
            "tractate": {"he": "ערכין", "en": "Arakhin"},
            "daf": 9,
            "inBavli": True,
        }

    def test_flags_tractates_that_are_not_pages_of_the_bavli(self):
        body = TestClient(app).get("/api/dafyomi", params={"month": "2021-03"}).json()
        by_date = {day["date"]: day for day in body["days"]}
        assert by_date["2021-03-23"]["tractate"]["he"] == "שקלים"  # the Yerushalmi's, no Bavli page
        assert by_date["2021-03-23"]["inBavli"] is False
        assert by_date["2021-03-22"]["inBavli"] is True  # Pesachim, the day before

    @pytest.mark.parametrize("month", ["", "2026-13", "2026-1", "nov-2026"])
    def test_rejects_a_malformed_month(self, month):
        assert TestClient(app).get("/api/dafyomi", params={"month": month}).status_code == 422

    def test_rejects_a_month_before_the_13th_cycle_with_a_code(self):
        response = TestClient(app).get("/api/dafyomi", params={"month": "2012-01"})
        assert response.status_code == 400
        assert response.json()["code"] == "month_out_of_range"
