"""Idempotent admin-user provisioning, shared by startup hook and CLI script."""

from __future__ import annotations

import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.security import hash_password, needs_rehash, verify_password
from app.models.commerce import User

logger = logging.getLogger("duocon.bootstrap")


async def ensure_admin_user(db: AsyncSession, email: str, password: str) -> User:
    """Create the admin user if missing; otherwise ensure it is an admin and
    that the password matches the configured one (re-hash / reset as needed)."""
    email = email.lower().strip()
    user = (await db.execute(select(User).where(User.email == email))).scalar_one_or_none()

    if user is None:
        user = User(
            email=email,
            password_hash=hash_password(password),
            full_name="Administrator",
            is_admin=True,
            is_verified=True,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        logger.info("Created admin user %s", email)
        return user

    dirty = False
    if not user.is_admin:
        user.is_admin = True
        dirty = True
    if not verify_password(password, user.password_hash) or needs_rehash(user.password_hash):
        user.password_hash = hash_password(password)
        dirty = True
    if dirty:
        await db.commit()
        await db.refresh(user)
        logger.info("Updated admin user %s", email)
    return user
