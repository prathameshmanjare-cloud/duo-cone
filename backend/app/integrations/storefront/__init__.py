"""Storefront rebuilds.

The storefront prerenders every product and category page at build time, so
catalog edits only reach crawlers after a new Vercel build. Admin writes call
``schedule_rebuild``; one deploy-hook request goes out after a quiet period,
however many edits happened in between.
"""

from __future__ import annotations

import asyncio
import logging

import httpx

from app.config.settings import get_settings

logger = logging.getLogger("duocon.storefront")
settings = get_settings()

# a batch of admin edits within this window becomes a single rebuild
DEBOUNCE_SECONDS = 300

_pending: asyncio.Task | None = None


def schedule_rebuild() -> None:
    global _pending
    if not settings.vercel_deploy_hook_url:
        return
    if _pending and not _pending.done():
        return
    _pending = asyncio.get_running_loop().create_task(_rebuild_later())


async def _rebuild_later() -> None:
    await asyncio.sleep(DEBOUNCE_SECONDS)
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(settings.vercel_deploy_hook_url)
        logger.info("Storefront rebuild requested (HTTP %s)", resp.status_code)
    except Exception:  # noqa: BLE001 — a missed rebuild is caught by the nightly one
        logger.exception("Storefront rebuild request failed")
