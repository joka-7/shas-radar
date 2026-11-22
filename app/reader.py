"""Reading one page of the Bavli: its text, and the pages on either side.

Search shows a match in context; this serves a whole page (a daf side) so it can
be read straight through. A page's commentary is a separate request, see
``app.commentary``.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from .books import Book, BookError, BookLibrary
from .citation import DafScheme, Ref
from .corpus import Tractate
from .hebrew import printed_text

# HebrewBooks numbers the Shas tractates in the printed (Vilna) order, which is not
# the order of this app's data (there Rosh Hashanah follows Pesachim). Shekalim, a
# Yerushalmi tractate printed in the Shas, is number 5, so it is skipped here.
# Tamid has no number: its pages are listed on the site but do not open. Berakhot (1),
# Sukkah (7), Sanhedrin (24) and Niddah (37) were confirmed against the site; the
# others follow the printed order between those points.
_HEBREWBOOKS_ORDER = (
    "Berakhot",
    "Shabbat",
    "Eruvin",
    "Pesachim",
    None,  # Shekalim
    "Yoma",
    "Sukkah",
    "Beitzah",
    "Rosh Hashanah",
    "Taanit",
    "Megillah",
    "Moed Katan",
    "Chagigah",
    "Yevamot",
    "Ketubot",
    "Nedarim",
    "Nazir",
    "Sotah",
    "Gittin",
    "Kiddushin",
    "Bava Kamma",
    "Bava Metzia",
    "Bava Batra",
    "Sanhedrin",
    "Makkot",
    "Shevuot",
    "Avodah Zarah",
    "Horayot",
    "Zevachim",
    "Menachot",
    "Chullin",
    "Bekhorot",
    "Arakhin",
    "Temurah",
    "Keritot",
    "Meilah",
    "Niddah",
)
HEBREWBOOKS_NUMBERS = {
    name: number for number, name in enumerate(_HEBREWBOOKS_ORDER, start=1) if name is not None
}


class ReaderError(BookError):
    """Base class for errors reading a page."""


class NotPagedBookError(ReaderError):
    """The book is not numbered by daf and amud, so it has no pages to read."""


class TractateNotFoundError(ReaderError, LookupError):
    """The book has no tractate by that name."""


class PageNotFoundError(ReaderError, LookupError):
    """The tractate has no text on that page."""


@dataclass(frozen=True)
class DafPage:
    """One page of a tractate, with where to go next and back."""

    book: Book
    tractate: Tractate
    ref: Ref
    segments: list[str]
    citation: str
    sefaria_url: str
    previous: Ref | None
    next: Ref | None
    print_url: str | None

    def as_dict(self) -> dict[str, Any]:
        """The JSON shape of ``GET /api/daf``."""
        daf, amud = self.ref
        return {
            "book": {"id": self.book.id, "he": self.book.he, "en": self.book.en},
            "tractate": {"he": self.tractate.he, "en": self.tractate.en},
            "daf": daf,
            "amud": _amud_name(amud),
            "citation": self.citation,
            "sefariaUrl": self.sefaria_url,
            "license": self.tractate.license,
            "segments": self.segments,
            "plainSegments": [printed_text(segment) for segment in self.segments],
            "printUrl": self.print_url,
            "previous": page_json(self.previous),
            "next": page_json(self.next),
        }


def _amud_name(amud: int) -> str:
    return "ab"[amud]


def page_json(ref: Ref | None) -> dict[str, int | str] | None:
    """A page's ``(daf, amud)`` as JSON, or ``None`` for no page.

    Args:
        ref: The page, or ``None`` at either end of a tractate.

    Returns:
        ``{"daf": 2, "amud": "a"}``, or ``None`` if ``ref`` is ``None``.
    """
    if ref is None:
        return None
    daf, amud = ref
    return {"daf": daf, "amud": _amud_name(amud)}


def print_scan_url(tractate: Tractate, daf: int, amud: int) -> str | None:
    """Where the scanned printed page is, as a PDF on HebrewBooks.

    The side is part of the ``daf`` value: ``2b`` for side b, the bare number for
    side a. The PDF is not tested to hold only that page.

    Args:
        tractate: A Bavli tractate, by its English name.
        daf: The page number.
        amud: ``0`` for side a, ``1`` for side b.

    Returns:
        The address, or ``None`` for a tractate HebrewBooks has no working page for.
    """
    number = HEBREWBOOKS_NUMBERS.get(tractate.en)
    if number is None:
        return None
    side = "b" if amud else ""
    return f"https://hebrewbooks.org/shas.aspx?mesechta={number}&daf={daf}{side}&format=pdf"


def is_paged(tractate: Tractate) -> bool:
    """Whether the tractate is numbered by daf and amud, so it can be read by page."""
    return isinstance(tractate.scheme, DafScheme) and tractate.scheme.arity == 2


def page_range(tractate: Tractate) -> tuple[Ref, Ref] | None:
    """The first and last page of a tractate, or ``None`` if it has no pages.

    A tractate can begin or end on side b (Tamid starts at 25b), so the range
    is in pages, not whole dafim.

    Args:
        tractate: Any tractate; one not numbered by daf and amud has no range.
    """
    if not is_paged(tractate):
        return None
    pages = tractate.page_refs()
    return pages[0], pages[-1]


def page_text(library: BookLibrary, book_id: str, tractate_he: str, daf: int, amud: int) -> DafPage:
    """The text of one page, and the pages before and after it.

    Args:
        library: The enabled books.
        book_id: The book to read, e.g. ``"bavli"``.
        tractate_he: That book's tractate, by its Hebrew name.
        daf: The page number.
        amud: ``0`` for side a, ``1`` for side b.

    Returns:
        The page's paragraphs in reading order. ``previous`` and ``next`` are
        the neighbouring pages that have text, ``None`` at either end.

    Raises:
        UnknownBookError: If ``book_id`` is not an enabled book.
        TractateNotFoundError: If the book has no such tractate.
        NotPagedBookError: If the book is not numbered by daf and amud.
        PageNotFoundError: If the tractate has no text on that page.
    """
    book = library.book(book_id)
    tractate = library.corpus(book.id).tractate_by_name(tractate_he)
    if tractate is None:
        raise TractateNotFoundError(tractate_he)
    if not is_paged(tractate):
        raise NotPagedBookError(book.id)

    ref = (daf, amud)
    segments = [segment.text for _, segment in tractate.segments_under(ref)]
    if not segments:
        raise PageNotFoundError(f"{tractate.he} {daf}{_amud_name(amud)}")

    pages = tractate.page_refs()
    index = pages.index(ref)
    return DafPage(
        book=book,
        tractate=tractate,
        ref=ref,
        segments=segments,
        citation=tractate.scheme.hebrew(tractate.he, ref),
        sefaria_url=tractate.scheme.sefaria_url(tractate.sefaria_title, ref),
        previous=pages[index - 1] if index > 0 else None,
        next=pages[index + 1] if index + 1 < len(pages) else None,
        print_url=print_scan_url(tractate, daf, amud),
    )
