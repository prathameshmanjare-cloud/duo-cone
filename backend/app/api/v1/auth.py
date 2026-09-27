import logging
import uuid

import jwt
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.deps import get_current_user
from app.auth.security import (
    burn_verify_time,
    create_access_token,
    create_password_reset_token,
    create_refresh_token,
    decode_token,
    hash_password,
    token_matches_password,
    verify_password,
)
from app.background.tasks import notify_password_reset
from app.config.settings import get_settings
from app.db.session import get_db
from app.middleware.rate_limit import (
    limiter,
    login_blocked,
    record_login_failure,
    reset_login_failures,
)
from app.models.commerce import User
from app.schemas.auth import (
    ForgotPasswordIn,
    LoginIn,
    ProfileUpdateIn,
    RefreshIn,
    RegisterIn,
    ResetPasswordIn,
    TokenOut,
    UserOut,
)

router = APIRouter(prefix="/auth", tags=["auth"])
logger = logging.getLogger("duocon.auth")
settings = get_settings()


def _tokens(user: User) -> TokenOut:
    return TokenOut(
        access_token=create_access_token(user.id, user.password_hash),
        refresh_token=create_refresh_token(user.id, user.password_hash),
    )


@router.post("/register", response_model=TokenOut, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/hour")
async def register(
    request: Request, payload: RegisterIn, db: AsyncSession = Depends(get_db)
) -> TokenOut:
    email = payload.email.lower()
    exists = (await db.execute(select(User).where(User.email == email))).scalar_one_or_none()
    if exists:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    user = User(
        email=email,
        password_hash=hash_password(payload.password),
        full_name=payload.full_name,
        company_name=payload.company_name,
        phone=payload.phone,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return _tokens(user)


@router.post("/login", response_model=TokenOut)
@limiter.limit("10/minute;50/hour")
async def login(request: Request, payload: LoginIn, db: AsyncSession = Depends(get_db)) -> TokenOut:
    email = payload.email.lower()
    if login_blocked(email):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many failed attempts. Try again in 15 minutes.",
        )
    user = (await db.execute(select(User).where(User.email == email))).scalar_one_or_none()
    if user is None:
        burn_verify_time(payload.password)
    if user is None or not verify_password(payload.password, user.password_hash):
        record_login_failure(email)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    reset_login_failures(email)
    return _tokens(user)


@router.post("/refresh", response_model=TokenOut)
@limiter.limit("30/minute")
async def refresh(
    request: Request, payload: RefreshIn, db: AsyncSession = Depends(get_db)
) -> TokenOut:
    try:
        data = decode_token(payload.refresh_token, expected_type="refresh")
        user_id = uuid.UUID(data["sub"])
    except (jwt.PyJWTError, KeyError, ValueError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
    user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if user is None or not token_matches_password(data, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
    return _tokens(user)


@router.get("/me", response_model=UserOut)
async def me(user: User = Depends(get_current_user)) -> UserOut:
    return UserOut.model_validate(user)


@router.patch("/me", response_model=UserOut)
async def update_me(
    payload: ProfileUpdateIn,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserOut:
    if "phone" in payload.model_fields_set:
        user.phone = (payload.phone or "").strip() or None
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return UserOut.model_validate(user)


@router.post("/forgot-password")
@limiter.limit("5/hour")
async def forgot_password(
    request: Request,
    payload: ForgotPasswordIn,
    background: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Always responds the same way whether or not the email is registered,
    so this endpoint can't be used to enumerate accounts."""
    user = (
        await db.execute(select(User).where(User.email == payload.email.lower()))
    ).scalar_one_or_none()
    if user is not None:
        token = create_password_reset_token(user.id, user.password_hash)
        reset_url = f"{settings.frontend_url.rstrip('/')}/reset-password?token={token}"
        background.add_task(notify_password_reset, email=user.email, reset_url=reset_url)
    return {"ok": True}


@router.post("/reset-password")
@limiter.limit("10/hour")
async def reset_password(
    request: Request, payload: ResetPasswordIn, db: AsyncSession = Depends(get_db)
) -> dict:
    try:
        data = decode_token(payload.token, expected_type="reset")
        user_id = uuid.UUID(data["sub"])
    except (jwt.PyJWTError, KeyError, ValueError):
        raise HTTPException(status_code=400, detail="This reset link is invalid or has expired")

    user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if user is None or not token_matches_password(data, user.password_hash):
        # password already changed since the link was issued (or user gone) — token is spent
        raise HTTPException(status_code=400, detail="This reset link is invalid or has expired")

    user.password_hash = hash_password(payload.password)
    await db.commit()
    reset_login_failures(user.email)
    logger.info("Password reset for user %s", user.email)
    return {"ok": True}
