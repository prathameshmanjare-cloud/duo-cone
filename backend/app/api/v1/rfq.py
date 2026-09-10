import uuid

from fastapi import APIRouter, BackgroundTasks, Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth.deps import get_current_user
from app.auth.security import decode_token
from app.db.session import get_db
from app.models.commerce import Rfq, RfqItem, User
from app.background.tasks import notify_rfq

router = APIRouter(prefix="/rfq", tags=["rfq"])

_bearer = HTTPBearer(auto_error=False)


async def _optional_user(
    creds: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: AsyncSession = Depends(get_db),
) -> User | None:
    """Resolve the caller if a valid bearer token is present, else None."""
    if creds is None or not creds.credentials:
        return None
    try:
        payload = decode_token(creds.credentials, expected_type="access")
        user_id = uuid.UUID(payload["sub"])
    except Exception:  # noqa: BLE001
        return None
    return (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()


class RfqLineIn(BaseModel):
    sku: str | None = None
    name: str | None = None
    qty: int = Field(1, ge=1, le=100000)
    note: str | None = None


class RfqIn(BaseModel):
    email: EmailStr
    company: str | None = None
    vat_id: str | None = None
    country_code: str | None = None
    phone: str | None = None
    message: str | None = None
    items: list[RfqLineIn] = Field(min_length=1)


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
async def create_rfq(
    payload: RfqIn,
    background: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    user: User | None = Depends(_optional_user),
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
