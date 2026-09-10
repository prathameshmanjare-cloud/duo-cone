"""Stripe webhook — confirms card orders.

Point a Stripe endpoint at ``POST /api/v1/stripe/webhook`` for the events
``checkout.session.completed`` and ``checkout.session.async_payment_succeeded``
and set ``STRIPE_WEBHOOK_SECRET``.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.background.tasks import notify_order
from app.config.settings import get_settings
from app.db.session import get_db
from app.integrations.payments import stripe_gateway
from app.models.commerce import Order, OrderStatus

router = APIRouter(prefix="/stripe", tags=["stripe"])
logger = logging.getLogger("duocon.stripe")
settings = get_settings()

_PAID_EVENTS = {"checkout.session.completed", "checkout.session.async_payment_succeeded"}


@router.post("/webhook")
async def stripe_webhook(
    request: Request, background: BackgroundTasks, db: AsyncSession = Depends(get_db)
):
    if not settings.stripe_webhook_secret:
        raise HTTPException(status_code=503, detail="Stripe webhook not configured")

    payload = await request.body()
    sig = request.headers.get("stripe-signature", "")
    try:
        event = stripe_gateway.construct_event(payload, sig)
    except Exception as exc:  # noqa: BLE001 — bad signature / malformed
        logger.warning("Stripe webhook rejected: %s", exc)
        raise HTTPException(status_code=400, detail="Invalid signature") from exc

    if event["type"] not in _PAID_EVENTS:
        return {"received": True, "ignored": event["type"]}

    session = event["data"]["object"]
    if session.get("payment_status") not in (None, "paid"):
        return {"received": True, "pending": session.get("payment_status")}

    number = (session.get("metadata") or {}).get("order_number") or session.get(
        "client_reference_id"
    )
    if not number:
        return {"received": True, "no_order_ref": True}

    order = (
        await db.execute(select(Order).where(Order.number == number))
    ).scalar_one_or_none()
    if order is None:
        logger.error("Stripe webhook: order %s not found", number)
        return {"received": True, "order_not_found": number}

    if order.status == OrderStatus.paid:
        return {"received": True, "already_paid": number}

    order.status = OrderStatus.paid
    order.paid_at = datetime.now(timezone.utc)
    order.stripe_payment_intent = session.get("payment_intent")
    await db.commit()

    background.add_task(
        notify_order,
        order_number=order.number,
        email=order.email,
        total_cents=order.total_cents,
        currency=order.currency,
        item_lines=None,
    )
    logger.info("Order %s marked paid via Stripe", number)
    return {"received": True, "paid": number}
