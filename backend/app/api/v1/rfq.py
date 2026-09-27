import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, Request
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth.deps import get_current_user, get_optional_user
from app.db.session import get_db
from app.middleware.rate_limit import limiter
from app.models.commerce import Rfq, RfqItem, User
from app.background.tasks import notify_rfq

router = APIRouter(prefix="/rfq", tags=["rfq"])

class RfqLineIn(BaseModel):
    sku: str | None = Field(default=None, max_length=120)
    name: str | None = Field(default=None, max_length=300)
    qty: int = Field(1, ge=1, le=100000)
    note: str | None = Field(default=None, max_length=300)


class RfqIn(BaseModel):
    email: EmailStr
    company: str | None = Field(default=None, max_length=200)
    vat_id: str | None = Field(default=None, max_length=40)
    country_code: str | None = Field(default=None, max_length=2)
    phone: str | None = Field(default=None, max_length=40)
    message: str | None = Field(default=None, max_length=5000)
    items: list[RfqLineIn] = Field(min_length=1, max_length=100)


class RfqLineOut(BaseModel):
    sku: str | None = None
    name: str | None = None
    qty: int
    note: str | None = None

    model_config = {"from_attributes": True}


class RfqOut(BaseModel):
    id: uuid.UUID
    number: str
    email: str
    company: str | None = None
    message: str | None = None
    status: str
    created_at: str
    items: list[RfqLineOut] = []

    model_config = {"from_attributes": True}


@router.post("")
@limiter.limit("5/minute;30/hour")
async def create_rfq(
    request: Request,
    payload: RfqIn,
    background: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    user: User | None = Depends(get_optional_user),
):
    number = f"RFQ-{uuid.uuid4().hex[:8].upper()}"
    rfq = Rfq(
        number=number,
        user_id=user.id if user else None,
        email=payload.email,
        company=payload.company,
        vat_id=payload.vat_id,
        country_code=payload.country_code,
        phone=payload.phone,
        message=payload.message,
    )
    db.add(rfq)
    await db.flush()

    for line in payload.items:
        db.add(RfqItem(rfq_id=rfq.id, sku=line.sku, name=line.name, qty=line.qty, note=line.note))

    await db.commit()
    background.add_task(
        notify_rfq,
        rfq_number=number,
        email=payload.email,
        company=payload.company,
        item_count=len(payload.items),
        message=payload.message,
    )
    return {"id": str(rfq.id), "number": number}


@router.get("", response_model=list[RfqOut])
async def my_rfqs(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[RfqOut]:
    rows = (
        await db.execute(
            select(Rfq)
            .where(Rfq.user_id == user.id)
            .options(selectinload(Rfq.items))
            .order_by(Rfq.created_at.desc())
        )
    ).scalars().all()
    return [
        RfqOut(
            id=r.id,
            number=r.number,
            email=r.email,
            company=r.company,
            message=r.message,
            status=r.status.value if hasattr(r.status, "value") else str(r.status),
            created_at=r.created_at.isoformat(),
            items=[RfqLineOut.model_validate(i) for i in r.items],
        )
        for r in rows
    ]
