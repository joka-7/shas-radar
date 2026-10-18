"""Tests for scripts/build_dataset.py: the pure helpers, not the network fetches."""

import importlib.util
import sys
from pathlib import Path

import pytest

_SPEC = importlib.util.spec_from_file_location(
    "build_dataset", Path(__file__).resolve().parent.parent / "scripts" / "build_dataset.py"
)
build_dataset = importlib.util.module_from_spec(_SPEC)
sys.modules["build_dataset"] = build_dataset  # @dataclass looks its module up here
_SPEC.loader.exec_module(build_dataset)


class TestCleanSegment:
    @pytest.mark.parametrize(
        ("raw", "cleaned"),
        [
            ("שלום עולם", "שלום עולם"),
            ("א<br>ב", "א ב"),  # a line break must not fuse the words around it
            ("<strong><big>משנה:</big></strong> טקסט", "משנה: טקסט"),
            ('<i data-overlay="Vilna Pages" data-value="1a"></i>שלום', "שלום"),
            ("א   ב\n\tג", "א ב ג"),
            ("א &lt;ב&gt; ג", "א <ב> ג"),  # escaped brackets become text, not markup
            ("&lt;i&gt;x", "<i>x"),  # unescaped after the tags are stripped
        ],
    )
    def test_strips_markup_and_unescapes_entities(self, raw, cleaned):
        assert build_dataset.clean_segment(raw) == cleaned


class TestWalkSections:
    def test_yields_one_based_refs_and_keeps_indices_across_gaps(self):
        text = [["א", "", "ג"], [], ["ד"]]
        assert list(build_dataset.walk_sections(text, 2)) == [
            ((1, 1), "א"),
            ((1, 3), "ג"),
            ((3, 1), "ד"),
        ]

    def test_three_levels(self):
        assert list(build_dataset.walk_sections([[["א", "ב"]]], 3)) == [
            ((1, 1, 1), "א"),
            ((1, 1, 2), "ב"),
        ]

    @pytest.mark.parametrize(
        ("text", "arity"),
        [
            ([["א"]], 3),  # shallower than the scheme expects
            ([[["א"]]], 2),  # deeper than the scheme expects
            ("א", 2),  # a bare string
            ([{"a": "א"}], 2),  # an unexpected type
            ([[5]], 2),
        ],
    )
    def test_rejects_text_that_is_not_nested_as_expected(self, text, arity):
        with pytest.raises(ValueError):
            list(build_dataset.walk_sections(text, arity))


TOC = [
    {
        "category": "Mishnah",
        "contents": [
            {"category": "Seder Zeraim", "contents": [{"title": "A"}, {"title": "B"}]},
            {"category": "Commentary", "contents": [{"title": "Skipped"}]},
            {"title": "C"},
        ],
    },
    {"category": "Other", "contents": [{"title": "Elsewhere"}]},
]


class TestTocLeaves:
    def test_collects_leaves_in_order_and_skips_named_categories(self):
        leaves = build_dataset.toc_leaves(TOC, ["Mishnah"], ["Commentary"])
        assert [leaf["title"] for leaf in leaves] == ["A", "B", "C"]

    def test_missing_path_raises(self):
        with pytest.raises(KeyError):
            build_dataset.toc_leaves(TOC, ["Nope"], [])


class TestSpecs:
    def test_every_chaptered_book_names_a_scheme_the_app_knows(self):
        from app.citation import CITATION_SCHEMES

        for spec in build_dataset.SPECS.values():
            assert CITATION_SCHEMES[spec.scheme].arity == spec.arity
