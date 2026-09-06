"""FastAPI application.

Serves the JSON search API and the mobile web UI from the *same origin*, so
there is no CORS involved -- the page and the API it calls share a host.
"""

from __future__ import annotations

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException, Query, Request, Response
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from .corpus import load_corpus
from .hebrew import daf_citation
from .search import (
    DEFAULT_CONTEXT,
    DEFAULT_LIMIT,
    MAX_LIMIT,
    Query as SearchQuery,
    find_proximity,
    search,
)

STATIC_DIR = Path(__file__).resolve().parent.parent / "static"

# A term separator, same convention as פסוק לשם: comma (Latin or Arabic) or
# semicolon separates independent OR-searched terms.
SEPARATORS = ",،;"
MAX_QUERIES = 5


@asynccontextmanager
async def lifespan(_: FastAPI):
    """Load and index the corpus at boot, rather than on the first request."""
    corpus = load_corpus()
    print(f"Loaded {len(corpus):,} tokens from {len(corpus.tractates)} tractates.")
    yield


app = FastAPI(
    title="Shas Radar",
    description="Search the Babylonian Talmud for words, names, and phrases with surrounding context.",
    version="1.0.0",
    lifespan=lifespan,
)


@app.middleware("http")
async def no_cache_static_assets(request: Request, call_next) -> Response:
    """Force revalidation on every load of the page and its static assets.

    Without this, a browser (or an intermediate cache) holding a cached copy
    of e.g. app.js from before a deploy can go on serving it indefinitely,
    since the URL never changes. "no-cache" still lets the browser keep its
    copy -- it just has to check with the server first (a cheap conditional
    request), so a change always takes effect on the very next load.
    """
    response = await call_next(request)
    path = request.url.path
    if path == "/" or path.endswith((".html", ".js", ".css")):
        response.headers["Cache-Control"] = "no-cache"
    return response


def error(code: str, message: str) -> dict:
    return {"code": code, "message": message}


def parse_queries(raw: str) -> list[SearchQuery]:
    for separator in SEPARATORS[1:]:
        raw = raw.replace(separator, SEPARATORS[0])
    parts = [part.strip() for part in raw.split(SEPARATORS[0]) if part.strip()]

    if not parts:
        raise HTTPException(status_code=400, detail=error("empty", "יש להזין מילה, שם או ביטוי לחיפוש"))
    if len(parts) > MAX_QUERIES:
        raise HTTPException(
            status_code=400,
            detail=error("too_many", f"אפשר לחפש עד {MAX_QUERIES} מונחים בבת אחת"),
        )

    try:
        return [SearchQuery.parse(part) for part in parts]
    except ValueError:
        raise HTTPException(
            status_code=400, detail=error("invalid_query", "יש להזין טקסט באותיות עבריות")
        ) from None


@app.get("/api/health")
def health() -> dict:
    corpus = load_corpus()
    return {
        "status": "ok",
        "words": len(corpus),
        "tractates": len(corpus.tractates),
        "source": corpus.source,
        "license": corpus.license,
    }


@app.get("/api/tractates")
def tractates_endpoint() -> dict:
    """The full tractate list, grouped by seder, for the UI's filter picker."""
    corpus = load_corpus()
    return {
        "tractates": [
            {
                "he": t.he,
                "en": t.en,
                "sederHe": t.seder_he,
                "sederEn": t.seder_en,
                "words": len(t),
            }
            for t in corpus.tractates
        ]
    }


@app.get("/api/search")
def search_endpoint(
    q: str = Query(..., description="One term, or several separated by a comma"),
    before: int = Query(DEFAULT_CONTEXT, description="Words of context before the match; clamped to the allowed range"),
    after: int = Query(DEFAULT_CONTEXT, description="Words of context after the match; clamped to the allowed range"),
    limit: int = Query(DEFAULT_LIMIT, description="Max results per group; clamped to the allowed range"),
    tractate: str | None = Query(None, description="Restrict to one tractate (Hebrew name)"),
) -> dict:
    corpus = load_corpus()
    queries = parse_queries(q)
    return search(corpus, queries, before=before, after=after, limit=limit, tractate_filter=tractate)


@app.get("/api/proximity")
def proximity_endpoint(
    a: str = Query(..., description="First word"),
    b: str = Query(..., description="Second word"),
    within: int = Query(6, ge=1, le=50, description="Maximum distance in words"),
    limit: int = Query(DEFAULT_LIMIT, ge=1, le=MAX_LIMIT),
) -> dict:
    """Bonus: find A and B occurring within `within` words of each other."""
    corpus = load_corpus()
    try:
        word_a = SearchQuery.parse(a).words_norm[0]
        word_b = SearchQuery.parse(b).words_norm[0]
    except (ValueError, IndexError):
        raise HTTPException(
            status_code=400, detail=error("invalid_query", "יש להזין שתי מילים באותיות עבריות")
        ) from None

    pairs = find_proximity(corpus, word_a, word_b, within)
    total = len(pairs)
    shown = pairs[:limit]
    results = []
    for pair in shown:
        tr = pair["tractate"]
        lo, hi = sorted((pair["posA"], pair["posB"]))
        daf, amud = tr.token_daf[lo], tr.token_amud[lo]
        results.append(
            {
                "text": " ".join(tr.tokens_raw[lo : hi + 1]),
                "tractate": {"he": tr.he, "en": tr.en},
                "citation": f"{tr.he} {daf_citation(daf, amud)}",
                "sefariaUrl": f"https://www.sefaria.org/{tr.en.replace(' ', '_')}.{daf}{amud}",
            }
        )
    return {"total": total, "results": results}


@app.exception_handler(HTTPException)
def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    detail = exc.detail
    if isinstance(detail, dict):
        content = {"error": detail.get("message", ""), "code": detail.get("code")}
    else:
        content = {"error": detail, "code": None}
    return JSONResponse(status_code=exc.status_code, content=content)


# Mounted last so that /api/* routes win; html=True serves index.html at "/".
app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")
