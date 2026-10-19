# Repository structure

Every file in this repo and what is inside it. The tree below is **generated** —
run `python scripts/gen_tree.py --project . --output docs/STRUCTURE.md` to
refresh it, and never edit between the markers by hand.

<!-- BEGIN GENERATED TREE (depth=all entries=all) -->
```text
shas-radar/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml
│   │   └── security.yml
│   ├── copilot-instructions.md
│   └── dependabot.yml
├── app/
│   ├── ai.py          # AI-assisted analysis: find connections across a set of search-result groups.
│   ├── books.py       # The books the app can search, which are enabled, and which are loaded.
│   ├── citation.py    # Where a passage sits in its book, and how that location is cited.
│   ├── commentary.py  # A commentary's comments on one page of the book it is keyed to.
│   ├── corpus.py      # Loading and indexing the Talmud corpus.
│   ├── hebrew.py      # Hebrew/Aramaic text normalization primitives.
│   ├── main.py        # FastAPI application.
│   └── search.py      # Talmud search: exact word, attached-prefix, exact phrase, and KWIC context.
├── data/
│   ├── mishnah.json.gz
│   ├── rashi.json.gz
│   ├── shas.json.gz
│   ├── tosefta.json.gz
│   └── yerushalmi.json.gz
├── docs/
│   ├── HLD.md
│   ├── LLD.md
│   └── STRUCTURE.md
├── frontend/
│   ├── src/
│   │   └── main.tsx
│   ├── .gitignore
│   ├── .prettierrc
│   ├── README.md          # frontend/
│   ├── eslint.config.js
│   ├── package-lock.json
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── scripts/
│   ├── build_dataset.py  # Build the local datasets used by the app.
│   └── gen_tree.py       # Generate or check the annotated repository tree used in the docs.
├── static/
│   ├── icons/
│   │   ├── app-icon.png
│   │   ├── app-icon.svg
│   │   ├── apple-touch-icon.png
│   │   ├── icon-192.png
│   │   └── icon-512.png
│   ├── vendor/
│   │   └── model-picker/
│   │       ├── main.css
│   │       └── main.js
│   ├── app.js
│   ├── config.js
│   ├── i18n.js
│   ├── index.html
│   ├── manifest.json
│   ├── styles.css
│   └── sw.js
├── tests/
│   ├── conftest.py            # Test configuration: every book is enabled, so the API tests can reach all of them.
│   ├── test_ai.py             # Tests for app/ai.py -- the optional "find connections" AI feature.
│   ├── test_books.py          # Tests for app/books.py: the book registry, configuration, and lazy loading.
│   ├── test_build_dataset.py  # Tests for scripts/build_dataset.py: the pure helpers, not the network fetches.
│   ├── test_citation.py       # Tests for app/citation.py: ref packing and the folio citation scheme.
│   ├── test_commentary.py     # Tests for app/commentary.py: a commentary's comments on one page, on the real data.
│   ├── test_corpus.py         # Tests for app/corpus.py: the compact word index.
│   ├── test_hebrew.py         # Tests for the Hebrew/Aramaic normalization primitives.
│   └── test_search.py         # Tests for the corpus, matching logic, and API -- against the real committed corpus rather than a fixture, the same way פסוק לשם's tests do.
├── .ai
├── .gitignore
├── .gitmodules
├── AGENTS.md
├── CLAUDE.md
├── Dockerfile
├── GEMINI.md
├── LICENSE
├── README.md             # Shas Radar — search the Talmud for words, names, and phrases
├── SECURITY.md
├── ai-config.toml
├── pyproject.toml
├── pytest.ini
├── render.yaml
├── requirements-dev.txt
├── requirements.txt
└── vercel.json
```
<!-- END GENERATED TREE -->
