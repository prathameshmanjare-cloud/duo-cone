"""Product URL slugs and part-number matching."""

from __future__ import annotations

import re
import unicodedata

MAX_SLUG = 200  # WordPress caps post_name at 200 characters


def product_slug(title: str) -> str:
    """URL slug for a product, built like WordPress ``sanitize_title`` did on
    the old WooCommerce shop: "SKF Mechanical Face Seal Type DF 108710" ->
    "skf-mechanical-face-seal-type-df-108710". Keeping the old rule keeps the
    old, already-ranked product URLs valid."""
    s = re.sub(r"<[^>]*>", "", title or "")
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    s = s.lower()
    s = re.sub(r"&.+?;", "", s)  # HTML entities
    s = s.replace(".", "-").replace("/", "-").replace("×", "x")
    s = re.sub(r"[^a-z0-9 _-]", "", s)
    s = re.sub(r"\s+", "-", s)
    s = re.sub(r"-+", "-", s)
    return s.strip("-")[:MAX_SLUG].rstrip("-") or "product"


def part_key(sku: str | None) -> str:
    """Part number reduced to letters and digits, so "140.30.00141",
    "140-30-00141" and "140 30 00141" are the same part."""
    return re.sub(r"[^a-z0-9]", "", (sku or "").lower())


# SQL twin of part_key, for the unique index and lookups in the database
PART_KEY_SQL = "lower(regexp_replace(sku, '[^A-Za-z0-9]', '', 'g'))"
