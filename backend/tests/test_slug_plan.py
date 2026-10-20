"""The one-time move to the old shop's product URLs (scripts/slug_plan.py)."""

from __future__ import annotations

import csv

import pytest

from scripts.legacy_redirects import SLUG_SNAPSHOT
from scripts.slug_plan import DUPLICATE_DECISIONS, PlanError, build_plan


def _snapshot() -> list[dict]:
    with SLUG_SNAPSHOT.open(encoding="utf-8") as fh:
        return list(csv.DictReader(fh))


def test_live_catalog_plan_has_no_duplicates_or_chains():
    products = _snapshot()
    plan = build_plan(products)

    assert len(plan.merged_into) == len(DUPLICATE_DECISIONS)
    finals = list(plan.final_slug.values())
    assert len(finals) == len(set(finals)) == len(products) - len(DUPLICATE_DECISIONS)
    # every redirect lands on a final URL in one hop
    assert set(plan.redirects.values()) <= set(finals)
    assert not set(plan.redirects) & set(finals)


def test_merged_copies_and_their_old_urls_reach_the_kept_product():
    plan = build_plan(_snapshot())
    kept = "komatsu-mechanical-face-seal-type-140-30-00141"  # the "price on request" copy
    assert plan.redirects["komatsu-140-30-00141"] == kept
    assert plan.redirects["komatsu-140-30-00141-2"] == kept
    assert plan.redirects["komatsu-mechanical-face-seal-type-do-140-30-00141"] == kept


def test_plan_refuses_undecided_duplicates():
    products = [
        {"id": "1", "slug": "acme-1-2", "brand": "acme", "sku": "1.2", "name": "Acme Seal 1.2"},
        {"id": "2", "slug": "acme-1-2-2", "brand": "acme", "sku": "1-2", "name": "Acme Seal 1-2"},
    ]
    with pytest.raises(PlanError, match="without a decision"):
        build_plan(products)


def test_plan_is_a_no_op_once_applied():
    products = _snapshot()
    plan = build_plan(products)
    applied = [
        {**p, "slug": plan.final_slug[p["id"]]} for p in products if p["id"] not in plan.merged_into
    ]
    again = build_plan(applied)
    assert not again.merged_into
    assert all(again.final_slug[p["id"]] == p["slug"] for p in applied)
