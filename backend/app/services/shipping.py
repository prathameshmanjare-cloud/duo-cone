"""Destination-based shipping + VAT calculation.

Germany and rest-of-EU ship at flat rates. Rest-of-world falls back to a
weight-based estimate standing in for JUMiNGO's carrier quote — tune
``_ROW_BASE_CENTS`` / ``_ROW_PER_EXTRA_KG_CENTS`` against real JUMiNGO
rates (see https://www.jumingo.com/) as they're confirmed.
"""

from __future__ import annotations

import math

# EU member states (excl. Germany, which is its own zone)
_EU = {
    "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "GR", "HU",
    "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE",
}

_DEFAULT_ITEM_WEIGHT_G = 400  # used when a line item has no known product weight

_DE_SHIPPING_CENTS = 1200
_EU_SHIPPING_CENTS = 2500

# rest-of-world: weight-based estimate (JUMiNGO placeholder rates)
_ROW_BASE_CENTS = 2490
_ROW_PER_EXTRA_KG_CENTS = 500

DE_VAT_RATE = 0.19


def _zone(country_code: str) -> str:
    cc = country_code.upper()
    if cc == "DE":
        return "DE"
    if cc in _EU:
        return "EU"
    return "ROW"


def calc_shipping_cents(country_code: str, weight_kg: float) -> int:
    zone = _zone(country_code)
    if zone == "DE":
        return _DE_SHIPPING_CENTS
    if zone == "EU":
        return _EU_SHIPPING_CENTS
    extra_kg = max(0.0, weight_kg - 1.0)
    return _ROW_BASE_CENTS + math.ceil(extra_kg) * _ROW_PER_EXTRA_KG_CENTS


def calc_vat_cents(country_code: str, taxable_cents: int) -> int:
    """19% VAT on DE orders. Other countries handled via invoice/reverse-charge."""
    if _zone(country_code) == "DE":
        return round(taxable_cents * DE_VAT_RATE)
    return 0


def line_weight_grams(product_weight_g: int | None, qty: int) -> int:
    return (product_weight_g or _DEFAULT_ITEM_WEIGHT_G) * qty
