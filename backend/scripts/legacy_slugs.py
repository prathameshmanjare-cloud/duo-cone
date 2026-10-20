"""Work out each product's old WooCommerce URL slug (report only).

The old duo-cone.com shop (WordPress/WooCommerce) built product URLs from the
product title with WordPress's ``sanitize_title``:
``/product/skf-mechanical-face-seal-type-df-108710/``. The rebuilt catalog was
imported from the Excel price list with short slugs (``skf-108710``), so the
old URLs Google ranks no longer exist.

This script reads the live catalog through the public API, derives the old
slug from each product title, checks the rule against old URLs Google still
lists, and writes a CSV report. It never writes to the database.

Usage:
    python -m scripts.legacy_slugs
    python -m scripts.legacy_slugs --api http://localhost:8000/api/v1 --out report.csv
"""

from __future__ import annotations

import argparse
import csv
import re
import sys
from collections import defaultdict
from pathlib import Path

import httpx

sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.utils.slug import part_key, product_slug  # noqa: E402

DEFAULT_API = "https://duo-cone.onrender.com/api/v1"
REPORTS_DIR = Path(__file__).parent / "reports"

# Old product URLs still in Google's index (Oct 2026). Used to check the rule.
KNOWN_OLD_SLUGS = {
    "goetze-mechanical-face-seal-do-type-76-90-h-25-76-97-h-25",
    "skf-mechanical-face-seal-type-df-108710",
    "caterpillar-metal-face-seal-df-type-group-172-1619-seal-nr-171-1189",
    "caterpillar-metal-face-seal-do-type-group-462-6304-seal-nr-154-3383",
    "komatsu-mechanical-face-seal-type-do-100-27-00040",
    "komatsu-mechanical-face-seal-type-do-141-30-00314",
}


def fetch_catalog(api: str) -> list[dict]:
    items: list[dict] = []
    page = 1
    with httpx.Client(timeout=120) as client:
        while True:
            # default (relevance) sort is the only stable ordering across pages
            data = client.get(f"{api}/products", params={"page": page, "page_size": 100}).json()
            items += data["items"]
            if len(data["items"]) < 100:
                break
            page += 1
    if len({p["id"] for p in items}) != len(items):
        sys.exit("catalog pages overlapped; refusing to build a report from it")
    return items


def build_rows(items: list[dict]) -> list[dict]:
    by_part: dict[tuple[str, str], list[dict]] = defaultdict(list)
    for p in items:
        by_part[((p.get("brand") or {}).get("slug", ""), part_key(p["sku"]))].append(p)

    rows = []
    for p in items:
        brand = (p.get("brand") or {}).get("slug", "")
        twins = by_part[(brand, part_key(p["sku"]))]
        rows.append(
            {
                "id": p["id"],
                "brand": (p.get("brand") or {}).get("name", ""),
                "sku": p["sku"],
                "name": p["name"],
                "price_eur": f"{p['price_cents'] / 100:.2f}",
                "current_url": f"/product/{p['slug']}",
                "final_url": f"/product/{product_slug(p['name'])}/",
                "duplicate_part": "yes" if len(twins) > 1 else "",
                "notes": [],
            }
        )

    # two products whose titles give the same slug: WordPress would have
    # added -2, -3 ... in creation order, which can't be recovered now
    by_slug: dict[str, list[dict]] = defaultdict(list)
    for r in rows:
        by_slug[r["final_url"]].append(r)
    for slug, group in by_slug.items():
        if len(group) > 1:
            for r in group:
                r["notes"].append(f"same final URL as {len(group) - 1} other product(s)")

    for r in rows:
        slug = r["final_url"].removeprefix("/product/").rstrip("/")
        if slug in KNOWN_OLD_SLUGS:
            r["notes"].append("matches an old URL Google still lists")
        if r["current_url"].removeprefix("/product/") == slug:
            r["notes"].append("already uses the final URL")
        if not re.search(r"\b(DF|DO)\b", r["name"]):
            r["notes"].append("title has no DF/DO type")
    return rows


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--api", default=DEFAULT_API)
    parser.add_argument("--out", type=Path, default=REPORTS_DIR / "final-product-urls.csv")
    args = parser.parse_args()

    items = fetch_catalog(args.api)
    rows = build_rows(items)

    args.out.parent.mkdir(parents=True, exist_ok=True)
    with args.out.open("w", newline="", encoding="utf-8-sig") as fh:  # BOM: opens cleanly in Excel
        writer = csv.DictWriter(fh, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        for r in rows:
            writer.writerow({**r, "notes": "; ".join(r["notes"])})

    final = {r["final_url"].removeprefix("/product/").rstrip("/") for r in rows}
    print(f"products: {len(rows)}")
    print(f"known old URLs matched: {len(KNOWN_OLD_SLUGS & final)}/{len(KNOWN_OLD_SLUGS)}")
    for slug in sorted(KNOWN_OLD_SLUGS - final):
        print(f"  not matched: {slug}")
    print(f"products with a duplicate part: {sum(1 for r in rows if r['duplicate_part'])}")
    print(f"products sharing a final URL: {sum(1 for r in rows if any('same final URL' in n for n in r['notes']))}")
    print(f"titles without DF/DO: {sum(1 for r in rows if any('no DF/DO' in n for n in r['notes']))}")
    print(f"report: {args.out}")


if __name__ == "__main__":
    main()
