"""A commentary's comments on one page of the book it is keyed to.

Rashi is keyed to the Bavli's pages: each of its comments carries the daf and
amud of the passage it explains. Given a Bavli result, this finds Rashi's
comments on the same page.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from .books import Book, BookError, BookLibrary
from .citation import CITATION_SCHEMES, Ref
from .corpus import Tractate


class CommentaryError(BookError):
    """Base class for errors looking up a page's commentary."""


class NoCommentaryError(CommentaryError):
    """The book has no enabled commentary."""


class UnknownTractateError(CommentaryError, LookupError):
    """The book has no tractate by that name."""


@dataclass(frozen=True)
class Comment:
    """One comment, with where it sits in the commentary."""

    ref: Ref
    text: str
    sefaria_url: str


@dataclass(frozen=True)
class PageCommentary:
    """The commentary on one page. ``tractate`` is ``None`` when the commentary
    does not cover the page's tractate at all."""

    book: Book
    tractate: Tractate | None
    citation: str | None
    sefaria_url: str | None
    comments: list[Comment]

    def as_dict(self) -> dict[str, Any]:
        """The JSON shape of ``GET /api/commentary``."""
        return {
            "book": {"id": self.book.id, "he": self.book.he, "en": self.book.en},
            "tractate": (
                {"he": self.tractate.he, "en": self.tractate.en} if self.tractate else None
            ),
            "citation": self.citation,
            "sefariaUrl": self.sefaria_url,
            "comments": [
                {"ref": list(c.ref), "text": c.text, "sefariaUrl": c.sefaria_url}
                for c in self.comments
            ],
        }


def commentary_on_page(
    library: BookLibrary, book_id: str, tractate_he: str, daf: int, amud: int
) -> PageCommentary:
    """The commentary's comments on one page of a book.

    Args:
        library: The enabled books.
        book_id: The book whose page it is, e.g. ``"bavli"``.
        tractate_he: That book's tractate, by its Hebrew name.
        daf: The page number.
        amud: ``0`` for side a, ``1`` for side b.

    Returns:
        The comments in reading order. A page, or a whole tractate, that the
        commentary does not cover gives no comments rather than an error.

    Raises:
        UnknownBookError: If ``book_id`` is not an enabled book.
        NoCommentaryError: If no enabled book comments on ``book_id``.
        UnknownTractateError: If the book has no such tractate.
    """
    commentary = library.commentary_for(library.book(book_id).id)
    if commentary is None:
        raise NoCommentaryError(book_id)
    base = library.corpus(book_id).tractate_by_name(tractate_he)
    if base is None:
        raise UnknownTractateError(tractate_he)

    tractate = library.corpus(commentary.id).tractate_by_en(commentary.title_prefix + base.en)
    if tractate is None:
        return PageCommentary(commentary, None, None, None, [])

    page = CITATION_SCHEMES["daf"]
    page_ref = (daf, amud)
    return PageCommentary(
        book=commentary,
        tractate=tractate,
        citation=page.hebrew(tractate.he, page_ref),
        sefaria_url=page.sefaria_url(tractate.sefaria_title, page_ref),
        comments=[
            Comment(
                ref=ref,
                text=segment.text,
                sefaria_url=tractate.scheme.sefaria_url(tractate.sefaria_title, ref),
            )
            for ref, segment in tractate.segments_under(page_ref)
        ],
    )
