"""One-off WooCommerce -> PostgreSQL migration.

Usage:
    python -m scripts.woo_migrate --dry-run
    python -m scripts.woo_migrate --run-id 2026-09-01 --only products
    python -m scripts.woo_migrate --resume 2026-09-01

Idempotent: upserts by `woo_id`. Writes a JSON report to scripts/reports/<run-id>.json.
Requires WOO_BASE_URL / WOO_CONSUMER_KEY / WOO_CONSUMER_SECRET in env.
"""

import argparse
import asyncio
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

import httpx
from sqlalchemy import select

sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.config.settings import get_settings  # noqa: E402
from app.db.session import SessionLocal  # noqa: E402
from app.models.catalog import Brand, Category, Product, ProductCategory, ProductImage, Segment  # noqa: E402

settings = get_settings()
REPORTS_DIR = Path(__file__).parent / "reports"
PAGE_SIZE = 100

SEAL_TYPE_RE = re.compile(r"\b(DF|DO)\b", re.IGNORECASE)


class WooClient:
    def __init__(self) -> None:
        self.client = httpx.AsyncClient(
            base_url=settings.woo_base_url.rstrip("/") + "/wp-json/wc/v3",
            auth=(settings.woo_consumer_key, settings.woo_consumer_secret),
            timeout=30.0,
        )

    async def paginate(self, path: str, params: dict | None = None):
        page = 1
        params = params or {}
        while True:
            resp = await self.client.get(path, params={**params, "per_page": PAGE_SIZE, "page": page})
            if resp.status_code == 429:
                await asyncio.sleep(5)
                continue
            resp.raise_for_status()
            batch = resp.json()
            if not batch:
                break
            for row in batch:
                yield row
            if len(batch) < PAGE_SIZE:
                break
            page += 1

    async def close(self) -> None:
        await self.client.aclose()


def parse_seal_type(name: str) -> str:
    match = SEAL_TYPE_RE.search(name or "")
    return match.group(1).upper() if match else "other"


def segment_for_category_names(names: list[str]) -> Segment | None:
    lowered = [n.lower() for n in names]
    if "aftermarket" in lowered:
        return Segment.aftermarket
    if "replacement" in lowered:
        return Segment.replacement
    return None


async def migrate_categories(woo: WooClient, log: list[dict]) -> dict[int, int]:
    """Returns woo_category_id -> local category id map."""
    async with SessionLocal() as db:
        mapping: dict[int, int] = {}
        async for row in woo.paginate("/products/categories"):
            existing = (
                await db.execute(select(Category).where(Category.woo_id == row["id"]))
            ).scalar_one_or_none()
            if existing:
                cat = existing
            else:
                cat = Category(slug=row["slug"], name=row["name"], woo_id=row["id"])
                db.add(cat)
                await db.flush()
            cat.description = row.get("description") or cat.description
            cat.image_url = (row.get("image") or {}).get("src")
            mapping[row["id"]] = cat.id
            log.append({"entity": "category", "woo_id": row["id"], "status": "ok"})
        await db.commit()
        return mapping


async def migrate_products(woo: WooClient, category_map: dict[int, int], log: list[dict]) -> None:
    async with SessionLocal() as db:
        brand_cache: dict[str, Brand] = {}
        async for row in woo.paginate("/products"):
            try:
                cat_names = [c["name"] for c in row.get("categories", [])]
                segment = segment_for_category_names(cat_names)
                brand_name = next((c["name"] for c in row.get("categories", []) if c["name"] not in ("Aftermarket", "Replacement", "Duo-Cone")), "Generic")
                brand_slug = brand_name.lower().replace(" ", "-")
                brand = brand_cache.get(brand_slug)
                if not brand:
                    brand = (await db.execute(select(Brand).where(Brand.slug == brand_slug))).scalar_one_or_none()
                    if not brand:
                        brand = Brand(slug=brand_slug, name=brand_name, segment=segment or Segment.oem)
                        db.add(brand)
                        await db.flush()
                    brand_cache[brand_slug] = brand

                existing = (
                    await db.execute(select(Product).where(Product.woo_id == row["id"]))
                ).scalar_one_or_none()
                product = existing or Product(woo_id=row["id"], slug=row["slug"])
                product.slug = row["slug"]
                product.sku = row.get("sku") or row["slug"]
                product.name = row["name"]
                product.seal_type = parse_seal_type(row["name"])
                product.brand_id = brand.id
                product.short_description = (row.get("short_description") or "")[:500] or None
                product.description_html = row.get("description")
                price = row.get("price") or row.get("regular_price") or "0"
                product.price_cents = int(round(float(price) * 100)) if price else 0
                sale_price = row.get("sale_price")
                product.sale_price_cents = int(round(float(sale_price) * 100)) if sale_price else None
                product.is_active = row.get("status") == "publish"

                if not existing:
                    db.add(product)
                await db.flush()

                for cat in row.get("categories", []):
                    local_cat_id = category_map.get(cat["id"])
                    if local_cat_id:
                        link_exists = await db.execute(
                            select(ProductCategory).where(
                                ProductCategory.product_id == product.id,
                                ProductCategory.category_id == local_cat_id,
                            )
                        )
                        if not link_exists.scalar_one_or_none():
                            db.add(ProductCategory(product_id=product.id, category_id=local_cat_id))

                for idx, img in enumerate(row.get("images", [])):
                    img_exists = await db.execute(
                        select(ProductImage).where(
                            ProductImage.product_id == product.id, ProductImage.url == img["src"]
                        )
                    )
                    if not img_exists.scalar_one_or_none():
                        db.add(
                            ProductImage(
                                product_id=product.id,
                                url=img["src"],
                                alt=img.get("alt") or product.name,
                                position=idx,
                            )
                        )

                log.append({"entity": "product", "woo_id": row["id"], "status": "ok"})
            except Exception as exc:  # noqa: BLE001
                log.append({"entity": "product", "woo_id": row.get("id"), "status": "error", "error": str(exc)})

        await db.commit()


async def run(args: argparse.Namespace) -> None:
    woo = WooClient()
    log: list[dict] = []
    try:
        category_map: dict[int, int] = {}
        if args.only in (None, "categories", "all"):
            category_map = await migrate_categories(woo, log)
        if args.only in (None, "products", "all"):
            await migrate_products(woo, category_map, log)
    finally:
        await woo.close()

    REPORTS_DIR.mkdir(exist_ok=True)
    run_id = args.run_id or datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S")
    report = {
        "run_id": run_id,
        "counts": {
            "ok": sum(1 for r in log if r["status"] == "ok"),
            "error": sum(1 for r in log if r["status"] == "error"),
        },
        "errors": [r for r in log if r["status"] == "error"],
    }
    (REPORTS_DIR / f"{run_id}.json").write_text(json.dumps(report, indent=2))
    print(json.dumps(report["counts"], indent=2))


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--run-id")
    parser.add_argument("--resume")
    parser.add_argument("--only", choices=["products", "categories", "images", "all"])
    asyncio.run(run(parser.parse_args()))
