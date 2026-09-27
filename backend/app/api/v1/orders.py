"""Customer-facing orders.

Quote / invoice model — no card capture here. An order is created with
status ``pending``; payment is settled by invoice (net-30 for verified B2B)
or arranged before dispatch. A confirmation email goes to the customer and
sales via a background task.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth.deps import get_current_user, get_optional_user
from app.background.tasks import notify_order, notify_order_paid
from app.db.session import get_db
from app.integrations.payments import stripe_gateway
from app.middleware.rate_limit import limiter
from app.models.catalog import Product
from app.models.commerce import Order, OrderItem, OrderStatus, User
from app.services.invoice import build_invoice_pdf
from app.services.shipping import calc_shipping_cents, calc_vat_cents, line_weight_grams

router = APIRouter(prefix="/orders", tags=["orders"])
logger = logging.getLogger("duocon.orders")

# EU member states for VAT reverse-charge (destination not DE, VAT id present)
_EU = {
    "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU",
    "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE",
}


class AddressIn(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    company: str | None = Field(default=None, max_length=200)
    line1: str = Field(min_length=1, max_length=200)
    line2: str | None = Field(default=None, max_length=200)
    city: str = Field(min_length=1, max_length=120)
    region: str | None = Field(default=None, max_length=120)
    postal_code: str = Field(min_length=1, max_length=20)
    country_code: str = Field(min_length=2, max_length=2)
    phone: str | None = Field(default=None, max_length=40)


class OrderLineIn(BaseModel):
    product_id: uuid.UUID
    # sku / name / unit_price_cents are accepted for backwards compatibility
    # but never trusted: the server re-reads all three from the catalog.
    sku: str | None = Field(default=None, max_length=120)
    name: str | None = Field(default=None, max_length=300)
    qty: int = Field(ge=1, le=100000)
    unit_price_cents: int | None = Field(default=None, ge=0)


class OrderIn(BaseModel):
    email: EmailStr
    currency: str = Field(default="EUR", min_length=3, max_length=3)
    vat_id: str | None = Field(default=None, max_length=40)
    shipping_address: AddressIn
    billing_address: AddressIn | None = None
    shipping_method: str | None = Field(default=None, max_length=120)
    customer_note: str | None = Field(default=None, max_length=2000)
    payment_method: str = Field(default="invoice", pattern="^(invoice|card)$")
    items: list[OrderLineIn] = Field(min_length=1, max_length=200)
    terms_accepted: bool


class ShippingEstimateIn(BaseModel):
    country_code: str = Field(min_length=2, max_length=2)
    items: list[OrderLineIn] = Field(min_length=1, max_length=200)


class ShippingEstimateOut(BaseModel):
    shipping_cents: int
    tax_cents: int = 0
    currency: str = "EUR"


class OrderLineOut(BaseModel):
    sku: str
    name: str
    qty: int
    unit_price_cents: int
    total_cents: int
    model_config = {"from_attributes": True}


class OrderOut(BaseModel):
    id: uuid.UUID
    number: str
    email: str
    status: str
    currency: str
    subtotal_cents: int
    tax_cents: int
    shipping_cents: int
    total_cents: int
    vat_reverse_charge: bool
    payment_method: str = "invoice"
    customer_note: str | None = None
    created_at: str
    items: list[OrderLineOut] = []
    # only set on the create response when payment_method == "card"
    checkout_url: str | None = None


class _PricedLine:
    """An order line priced from the catalog, never from the client."""

    def __init__(self, product: Product, qty: int) -> None:
        self.product_id = product.id
        self.sku = product.sku
        self.name = product.name
        self.qty = qty
        self.unit_price_cents = (
            product.sale_price_cents if product.sale_price_cents is not None else product.price_cents
        )
        self.weight_g = product.weight_g

    @property
    def total_cents(self) -> int:
        return self.unit_price_cents * self.qty


async def _price_lines(
    db: AsyncSession, items: list[OrderLineIn], currency: str | None = None
) -> list[_PricedLine]:
    ids = {li.product_id for li in items}
    products = {
        p.id: p
        for p in (await db.execute(select(Product).where(Product.id.in_(ids)))).scalars().all()
    }
    lines: list[_PricedLine] = []
    for li in items:
        product = products.get(li.product_id)
        if product is None or not product.is_active:
            raise HTTPException(
                status_code=422, detail="A product in your cart is no longer available."
            )
        if product.is_rfq_only:
            raise HTTPException(
                status_code=422,
                detail=f"{product.name} is quote-only — please request a quote for it.",
            )
        if currency and product.currency.upper() != currency.upper():
            raise HTTPException(status_code=422, detail="Cart currency mismatch.")
        lines.append(_PricedLine(product, li.qty))
    return lines


def _total_weight_kg(lines: list[_PricedLine]) -> float:
    return sum(line_weight_grams(li.weight_g, li.qty) for li in lines) / 1000


@router.post("/shipping-estimate", response_model=ShippingEstimateOut)
@limiter.limit("60/minute")
async def shipping_estimate(
    request: Request, payload: ShippingEstimateIn, db: AsyncSession = Depends(get_db)
) -> ShippingEstimateOut:
    lines = await _price_lines(db, payload.items)
    shipping_cents = calc_shipping_cents(payload.country_code, _total_weight_kg(lines))
    subtotal = sum(li.total_cents for li in lines)
    tax_cents = calc_vat_cents(payload.country_code, subtotal + shipping_cents)
    return ShippingEstimateOut(shipping_cents=shipping_cents, tax_cents=tax_cents)


def session_matches_order(session, order: Order) -> bool:
    """Stripe charged exactly what the order says, in the order's currency."""
    return (
        session.get("amount_total") == order.total_cents
        and str(session.get("currency") or "").lower() == order.currency.lower()
    )


async def mark_order_paid(
    db: AsyncSession, order: Order, payment_intent: str | None = None
) -> bool:
    """Flip an order to paid exactly once. Returns True if this call changed it."""
    if order.status == OrderStatus.paid:
        return False
    order.status = OrderStatus.paid
    order.paid_at = datetime.now(timezone.utc)
    if payment_intent:
        order.stripe_payment_intent = payment_intent
    await db.commit()
    return True


def _serialize(o: Order) -> OrderOut:
    return OrderOut(
        id=o.id,
        number=o.number,
        email=o.email,
        status=o.status.value if hasattr(o.status, "value") else str(o.status),
        currency=o.currency,
        subtotal_cents=o.subtotal_cents,
        tax_cents=o.tax_cents,
        shipping_cents=o.shipping_cents,
        total_cents=o.total_cents,
        vat_reverse_charge=o.vat_reverse_charge,
        payment_method=o.payment_method,
        customer_note=o.customer_note,
        created_at=o.created_at.isoformat(),
        items=[
            OrderLineOut(
                sku=i.sku,
                name=i.name,
                qty=i.qty,
                unit_price_cents=i.unit_price_cents,
                total_cents=i.total_cents,
            )
            for i in o.items
        ],
    )


@router.post("", response_model=OrderOut, status_code=201)
@limiter.limit("10/minute;60/hour")
async def create_order(
    request: Request,
    payload: OrderIn,
    background: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    user: User | None = Depends(get_optional_user),
) -> OrderOut:
    if not payload.terms_accepted:
        raise HTTPException(status_code=422, detail="Terms must be accepted")
    if payload.payment_method == "card" and not stripe_gateway.enabled():
        raise HTTPException(
            status_code=503,
            detail="Card payment is not available right now — please choose invoice.",
        )

    lines = await _price_lines(db, payload.items, currency=payload.currency)
    subtotal = sum(li.total_cents for li in lines)
    reverse_charge = bool(
        payload.vat_id
        and payload.shipping_address.country_code.upper() in _EU
        and payload.shipping_address.country_code.upper() != "DE"
    )
    shipping_cents = calc_shipping_cents(
        payload.shipping_address.country_code, _total_weight_kg(lines)
    )
    tax_cents = calc_vat_cents(payload.shipping_address.country_code, subtotal + shipping_cents)
    number = f"DC-{uuid.uuid4().hex[:8].upper()}"
    order = Order(
        number=number,
        user_id=user.id if user else None,
        email=payload.email,
        currency=payload.currency.upper(),
        subtotal_cents=subtotal,
        discount_cents=0,
        shipping_cents=shipping_cents,
        tax_cents=tax_cents,
        total_cents=subtotal + shipping_cents + tax_cents,
        vat_id=payload.vat_id,
        vat_reverse_charge=reverse_charge,
        shipping_address=payload.shipping_address.model_dump(),
        billing_address=(payload.billing_address or payload.shipping_address).model_dump(),
        shipping_method=payload.shipping_method,
        customer_note=payload.customer_note,
        payment_method=payload.payment_method,
    )
    db.add(order)
    await db.flush()
    for li in lines:
        db.add(
            OrderItem(
                order_id=order.id,
                product_id=li.product_id,
                sku=li.sku,
                name=li.name,
                qty=li.qty,
                unit_price_cents=li.unit_price_cents,
                total_cents=li.total_cents,
            )
        )
    await db.commit()
    await db.refresh(order, attribute_names=["items"])

    checkout_url: str | None = None
    if payload.payment_method == "card":
        try:
            session = stripe_gateway.create_checkout_session(
                order_number=number,
                email=payload.email,
                currency=order.currency,
                line_items=[
                    {"name": li.name, "sku": li.sku, "unit_price_cents": li.unit_price_cents, "qty": li.qty}
                    for li in lines
                ]
                + (
                    [{"name": "Shipping", "sku": "SHIPPING", "unit_price_cents": shipping_cents, "qty": 1}]
                    if shipping_cents
                    else []
                )
                + (
                    [{"name": "VAT (19%)", "sku": "VAT", "unit_price_cents": tax_cents, "qty": 1}]
                    if tax_cents
                    else []
                ),
            )
            order.stripe_session_id = session.id
            await db.commit()
            checkout_url = session.url
        except Exception as exc:  # noqa: BLE001
            # order row stays as an unpaid card order the customer can retry
            logger.error(
                "Stripe checkout session creation failed for order %s: %s", number, exc
            )
            # details stay in the server log; the client gets a generic message
            raise HTTPException(
                status_code=502,
                detail="Could not start the card payment. Please try again or choose invoice.",
            ) from exc
    else:
        # invoice orders confirm immediately; card orders confirm on webhook
        background.add_task(
            notify_order,
            order_number=number,
            email=payload.email,
            total_cents=subtotal,
            currency=order.currency,
            item_lines=[f"{li.qty}× {li.name} ({li.sku})" for li in lines],
        )

    out = _serialize(order)
    out.checkout_url = checkout_url
    return out


@router.get("", response_model=list[OrderOut])
async def my_orders(
    db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)
) -> list[OrderOut]:
    rows = (
        await db.execute(
            select(Order)
            .where(Order.user_id == user.id)
            .options(selectinload(Order.items))
            .order_by(Order.created_at.desc())
        )
    ).scalars().all()
    return [_serialize(o) for o in rows]


@router.post("/{number}/sync-payment", response_model=OrderOut)
@limiter.limit("20/minute")
async def sync_payment(
    request: Request,
    number: str,
    background: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
) -> OrderOut:
    """Webhook-free confirmation: pull the Checkout Session straight from Stripe
    and mark the order paid if Stripe says so. Safe to call repeatedly — the
    frontend hits this on the success page so payment resolves even when no
    Stripe webhook endpoint is configured."""
    order = (
        await db.execute(
            select(Order).where(Order.number == number).options(selectinload(Order.items))
        )
    ).scalar_one_or_none()
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.status == OrderStatus.paid:
        return _serialize(order)
    if not order.stripe_session_id or not stripe_gateway.enabled():
        return _serialize(order)

    try:
        session = stripe_gateway.retrieve_session(order.stripe_session_id)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail="Could not reach Stripe") from exc

    if session.get("payment_status") == "paid":
        if not session_matches_order(session, order):
            logger.error("Stripe amount mismatch for order %s — not marking paid", order.number)
            raise HTTPException(status_code=409, detail="Payment does not match this order")
        changed = await mark_order_paid(db, order, session.get("payment_intent"))
        if changed:
            background.add_task(
                notify_order_paid,
                order_number=order.number,
                email=order.email,
                total_cents=order.total_cents,
                currency=order.currency,
                invoice_pdf=build_invoice_pdf(order),
            )
        await db.refresh(order, attribute_names=["items"])
    return _serialize(order)


@router.get("/{number}", response_model=OrderOut)
@limiter.limit("30/minute")
async def get_order(
    request: Request,
    number: str,
    email: str | None = None,
    db: AsyncSession = Depends(get_db),
    user: User | None = Depends(get_optional_user),
) -> OrderOut:
    order = (
        await db.execute(
            select(Order).where(Order.number == number).options(selectinload(Order.items))
        )
    ).scalar_one_or_none()
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    # access: the owner, an admin, or a guest who knows the matching email
    allowed = (
        (user and (order.user_id == user.id or user.is_admin))
        or (email and email.lower() == order.email.lower())
    )
    if not allowed:
        raise HTTPException(status_code=404, detail="Order not found")
    return _serialize(order)
