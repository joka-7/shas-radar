"""Tests for static/manifest.json: what the installed app is allowed to do."""

import json
from pathlib import Path

MANIFEST = Path(__file__).resolve().parent.parent / "static" / "manifest.json"


class TestOrientation:
    def test_lets_the_phone_rotate_because_the_reader_asks_people_to_turn_it(self):
        manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
        # "any" is also the default when the key is absent.
        assert manifest.get("orientation", "any") in {"any", "natural"}
