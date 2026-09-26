# Low-level design — Shas Radar

Per-module contracts, the exact response shapes, and the non-obvious logic.
System-level context is in [`HLD.md`](HLD.md).

## `app/hebrew.py` — normalization primitives

Pure functions over `str`. No knowledge of the corpus, tractates, or HTTP.

| Function | Contract |
| --- | --- |
| `normalize_finals(text)` | Fold ך ם ן ף ץ onto כ מ נ פ צ |
| `has_hebrew(text)` | Whether any Hebrew consonant is present |
| `words(text)` | Text split into normalized words on any non-letter run |
| `tokenize(text)` | `(raw, normalized)` pairs in reading order, off runs of letters plus attached niqqud |
| `he_number(value)` | Integer → Hebrew numeral (`15 → ט״ו`, not יה) |
| `daf_citation(daf, amud)` | The printed page suffix: `ב.` for 2a, `ל:` for 30b |

**Why tokenizing works off letter-runs, not whitespace.** A vocalized
word's niqqud sits *between* its letters, so a bare-letters regex would
fragment `מֵאֵימָתַי` into five pieces. `WORD_RUN` matches letters and their
attached niqqud together, keeping the word one token; `MARKS.sub` then
strips niqqud only from the `normalized` half of the pair, so `raw` still
reads exactly as printed.

**Why maqaf (`־`) is a separator, not a stripped mark.** It joins two words
in the source text (`אֲשֶׁר־אָמַר`). Stripping it like an ordinary mark would
fuse the two words into one for matching purposes; treating it as
non-letter (and therefore a boundary in `NON_LETTERS`/`WORD_RUN`) keeps
`אשר` and `אמר` as two tokens.

## `app/corpus.py` — model and indexes

### `Segment`

A `__slots__` record: one paragraph's `daf`, `amud`, full `text`, and its
`[start, end)` token-position range in the tractate's stream.

### `Tractate`

```python
Tractate(he: str, en: str, seder_he: str, seder_en: str)
```

Built incrementally: `add_segment(daf, amud, text)` tokenizes one segment
and appends it to the tractate's flat, continuous token stream (see
**HLD — Data storage** for why interning and `array.array` are used here),
then `build_index()` builds `by_word` once all segments are in.

| Field / method | Contract |
| --- | --- |
| `tokens` / `tokens_raw` | Normalized / as-printed token stream, interned |
| `token_daf` / `token_amud` | Parallel `array.array("B")` columns |
| `by_word` | `dict[str, array.array[int]]` — normalized word → sorted token positions |
| `segment_at(position)` | The `Segment` (paragraph) containing that token, via `bisect` on `segment_starts` |
| `amud_at(position)` | `"a"`/`"b"`, decoded from the packed `token_amud` byte |
| `citation(position)` | The traditional printed citation for that token |
| `__len__` | Token count |

### `Corpus`

```python
Corpus(dataset: dict[str, Any])
```

Builds one `Tractate` per entry in the dataset, in the order the file lists
them (the traditional Vilna Shas order — see `scripts/build_dataset.py`).

| Method | Contract |
| --- | --- |
| `tractate_by_name(name_he)` | The `Tractate` with that Hebrew name, or `None` |
| `__len__` | Total token count across every tractate |

`load_corpus(path=None)` is `@functools.lru_cache(maxsize=1)`, so the gzip
read and the whole indexing pass happen once per process. Passing an
explicit `path` is how tests load a fixture instead of the real corpus.

## `app/search.py` — matching, proximity, and KWIC shaping

### `Query`

`Query.parse(raw)` strips, rejects input with no Hebrew (`ValueError`), and
stores `raw` plus `words_norm` (a tuple — one entry for a single word, more
for a phrase). `is_phrase` is `len(words_norm) > 1`.

### `Match`

One place a query matched: `tractate`, `start` (token position), `length`
(tokens spanned), `kind` (`"exact"` | `"withPrefix"`).

### Finding matches

| Function | Returns | Cost |
| --- | --- | --- |
| `find_exact_word(corpus, word)` | Every position for `word` | `by_word` dict hit per tractate |
| `find_with_prefix(corpus, word)` | Positions where a word *ends with* `word` but isn't it | Linear scan of each tractate's distinct vocabulary |
| `find_phrase(corpus, words)` | Consecutive-position matches for a multi-word query | `by_word` hit on the first word, then a positional check |
| `find_phrase_with_prefix(corpus, words)` | Same, but the phrase's first word also gets attached-prefix treatment | Vocabulary scan + positional check |
| `find_proximity(corpus, a, b, within)` | `{tractate, posA, posB}` pairs within `within` tokens, either order | `by_word` hits on both, then a bounded double loop |

**Why "prefix" search is really a suffix scan.** Hebrew/Aramaic clitics
(ו/ה/ב/כ/ל/מ/ש, and combinations) attach to the *front* of a word, so a
search for אביי also has to find דאביי. The rule that expresses that is "the
candidate word ends with the query" — `find_with_prefix` is named for the
grammar being matched, not the string operation used.

**Why only the phrase's first word gets that treatment.** A clitic attaches
to whichever word actually starts the sentence; the words after it in a
phrase still have to match exactly. `find_phrase_with_prefix` applies the
suffix check only to `words_norm[0]`, then requires every later word to
match `rest` positionally, same as `find_phrase`.

### Shaping results

```python
search_one(corpus, query, before, after, limit, tractate_filter=None, offset=0) -> dict[str, Any]
search(corpus, queries, before=DEFAULT_CONTEXT, after=DEFAULT_CONTEXT,
       limit=DEFAULT_LIMIT, tractate_filter=None, offset=0) -> dict[str, Any]
```

`search_one` runs one query's match functions, optionally filters by
tractate, sorts exact matches before with-prefix matches (stable within each
tier), and slices `[offset:offset+limit]` — what lets a group's own "show
more" button fetch the next page of the *same* query without skipping or
repeating a result. `search` clamps `before`/`after`/`limit`/`offset` into
their allowed ranges and runs every comma-separated query independently
(OR), one result group each.

`serialize_match(corpus, match, before, after)` shapes one match into the
KWIC payload: `before`/`match`/`after` text slices off `tokens_raw`,
citation (Hebrew and English), the Sefaria URL, and `fullParagraph` (the
whole segment, for the UI's on-demand expansion).

Constants: `DEFAULT_LIMIT = 50`, `MAX_LIMIT = 200`, `DEFAULT_CONTEXT = 5`,
`MIN_CONTEXT = 1`, `MAX_CONTEXT = 50`.

## `app/ai.py` — optional AI connections

Builds a [ModelDispatcher](https://github.com/joka-7/ModelDispatcher)
gateway from whichever credentials exist for one request — server env vars,
a visitor's own (BYOK), or both — via `model_dispatcher.byok`, which owns
the registry-building, credential-metadata, and timeout-wiring this module
used to hand-roll. `_build_registry`, `_credential_metadata`,
`NoCredentialError`, `RequestTimeoutError` stay this module's own names
(its public API, per its tests) but delegate straight through.

```python
analyze_connections(groups: list[dict[str, Any]], locale: str = "he", *,
                     credentials: dict[str, list[str]] | None = None,
                     gateway: ModelGateway | None = None,
                     history: list[dict[str, str]] | None = None) -> AnalyzeResult
```

| Behavior | Detail |
| --- | --- |
| Registry | Rebuilt per request, registering only vendors with a usable key for *this* request — a keyless vendor is left out entirely rather than included and left to hard-fail the dispatch chain |
| Quota | One app-wide `TenantQuota` (`AI_REQUESTS_PER_MIN`/`AI_TOKENS_PER_MIN`/`AI_TOKENS_PER_DAY`), shared across every visitor since there is no per-user auth |
| Deadline | `dispatch_with_timeout` on a dedicated 4-worker thread pool, bounded to `AI_REQUEST_DEADLINE_SECONDS` (default 30) — no ModelDispatcher provider adapter sets its own HTTP timeout |
| Prompt | `_SYSTEM_PROMPT` plus `_format_groups(groups)`, capped to `MAX_GROUPS` (5) groups and `MAX_RESULTS_PER_GROUP` (6) results each, each snippet capped to `SNIPPET_WORD_CAP` (40) words |
| `history` param | A "continue chatting" follow-up's prior turns (`[{"role": "assistant"\|"user", "content": ...}, ...]`), appended as `Message`s after the groups prompt, capped at `MAX_HISTORY_TURNS` (20). Empty/omitted for the original single-shot analysis — the client resends the whole exchange on every follow-up since nothing is kept server-side |
| `gateway` param | Injection seam for tests — a `MockProvider`-backed gateway, never a real network call in the suite |

Raises `NoCredentialError` (no key anywhere), `RequestTimeoutError` (deadline
exceeded), or lets any `model_dispatcher.exceptions.ModelDispatcherError`
propagate — each already carries the HTTP status `main.py` needs to surface
it as-is.

## `app/main.py` — HTTP boundary

### Wiring

`lifespan` loads and indexes the corpus at boot; `load_corpus()` being
cached means every later call in a handler is a dict lookup, not a reload.

The `no_cache_static_assets` middleware forces revalidation on `/` and
`static/*.js`/`*.css`, so a deploy always takes effect on the next load
rather than a stale bundle outliving it (its URL never changes).

**CORS.** `ALLOWED_ORIGINS` is an explicit allowlist plus an
`allow_origin_regex` for Vercel's per-branch preview hostnames.
`allow_credentials` stays `False` — no cookies, no auth — which is what lets
the allowlist stay a plain list rather than a stricter per-request check,
even though `/api/analyze` accepts a visitor's own API keys in its body.

### Routes

| Route | Query / body | Response |
| --- | --- | --- |
| `GET /api/health` | — | `status`, `words`, `tractates`, `source`, `license`, `commit` |
| `GET /api/tractates` | — | The full tractate list, grouped by seder |
| `GET /api/search` | `q`, `before`, `after`, `limit`, `tractate`, `offset` | `before`, `after`, `groups[]` |
| `GET /api/proximity` | `a`, `b`, `within`, `limit` | `total`, `results[]` |
| `GET /api/ai-status` | — | Which vendors have a shared server key |
| `POST /api/analyze` | `AnalyzeBody` (`groups`, `locale`, `credentials`, `history`) | `{connection, provider}` |
| `GET /` + `/static/*` | — | The frontend, same origin |

### Error contract

One shape everywhere, raised as `HTTPException` (search/validation errors)
or built directly as a `JSONResponse` (AI errors, matching the same shape),
and rendered by `http_exception_handler`:

```json
{"error": "<message, mostly Hebrew>", "code": "<stable machine code>"}
```

`code` values: `empty`, `too_many`, `invalid_query`, `no_credential`,
`timeout`, plus whatever `ModelDispatcherError.error_code` supplies for a
dispatch failure. The frontend's `error.code.*` lookup keys off these.

`parse_queries(raw)` splits on `,`، or `;`, drops blanks, enforces
`MAX_QUERIES` (5), and parses each part as a `SearchQuery`.

## `scripts/build_dataset.py` — corpus build

Build-time only; never imported by the running service.

| Function | Contract |
| --- | --- |
| `clean_segment(text)` | Strips Sefaria's display markup (`<big><strong>`, `<br>`) from one segment |
| `tractate_url(seder, name)` | Builds the export URL for one tractate |
| `fetch_tractate(entry)` | Downloads one tractate, derives `daf`/`amud` from Sefaria's flat `text` array index (`daf = index // 2 + 1`, `amud = "a" if even else "b"`), cleans and shapes its pages |
| `main()` | Fetches all 37 tractates (`ThreadPoolExecutor(max_workers=8)`), restores canonical order, writes `data/shas.json.gz` |

## Logging

Deliberately minimal: one `print` at boot reporting token/tractate counts.
No users to correlate, no request IDs, no aggregator to ship to. Structured
logging would be the right call the moment anything stateful or
multi-tenant arrives; today it would be ceremony.

## Test plan

Arrange–Act–Assert throughout, no mocking of the corpus itself.

| File | Targets |
| --- | --- |
| `tests/test_hebrew.py` | Every normalization primitive, including niqqud stripping, maqaf as a separator, and the ט״ו/ט״ז gematria exception |
| `tests/test_search.py` | Index correctness, all four match kinds (exact, with-prefix, phrase, phrase-with-prefix), proximity, offset/limit pagination, and the HTTP surface via `TestClient` — status codes, the error contract, clamping |
| `tests/test_ai.py` | `analyze_connections` and its supporting functions against ModelDispatcher's keyless `MockProvider`, including the no-credential, timeout, and chat-history (ordering, capping) paths |

The real ~1.86M-token corpus loads once per session in `test_search.py`. The
trade is a startup cost for tests that exercise matching against genuine
text — `אביי` and `רבא` each turning up thousands of times is itself part of
what the tests assert — rather than a fixture that agrees with the
implementation by construction.
