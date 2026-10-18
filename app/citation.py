"""Where a passage sits in its book, and how that location is cited.

A passage's location is a ``Ref``: a short tuple of small integers in the
source text's own numbering (for the Bavli, ``(daf, amud)``). A
``CitationScheme`` turns a ``Ref`` into the printed citation, the English
citation, and the Sefaria deep link. Search code asks the tractate for these
and never looks inside a ``Ref``, so a book whose pages are numbered
differently only needs its own scheme.

Refs are stored packed, one ``int`` per paragraph, in an ``array.array("Q")``
(see ``Tractate.segment_refs``): up to four 16-bit parts.
"""

from __future__ import annotations

from typing import Protocol

from .hebrew import daf_citation, he_number

Ref = tuple[int, ...]

MAX_REF_PARTS = 4
_PART_BITS = 16
_PART_MASK = (1 << _PART_BITS) - 1


def pack_ref(ref: Ref, arity: int) -> int:
    """Pack ``ref`` into one integer, most significant part first.

    Args:
        ref: The location, one integer per part.
        arity: How many parts the book's scheme uses; ``ref`` must match.

    Returns:
        The packed integer, at most ``MAX_REF_PARTS * 16`` bits wide.

    Raises:
        ValueError: If ``ref`` has the wrong number of parts, or a part does
            not fit in 16 bits.
    """
    if not 1 <= arity <= MAX_REF_PARTS:
        raise ValueError(f"arity must be 1-{MAX_REF_PARTS}, got {arity}")
    if len(ref) != arity:
        raise ValueError(f"expected {arity} ref parts, got {ref!r}")
    packed = 0
    for part in ref:
        if not 0 <= part <= _PART_MASK:
            raise ValueError(f"ref part {part} out of range 0-{_PART_MASK} in {ref!r}")
        packed = (packed << _PART_BITS) | part
    return packed


def unpack_ref(packed: int, arity: int) -> Ref:
    """Invert :func:`pack_ref` for a scheme of the given ``arity``."""
    return tuple((packed >> (_PART_BITS * (arity - 1 - i))) & _PART_MASK for i in range(arity))


class CitationScheme(Protocol):
    """How one book's locations are cited. See the module docstring."""

    @property
    def arity(self) -> int:
        """Number of parts in this scheme's ``Ref``."""
        ...

    def hebrew(self, tractate_he: str, ref: Ref) -> str:
        """The printed citation, e.g. ``ברכות ב.``."""
        ...

    def english(self, tractate_en: str, ref: Ref) -> str:
        """The English citation, e.g. ``Berakhot 2a``."""
        ...

    def sefaria_url(self, sefaria_title: str, ref: Ref) -> str:
        """The deep link to this location on Sefaria."""
        ...

    def fields(self, ref: Ref) -> dict[str, int | str]:
        """Extra result fields that describe ``ref`` (daf and amud, for the Bavli)."""
        ...


_AMUD_CHARS = ("a", "b")


class DafScheme:
    """Folio citation: ``(daf, amud)``, with amud stored as 0 for "a" and 1 for "b"."""

    @property
    def arity(self) -> int:
        return 2

    def hebrew(self, tractate_he: str, ref: Ref) -> str:
        daf, amud = ref
        return f"{tractate_he} {daf_citation(daf, _AMUD_CHARS[amud])}"

    def english(self, tractate_en: str, ref: Ref) -> str:
        daf, amud = ref
        return f"{tractate_en} {daf}{_AMUD_CHARS[amud]}"

    # Sefaria's ref-slug convention: spaces in a multi-word title become
    # underscores, e.g. "Bava Kamma" -> "Bava_Kamma.5a". Sefaria's own site is
    # unreachable from the build environment to verify directly; this matches
    # their documented convention -- worth a spot-check once deployed.
    def sefaria_url(self, sefaria_title: str, ref: Ref) -> str:
        daf, amud = ref
        return f"https://www.sefaria.org/{sefaria_title.replace(' ', '_')}.{daf}{_AMUD_CHARS[amud]}"

    def fields(self, ref: Ref) -> dict[str, int | str]:
        daf, amud = ref
        return {"daf": daf, "amud": _AMUD_CHARS[amud]}


class ChapterScheme:
    """Chapter and section: ``(chapter, section)``, optionally with a third part.

    Cited as ``chapter:section`` (Mishnah, Tosefta, Yerushalmi). A third part,
    the Yerushalmi's segment within a halakhah, is part of the Sefaria link but
    not of the printed citation.
    """

    def __init__(self, arity: int):
        if arity not in (2, 3):
            raise ValueError(f"a chapter scheme has 2 or 3 parts, not {arity}")
        self._arity = arity

    @property
    def arity(self) -> int:
        return self._arity

    def hebrew(self, tractate_he: str, ref: Ref) -> str:
        chapter, section = ref[:2]
        return f"{tractate_he} {he_number(chapter)}:{he_number(section)}"

    def english(self, tractate_en: str, ref: Ref) -> str:
        chapter, section = ref[:2]
        return f"{tractate_en} {chapter}:{section}"

    def sefaria_url(self, sefaria_title: str, ref: Ref) -> str:
        return f"https://www.sefaria.org/{sefaria_title.replace(' ', '_')}." + ".".join(
            str(part) for part in ref
        )

    def fields(self, ref: Ref) -> dict[str, int | str]:
        return dict(zip(("chapter", "section", "segment"), ref, strict=False))


CITATION_SCHEMES: dict[str, CitationScheme] = {
    "daf": DafScheme(),
    "chapter": ChapterScheme(2),
    "chapter-segment": ChapterScheme(3),
}
