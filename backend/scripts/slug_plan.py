"""The one-time move from short product slugs to the old shop's URLs.

Shared by ``finalize_slugs`` (writes the database) and ``legacy_redirects``
(writes the 301 list in vercel.json), so both always agree on where every
product ends up.

Input is a list of products with ``id``, ``slug``, ``brand`` (brand slug),
``sku`` and ``name``. Output, per product: kept or merged into another one, and
its final slug.
"""

from __future__ import annotations

import sys
from collections import defaultdict
from dataclasses import dataclass, field
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.utils.slug import part_key, product_slug  # noqa: E402

# Parts stored twice (same brand + part number), decided with the owner on
# 2026-10-20: current slug of the copy to remove -> current slug of the copy
# to keep. Orders, RFQs and carts of a removed copy move to the kept one.
DUPLICATE_DECISIONS: dict[str, str] = {
    # identical copies; keep the one that already has the final URL
    "benati-1210654": "benati-mechanical-face-seal-df-type-1210654",
    "benati-2205080": "benati-mechanical-face-seal-do-type-2205080",
    # keep the "price on request" copy
    "komatsu-140-30-00141": "komatsu-140-30-00141-2",
    "komatsu-141-30-00610": "komatsu-141-30-00610-2",
    # identical apart from dots vs dashes; keep Komatsu's dotted format
    "komatsu-150-27-00025-2": "komatsu-150-27-00025",
    "komatsu-150-27-00027-2": "komatsu-150-27-00027",
    "komatsu-150-27-00028-2": "komatsu-150-27-00028",
}


class PlanError(Exception):
    pass


@dataclass
class Plan:
    final_slug: dict[str, str] = field(default_factory=dict)  # product id -> final slug (kept products)
    merged_into: dict[str, str] = field(default_factory=dict)  # removed product id -> kept product id
    # every URL slug that must 301 to a final slug: current short slugs, the
    # removed copies' slugs, and the removed copies' own old shop slugs
    redirects: dict[str, str] = field(default_factory=dict)


def build_plan(products: list[dict]) -> Plan:
    by_slug = {p["slug"]: p for p in products}
    plan = Plan()

    for remove, keep in DUPLICATE_DECISIONS.items():
        if remove not in by_slug or keep not in by_slug:
            # already applied (or catalog changed): only fine if neither exists twice
            if remove in by_slug:
                raise PlanError(f"duplicate {remove!r} has no product {keep!r} to merge into")
            continue
        plan.merged_into[by_slug[remove]["id"]] = by_slug[keep]["id"]

    # any other part stored twice needs a decision first
    groups: dict[tuple[str, str], list[dict]] = defaultdict(list)
    for p in products:
        if p["id"] not in plan.merged_into:
            groups[(p["brand"], part_key(p["sku"]))].append(p)
    undecided = [g for g in groups.values() if len(g) > 1]
    if undecided:
        names = "; ".join(" / ".join(p["slug"] for p in g) for g in undecided)
        raise PlanError(f"parts stored twice without a decision: {names}")

    # final slugs, -2, -3 ... only if two titles produce the same slug
    taken: set[str] = set()
    for p in sorted(products, key=lambda p: p["slug"]):
        if p["id"] in plan.merged_into:
            continue
        base = product_slug(p["name"])
        slug, n = base, 2
        while slug in taken:
            slug, n = f"{base}-{n}", n + 1
        taken.add(slug)
        plan.final_slug[p["id"]] = slug

    for p in products:
        target_id = plan.merged_into.get(p["id"], p["id"])
        target = plan.final_slug[target_id]
        for source in (p["slug"], product_slug(p["name"])):
            if source != target and source not in taken:
                previous = plan.redirects.setdefault(source, target)
                if previous != target:
                    raise PlanError(f"{source!r} would redirect to both {previous!r} and {target!r}")
    return plan
