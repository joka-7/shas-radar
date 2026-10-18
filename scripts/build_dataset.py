#!/usr/bin/env python3
"""Build the local datasets used by the app.

Downloads the Hebrew/Aramaic text of a book from Sefaria's public export
bucket, cleans the editorial HTML markup out of it, and writes one gzipped
JSON file under ``data/``. The default is the Babylonian Talmud: all 37
tractates (William Davidson Edition, niqqud-vocalized -- confirmed against the
fetched data, not assumed) into ``data/shas.json.gz``.

This script is a *build-time* tool. Run it once (or whenever you want to
refresh a corpus); the resulting file is committed to the repository, and
the running application never touches the network.

    python scripts/build_dataset.py                  # the Bavli
    python scripts/build_dataset.py --book mishnah   # or tosefta, yerushalmi

The other books are chaptered texts. For each tractate the script fetches one
specific Sefaria version and checks that version's license against the list
the book allows, because Sefaria's "merged" text can blend in a second version
with a different (or unknown) license. It stops, naming the tractate, if a
license is not allowed or the text is not nested as the book's citation
scheme expects.

Source : https://github.com/Sefaria/Sefaria-Export  (William Davidson Edition,
         hosted by Sefaria; page numbering follows the Vilna Shas)
License: CC-BY-NC, per Sefaria's version record -- credit required, no
         commercial use. Menachot and Chullin are recorded as "unknown" there.
"""

from __future__ import annotations

import argparse
import concurrent.futures
import gzip
import html
import json
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from collections.abc import Iterator, Sequence
from dataclasses import dataclass
from pathlib import Path
from typing import Any

EXPORT = "https://storage.googleapis.com/sefaria-export"
BUCKET = f"{EXPORT}/json/Talmud/Bavli"
VERSION_FILE = "merged.json"

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DATA_PATH = DATA_DIR / "shas.json.gz"
SOURCE = "https://github.com/Sefaria/Sefaria-Export"

# The 37 tractates of the Bavli that have Gemara, in the traditional order of
# the Vilna Shas, grouped by seder. Order matters only for the UI's tractate
# picker; each tractate's own token stream is independent of the others.
TRACTATES: list[tuple[str, str]] = [
    ("Seder Zeraim", "Berakhot"),
    ("Seder Moed", "Shabbat"),
    ("Seder Moed", "Eruvin"),
    ("Seder Moed", "Pesachim"),
    ("Seder Moed", "Rosh Hashanah"),
    ("Seder Moed", "Yoma"),
    ("Seder Moed", "Sukkah"),
    ("Seder Moed", "Beitzah"),
    ("Seder Moed", "Taanit"),
    ("Seder Moed", "Megillah"),
    ("Seder Moed", "Moed Katan"),
    ("Seder Moed", "Chagigah"),
    ("Seder Nashim", "Yevamot"),
    ("Seder Nashim", "Ketubot"),
    ("Seder Nashim", "Nedarim"),
    ("Seder Nashim", "Nazir"),
    ("Seder Nashim", "Sotah"),
    ("Seder Nashim", "Gittin"),
    ("Seder Nashim", "Kiddushin"),
    ("Seder Nezikin", "Bava Kamma"),
    ("Seder Nezikin", "Bava Metzia"),
    ("Seder Nezikin", "Bava Batra"),
    ("Seder Nezikin", "Sanhedrin"),
    ("Seder Nezikin", "Makkot"),
    ("Seder Nezikin", "Shevuot"),
    ("Seder Nezikin", "Avodah Zarah"),
    ("Seder Nezikin", "Horayot"),
    ("Seder Kodashim", "Zevachim"),
    ("Seder Kodashim", "Menachot"),
    ("Seder Kodashim", "Chullin"),
    ("Seder Kodashim", "Bekhorot"),
    ("Seder Kodashim", "Arakhin"),
    ("Seder Kodashim", "Temurah"),
    ("Seder Kodashim", "Keritot"),
    ("Seder Kodashim", "Meilah"),
    ("Seder Kodashim", "Tamid"),
    ("Seder Tahorot", "Niddah"),
]

# Hebrew names for the six sedarim.
SEDER_HE = {
    "Seder Zeraim": "סדר זרעים",
    "Seder Moed": "סדר מועד",
    "Seder Nashim": "סדר נשים",
    "Seder Nezikin": "סדר נזיקין",
    "Seder Kodashim": "סדר קדשים",
    "Seder Tahorot": "סדר טהרות",
}


# --- Text cleaning -----------------------------------------------------------
#
# Unlike the Tanakh export, this text carries no niqqud or cantillation --
# printed Talmud editions are unpointed. What it does carry is Sefaria's own
# display markup:
#
#   <big><strong>...</strong></big>   wraps the bold opening word(s) of a
#                                      Mishnah or a new topic. Inventoried
#                                      across two sample tractates: only this
#                                      and <br> ever appear.
#   <br>                               a line break inside a segment (verse
#                                      quotations set out on their own line).
#                                      Replaced with a space, not dropped
#                                      outright, so the words on either side
#                                      of it don't get fused together.

HTML_TAG = re.compile(r"<[^>]+>")
BR_TAG = re.compile(r"<br\s*/?>", re.IGNORECASE)
WHITESPACE = re.compile(r"\s+")


def clean_segment(text: str) -> str:
    """Strip Sefaria's display markup from one segment of text."""
    text = BR_TAG.sub(" ", text)
    text = HTML_TAG.sub("", text)
    # After the tags: an escaped "&lt;" must not be mistaken for the start of one.
    text = html.unescape(text)
    return WHITESPACE.sub(" ", text).strip()


def tractate_url(seder: str, name: str) -> str:
    """Build the export URL for one tractate, quoting spaces."""
    path = f"{seder}/{name}/Hebrew/{VERSION_FILE}"
    return f"{BUCKET}/{urllib.parse.quote(path)}"


def fetch_tractate(entry: tuple[int, tuple[str, str]]) -> dict:
    """Download and shape one tractate. Returns a dict ready for the dataset.

    Sefaria's ``text`` array is indexed by daf/amud directly: index 0 is 1a,
    index 1 is 1b, index 2 is 2a, and so on (1a/1b are always empty padding,
    since the Gemara traditionally begins at 2a). So ``daf = index // 2 + 1``
    and ``amud = 'a' if index is even else 'b'`` -- verified against Berakhot
    (ends at 64a, the traditional length of the tractate) and Sanhedrin.
    """
    order, (seder, name) = entry
    url = tractate_url(seder, name)
    try:
        with urllib.request.urlopen(url, timeout=180) as response:
            raw = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:  # pragma: no cover - network path
        raise SystemExit(f"failed to fetch {name}: HTTP {exc.code} for {url}") from exc

    sections: list[dict] = []
    for index, segments in enumerate(raw["text"]):
        if not segments:
            continue
        daf = index // 2 + 1
        amud_code = index % 2  # 0 = "a", 1 = "b"
        cleaned = [clean_segment(seg) for seg in segments if seg]
        cleaned = [seg for seg in cleaned if seg]
        if cleaned:
            sections.append({"ref": [daf, amud_code], "segments": cleaned})

    word_count = sum(len(seg.split()) for section in sections for seg in section["segments"])
    print(f"  {name:<16} {len(sections):>4} pages  {word_count:>7,} words", file=sys.stderr)

    return {
        "order": order,
        "he": raw["heTitle"],
        "en": raw["title"],
        "sefariaTitle": raw["title"],
        "seder": seder,
        "sederHe": SEDER_HE[seder],
        "sections": sections,
    }


def write_dataset(path: Path, dataset: dict[str, Any]) -> None:
    """Write ``dataset`` gzipped.

    The header fields must stay ahead of ``tractates``: ``app.books.read_header``
    reads them without parsing the whole file.
    """
    path.parent.mkdir(parents=True, exist_ok=True)
    payload = json.dumps(dataset, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    with gzip.open(path, "wb", compresslevel=9) as handle:
        handle.write(payload)
    size_mb = path.stat().st_size / 1024 / 1024
    print(
        f"\nWrote {path.relative_to(Path.cwd())}: {dataset['tractateCount']} tractates, "
        f"{dataset['wordCount']:,} words, {size_mb:.2f} MB gzipped",
        file=sys.stderr,
    )


def count_words(tractates: Sequence[dict[str, Any]]) -> int:
    return sum(
        len(seg.split()) for t in tractates for sec in t["sections"] for seg in sec["segments"]
    )


def build_bavli() -> dict[str, Any]:
    print(f"Fetching {len(TRACTATES)} tractates from Sefaria's export bucket…", file=sys.stderr)

    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
        tractates = list(pool.map(fetch_tractate, enumerate(TRACTATES)))

    # Threads finish out of order; restore canonical (Vilna Shas) order.
    tractates.sort(key=lambda t: t["order"])
    for tractate in tractates:
        del tractate["order"]

    return {
        "book": "bavli",
        "citationScheme": "daf",
        "source": SOURCE,
        "textSource": "William Davidson Edition",
        "license": "CC-BY-NC",
        "tractateCount": len(tractates),
        "wordCount": count_words(tractates),
        "tractates": tractates,
    }


# --- Chaptered books (Mishnah, Tosefta, Yerushalmi) --------------------------


@dataclass(frozen=True)
class BookSpec:
    """Where a chaptered book lives in the export, and what is allowed into it."""

    id: str
    output: str  # file name under data/
    scheme: str  # the dataset's citationScheme
    arity: int  # nesting depth of the text: chapter, section[, segment]
    toc_path: tuple[str, ...]
    skip_categories: tuple[str, ...]
    version: str | None  # exact Sefaria version title; None = the tractate's only version
    allowed_licenses: frozenset[str]
    text_source: str
    license: str


SPECS: dict[str, BookSpec] = {
    spec.id: spec
    for spec in (
        BookSpec(
            id="mishnah",
            output="mishnah.json.gz",
            scheme="chapter",
            arity=2,
            toc_path=("Mishnah",),
            skip_categories=(
                "Rishonim on Mishnah",
                "Acharonim on Mishnah",
                "Modern Commentary on Mishnah",
            ),
            version="Torat Emet 357",
            allowed_licenses=frozenset({"Public Domain"}),
            text_source="Torat Emet",
            license="Public Domain",
        ),
        BookSpec(
            id="tosefta",
            output="tosefta.json.gz",
            scheme="chapter",
            arity=2,
            toc_path=("Tosefta", "Vilna Edition"),
            skip_categories=("Commentary",),
            version=None,
            allowed_licenses=frozenset({"Public Domain"}),
            text_source="Mechon Mamre (Vilna edition)",
            license="Public Domain",
        ),
        BookSpec(
            id="yerushalmi",
            output="yerushalmi.json.gz",
            scheme="chapter-segment",
            arity=3,
            toc_path=("Talmud", "Yerushalmi"),
            skip_categories=("Commentary", "Modern Commentary on Talmud"),
            version=(
                "The Jerusalem Talmud, edition by Heinrich W. Guggenheimer. "
                "Berlin, De Gruyter, 1999-2015"
            ),
            allowed_licenses=frozenset({"CC-BY"}),
            text_source="Guggenheimer edition (De Gruyter, 1999-2015)",
            license="CC-BY",
        ),
    )
}


def toc_leaves(
    contents: Sequence[dict[str, Any]], path: Sequence[str], skip: Sequence[str]
) -> list[dict[str, Any]]:
    """The texts under a category path in Sefaria's table of contents, in order.

    Args:
        contents: The table of contents (or a category's ``contents``).
        path: Category names to descend through.
        skip: Category names to leave out wherever they appear below ``path``.

    Raises:
        KeyError: If ``path`` is not in the table of contents.
    """
    for name in path:
        match = next((c for c in contents if c.get("category") == name), None)
        if match is None:
            raise KeyError(f"category {name!r} is not in the table of contents")
        contents = match["contents"]

    def collect(nodes: Sequence[dict[str, Any]]) -> list[dict[str, Any]]:
        found: list[dict[str, Any]] = []
        for node in nodes:
            if "category" not in node:
                found.append(node)
            elif node["category"] not in skip:
                found.extend(collect(node["contents"]))
        return found

    return collect(contents)


def walk_sections(text: object, arity: int) -> Iterator[tuple[tuple[int, ...], str]]:
    """Yield ``(ref, segment)`` for every non-empty leaf of nested text.

    Refs are 1-based indices, as Sefaria numbers chapters and sections.

    Raises:
        ValueError: If a leaf is not exactly ``arity`` levels deep.
    """

    def descend(node: object, ref: tuple[int, ...]) -> Iterator[tuple[tuple[int, ...], str]]:
        if isinstance(node, str):
            if len(ref) != arity:
                raise ValueError(f"text is {len(ref)} levels deep at {ref}, expected {arity}")
            if node.strip():
                yield ref, node
        elif isinstance(node, list):
            for index, child in enumerate(node, start=1):
                yield from descend(child, (*ref, index))
        else:
            raise ValueError(f"unexpected {type(node).__name__} in nested text at {ref}")

    yield from descend(text, ())


def fetch_json(url: str) -> Any:
    try:
        with urllib.request.urlopen(url, timeout=180) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:  # pragma: no cover - network path
        raise SystemExit(f"HTTP {exc.code} for {url}") from exc


def fetch_chaptered_tractate(spec: BookSpec, leaf: dict[str, Any]) -> dict[str, Any]:
    """Download one tractate's chosen version, check its license, and shape it."""
    title = leaf["title"]
    base = (
        f"{EXPORT}/json/" + urllib.parse.quote("/".join([*leaf["categories"], title])) + "/Hebrew/"
    )
    merged = fetch_json(base + VERSION_FILE)
    versions = [version[0] for version in merged["versions"]]
    version = spec.version or (versions[0] if len(versions) == 1 else None)
    if version is None or version not in versions:
        raise SystemExit(f"{title}: version {spec.version!r} not among {versions}")

    data = fetch_json(base + urllib.parse.quote(version + ".json"))
    if data.get("license") not in spec.allowed_licenses:
        raise SystemExit(
            f"{title}: version {version!r} is licensed {data.get('license')!r}, "
            f"not one of {sorted(spec.allowed_licenses)}"
        )

    try:
        sections = [
            {"ref": list(ref), "segments": [segment]}
            for ref, raw in walk_sections(data["text"], spec.arity)
            if (segment := clean_segment(raw))
        ]
    except ValueError as exc:
        raise SystemExit(f"{title}: {exc}") from exc

    seder = leaf["categories"][-1]
    if seder not in SEDER_HE:
        raise SystemExit(f"{title}: unexpected seder {seder!r}")
    print(f"  {title:<34} {len(sections):>5} sections", file=sys.stderr)
    return {
        "he": merged["heTitle"],
        "en": merged["title"],
        "sefariaTitle": merged["title"],
        "seder": seder,
        "sederHe": SEDER_HE[seder],
        "sections": sections,
    }


def build_chaptered_book(spec: BookSpec) -> dict[str, Any]:
    print(f"Fetching the table of contents for {spec.id}…", file=sys.stderr)
    toc = fetch_json(f"{EXPORT}/table_of_contents.json")
    leaves = toc_leaves(toc, spec.toc_path, spec.skip_categories)
    print(f"Fetching {len(leaves)} tractates…", file=sys.stderr)

    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
        tractates = list(pool.map(lambda leaf: fetch_chaptered_tractate(spec, leaf), leaves))

    names = [t["he"] for t in tractates]
    if len(set(names)) != len(names):
        raise SystemExit(f"{spec.id}: tractate names are not unique")

    return {
        "book": spec.id,
        "citationScheme": spec.scheme,
        "source": SOURCE,
        "textSource": spec.text_source,
        "license": spec.license,
        "tractateCount": len(tractates),
        "wordCount": count_words(tractates),
        "tractates": tractates,
    }


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Build a book's dataset under data/.")
    parser.add_argument("--book", choices=["bavli", *SPECS], default="bavli")
    args = parser.parse_args(argv)

    if args.book == "bavli":
        write_dataset(DATA_PATH, build_bavli())
    else:
        spec = SPECS[args.book]
        write_dataset(DATA_DIR / spec.output, build_chaptered_book(spec))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
