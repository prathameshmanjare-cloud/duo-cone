"""Rule-based support bot: keyword-matched FAQ answers + catalog lookup +
handoff to sales. No LLM, no per-message cost.

The router turns ``answer()`` into JSON; the same function backs any future
channel (WhatsApp, etc.).
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field

from sqlalchemy.ext.asyncio import AsyncSession

from app.config.settings import get_settings
from app.repositories import product_repository as repo

settings = get_settings()

SALES_EMAIL = settings.sales_email


@dataclass
class BotProduct:
    name: str
    slug: str
    sku: str
    price_cents: int
    currency: str
    is_rfq_only: bool


@dataclass
class ChatReply:
    reply: str
    quick_replies: list[str] = field(default_factory=list)
    products: list[BotProduct] = field(default_factory=list)
    handoff: bool = False


DEFAULT_QUICK_REPLIES = [
    "Find a seal by part number",
    "Shipping & delivery",
    "Request a quote",
    "Talk to sales",
]

# (any-of keywords, answer, follow-up chips)
_FAQ: list[tuple[tuple[str, ...], str, list[str]]] = [
    (
        ("hello", "hi", "hey", "good morning", "good afternoon"),
        "Hi! I'm the DuoCone assistant. I can help you find a mechanical face "
        "seal, check availability, or put you in touch with our sales team.",
        DEFAULT_QUICK_REPLIES,
    ),
    (
        ("shipping", "delivery", "deliver", "dispatch", "how long", "lead time", "when will"),
        "Stocked items ship from Germany within 1–3 working days. Made-to-order "
        "or out-of-stock items show an estimated lead time on the product page. "
        "EU delivery is typically 2–5 working days after dispatch.",
        ["Track my order", "Talk to sales"],
    ),
    (
        ("return", "refund", "warranty", "guarantee", "defective", "faulty"),
        "Unused parts can be returned within 30 days. Manufacturing defects are "
        "covered by warranty (24 months on most seals). Start a return or claim "
        "by contacting sales with your order number.",
        ["Talk to sales"],
    ),
    (
        ("payment", "pay", "invoice", "credit", "purchase order", "vat", "tax"),
        "We accept bank transfer and card. VAT-registered EU businesses can buy "
        "under reverse-charge by entering a valid VAT ID at checkout. Net terms "
        "are available for approved accounts — ask sales.",
        ["Talk to sales"],
    ),
    (
        ("cross reference", "cross-reference", "equivalent", "replace", "alternative", "oem number", "oem part"),
        "Type the OEM or competitor part number and I'll look for a DuoCone "
        "equivalent. You can also use the Cross-Reference tool in the top menu.",
        [],
    ),
    (
        ("bulk", "wholesale", "distributor", "reseller", "large order", "oem supply", "volume"),
        "For volume, OEM or distributor pricing, send a request for quote with "
        "quantities and part numbers — our team replies within 24 hours.",
        ["Request a quote", "Talk to sales"],
    ),
    (
        ("material", "nbr", "fkm", "viton", "hardness", "duo cone", "duocone", "df type", "do type", "specification", "spec"),
        "DuoCone seals use hardened alloy metal rings (typically 58–62 HRC) with "
        "NBR or FKM elastomer load rings, in DF and DO profiles. Full specs — "
        "diameters, material, lifetime — are on each product page.",
        ["Find a seal by part number"],
    ),
    (
        ("price", "cost", "how much", "quote", "quotation", "rfq"),
        "Listed products show live prices excl. VAT. For quote-only items, bulk "
        "orders or a formal quotation, use Request a Quote and we'll come back "
        "within 24 hours.",
        ["Request a quote", "Find a seal by part number"],
    ),
    (
        ("contact", "phone", "call", "email", "address", "reach you", "office"),
        f"You can reach our sales team at {SALES_EMAIL}, or leave your email here "
        "and we'll get back to you.",
        ["Talk to sales"],
    ),
    (
        ("hours", "open", "working hours", "timezone"),
        "Our team is online Monday–Friday, 08:00–17:00 CET. Messages left outside "
        "those hours are answered the next working day.",
        [],
    ),
]

_HANDOFF_TRIGGERS = (
    "talk to sales",
    "talk to a human",
    "speak to someone",
    "real person",
    "agent",
    "representative",
    "call me",
    "contact me",
    "sales team",
)

_LOOKUP_TRIGGERS = (
    "do you have",
    "looking for",
    "need a",
    "find",
    "search",
    "stock of",
    "part number",
    "part no",
    "part #",
    "seal for",
)

# a plausible part/OEM number: 4+ chars, contains a digit, mostly alphanumeric
_PARTNO_RE = re.compile(r"\b(?=[A-Za-z0-9\-./]{4,20}\b)(?=[^\s]*\d)[A-Za-z0-9\-./]+\b")

_STOPWORDS = {"2024", "2025", "2026", "24/7", "0800"}


def _has(low: str, keywords: tuple[str, ...] | list[str]) -> bool:
    """Whole-word / whole-phrase match so 'shipping' doesn't match 'hi'."""
    for k in keywords:
        # allow a trailing plural 's' (material -> materials, return -> returns)
        if re.search(r"(?<!\w)" + re.escape(k) + r"s?(?!\w)", low):
            return True
    return False


def _extract_part_numbers(text: str) -> list[str]:
    found = []
    for m in _PARTNO_RE.finditer(text):
        token = m.group(0).strip("-./")
        if len(token) >= 4 and token.lower() not in _STOPWORDS and token not in found:
            found.append(token)
    return found[:3]


async def _lookup(db: AsyncSession, query: str) -> list[BotProduct]:
    seen: dict[str, BotProduct] = {}
    # 1) cross-reference / SKU match
    for p in await repo.search_cross_reference(db, query):
        seen[p.slug] = _to_bot_product(p)
    # 2) name/SKU search
    if len(seen) < 3:
        filters = repo.ProductFilters(q=query, page=1, page_size=5)
        items, _ = await repo.list_products(db, filters)
        for p in items:
            seen.setdefault(p.slug, _to_bot_product(p))
    return list(seen.values())[:3]


def _to_bot_product(p) -> BotProduct:  # noqa: ANN001
    return BotProduct(
        name=p.name,
        slug=p.slug,
        sku=p.sku,
        price_cents=p.price_cents,
        currency=p.currency,
        is_rfq_only=p.is_rfq_only,
    )


async def answer(db: AsyncSession, message: str, history: list[dict] | None = None) -> ChatReply:
    text = (message or "").strip()
    low = text.lower()

    if not text:
        return ChatReply(
            reply="Ask me anything about DuoCone seals, availability, shipping or pricing.",
            quick_replies=DEFAULT_QUICK_REPLIES,
        )

    # explicit human handoff
    if _has(low, _HANDOFF_TRIGGERS):
        return ChatReply(
            reply="I'll connect you with our sales team. Leave your email and a "
            "short message and they'll reply within one working day.",
            handoff=True,
        )

    # catalog lookup — part numbers or "do you have ..."
    part_numbers = _extract_part_numbers(text)
    wants_lookup = _has(low, _LOOKUP_TRIGGERS) or bool(part_numbers)
    if wants_lookup:
        query = part_numbers[0] if part_numbers else _strip_lookup_phrases(text)
        products = await _lookup(db, query) if query else []
        if products:
            return ChatReply(
                reply=f"Here's what I found for “{query}”:",
                products=products,
                quick_replies=["Request a quote", "Talk to sales"],
            )
        return ChatReply(
            reply=f"I couldn't find a direct match for “{query}”. Our team can "
            "cross-reference it manually — leave your email and the part number.",
            handoff=True,
        )

    # FAQ intents
    for keywords, response, chips in _FAQ:
        if _has(low, keywords):
            return ChatReply(reply=response, quick_replies=chips or DEFAULT_QUICK_REPLIES)

    # fallback
    return ChatReply(
        reply="I'm not sure I got that. I can help with finding a seal by part "
        "number, availability, shipping, or pricing — or connect you with sales.",
        quick_replies=DEFAULT_QUICK_REPLIES,
    )


def _strip_lookup_phrases(text: str) -> str:
    out = text.lower()
    for t in _LOOKUP_TRIGGERS:
        out = out.replace(t, " ")
    out = re.sub(r"\b(seal|seals|a|an|the|for|please|do|you|have|me|need)\b", " ", out)
    return re.sub(r"\s+", " ", out).strip()
