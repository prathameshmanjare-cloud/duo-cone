"""Customer-facing orders.

Quote / invoice model — no card capture here. An order is created with
status ``pending``; payment is settled by invoice (net-30 for verified B2B)
or arranged before dispatch. A confirmation email goes to the customer and
sales via a background task.
"""

from __future__ import annotations

import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth.deps import get_current_user
from app.auth.security import decode_token
from app.background.tasks import notify_order
from app.db.session import get_db
from app.models.commerce import Order, OrderItem, User

router = APIRouter(prefix="/orders", tags=["orders"])

_bearer = HTTPBearer(auto_error=False)

# EU member states for VAT reverse-charge (destination not DE, VAT id present)
_EU = {
    "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU",
    "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE",
}


async def _optional_user(
    creds: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: AsyncSession = Depends(get_db),
) -> User | None:
    if creds is None or not creds.credentials:
        return None
    try:
        payload = decode_token(creds.credentials, expected_type="access")
        uid = uuid.UUID(payload["sub"])
    except Exception:  # noqa: BLE001
        return None
    return (await db.execute(select(User).where(User.id == uid))).scalar_one_or_none()


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
    product_id: uuid.UUID | None = None
    sku: str = Field(min_length=1, max_length=120)
    name: str = Field(min_length=1, max_length=300)
    qty: int = Field(ge=1, le=100000)
    unit_price_cents: int = Field(ge=0)


class OrderIn(BaseModel):
    email: EmailStr
    currency: str = Field(default="EUR", min_length=3, max_length=3)
    vat_id: str | None = Field(default=None, max_length=40)
    shipping_address: AddressIn
    billing_address: AddressIn | None = None
    shipping_method: str | None = Field(default=None, max_length=120)
    customer_note: str | None = Field(default=None, max_length=2000)
    items: list[OrderLineIn] = Field(min_length=1)
    terms_accepted: bool

    def total(self) -> int:
        return sum(li.unit_price_cents * li.qty for li in self.items)


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
    customer_note: str | None = None
    created_at: str
    items: list[OrderLineOut] = []


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
async def create_order(
    payload: OrderIn,
    background: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    user: User | None = Depends(_optional_user),
) -> OrderOut:
    if not payload.terms_accepted:
        raise HTTPException(status_code=422, detail="Terms must be accepted")

    subtotal = payload.total()
    reverse_charge = bool(
        payload.vat_id
        and payload.shipping_address.country_code.upper() in _EU
        and payload.shipping_address.country_code.upper() != "DE"
    )
    number = f"DC-{uuid.uuid4().hex[:8].upper()}"
    order = Order(
        number=number,
        user_id=user.id if user else None,
        email=payload.email,
        currency=payload.currency.upper(),
        subtotal_cents=subtotal,
        discount_cents=0,
        shipping_cents=0,
        tax_cents=0,  # invoice issued separately; VAT handled on the invoice
        total_cents=subtotal,
        vat_id=payload.vat_id,
        vat_reverse_charge=reverse_charge,
        shipping_address=payload.shipping_address.model_dump(),
        billing_address=(payload.billing_address or payload.shipping_address).model_dump(),
        shipping_method=payload.shipping_method,
        customer_note=payload.customer_note,
    )
    db.add(order)
    await db.flush()
    for li in payload.items:
        db.add(
            OrderItem(
                order_id=order.id,
                product_id=li.product_id,
                sku=li.sku,
                name=li.name,
                qty=li.qty,
                unit_price_cents=li.unit_price_cents,
                total_cents=li.unit_price_cents * li.qty,
            )
        )
    await db.commit()
    await db.refresh(order, attribute_names=["items"])

    background.add_task(
        notify_order,
        order_number=number,
        email=payload.email,
        total_cents=subtotal,
        currency=order.currency,
        item_lines=[f"{li.qty}× {li.name} ({li.sku})" for li in payload.items],
    )
    return _serialize(order)


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


@router.get("/{number}", response_model=OrderOut)
async def get_order(
    number: str,
    email: str | None = None,
    db: AsyncSession = Depends(get_db),
    user: User | None = Depends(_optional_user),
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
