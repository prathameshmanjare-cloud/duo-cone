"""Auth dependencies: resolve bearer token -> User, gate admin routes."""

from __future__ import annotations

import uuid

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.security import decode_token, token_matches_password
from app.db.session import get_db
from app.models.commerce import User

_bearer = HTTPBearer(auto_error=False)

_CREDENTIALS_EXC = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Invalid or expired credentials",
    headers={"WWW-Authenticate": "Bearer"},
)


async def _user_from_access_token(token: str, db: AsyncSession) -> User | None:
    """Valid, unexpired access token for an existing user whose password hasn't
    changed since the token was issued -> that user; anything else -> None."""
    try:
        payload = decode_token(token, expected_type="access")
        user_id = uuid.UUID(payload["sub"])
    except (jwt.PyJWTError, KeyError, ValueError):
        return None
    user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if user is None or not token_matches_password(payload, user.password_hash):
        return None
    return user


async def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: AsyncSession = Depends(get_db),
) -> User:
    if creds is None or not creds.credentials:
        raise _CREDENTIALS_EXC
    user = await _user_from_access_token(creds.credentials, db)
    if user is None:
        raise _CREDENTIALS_EXC
    return user


async def get_optional_user(
    creds: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: AsyncSession = Depends(get_db),
) -> User | None:
    """For endpoints open to guests: the caller if a valid token is sent, else None."""
    if creds is None or not creds.credentials:
        return None
    return await _user_from_access_token(creds.credentials, db)


async def require_admin(user: User = Depends(get_current_user)) -> User:
    if not user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return user
