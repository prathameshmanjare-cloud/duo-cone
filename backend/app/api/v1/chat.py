import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, Request
from pydantic import BaseModel, EmailStr, Field, field_validator
from sqlalchemy.ext.asyncio import AsyncSession

from app.background.tasks import notify_rfq
from app.db.session import get_db
from app.middleware.rate_limit import limiter
from app.models.commerce import Rfq, RfqItem
from app.services import chat_bot

router = APIRouter(prefix="/chat", tags=["chat"])


class ChatMessage(BaseModel):
    role: str = Field(max_length=20)
    text: str = Field(max_length=8000)


class ChatIn(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    history: list[ChatMessage] = Field(default_factory=list)

    @field_validator("history", mode="before")
    @classmethod
    def _recent_only(cls, v: object) -> object:
        # the widget sends the whole conversation; only the tail matters, and
        # keeping it bounded stops oversized payloads without breaking long chats
        return v[-20:] if isinstance(v, list) else v


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
    name: str | None = Field(default=None, max_length=200)
    phone: str | None = Field(default=None, max_length=40)
    part_number: str | None = Field(default=None, max_length=120)


@router.post("", response_model=ChatOut)
@limiter.limit("30/minute")
async def chat(request: Request, payload: ChatIn, db: AsyncSession = Depends(get_db)) -> ChatOut:
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
@limiter.limit("5/minute;30/hour")
async def handoff(
    request: Request,
    payload: HandoffIn,
    background: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
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
