"""Tests for app/commentary_store.py: display-only commentaries, read a tractate at a time."""

import pytest

from app.books import BookConfigError
from app.commentary_store import (
    KNOWN_COMMENTARIES,
    CommentaryStore,
    CommentaryStores,
    StoredCommentary,
    UnknownCommentaryError,
    parse_tractate,
)

STEINSALTZ = KNOWN_COMMENTARIES[0]

MEMBER = {
    "he": "ביאור שטיינזלץ על ברכות",
    "en": "Steinsaltz on Berakhot",
    "sections": [
        {"ref": [2, 0, 1], "segments": ["<b>א</b>"]},
        {"ref": [2, 0, 3], "segments": ["ג"]},  # paragraph 2 has no text: the number is kept
        {"ref": [2, 1, 1], "segments": ["ד"]},
    ],
    "slots": [[2, 0, 3], [2, 1, 1]],
}


class TestParseTractate:
    def test_groups_paragraphs_by_page_keeping_their_numbers_and_the_slot_counts(self):
        tractate = parse_tractate(MEMBER, "CC-BY-NC")
        assert tractate.pages == {(2, 0): [(1, "<b>א</b>"), (3, "ג")], (2, 1): [(1, "ד")]}
        assert tractate.slots == {(2, 0): 3, (2, 1): 1}
        assert (tractate.he, tractate.en) == ("ביאור שטיינזלץ על ברכות", "Steinsaltz on Berakhot")

    @pytest.mark.parametrize(
        ("member_license", "expected"),
        [(None, "CC-BY-NC"), ("CC-BY-SA", "CC-BY-SA")],  # a tractate's own license wins
    )
    def test_license_is_the_tractates_own_or_the_books(self, member_license, expected):
        member = dict(MEMBER, **({"license": member_license} if member_license else {}))
        assert parse_tractate(member, "CC-BY-NC").license == expected


class TestCommentaryStore:
    def test_reads_a_tractate_from_the_real_archive(self):
        tractate = CommentaryStore(STEINSALTZ).tractate("Berakhot")
        assert tractate is not None
        assert [number for number, _ in tractate.pages[(2, 0)]] == list(range(1, 15))
        assert tractate.slots[(2, 0)] == 14
        assert tractate.license == "CC-BY-NC"

    def test_a_tractate_the_commentary_does_not_cover_is_none(self):
        assert CommentaryStore(STEINSALTZ).tractate("Not a tractate") is None

    @pytest.mark.parametrize(
        ("cache_size", "second_read_is_the_first"),
        [(2, True), (1, False)],  # with room for one tractate, the next read evicts it
    )
    def test_keeps_the_last_few_tractates_and_drops_the_rest(
        self, cache_size, second_read_is_the_first
    ):
        store = CommentaryStore(STEINSALTZ, cache_size=cache_size)
        first = store.tractate("Berakhot")
        store.tractate("Shabbat")
        assert (store.tractate("Berakhot") is first) is second_read_is_the_first


class TestCommentaryStores:
    @pytest.mark.parametrize(
        ("environ", "ids"),
        [
            ({}, []),
            ({"ENABLED_COMMENTARIES": ""}, []),
            ({"ENABLED_COMMENTARIES": "steinsaltz"}, ["steinsaltz"]),
            ({"ENABLED_COMMENTARIES": " steinsaltz ,"}, ["steinsaltz"]),
        ],
    )
    def test_enables_what_the_environment_lists(self, environ, ids):
        assert CommentaryStores.from_environ(environ).ids() == ids

    def test_an_unknown_id_stops_startup(self):
        with pytest.raises(BookConfigError, match="unknown commentaries"):
            CommentaryStores.from_environ({"ENABLED_COMMENTARIES": "nope"})

    @pytest.mark.parametrize(
        "enabled",
        [
            [STEINSALTZ, STEINSALTZ],  # listed twice
            [StoredCommentary("x", "א", "X", "missing.zip", "bavli", "X on ")],  # no data file
        ],
    )
    def test_an_invalid_set_stops_startup(self, enabled):
        with pytest.raises(BookConfigError):
            CommentaryStores(enabled)

    def test_finds_a_store_by_id_and_the_commentaries_on_a_book(self):
        stores = CommentaryStores([STEINSALTZ])
        assert stores.store("steinsaltz").info is STEINSALTZ
        assert stores.for_book("bavli") == [STEINSALTZ]
        assert stores.for_book("mishnah") == []
        with pytest.raises(UnknownCommentaryError):
            stores.store("rashi")
