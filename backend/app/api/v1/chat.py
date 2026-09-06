import uuid

from fastapi import APIRouter, BackgroundTasks, Depends
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.background.tasks import notify_rfq
from app.db.session import get_db
from app.models.commerce import Rfq, RfqItem
from app.services import chat_bot

router = APIRouter(prefix="/chat", tags=["chat"])


class ChatMessage(BaseModel):
    role: str
    text: str


class ChatIn(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    history: list[ChatMessage] = Field(default_factory=list)


class BotProductOut(BaseModel):
    name: str
    slug: str
    sku: str
    price_cents: int
    currency: str
    is_rfq_only: bool


class ChatOut(BaseModel):
    reply: str
    quick_replies: list[str] = []
    products: list[BotProductOut] = []
    handoff: bool = False


class HandoffIn(BaseModel):
    email: EmailStr
    message: str = Field(min_length=1, max_length=4000)
    name: str | None = None
    phone: str | None = None
    part_number: str | None = None


@router.post("", response_model=ChatOut)
async def chat(payload: ChatIn, db: AsyncSession = Depends(get_db)) -> ChatOut:
    result = await chat_bot.answer(
        db, payload.message, [m.model_dump() for m in payload.history]
    )
    return ChatOut(
        reply=result.reply,
        quick_replies=result.quick_replies,
        products=[BotProductOut(**p.__dict__) for p in result.products],
        handoff=result.handoff,
    )


@router.post("/handoff")
async def handoff(
    payload: HandoffIn, background: BackgroundTasks, db: AsyncSession = Depends(get_db)
):
    number = f"CHAT-{uuid.uuid4().hex[:8].upper()}"
    rfq = Rfq(
        number=number,
        email=payload.email.lower(),
        phone=payload.phone,
        message=f"[Live chat handoff] {payload.message}"
        + (f"\nName: {payload.name}" if payload.name else ""),
    )
    db.add(rfq)
    await db.flush()
    if payload.part_number:
        db.add(RfqItem(rfq_id=rfq.id, sku=payload.part_number, name=payload.part_number, qty=1))
    await db.commit()

    background.add_task(notify_rfq, rfq_number=number, email=payload.email)
    return {"number": number}
