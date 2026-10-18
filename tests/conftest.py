"""Test configuration: every book is enabled, so the API tests can reach all of them."""

import os

# Set before app.main is imported (it builds its BookLibrary from this at import).
os.environ["ENABLED_BOOKS"] = "bavli,yerushalmi,mishnah,tosefta"
