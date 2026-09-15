"""Tests for the corpus, matching logic, and API -- against the real
committed corpus rather than a fixture, the same way פסוק לשם's tests do.
"""

import pytest
from fastapi.testclient import TestClient

from app.corpus import load_corpus
from app.main import app
from app.search import (
    Query,
    find_exact_word,
    find_phrase,
    find_phrase_with_prefix,
    find_proximity,
    find_with_prefix,
    search,
)


@pytest.fixture(scope="session")
def corpus():
    return load_corpus()


@pytest.fixture(scope="session")
def client():
    return TestClient(app)


class TestCorpus:
    def test_tractate_count(self, corpus):
        assert len(corpus.tractates) == 37

    def test_word_count_matches_the_committed_dataset(self, corpus):
        # ~1.9M, in the range the Talmud is generally described as (~1.8M).
        assert 1_800_000 < len(corpus) < 2_000_000

    def test_canonical_order_starts_with_berakhot(self, corpus):
        assert corpus.tractates[0].he == "ברכות"
        assert corpus.tractates[0].en == "Berakhot"

    def test_berakhot_ends_at_the_traditional_64a(self, corpus):
        berakhot = corpus.tractate_by_name("ברכות")
        last_daf = max(berakhot.token_daf)
        assert last_daf == 64

    def test_every_tractate_has_tokens(self, corpus):
        assert all(len(t) > 0 for t in corpus.tractates)

    def test_citation_format(self, corpus):
        berakhot = corpus.tractate_by_name("ברכות")
        assert berakhot.citation(0) == "ברכות ב."  # token 0 is the start of 2a


class TestTokenization:
    """The niqqud-fragmentation bug, guarded against regressing."""

    def test_a_vocalized_multi_syllable_word_is_one_token(self, corpus):
        berakhot = corpus.tractate_by_name("ברכות")
        # The Gemara's opening word, מֵאֵימָתַי, is one token, not fragments
        # split at each of its vowel points.
        assert berakhot.tokens[0] == "מאימתי"
        assert berakhot.tokens_raw[0] == "מֵאֵימָתַי"

    def test_raw_form_keeps_niqqud(self, corpus):
        berakhot = corpus.tractate_by_name("ברכות")
        assert any(0x05B0 <= ord(ch) <= 0x05C7 for ch in berakhot.tokens_raw[0])

    def test_normalized_form_has_no_niqqud(self, corpus):
        berakhot = corpus.tractate_by_name("ברכות")
        assert not any(0x05B0 <= ord(ch) <= 0x05C7 for ch in berakhot.tokens[0])


class TestFindExactWord:
    def test_known_sage_names_have_plausible_counts(self, corpus):
        # Abaye and Rava are among the most-cited Amoraim in the Bavli --
        # thousands of mentions each is the expected order of magnitude.
        assert len(find_exact_word(corpus, "אביי")) > 2000
        assert len(find_exact_word(corpus, "רבא")) > 3500

    def test_unknown_word_has_no_matches(self, corpus):
        assert find_exact_word(corpus, "זזזזזזז") == []


class TestFindWithPrefix:
    def test_attached_prefixes_are_found(self, corpus):
        """The example from the spec: אביי should also find דאביי/לאביי/ואביי."""
        matches = find_with_prefix(corpus, "אביי")
        found_words = {m.tractate.tokens[m.start] for m in matches}
        assert "לאביי" in found_words
        assert "ואביי" in found_words
        assert "דאביי" in found_words

    def test_exact_matches_are_excluded(self, corpus):
        """The two tiers never overlap: an exact hit isn't also a prefix hit."""
        matches = find_with_prefix(corpus, "אביי")
        assert all(m.tractate.tokens[m.start] != "אביי" for m in matches)

    def test_unrelated_words_are_not_matched(self, corpus):
        """A word ending in similar-but-different letters must not match."""
        matches = find_with_prefix(corpus, "אביי")
        found_words = {m.tractate.tokens[m.start] for m in matches}
        assert "אבי" not in found_words  # missing the second י -- not a match


class TestFindPhrase:
    def test_exact_phrase_matches_consecutive_words_only(self, corpus):
        matches = find_phrase(corpus, ("אמר", "רבא"))
        assert len(matches) > 500
        for m in matches[:20]:
            assert m.tractate.tokens[m.start] == "אמר"
            assert m.tractate.tokens[m.start + 1] == "רבא"

    def test_phrase_length_is_reported(self, corpus):
        matches = find_phrase(corpus, ("אמר", "רבא"))
        assert matches[0].length == 2


class TestFindPhraseWithPrefix:
    """Only the phrase's *first* word gets the attached-prefix treatment --
    e.g. "אמר רבא" also finds "ואמר רבא"/"דאמר רבא" -- every word after it
    still has to match exactly, same as an ordinary exact phrase."""

    def test_prefixed_first_word_is_found(self, corpus):
        matches = find_phrase_with_prefix(corpus, ("אמר", "רבא"))
        assert len(matches) > 100
        found_first_words = {m.tractate.tokens[m.start] for m in matches}
        assert "ואמר" in found_first_words
        assert "דאמר" in found_first_words

    def test_second_word_still_must_match_exactly(self, corpus):
        matches = find_phrase_with_prefix(corpus, ("אמר", "רבא"))
        for m in matches[:50]:
            assert m.tractate.tokens[m.start + 1] == "רבא"

    def test_exact_first_word_is_excluded(self, corpus):
        """The two tiers never overlap, same as the single-word case."""
        matches = find_phrase_with_prefix(corpus, ("אמר", "רבא"))
        assert all(m.tractate.tokens[m.start] != "אמר" for m in matches)

    def test_kind_is_with_prefix(self, corpus):
        matches = find_phrase_with_prefix(corpus, ("אמר", "רבא"))
        assert all(m.kind == "withPrefix" for m in matches)


class TestProximity:
    def test_within_distance_finds_pairs(self, corpus):
        pairs = find_proximity(corpus, "אביי", "רבא", within=6)
        assert len(pairs) > 0
        for pair in pairs[:20]:
            assert abs(pair["posA"] - pair["posB"]) <= 6

    def test_tighter_distance_finds_fewer_pairs(self, corpus):
        loose = find_proximity(corpus, "אביי", "רבא", within=20)
        tight = find_proximity(corpus, "אביי", "רבא", within=2)
        assert len(tight) <= len(loose)


class TestKwicContext:
    def test_context_window_respects_before_after_counts(self, corpus):
        query = Query.parse("אביי")
        result = search(corpus, [query], before=3, after=7)
        group = result["groups"][0]
        for r in group["results"][:10]:
            assert len(r["before"].split()) <= 3
            assert len(r["after"].split()) <= 7

    def test_full_paragraph_contains_the_match(self, corpus):
        query = Query.parse("אביי")
        result = search(corpus, [query], before=5, after=5, limit=5)
        for r in result["groups"][0]["results"]:
            assert r["match"] in r["fullParagraph"]

    def test_citation_and_link_are_present(self, corpus):
        query = Query.parse("אביי")
        result = search(corpus, [query], limit=1)
        r = result["groups"][0]["results"][0]
        assert r["citation"].startswith(r["tractate"]["he"])
        assert r["sefariaUrl"].startswith("https://www.sefaria.org/")


class TestPagination:
    """A group's own "show more": offset walks the same deterministic match
    order, so paging through it never skips or repeats a result."""

    def test_offset_skips_the_first_page_without_gaps_or_repeats(self, corpus):
        # Two pages fetched separately must line up exactly with one fetch
        # covering both -- proof that offset neither skips nor repeats a
        # match, not just that the two pages happen to look different.
        query = Query.parse("אביי")
        first_page = search(corpus, [query], limit=20)["groups"][0]["results"]
        second_page = search(corpus, [query], limit=20, offset=20)["groups"][0]["results"]
        whole = search(corpus, [query], limit=40)["groups"][0]["results"]
        assert whole == first_page + second_page

    def test_total_is_unaffected_by_offset(self, corpus):
        query = Query.parse("אביי")
        total_at_zero = search(corpus, [query], offset=0)["groups"][0]["total"]
        total_at_offset = search(corpus, [query], offset=1000)["groups"][0]["total"]
        assert total_at_zero == total_at_offset

    def test_offset_past_the_end_returns_no_results(self, corpus):
        query = Query.parse("אביי")
        group = search(corpus, [query], offset=10_000_000)["groups"][0]
        assert group["results"] == []
        assert group["total"] > 0

    def test_negative_offset_is_clamped_to_zero(self, corpus):
        query = Query.parse("אביי")
        clamped = search(corpus, [query], limit=5, offset=-50)["groups"][0]["results"]
        zero = search(corpus, [query], limit=5, offset=0)["groups"][0]["results"]
        assert [r["citation"] for r in clamped] == [r["citation"] for r in zero]


class TestMultiQuery:
    def test_comma_separates_independent_or_queries(self, corpus):
        queries = [Query.parse("אביי"), Query.parse("רבא")]
        result = search(corpus, queries)
        assert len(result["groups"]) == 2
        assert result["groups"][0]["query"] == "אביי"
        assert result["groups"][1]["query"] == "רבא"

    def test_tractate_filter_restricts_results(self, corpus):
        query = Query.parse("אביי")
        unfiltered = search(corpus, [query])["groups"][0]["total"]
        filtered = search(corpus, [query], tractate_filter="ברכות")["groups"][0]["total"]
        assert 0 < filtered < unfiltered


class TestApi:
    def test_health(self, client):
        body = client.get("/api/health").json()
        assert body["status"] == "ok"
        assert body["tractates"] == 37
        assert body["license"] == "Public Domain"

    def test_tractates_endpoint(self, client):
        body = client.get("/api/tractates").json()
        assert len(body["tractates"]) == 37
        assert body["tractates"][0]["he"] == "ברכות"

    def test_search_single_word(self, client):
        body = client.get("/api/search", params={"q": "אביי"}).json()
        assert len(body["groups"]) == 1
        assert body["groups"][0]["total"] > 2000

    def test_search_multi_term(self, client):
        body = client.get("/api/search", params={"q": "אביי, רבא"}).json()
        assert len(body["groups"]) == 2

    def test_search_phrase(self, client):
        body = client.get("/api/search", params={"q": "אמר רבא"}).json()
        assert body["groups"][0]["isPhrase"] is True

    def test_search_phrase_includes_prefixed_first_word_matches(self, client):
        """A phrase group can carry both tiers now, same as a single word --
        "אמר רבא" also reports the "ואמר רבא"/"דאמר רבא" matches, even
        though (like the single-word case) exact matches sort first, so a
        first page well within the exact tier's own size shows only "exact"."""
        body = client.get("/api/search", params={"q": "אמר רבא", "limit": 200}).json()
        group = body["groups"][0]
        assert group["exactTotal"] > 0
        assert group["prefixTotal"] > 0
        assert group["total"] == group["exactTotal"] + group["prefixTotal"]
        assert all(r["kind"] == "exact" for r in group["results"])

        # Page past the entire exact tier to reach into the with-prefix one.
        tail = client.get(
            "/api/search", params={"q": "אמר רבא", "limit": 5, "offset": group["exactTotal"]}
        ).json()["groups"][0]
        assert all(r["kind"] == "withPrefix" for r in tail["results"])

    def test_before_after_are_clamped(self, client):
        body = client.get("/api/search", params={"q": "אביי", "before": 999, "after": 0}).json()
        assert body["before"] == 50  # MAX_CONTEXT
        assert body["after"] == 1  # MIN_CONTEXT

    def test_offset_pages_through_a_groups_own_results(self, client):
        """The "show more" button's own request shape: same term, growing
        offset, appended to what the first page already showed."""
        first = client.get("/api/search", params={"q": "אביי", "limit": 20}).json()
        second = client.get("/api/search", params={"q": "אביי", "limit": 20, "offset": 20}).json()
        assert first["groups"][0]["results"] != second["groups"][0]["results"]
        assert first["groups"][0]["total"] == second["groups"][0]["total"]

    def test_empty_query_is_rejected(self, client):
        response = client.get("/api/search", params={"q": "  ,  "})
        assert response.status_code == 400
        assert response.json()["code"] == "empty"

    def test_non_hebrew_is_rejected(self, client):
        response = client.get("/api/search", params={"q": "abc"})
        assert response.status_code == 400
        assert response.json()["code"] == "invalid_query"

    def test_too_many_terms_are_rejected(self, client):
        response = client.get("/api/search", params={"q": "א, ב, ג, ד, ה, ו"})
        assert response.status_code == 400
        assert response.json()["code"] == "too_many"

    def test_proximity_endpoint(self, client):
        body = client.get("/api/proximity", params={"a": "אביי", "b": "רבא", "within": 6}).json()
        assert body["total"] > 0

    def test_static_assets_force_revalidation(self, client):
        response = client.get("/")
        assert response.headers["cache-control"] == "no-cache"

    def test_spa_is_served_at_the_root(self, client):
        response = client.get("/")
        assert response.status_code == 200
        assert 'dir="rtl"' in response.text
