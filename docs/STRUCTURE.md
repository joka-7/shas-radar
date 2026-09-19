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
│   ├── ai.py      # AI-assisted analysis: find connections across a set of search-result groups.
│   ├── corpus.py  # Loading and indexing the Talmud corpus.
│   ├── hebrew.py  # Hebrew/Aramaic text normalization primitives.
│   ├── main.py    # FastAPI application.
│   └── search.py  # Talmud search: exact word, attached-prefix, exact phrase, and KWIC context.
├── data/
│   └── shas.json.gz
├── docs/
│   ├── HLD.md
│   ├── LLD.md
│   └── STRUCTURE.md
├── scripts/
│   ├── build_dataset.py  # Build the local Talmud Bavli dataset used by the app.
│   └── gen_tree.py       # Generate or check the annotated repository tree used in the docs.
├── static/
│   ├── icons/
│   │   ├── app-icon.png
│   │   ├── apple-touch-icon.png
│   │   ├── icon-192.png
│   │   └── icon-512.png
│   ├── app.js
│   ├── config.js
│   ├── i18n.js
│   ├── index.html
│   ├── manifest.json
│   ├── styles.css
│   └── sw.js
├── tests/
│   ├── test_ai.py      # Tests for app/ai.py -- the optional "find connections" AI feature.
│   ├── test_hebrew.py  # Tests for the Hebrew/Aramaic normalization primitives.
│   └── test_search.py  # Tests for the corpus, matching logic, and API -- against the real committed corpus rather than a fixture, the same way פסוק לשם's tests do.
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
