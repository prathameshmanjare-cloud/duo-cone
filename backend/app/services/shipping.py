"""Destination + weight based shipping calculation.

Flat-rate-by-zone model: a base rate covers the first kg, then a per-kg
rate for the rest. Ships from Engelskirchen, Germany. Rates are a
starting point — tune ``_ZONES`` to match real courier contracts.
"""

from __future__ import annotations

import math

# EU member states (excl. Germany, which is its own zone)
_EU = {
    "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "GR", "HU",
    "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE",
}

_DEFAULT_ITEM_WEIGHT_G = 400  # used when a line item has no known product weight

# zone -> (base_cents for first kg, per_extra_kg_cents)
_ZONES: dict[str, tuple[int, int]] = {
    "DE": (490, 150),
    "EU": (990, 250),
    "ROW": (2490, 500),
}


def _zone(country_code: str) -> str:
    cc = country_code.upper()
    if cc == "DE":
        return "DE"
    if cc in _EU:
        return "EU"
    return "ROW"


def calc_shipping_cents(country_code: str, weight_kg: float) -> int:
    base, per_extra_kg = _ZONES[_zone(country_code)]
    extra_kg = max(0.0, weight_kg - 1.0)
    return base + math.ceil(extra_kg) * per_extra_kg


def line_weight_grams(product_weight_g: int | None, qty: int) -> int:
    return (product_weight_g or _DEFAULT_ITEM_WEIGHT_G) * qty
