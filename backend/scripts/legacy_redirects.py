"""Write the permanent (301) redirects in vercel.json.

Every old URL must reach its page in one hop:

* old WooCommerce paths (/about-us/ stays, /store/, /my-account/, /code/...)
* the short product slugs the rebuilt shop used before ``finalize_slugs``,
  and duplicate products merged away there (see ``slug_plan``)
* /category/<segment> URLs of the first rebuild
* finally, any other page URL without its trailing slash

Vercel applies redirects in order and the slash rule is last, so a short
product URL goes straight to its final URL instead of first gaining a slash.
(``trailingSlash: true`` in vercel.json would run before these and cost a
second hop, so it isn't used.)

    python -m scripts.legacy_redirects            # rewrite vercel.json
    python -m scripts.legacy_redirects --check    # exit 1 if it is out of date
"""

from __future__ import annotations

import argparse
import csv
import json
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

from scripts.slug_plan import build_plan  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
VERCEL_JSON = ROOT / "vercel.json"
# product slugs as they were before finalize_slugs ran (live catalog snapshot)
SLUG_SNAPSHOT = Path(__file__).parent / "data" / "product-slugs-2026-10-20.csv"

# vercel.json allows at most 2048 redirects
MAX_REDIRECTS = 2048

SEGMENT = ":segment(replacement|aftermarket)"

STATIC_REDIRECTS: list[tuple[str, str]] = [
    # first rebuild's URLs
    ("/about{/}?", "/about-us/"),
    ("/category/duo-cone{/}?", "/shop/"),
    (f"/category/{SEGMENT}/page/:page{{/}}?", "/product-category/:segment/page/:page/"),
    (f"/category/{SEGMENT}{{/}}?", "/product-category/:segment/"),
    # old WooCommerce shop
    ("/product-category/duo-cone/:rest*", "/shop/"),
    ("/product-category/duo-cone{/}?", "/shop/"),
    ("/store/page/:page{/}?", "/shop/page/:page/"),
    ("/store{/}?", "/shop/"),
    ("/my-account/:rest*", "/account/"),
    ("/my-account{/}?", "/account/"),
    # internal-code and tag archives had no page of their own; search finds the parts
    ("/code/:code/:rest*", "/search/?q=:code"),
    ("/code/:code{/}?", "/search/?q=:code"),
    ("/product-tag/:tag/:rest*", "/search/?q=:tag"),
    ("/product-tag/:tag{/}?", "/search/?q=:tag"),
]

# any page URL (last segment without a dot) that lacks its trailing slash
TRAILING_SLASH = ("/:path((?:[^/]+/)*[^/.]+)", "/:path/")


def product_redirects() -> list[tuple[str, str]]:
    with SLUG_SNAPSHOT.open(encoding="utf-8") as fh:
        products = list(csv.DictReader(fh))
    plan = build_plan(products)
    return [(f"/product/{old}{{/}}?", f"/product/{new}/") for old, new in sorted(plan.redirects.items())]


def build() -> list[dict]:
    pairs = [*STATIC_REDIRECTS, *product_redirects(), TRAILING_SLASH]
    if len(pairs) > MAX_REDIRECTS:
        sys.exit(f"{len(pairs)} redirects is over Vercel's limit of {MAX_REDIRECTS}")
    return [{"source": s, "destination": d, "statusCode": 301} for s, d in pairs]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()

    config = json.loads(VERCEL_JSON.read_text())
    redirects = build()
    if args.check:
        if config.get("redirects") != redirects:
            sys.exit("vercel.json redirects are out of date: run python -m scripts.legacy_redirects")
        print(f"vercel.json redirects up to date ({len(redirects)})")
        return

    # keep redirects right after the build settings so vercel.json stays readable
    out = {}
    for key, value in config.items():
        if key != "redirects":
            out[key] = value
        if key == "installCommand":
            out["redirects"] = redirects
    out.setdefault("redirects", redirects)
    VERCEL_JSON.write_text(json.dumps(out, indent=2) + "\n")
    print(f"wrote {len(redirects)} redirects to {VERCEL_JSON.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
