"""Stripe wrapper — hosted Checkout Sessions + webhook verification.

Card payments are optional: when ``STRIPE_SECRET_KEY`` is unset, ``enabled``
is False and callers fall back to invoice orders.
"""

from __future__ import annotations

import logging

import stripe

from app.config.settings import get_settings

logger = logging.getLogger("duocon.stripe")
settings = get_settings()

if settings.stripe_secret_key:
    stripe.api_key = settings.stripe_secret_key


def enabled() -> bool:
    return bool(settings.stripe_secret_key)


def create_checkout_session(
    *,
    order_number: str,
    email: str,
    currency: str,
    line_items: list[dict],
) -> stripe.checkout.Session:
    """`line_items` = [{name, sku, unit_price_cents, qty}]."""
    stripe_line_items = [
        {
            "quantity": li["qty"],
            "price_data": {
                "currency": currency.lower(),
                "unit_amount": li["unit_price_cents"],
                "product_data": {
                    "name": li["name"][:250],
                    "metadata": {"sku": li.get("sku", "")[:250]},
                },
            },
        }
        for li in line_items
    ]
    base = settings.frontend_url.rstrip("/")
    return stripe.checkout.Session.create(
        mode="payment",
        customer_email=email,
        line_items=stripe_line_items,
        client_reference_id=order_number,
        metadata={"order_number": order_number},
        payment_intent_data={"metadata": {"order_number": order_number}},
        success_url=f"{base}/order-success/{order_number}?paid=1",
        cancel_url=f"{base}/checkout?cancelled=1",
    )


def retrieve_session(session_id: str) -> stripe.checkout.Session:
    return stripe.checkout.Session.retrieve(session_id)


def construct_event(payload: bytes, sig_header: str) -> stripe.Event:
    """Raises stripe.error.SignatureVerificationError / ValueError on bad input."""
    return stripe.Webhook.construct_event(
        payload, sig_header, settings.stripe_webhook_secret
    )
