# Shas Radar — search the Talmud for words, names, and phrases

A mobile-first Hebrew/Aramaic web app for searching the entire Babylonian
Talmud (ש״ס) for a word, name, or phrase, and reading it in **context** — a
configurable number of words before and after each match, with the option to
expand to the full surrounding paragraph. Every result carries an authoritative
citation (tractate, daf, amud) and a direct link to that page on Sefaria.

Same architecture as [פסוק לשם](https://github.com/joka-7/ot-va-ot), its sister
project for Tanakh verses: one small FastAPI service, API and UI on the same
origin, the whole corpus bundled locally so the running app never touches the
network.

```
┌── static/ ────────────┐        ┌── app/ ──────────────────┐
│  index.html           │  same  │  main.py    HTTP API      │
│  styles.css           │◄──────►│  search.py  matching, KWIC│
│  app.js, i18n.js       │ origin │  corpus.py  index         │
└───────────────────────┘        │  hebrew.py  normalization │
                                 └──────────┬────────────────┘
                                            │ loaded once at boot
                                 ┌──────────▼────────────────┐
                                 │ data/shas.json.gz   5.1MB │
                                 │ ~1.86M words, 37 tractates│
                                 └───────────────────────────┘
```

## Quick start

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Open <http://127.0.0.1:8000>. That's the whole setup — the corpus is already
in the repository, and the frontend has no build step.

### On your phone, over the local network

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Find your machine's LAN address and open `http://<that-address>:8000` on the
phone, with both devices on the same Wi-Fi:

```bash
hostname -I | awk '{print $1}'          # Linux
ipconfig getifaddr en0                  # macOS
```

## How the Talmud is packaged and loaded

| | |
| --- | --- |
| **Text** | The Vilna edition (מהדורת וילנא), niqqud-vocalized |
| **Source** | [Sefaria's public export](https://github.com/Sefaria/Sefaria-Export) |
| **License** | Public Domain |
| **Size** | 37 tractates (all of Shas with Gemara), ~1.86M words, 5.1 MB gzipped |
| **Packaging** | One gzipped JSON at `data/shas.json.gz`, committed to the repo |
| **Loading** | Read and indexed once at process start, then held in memory |

`scripts/build_dataset.py` is what produced that file. It's a **build-time**
tool, not part of the running app — run it only to refresh the corpus:

```bash
python scripts/build_dataset.py
```

Because the data is committed, the running application never makes a network
call and a fresh clone works offline.

### The text turned out to be vocalized, not plain print

Standard printed editions of the Talmud carry no niqqud, so that was the
initial assumption going in — wrong, and caught by inspecting the actual
fetched data rather than trusting the assumption. Sefaria's "merged" version
here is fully vocalized (vowel points; no cantillation trope, since the Bavli
isn't chanted with Torah trope). The app keeps that: `tokenize()` in
`app/hebrew.py` produces a **raw** form (niqqud kept, exactly as printed) for
display and a **normalized** form (niqqud stripped, finals folded) for
matching — the same raw/normalized split פסוק לשם uses, for the same reason.

## Hebrew/Aramaic normalization

`app/hebrew.py` holds the primitives, all pure functions:

- **Niqqud** is stripped from the normalized form only; the raw/display form
  keeps it, so text reads exactly as printed.
- **Maqaf** (`־`) is deliberately *not* treated as a mark to strip — it joins
  two words, so it's a word separator instead. `אֲשֶׁר־אָמַר` tokenizes as two
  words, `אשר` and `אמר`, not one fused word — the same distinction that
  matters in פסוק לשם, and the same class of bug when gotten wrong (a mark
  range that happens to include U+05BE silently fuses maqaf-joined pairs).
- **Final letters** (אותיות מנצפ״ך) fold to their regular forms, so `שלום`
  and `שלומ` compare equal regardless of a neighboring word's final letter.
- Tokenizing works off runs of **letters plus their attached niqqud**, not off
  whitespace or bare letters — a bare-letters regex fragments a vocalized word
  at every vowel point (`מֵאֵימָתַי` would split into five pieces instead of
  staying one token).

## Matching

Three ways a query can match a word in the corpus:

| Mode | Rule | Example |
| --- | --- | --- |
| **Exact** | the query, normalized, equals the word | `אביי` matches `אביי` |
| **With an attached prefix** | the word *ends with* the query | `אביי` also finds `דאביי`, `לאביי`, `ואביי` |
| **Exact phrase** | a multi-word query matches that consecutive sequence | `אמר רבא` matches only that order, adjacent |
| **Phrase, prefixed first word** | same, but the phrase's *first* word also gets the attached-prefix treatment | `אמר רבא` also finds `ואמר רבא`, `דאמר רבא` |

The "prefix" search is named for the grammar being matched (Hebrew/Aramaic
clitics — ו/ה/ב/כ/ל/מ/ש, and combinations — attach to the *front* of a word),
not the string operation used: a word matches when it *ends with* the query,
so `find_with_prefix` is really a suffix scan. A multi-word query gets this
treatment too, but only on its first word — a clitic attaches to whichever
word actually starts the sentence, so the words after it in the phrase still
have to match exactly (`find_phrase_with_prefix` in `app/search.py`). Exact
and attached-prefix matches are reported separately (`exactTotal`/
`prefixTotal` per group, phrase or not) and never overlap.

A comma (or semicolon) separates independent queries, OR'd together and each
reported as its own result group — up to 5 at once. There's no letter-matching
custom here the way פסוק לשם has for Tanakh verses; the Talmud has no
equivalent tradition, so this is a plain concordance/KWIC search.

**Proximity** (bonus, `/api/proximity`) — two words occurring within N tokens
of each other, either order, same tractate.

## KWIC context

Every result is shaped as **Keyword-In-Context**: the matched word(s), plus a
configurable number of words before and after (default 5, range 1–50,
`before`/`after` query params — clamped to that range rather than rejected, so
a client can pass anything and get a sane result back). Each result also
carries the full paragraph it came from (`fullParagraph`), for a "show full
paragraph" expansion the UI reveals on demand rather than rendering by
default — the KWIC window is the point, not a wall of running Gemara text.

Context is computed as a slice of the tractate's flat token stream, which is
deliberately continuous across segment (paragraph) boundaries — a request for
20 words before a match at the start of a paragraph reaches back into the
previous one, since that's still the surrounding text, not a hard barrier.

## Citations

Every result carries the traditional printed reference — tractate, daf
(page), amud (side) — computed from the Vilna pagination baked into the
source data, formatted with Hebrew numerals (`he_number()` in `app/hebrew.py`,
special-casing 15/16 as ט״ו/ט״ז to avoid the divine name) and the standard
`.`/`:` suffix for amud א/ב, e.g. `ברכות ב.` (Berakhot 2a) or `שבת ל:`
(Shabbat 30b). Each result also links directly to that daf on Sefaria.

## API

The UI is a client of this API; nothing is private to it.

```http
GET /api/search?q=אביי,רבא&before=5&after=5&limit=50&tractate=ברכות
GET /api/proximity?a=אביי&b=רבא&within=6
GET /api/tractates
GET /api/health
POST /api/analyze   {"groups": [...], "locale": "he", "credentials": [...]}   -- see "AI connections" below
GET /api/ai-status   -- which vendors have a shared server key, for the AI settings panel
```

`q` accepts one term, a phrase, or several comma/semicolon-separated terms
(up to 5). `tractate` (optional) restricts to one tractate by its Hebrew name.
Errors come back as `{"error": "…", "code": "…"}` — `error` is a Hebrew message
ready to display as-is; `code` (`empty` | `too_many` | `invalid_query`) is a
stable string for the frontend.

```jsonc
{
  "before": 5, "after": 5,          // the clamped values actually used
  "groups": [
    {
      "query": "אביי", "isPhrase": false,
      "total": 2431, "exactTotal": 2103, "prefixTotal": 328,
      "results": [
        {
          "kind": "exact",                       // "exact" | "withPrefix"
          "before": "אמר רב יוסף אמר", "match": "אביי", "after": "אמר מאי טעמא",
          "tractate": { "he": "ברכות", "en": "Berakhot" },
          "seder": { "he": "זרעים", "en": "Zeraim" },
          "daf": 3, "amud": "b",
          "citation": "ברכות ג:", "citationEn": "Berakhot 3b",
          "sefariaUrl": "https://www.sefaria.org/Berakhot.3b",
          "fullParagraph": "…"
        }
      ]
    }
  ]
}
```

## AI connections (optional)

**"Find connections between results"**, shown above the results (not
scrolled past below them) whenever a search turns up at least 2 individual
matches, sends the top few of them to a language model and asks it to find
what connects them. That's meaningful in two shapes:

- **One search term with several occurrences** — look for a pattern across
  them: a recurring context, a halachic theme, a particular group of sages
  who use it a specific way, a shift in meaning across tractates.
- **A comma-separated search (up to 5 terms)**, already putting several
  result groups side by side — look for what links the *terms*: a shared
  sugya, a recurring dispute, amoraim who appear together, a plausible
  reason to search these together.

Answers in the UI's current language (Hebrew/English/French); the Talmud
text quoted in the prompt stays Hebrew/Aramaic, same as everywhere else in
this app.

This is the **one** thing in the app that makes an outbound network call —
everything else (see "How the Talmud is packaged and loaded" above) runs off
the bundled, offline corpus, on purpose. `app/ai.py` builds a
[ModelDispatcher](https://github.com/joka-7/ModelDispatcher) gateway from
whichever credentials actually exist for *this* request — server-side, a
visitor's own, or both — and answers a clean `400 no_credential` rather than
a crash when neither is available for any vendor. A fresh clone with no keys
set anywhere runs the rest of the app exactly as before.

### Server-side keys (shared across every visitor)

Set any one (or more, for cross-provider fallback) of:

| Env var | Vendor | Default model |
| --- | --- | --- |
| `GEMINI_API_KEY` | Google Gemini | `gemini-2.5-flash` (override: `GEMINI_MODEL`) |
| `OPENAI_API_KEY` | OpenAI | `gpt-4o-mini` (override: `OPENAI_MODEL`) |
| `ANTHROPIC_API_KEY` | Anthropic | `claude-opus-4-8` (override: `ANTHROPIC_MODEL`) |

With more than one key set, ModelDispatcher's own router/fallback chain
tries the cheaper model first and transparently escalates on failure — no
extra wiring needed for that. An app-wide token budget (not per-visitor,
since there's no auth here) protects against runaway cost, tunable via
`AI_REQUESTS_PER_MIN` / `AI_TOKENS_PER_MIN` / `AI_TOKENS_PER_DAY`
(defaults: 10 / 20,000 / 200,000); once spent, `/api/analyze` answers a
`quota_exceeded` error until the window resets rather than calling the
model.

### Bring your own key (per visitor)

**⚙ AI settings** (in the footer, and next to the connections button once
it's shown) opens a panel where a visitor can paste their own key for
Gemini, OpenAI, or Anthropic — several keys per vendor if they like, pooled
for redundancy (ModelDispatcher rotates through them on a rate limit before
giving up on that vendor). `/api/ai-status` tells the panel which vendors
already have a shared server key, so it can say "optional" versus "bring
your own" per vendor.

A key a visitor adds:

- Is stored **only** in that browser's `localStorage`
  (`shas-radar:ai-keys`) — never sent anywhere but this app's own `/api/analyze`.
- Is **never** persisted server-side or logged; it's threaded straight into
  the one ModelDispatcher dispatch the request makes and discarded
  afterwards (`AnalyzeCredential` in `app/main.py`, `credentials` param on
  `ai.analyze_connections`).
- Always takes precedence over the shared server key **for that vendor**
  (ModelDispatcher's own credential precedence) — different vendors can mix,
  e.g. the server has a Gemini key, a visitor adds their own Anthropic key,
  and both participate in the same cost-tiered fallback chain for that one
  request.

The registry is rebuilt per request rather than once at startup, specifically
so a vendor with *no* key at all for a given request (neither server nor
visitor) is left out of it entirely — ModelDispatcher treats an auth failure
as terminal, not fallback-worthy, so a keyless vendor sitting ahead of one
the visitor actually gave a key for would otherwise hard-fail the whole
request before ever reaching the one that would have worked. See the
docstring at the top of `app/ai.py` for the full reasoning.

### No key at all

Every failure mode that means "this app's own AI path can't serve this
request" (`no_credential`, a rejected key, quota exhaustion, every provider
failing) surfaces a nudge toward **⚙ AI settings**, plus **"ask an external
AI"** links to ChatGPT, Claude, and Google's AI-mode search — the same
question, copied to the clipboard and opened pre-filled in a new tab where
the target supports it. No key, no backend call: just a deep link into a
product the visitor can already use for free.

## UI

Mobile-first, available in Hebrew, English and French (`static/i18n.js`, the
same plain string-table pattern as פסוק לשם — `{token}` interpolation and
one/two/other pluralization, Hebrew's dual form included), RTL for Hebrew and
LTR for English/French.

- One search field, comma hint, and example chips.
- Stepper controls for words-before/words-after (±1, clamped 1–50) rather than
  a bare number input, since the range fits comfortably on a phone as
  tap-targets.
- An optional tractate/seder filter.
- Each result: tractate + citation badges, the KWIC line with the match
  highlighted, a "show full paragraph" disclosure, a copy-quote button
  (`"...before match after..." (citation)`, clipboard API with a
  `document.execCommand` fallback for older mobile Safari), and a direct
  Sefaria link.
- A "waking the server" notice if a request is still pending after 2.5s
  (`armWaking`/`disarmWaking` in `static/app.js`) — see **Deploying** below.

### Language

Two things never translate, on purpose, the same as in פסוק לשם: **the
Talmud text** (the KWIC context, the expanded paragraph) and **its
citation** (e.g. `ברכות ה.`) — always the original Hebrew/Aramaic, gematria
included, regardless of the UI language. The search field only ever accepts
Hebrew/Aramaic input too, so the example chips and the placeholder's example
text stay Hebrew in every locale as well.

Tractate and seder names *do* switch with the locale, using the English name
already carried on every match and in `/api/tractates` — but only for
Hebrew/English. There's no separate set of French tractate names to source,
so the French UI falls back to the English name (`localizedName()` in
`static/app.js`) rather than leave just that one label in Hebrew. The tractate filter's `<option>` *value* is always the Hebrew name
regardless of locale, since that's what the API filters on — only the
displayed label changes.

Switching language re-renders the current results from the last response
already in hand, with no new request to the server — the same as פסוק לשם.
A group's own "show more" progress resets to its first page on a language
switch, the same simplification פסוק לשם makes for its own "show more".

The chosen language persists in `localStorage` and defaults to Hebrew.
- Search state lives in the URL hash (`#q=אביי`), so a result is shareable and
  back/forward works.

## Tests

```bash
pip install -r requirements-dev.txt
pytest
```

72 tests, run against the real committed corpus rather than a fixture — the
point of most of them is that the actual Talmud gives the expected answer:
`אביי` and `רבא` each turn up thousands of times, `אמר רבא` matches hundreds
of consecutive occurrences, and Berakhot really does end at the traditional
64a. Includes explicit regression tests for the two bugs that only showed up
against real data: niqqud fragmenting a vocalized word into several tokens,
and a mark range wide enough to accidentally swallow maqaf. The AI
connections feature (`tests/test_ai.py`) is tested against ModelDispatcher's
own keyless `MockProvider`, so the suite never makes a real network call or
needs an API key.

## Deploying

`static/*.js`, `*.css` and `/` are served with `Cache-Control: no-cache`
(`app/main.py`), so every deploy takes effect immediately — a browser always
revalidates before using a cached copy, rather than a stale `app.js` outliving
a deploy because its URL never changes.

**Render** — `render.yaml` is a blueprint; point Render at the repo and it
builds and starts with a `/api/health` health check. On the free plan the
service sleeps when idle, so the first request after a while pays a cold
start (up to ~a minute); the UI accounts for this itself with the "waking the
server" notice described above.

**Docker** — the corpus is baked into the image, so the container needs no
network access to run the core search (only the optional AI connections
feature above ever calls out, and only once a provider key is set):

```bash
docker build -t shas-radar .
docker run -p 8000:8000 shas-radar
```

**Anywhere else** — it's one ASGI app with two dependencies:
`uvicorn app.main:app --host 0.0.0.0 --port $PORT`. Fly.io, Railway and Deta
all take it as-is. Vercel is a poor fit: its Python runtime is serverless, so
the corpus load would run on every cold start.

## Layout

```
app/hebrew.py           normalization, tokenization, Hebrew numerals  (no deps)
app/corpus.py           gzip load + per-tractate token stream and word index
app/search.py           exact/prefix/phrase/proximity matching, KWIC context
app/ai.py                optional "find connections" feature via ModelDispatcher
app/main.py             FastAPI routes; mounts static/ at "/"
scripts/build_dataset.py   Sefaria export -> data/shas.json.gz (build-time)
static/                 the UI: one page, one stylesheet, one script, one translation table
tests/                  pytest, against the real corpus
```

## Notes

- Text is public domain. The code is available under the MIT license.
- The Sefaria deep-link format (`sefaria.org/<Title>.<daf><amud>`) matches
  their documented convention but couldn't be verified live from this build
  environment (network-restricted) — worth a spot-check once deployed.
