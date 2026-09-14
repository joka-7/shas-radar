#!/usr/bin/env python3
"""Build the local Talmud Bavli dataset used by the app.

Downloads the Hebrew/Aramaic text of all 37 tractates of the Babylonian Talmud
(Vilna edition, niqqud-vocalized -- confirmed against the fetched data, not
assumed) from Sefaria's public export bucket, cleans the editorial HTML
markup out of it, and writes a single gzipped JSON file at
``data/shas.json.gz``.

This script is a *build-time* tool. Run it once (or whenever you want to
refresh the corpus); the resulting file is committed to the repository, and
the running application never touches the network.

    python scripts/build_dataset.py

Source : https://github.com/Sefaria/Sefaria-Export  (text originally the
         Vilna edition, digitized and hosted by Sefaria)
License: Public Domain
"""

from __future__ import annotations

import concurrent.futures
import gzip
import json
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

BUCKET = "https://storage.googleapis.com/sefaria-export/json/Talmud/Bavli"
VERSION_FILE = "merged.json"

DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "shas.json.gz"

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

    pages: list[dict] = []
    for index, segments in enumerate(raw["text"]):
        if not segments:
            continue
        daf = index // 2 + 1
        amud = "a" if index % 2 == 0 else "b"
        cleaned = [clean_segment(seg) for seg in segments if seg]
        cleaned = [seg for seg in cleaned if seg]
        if cleaned:
            pages.append({"daf": daf, "amud": amud, "segments": cleaned})

    word_count = sum(len(seg.split()) for page in pages for seg in page["segments"])
    print(f"  {name:<16} {len(pages):>4} pages  {word_count:>7,} words", file=sys.stderr)

    return {
        "order": order,
        "he": raw["heTitle"],
        "en": raw["title"],
        "seder": seder,
        "sederHe": SEDER_HE[seder],
        "pages": pages,
    }


def main() -> int:
    print(f"Fetching {len(TRACTATES)} tractates from Sefaria's export bucket…", file=sys.stderr)

    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
        tractates = list(pool.map(fetch_tractate, enumerate(TRACTATES)))

    # Threads finish out of order; restore canonical (Vilna Shas) order.
    tractates.sort(key=lambda t: t["order"])
    for tractate in tractates:
        del tractate["order"]

    word_count = sum(
        len(seg.split()) for t in tractates for p in t["pages"] for seg in p["segments"]
    )
    dataset = {
        "source": "https://github.com/Sefaria/Sefaria-Export",
        "textSource": "Vilna edition, via Sefaria",
        "license": "Public Domain",
        "tractateCount": len(tractates),
        "wordCount": word_count,
        "tractates": tractates,
    }

    DATA_PATH.parent.mkdir(parents=True, exist_ok=True)
    payload = json.dumps(dataset, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    with gzip.open(DATA_PATH, "wb", compresslevel=9) as handle:
        handle.write(payload)

    size_mb = DATA_PATH.stat().st_size / 1024 / 1024
    print(
        f"\nWrote {DATA_PATH.relative_to(Path.cwd())}: "
        f"{len(tractates)} tractates, {word_count:,} words, {size_mb:.2f} MB gzipped",
        file=sys.stderr,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
