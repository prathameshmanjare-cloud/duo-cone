"""Move every product to its final (old shop) URL and merge the duplicate parts.

One-time catalog migration; see ``scripts/slug_plan.py`` for the rules.

    # show what would change, write nothing
    DATABASE_URL=... python -m scripts.finalize_slugs
    # do it
    DATABASE_URL=... python -m scripts.finalize_slugs --apply

With --apply it first saves every product row and every order/RFQ/cart line
that points at a merged product to scripts/reports/finalize-backup-<time>.json,
then runs all changes in one transaction: if anything fails, nothing changes.
Running it again after it succeeded is a no-op.
"""

from __future__ import annotations

import argparse
import asyncio
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy import text

sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.db.bootstrap import ensure_product_uniqueness  # noqa: E402
from app.db.session import SessionLocal, engine  # noqa: E402
from scripts.slug_plan import PlanError, build_plan  # noqa: E402

REPORTS_DIR = Path(__file__).parent / "reports"

# rows that reference a product and must follow it when duplicates merge
_LINE_TABLES = ("order_items", "rfq_items", "cart_items")
# rows owned by a product that go away with a removed duplicate
_OWNED_TABLES = (
    "product_images",
    "product_categories",
    "product_attributes",
    "cross_references",
    "inventory",
    "media_assets",
)


async def _products(db) -> list[dict]:
    rows = await db.execute(
        text(
            "SELECT p.id::text AS id, p.slug, coalesce(b.slug, '') AS brand, p.sku, p.name "
            "FROM products p LEFT JOIN brands b ON b.id = p.brand_id"
        )
    )
    return [dict(r._mapping) for r in rows]


async def _backup(db, merged_ids: list[str]) -> Path:
    dump: dict[str, list[dict]] = {}
    dump["products"] = [dict(r._mapping) for r in await db.execute(text("SELECT * FROM products"))]
    for table in _LINE_TABLES + _OWNED_TABLES:
        q = f"SELECT * FROM {table} WHERE product_id::text = ANY(:ids)"
        dump[table] = [dict(r._mapping) for r in await db.execute(text(q), {"ids": merged_ids})]
    REPORTS_DIR.mkdir(exist_ok=True)
    path = REPORTS_DIR / f"finalize-backup-{datetime.now(timezone.utc):%Y%m%dT%H%M%SZ}.json"
    path.write_text(json.dumps(dump, default=str, indent=1))
    return path


async def run(apply: bool) -> None:
    async with SessionLocal() as db:
        products = await _products(db)
        try:
            plan = build_plan(products)
        except PlanError as exc:
            sys.exit(f"Stopped, nothing changed: {exc}")

        by_id = {p["id"]: p for p in products}
        changes = {i: s for i, s in plan.final_slug.items() if by_id[i]["slug"] != s}
        print(f"products: {len(products)}")
        print(f"duplicates to merge: {len(plan.merged_into)}")
        for removed, kept in plan.merged_into.items():
            print(f"  {by_id[removed]['slug']}  ->  {by_id[kept]['slug']}")
        print(f"slugs to change: {len(changes)}")
        for i in list(changes)[:5]:
            print(f"  {by_id[i]['slug']}  ->  {changes[i]}")

        if not plan.merged_into and not changes:
            print("Already done.")
            await ensure_product_uniqueness(db)
            return
        if not apply:
            print("\nDry run: nothing written. Re-run with --apply to make these changes.")
            return

        merged_ids = list(plan.merged_into)
        backup = await _backup(db, merged_ids)
        print(f"\nbackup: {backup}")

        for removed, kept in plan.merged_into.items():
            for table in _LINE_TABLES:
                await db.execute(
                    text(f"UPDATE {table} SET product_id = :kept WHERE product_id = :removed"),
                    {"kept": kept, "removed": removed},
                )
            for table in _OWNED_TABLES:
                await db.execute(text(f"DELETE FROM {table} WHERE product_id = :removed"), {"removed": removed})
            await db.execute(text("DELETE FROM products WHERE id = :removed"), {"removed": removed})

        # two passes so a new slug never collides with one not yet renamed
        for i in changes:
            await db.execute(text("UPDATE products SET slug = :tmp WHERE id = :id"), {"tmp": f"tmp-{i}", "id": i})
        for i, slug in changes.items():
            await db.execute(text("UPDATE products SET slug = :slug WHERE id = :id"), {"slug": slug, "id": i})

        after = await _products(db)
        try:
            leftover = build_plan(after)
        except PlanError as exc:
            await db.rollback()
            sys.exit(f"Rolled back, nothing changed: {exc}")
        if leftover.merged_into or any(p["slug"] != leftover.final_slug[p["id"]] for p in after):
            await db.rollback()
            sys.exit("Rolled back, nothing changed: result does not match the plan")
        await db.commit()
        print(f"Done: merged {len(plan.merged_into)} duplicates, moved {len(changes)} products to their final URL.")

        print("unique brand + part number rule active:", await ensure_product_uniqueness(db))
    await engine.dispose()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true", help="write the changes (default: dry run)")
    asyncio.run(run(parser.parse_args().apply))
