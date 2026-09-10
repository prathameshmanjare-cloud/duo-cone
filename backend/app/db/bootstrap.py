"""Idempotent admin-user provisioning, shared by startup hook and CLI script."""

from __future__ import annotations

import logging

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.security import hash_password, needs_rehash, verify_password
from app.models.commerce import User

logger = logging.getLogger("duocon.bootstrap")

# Lightweight forward-only column adds for tables that already exist in prod
# (SQLAlchemy's create_all only creates missing tables, never ALTERs).
# Postgres supports ADD COLUMN IF NOT EXISTS, so this is safe to run every boot.
_COLUMN_UPGRADES: list[str] = [
    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) DEFAULT 'invoice'",
    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_session_id VARCHAR(120)",
    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_payment_intent VARCHAR(120)",
    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ",
    "CREATE INDEX IF NOT EXISTS ix_orders_stripe_session_id ON orders (stripe_session_id)",
]


async def ensure_schema_upgrades(db: AsyncSession) -> None:
    for stmt in _COLUMN_UPGRADES:
        try:
            await db.execute(text(stmt))
        except Exception:  # noqa: BLE001 — table may not exist yet on a fresh db
            logger.debug("schema upgrade skipped: %s", stmt)
    await db.commit()


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
