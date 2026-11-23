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
from .commentary_store import (
    CommentaryStores,
    StoredCommentary,
    StoredTractate,
    UnknownCommentaryError,
)
from .corpus import Tractate
from .hebrew import daf_citation, printed_text


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
    sefaria_url: str | None


@dataclass(frozen=True)
class PageCommentary:
    """The commentary on one page. ``tractate`` is ``None`` when the commentary
    does not cover the page's tractate at all."""

    book: Book
    tractate: Tractate | None
    citation: str | None
    sefaria_url: str | None
    comments: list[Comment]
    license: str | None = None

    def as_dict(self) -> dict[str, Any]:
        """The JSON shape of ``GET /api/commentary``."""
        return {
            "book": {"id": self.book.id, "he": self.book.he, "en": self.book.en},
            "tractate": (
                {"he": self.tractate.he, "en": self.tractate.en} if self.tractate else None
            ),
            "citation": self.citation,
            "sefariaUrl": self.sefaria_url,
            "license": self.license,
            "comments": [
                {
                    "ref": list(c.ref),
                    "text": c.text,
                    "plain": printed_text(c.text),
                    "sefariaUrl": c.sefaria_url,
                }
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
        license=tractate.license,
        comments=[
            Comment(
                ref=ref,
                text=segment.text,
                sefaria_url=tractate.scheme.sefaria_url(tractate.sefaria_title, ref),
            )
            for ref, segment in tractate.segments_under(page_ref)
        ],
    )


@dataclass(frozen=True)
class StoredPageCommentary:
    """A display-only commentary's comments on one page.

    ``aligned`` says whether the commentary has as many paragraph slots on this page
    as the book has paragraphs, so that comment ``n`` can be shown under paragraph
    ``n``. Where it does not, the comments are for the page as a whole.
    """

    commentary: StoredCommentary
    tractate: StoredTractate | None
    citation: str | None
    comments: list[Comment]
    aligned: bool

    def as_dict(self) -> dict[str, Any]:
        """The JSON shape of ``GET /api/commentary`` for a display-only commentary."""
        return {
            "book": {"id": self.commentary.id, "he": self.commentary.he, "en": self.commentary.en},
            "tractate": (
                {"he": self.tractate.he, "en": self.tractate.en} if self.tractate else None
            ),
            "citation": self.citation,
            "sefariaUrl": None,
            "license": self.tractate.license if self.tractate else None,
            "aligned": self.aligned,
            "comments": [
                {"ref": list(c.ref), "text": c.text, "sefariaUrl": None} for c in self.comments
            ],
        }


def stored_commentary_on_page(
    library: BookLibrary,
    stores: CommentaryStores,
    commentary_id: str,
    book_id: str,
    tractate_he: str,
    daf: int,
    amud: int,
) -> StoredPageCommentary:
    """A display-only commentary's comments on one page of a book.

    Args:
        library: The enabled books.
        stores: The enabled display-only commentaries.
        commentary_id: The commentary, e.g. ``"steinsaltz"``.
        book_id: The book whose page it is, e.g. ``"bavli"``.
        tractate_he: That book's tractate, by its Hebrew name.
        daf: The page number.
        amud: ``0`` for side a, ``1`` for side b.

    Returns:
        The comments in paragraph order. A page, or a whole tractate, the commentary
        does not cover gives no comments rather than an error.

    Raises:
        UnknownCommentaryError: If ``commentary_id`` is not an enabled commentary.
        UnknownBookError: If ``book_id`` is not an enabled book.
        NoCommentaryError: If the commentary is not on ``book_id``.
        UnknownTractateError: If the book has no such tractate.
    """
    store = stores.store(commentary_id)
    book = library.book(book_id)
    if store.info.commentary_on != book.id:
        raise NoCommentaryError(book.id)
    base = library.corpus(book.id).tractate_by_name(tractate_he)
    if base is None:
        raise UnknownTractateError(tractate_he)

    tractate = store.tractate(base.en)
    if tractate is None:
        return StoredPageCommentary(store.info, None, None, [], aligned=True)

    page = (daf, amud)
    slots = tractate.slots.get(page)
    return StoredPageCommentary(
        commentary=store.info,
        tractate=tractate,
        citation=f"{tractate.he} {daf_citation(daf, 'ab'[amud])}",
        comments=[
            Comment(ref=(daf, amud, paragraph), text=text, sefaria_url=None)
            for paragraph, text in tractate.pages.get(page, ())
        ],
        aligned=slots is None or slots == len(base.segments_under(page)),
    )


def commentary_for_page(
    library: BookLibrary,
    stores: CommentaryStores,
    book_id: str,
    tractate_he: str,
    daf: int,
    amud: int,
    commentary_id: str | None,
) -> PageCommentary | StoredPageCommentary:
    """One page's comments from the named commentary, or from Rashi when none is named.

    Args:
        library: The enabled books.
        stores: The enabled display-only commentaries.
        book_id: The book whose page it is.
        tractate_he: That book's tractate, by its Hebrew name.
        daf: The page number.
        amud: ``0`` for side a, ``1`` for side b.
        commentary_id: A display-only commentary, the searchable commentary book
            (Rashi), or ``None`` for the latter.

    Raises:
        UnknownCommentaryError: If ``commentary_id`` names neither.
        BookError: As :func:`commentary_on_page` and
            :func:`stored_commentary_on_page` raise.
    """
    if commentary_id is not None and commentary_id in stores.ids():
        return stored_commentary_on_page(
            library, stores, commentary_id, book_id, tractate_he, daf, amud
        )
    searchable = library.commentary_for(library.book(book_id).id)
    if commentary_id is not None and (searchable is None or searchable.id != commentary_id):
        raise UnknownCommentaryError(commentary_id)
    return commentary_on_page(library, book_id, tractate_he, daf, amud)
