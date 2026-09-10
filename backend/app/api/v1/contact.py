import uuid

from fastapi import APIRouter, BackgroundTasks, Depends
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.background.tasks import notify_contact
from app.db.session import get_db
from app.models.commerce import ContactMessage

router = APIRouter(prefix="/contact", tags=["contact"])


class ContactIn(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    email: EmailStr
    message: str = Field(min_length=1, max_length=5000)
    phone: str | None = Field(default=None, max_length=40)
    company: str | None = Field(default=None, max_length=200)
    product: str | None = Field(default=None, max_length=200)


@router.post("", status_code=201)
async def create_contact(
    payload: ContactIn, background: BackgroundTasks, db: AsyncSession = Depends(get_db)
):
    number = f"MSG-{uuid.uuid4().hex[:8].upper()}"
    row = ContactMessage(
        number=number,
        name=payload.name,
        email=payload.email,
        phone=payload.phone,
        company=payload.company,
        product=payload.product,
        message=payload.message,
    )
    db.add(row)
    await db.commit()
    background.add_task(
        notify_contact,
        name=payload.name,
        email=payload.email,
        message=payload.message,
        company=payload.company,
        phone=payload.phone,
        product=payload.product,
    )
    return {"id": str(row.id), "number": number}
