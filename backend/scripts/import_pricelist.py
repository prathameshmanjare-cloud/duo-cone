"""Import the Excel article + price list into the catalog.

Source: scripts/data/pricelist.xlsx  (sheet "Shop Liste")
Columns: Hersteller | Artikelnr | Titel | Beschreibung | VK Shop |
         Reybex Artikel | Verfuegbarkeit | Hilfsspalte Beschreibung 1

Idempotent: upserts Product by slug (brand + article number). Re-runnable.

Usage:
    python -m scripts.import_pricelist
    python -m scripts.import_pricelist --file scripts/data/pricelist.xlsx --limit 50
    python -m scripts.import_pricelist --dry-run
"""

from __future__ import annotations

import argparse
import asyncio
import re
import sys
from pathlib import Path

import openpyxl
from sqlalchemy import select

sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.db.session import Base, SessionLocal, engine  # noqa: E402
from app.models import catalog as _catalog  # noqa: E402,F401  (register tables)
from app.models import commerce as _commerce  # noqa: E402,F401
from app.models.catalog import (  # noqa: E402
    BackorderPolicy,
    Brand,
    Category,
    Inventory,
    Product,
    ProductCategory,
    SealType,
    Segment,
)

DEFAULT_FILE = Path(__file__).parent / "data" / "pricelist.xlsx"
SHEET = "Shop Liste"
HEADER_ROW = 1  # 0-indexed
COMMIT_EVERY = 200

# brands that are seal-brand originals -> replacement, everything else -> aftermarket
REPLACEMENT_BRANDS = {
    "goetze",
    "trelleborg",
    "nuova sjat",
    "gnl",
    "skf",
    "eagle burgmann",
}

SEAL_TYPE_RE = re.compile(r"\b(DF|DO)\b", re.IGNORECASE)


def slugify(value: str) -> str:
    value = re.sub(r"[^a-z0-9]+", "-", (value or "").strip().lower())
    return value.strip("-") or "item"


def parse_seal_type(title: str) -> SealType:
    m = SEAL_TYPE_RE.search(title or "")
    if not m:
        return SealType.other
    return SealType.DF if m.group(1).upper() == "DF" else SealType.DO


def build_description(raw: str | None) -> tuple[str | None, str | None]:
    """Return (short_description, description_html)."""
    if not raw:
        return None, None
    text = raw.replace("\r\n", "\n").strip()
    lines = [ln.strip() for ln in text.split("\n") if ln.strip()]
    if not lines:
        return None, None
    intro_parts: list[str] = []
    li_parts: list[str] = []
    for ln in lines:
        if ln.startswith("<li") or ln.startswith("</ul") or ln.startswith("<ul"):
            if not ln.startswith("<ul") and not ln.startswith("</ul"):
                li_parts.append(ln)
        else:
            intro_parts.append(ln)
    intro = " ".join(intro_parts).strip()
    html_bits: list[str] = []
    if intro:
        html_bits.append(f"<p>{intro}</p>")
    if li_parts:
        html_bits.append("<ul>\n" + "\n".join(li_parts) + "\n</ul>")
    html = "\n".join(html_bits) or None
    short = (intro or re.sub(r"<[^>]+>", "", li_parts[0]) if li_parts else intro)[:500] or None
    return short, html


def price_to_cents(value) -> tuple[int, bool]:
    """Return (cents, is_rfq_only). Non-numeric price -> quote-only."""
    if value in (None, ""):
        return 0, True
    if isinstance(value, str):
        cleaned = value.strip().replace(",", ".")
        try:
            return int(round(float(cleaned) * 100)), False
        except ValueError:
            return 0, True
    try:
        return int(round(float(value) * 100)), False
    except (TypeError, ValueError):
        return 0, True


def in_stock_from(value) -> bool:
    return "stock" in str(value or "").lower()


async def ensure_categories(db) -> dict[str, int]:
    """Returns slug -> category id for replacement / aftermarket / duo-cone."""
    ids: dict[str, int] = {}
    wanted = [
        ("replacement", "Replacement", Segment.replacement),
        ("aftermarket", "Aftermarket", Segment.aftermarket),
        ("duo-cone", "Duo Cone", Segment.oem),
    ]
    for slug, name, seg in wanted:
        cat = (
            await db.execute(select(Category).where(Category.slug == slug))
        ).scalar_one_or_none()
        if not cat:
            cat = Category(slug=slug, name=name, segment=seg)
            db.add(cat)
            await db.flush()
        else:
            cat.segment = seg
        ids[slug] = cat.id
    await db.commit()
    return ids


def read_rows(path: Path, limit: int | None):
    wb = openpyxl.load_workbook(path, data_only=True, read_only=True)
    ws = wb[SHEET]
    rows = list(ws.iter_rows(values_only=True))
    wb.close()
    out = []
    seen: set[tuple[str, str]] = set()
    for r in rows[HEADER_ROW + 1 :]:
        manufacturer = (r[0] or "").strip() if r[0] else ""
        article = str(r[1]).strip() if r[1] not in (None, "") else ""
        if not manufacturer or not article:
            continue
        key = (manufacturer.lower(), article.lower())
        if key in seen:
            continue
        seen.add(key)
        out.append(
            {
                "manufacturer": manufacturer,
                "article": article,
                "title": (r[2] or "").strip() if r[2] else "",
                "description": r[3],
                "price": r[4],
                "internal_code": (str(r[5]).strip() if r[5] not in (None, "") else None),
                "availability": r[6],
            }
        )
        if limit and len(out) >= limit:
            break
    return out


async def run(args: argparse.Namespace) -> None:
    path = Path(args.file)
    if not path.is_absolute():
        path = Path(__file__).resolve().parents[1] / path
    rows = read_rows(path, args.limit)
    print(f"Read {len(rows)} product rows from {path.name}")
    if args.dry_run:
        for row in rows[:10]:
            print(" -", row["manufacturer"], row["article"], "|", row["title"][:60], "| EUR", row["price"])
        return

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Ensured tables exist")

    created = updated = 0
    async with SessionLocal() as db:
        cat_ids = await ensure_categories(db)

        brand_cache: dict[str, Brand] = {}
        slug_seen: set[str] = set()
        pending = 0

        for i, row in enumerate(rows, 1):
            brand_name = row["manufacturer"]
            brand_slug = slugify(brand_name)
            segment = (
                Segment.replacement
                if brand_name.lower() in REPLACEMENT_BRANDS
                else Segment.aftermarket
            )

            brand = brand_cache.get(brand_slug)
            if not brand:
                brand = (
                    await db.execute(select(Brand).where(Brand.slug == brand_slug))
                ).scalar_one_or_none()
                if not brand:
                    brand = Brand(slug=brand_slug, name=brand_name, segment=segment)
                    db.add(brand)
                    await db.flush()
                brand_cache[brand_slug] = brand

            base_slug = slugify(f"{brand_name}-{row['article']}")
            slug = base_slug
            n = 2
            while slug in slug_seen:
                slug = f"{base_slug}-{n}"
                n += 1
            slug_seen.add(slug)

            short_desc, html = build_description(row["description"])
            title = row["title"] or f"{brand_name} Mechanical Face Seal {row['article']}"

            product = (
                await db.execute(select(Product).where(Product.slug == slug))
            ).scalar_one_or_none()
            is_new = product is None
            if is_new:
                product = Product(slug=slug)
                db.add(product)

            product.sku = row["article"]
            product.name = title
            product.seal_type = parse_seal_type(title)
            product.brand_id = brand.id
            product.short_description = short_desc
            product.description_html = html
            product.internal_code = row["internal_code"]
            cents, rfq_only = price_to_cents(row["price"])
            product.price_cents = cents
            product.is_rfq_only = rfq_only
            product.currency = "EUR"
            product.is_active = True
            await db.flush()

            # category links: its segment + the shared duo-cone view
            for cat_id in {cat_ids[segment.value], cat_ids["duo-cone"]}:
                link = (
                    await db.execute(
                        select(ProductCategory).where(
                            ProductCategory.product_id == product.id,
                            ProductCategory.category_id == cat_id,
                        )
                    )
                ).scalar_one_or_none()
                if not link:
                    db.add(ProductCategory(product_id=product.id, category_id=cat_id))

            # inventory
            inv = (
                await db.execute(select(Inventory).where(Inventory.product_id == product.id))
            ).scalar_one_or_none()
            qty = 100 if in_stock_from(row["availability"]) else 0
            if not inv:
                db.add(
                    Inventory(
                        product_id=product.id,
                        stock_qty=qty,
                        backorder=BackorderPolicy.notify,
                        lead_time_days=3,
                        warehouse="DE",
                    )
                )
            else:
                inv.stock_qty = qty

            created += int(is_new)
            updated += int(not is_new)
            pending += 1
            if pending >= COMMIT_EVERY:
                await db.commit()
                pending = 0
                print(f"  ...{i}/{len(rows)}")

        await db.commit()

    print(f"Done. created={created} updated={updated} brands={len(brand_cache)}")


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--file", default=str(DEFAULT_FILE))
    p.add_argument("--limit", type=int)
    p.add_argument("--dry-run", action="store_true")
    asyncio.run(run(p.parse_args()))
