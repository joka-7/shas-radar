"""FastAPI application.

Serves the JSON search API and the mobile web UI from the *same origin*, so
there is no CORS involved -- the page and the API it calls share a host.
"""

from __future__ import annotations

import os
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Literal

from fastapi import FastAPI, HTTPException, Query, Request, Response
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from model_dispatcher.exceptions import ModelDispatcherError
from pydantic import BaseModel, ConfigDict, Field

from . import ai
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
    """Liveness check that also reports what corpus is loaded.

    ``commit`` echoes Render's own RENDER_GIT_COMMIT env var (set
    automatically on every deploy) so the footer can show which commit is
    actually running -- a plain, unambiguous way to tell whether a given
    fix has really been deployed, rather than inferring it from behavior.
    """
    corpus = load_corpus()
    return {
        "status": "ok",
        "words": len(corpus),
        "tractates": len(corpus.tractates),
        "source": corpus.source,
        "license": corpus.license,
        "commit": os.environ.get("RENDER_GIT_COMMIT", "dev")[:7],
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
    offset: int = Query(0, description="Skip this many matches per group, for a group's own 'show more'; clamped to >= 0"),
) -> dict:
    corpus = load_corpus()
    queries = parse_queries(q)
    return search(
        corpus, queries, before=before, after=after, limit=limit, tractate_filter=tractate, offset=offset
    )


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
        daf, amud = tr.token_daf[lo], tr.amud_at(lo)
        results.append(
            {
                "text": " ".join(tr.tokens_raw[lo : hi + 1]),
                "tractate": {"he": tr.he, "en": tr.en},
                "citation": f"{tr.he} {daf_citation(daf, amud)}",
                "sefariaUrl": f"https://www.sefaria.org/{tr.en.replace(' ', '_')}.{daf}{amud}",
            }
        )
    return {"total": total, "results": results}


class AnalyzeResultItem(BaseModel):
    """The subset of a search result the analysis prompt actually needs."""

    citation: str = ""
    before: str = ""
    match: str = ""
    after: str = ""


class AnalyzeGroup(BaseModel):
    query: str
    results: list[AnalyzeResultItem] = Field(default_factory=list)


class AnalyzeCredential(BaseModel):
    """A visitor's own key(s) for one vendor -- "bring your own key" (BYOK).

    Never persisted: threaded straight into the one ModelDispatcher
    dispatch this request makes (see app/ai.py) and discarded afterwards.
    Several keys for the same vendor are pooled -- ModelDispatcher rotates
    through them on a rate limit before giving up on that vendor.
    """

    # Capped defensively (an unbounded list/string in a request body costs
    # nothing to send but shouldn't cost us anything to accept either) --
    # nobody legitimately pools more than a handful of keys for one vendor,
    # and no real API key is anywhere near 200 characters.
    model_config = ConfigDict(str_max_length=200)

    provider: Literal["gemini", "openai", "anthropic"]
    apiKeys: list[str] = Field(default_factory=list, max_length=5)


class AnalyzeBody(BaseModel):
    # Same cap as a search's own comma-separated term limit (MAX_QUERIES) --
    # an analysis can never legitimately cover more groups than one search
    # response can contain.
    groups: list[AnalyzeGroup] = Field(min_length=1, max_length=MAX_QUERIES)
    locale: str = "he"
    credentials: list[AnalyzeCredential] = Field(default_factory=list, max_length=3)


@app.get("/api/ai-status")
def ai_status_endpoint() -> dict:
    """Which vendors already have a shared server key -- for the AI settings UI.

    Lets the settings panel tell a visitor "no key needed for this one" per
    vendor, versus "bring your own" for the rest.
    """
    configured = ai.server_configured_providers()
    return {"providers": {name: name in configured for name in ("gemini", "openai", "anthropic")}}


@app.post("/api/analyze")
def analyze_endpoint(body: AnalyzeBody) -> JSONResponse:
    """AI-assisted: look for a connection across the groups' top results.

    The one endpoint in this app that makes an outbound network call (see
    app/ai.py) -- everything else runs off the bundled, offline corpus.
    Works from a server-configured key, a visitor's own (``body.credentials``),
    or both; answers a clean 400 ``no_credential`` rather than a crash when
    neither is available for any vendor.
    """
    groups = [g.model_dump() for g in body.groups]
    credentials = {
        cred.provider: [key.strip() for key in cred.apiKeys if key.strip()] for cred in body.credentials
    }
    try:
        result = ai.analyze_connections(groups, body.locale, credentials=credentials)
    except ai.NoCredentialError:
        return JSONResponse(
            status_code=400,
            content={"error": "אין מפתח AI זמין — הוסיפו מפתח משלכם בהגדרות ה-AI", "code": "no_credential"},
        )
    except ai.RequestTimeoutError:
        return JSONResponse(
            status_code=504,
            content={"error": "הבקשה ל-AI ארכה יותר מדי זמן — נסו שוב", "code": "timeout"},
        )
    except ModelDispatcherError as exc:
        # Reshaped into this app's own {"error", "code"} convention (the same
        # one http_exception_handler below produces) rather than exposing
        # ModelDispatcher's own {"error", "detail"} payload shape verbatim --
        # so the frontend's existing `error.code.*` lookup pattern just works.
        return JSONResponse(
            status_code=exc.http_status,
            content={"error": exc.message, "code": exc.error_code},
        )

    return JSONResponse(content={"connection": result.text, "provider": result.provider})


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
