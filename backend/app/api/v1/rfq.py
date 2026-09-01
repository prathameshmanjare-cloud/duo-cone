import uuid

from fastapi import APIRouter, BackgroundTasks, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.commerce import Rfq, RfqItem
from app.background.tasks import notify_rfq

router = APIRouter(prefix="/rfq", tags=["rfq"])


class RfqLineIn(BaseModel):
    sku: str | None = None
    name: str | None = None
    qty: int = 1
    note: str | None = None


class RfqIn(BaseModel):
    email: str
    company: str | None = None
    vat_id: str | None = None
    country_code: str | None = None
    phone: str | None = None
    message: str | None = None
    items: list[RfqLineIn]


@router.post("")
async def create_rfq(payload: RfqIn, background: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    number = f"RFQ-{uuid.uuid4().hex[:8].upper()}"
    rfq = Rfq(
        number=number,
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
    background.add_task(notify_rfq, rfq_number=number, email=payload.email)
    return {"id": str(rfq.id), "number": number}
