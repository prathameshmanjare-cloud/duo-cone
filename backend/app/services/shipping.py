"""Destination-based shipping + VAT calculation.

Three zones:

* ``DE``     — flat €12 shipping, 19% German VAT.
* ``EUROPE`` — rest of Europe (EU + EEA + CH + GB), flat €25 shipping.
* ``ROW``    — rest of world: no direct purchase, the customer sends an
  enquiry (RFQ) and sales quotes freight individually.
"""

from __future__ import annotations

# European countries that can buy directly (excl. Germany, which is its own zone)
_EUROPE = {
    # EU
    "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "GR", "HU",
    "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE",
    # EEA / EFTA + UK
    "IS", "LI", "NO", "CH", "GB",
}

# EU member states (incl. DE) — intra-Community VAT rules apply
EU_COUNTRIES = frozenset({
    "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU",
    "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE",
})

_DE_SHIPPING_CENTS = 1200
_EUROPE_SHIPPING_CENTS = 2500

DE_VAT_RATE = 0.19

ENQUIRY_ONLY_DETAIL = (
    "We don't ship direct orders outside Europe. "
    "Please send an enquiry and our team will quote shipping for you."
)


class EnquiryOnlyDestination(ValueError):
    """Destination outside Europe — direct purchase is not offered."""


def zone(country_code: str) -> str:
    cc = country_code.upper()
    if cc == "DE":
        return "DE"
    if cc in _EUROPE:
        return "EUROPE"
    return "ROW"


def is_direct_purchase_allowed(country_code: str) -> bool:
    return zone(country_code) != "ROW"


def calc_shipping_cents(country_code: str) -> int:
    z = zone(country_code)
    if z == "DE":
        return _DE_SHIPPING_CENTS
    if z == "EUROPE":
        return _EUROPE_SHIPPING_CENTS
    raise EnquiryOnlyDestination(country_code)


def calc_vat_cents(country_code: str, taxable_cents: int) -> int:
    """19% VAT on DE orders. Other countries handled via invoice/reverse-charge."""
    if zone(country_code) == "DE":
        return round(taxable_cents * DE_VAT_RATE)
    return 0
