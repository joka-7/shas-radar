"""Test configuration: every book and commentary is enabled, so the API tests can reach them."""

import os

# Set before app.main is imported (it builds its BookLibrary from this at import).
os.environ["ENABLED_BOOKS"] = "bavli,yerushalmi,mishnah,tosefta,rashi"
os.environ["ENABLED_COMMENTARIES"] = "steinsaltz"
