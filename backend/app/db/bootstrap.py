"""Idempotent admin-user provisioning, shared by startup hook and CLI script."""

from __future__ import annotations

import logging

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.security import hash_password, needs_rehash, verify_password
from app.models.commerce import AppSetting, EmailTemplate, User

logger = logging.getLogger("duocon.bootstrap")

# Fixed set of templates the code triggers by key. Seeded once; an admin may
# edit subject/html_body afterwards but the set of keys itself is fixed.
_DEFAULT_EMAIL_TEMPLATES: list[dict] = [
    {
        "key": "order_confirmation",
        "subject": "Order {{order_id}} confirmed",
        "html_body": (
            "<p>Hi {{customer_name}},</p>"
            "<p>Order <strong>{{order_id}}</strong> is confirmed and now pending. "
            "We invoice verified B2B accounts (net 30); otherwise payment is "
            "arranged before dispatch.</p>"
            "<div>{{items}}</div>"
            "<p>Total: <strong>{{total}}</strong> (excl. VAT)</p>"
        ),
    },
    {
        "key": "inquiry_received",
        "subject": "We received your message",
        "html_body": (
            "<p>Hi {{customer_name}},</p>"
            "<p>Thanks for reaching out — our team replies within one business day.</p>"
            "<p><em>{{message}}</em></p>"
            "<p>We'll follow up at {{email}}.</p>"
        ),
    },
    {
        "key": "rfq_received",
        "subject": "We received your RFQ ({{order_id}})",
        "html_body": (
            "<p>Hi {{customer_name}},</p>"
            "<p>Your reference is <strong>{{order_id}}</strong>. "
            "Our engineering team replies within one business day.</p>"
            "<div>{{items}}</div>"
        ),
    },
]


async def ensure_email_templates(db: AsyncSession) -> None:
    """Idempotently seed the fixed set of default templates if missing.

    Never overwrites an existing row — an admin's edits are never clobbered
    by a redeploy.
    """
    for tpl in _DEFAULT_EMAIL_TEMPLATES:
        existing = (
            await db.execute(select(EmailTemplate).where(EmailTemplate.key == tpl["key"]))
        ).scalar_one_or_none()
        if existing is None:
            db.add(EmailTemplate(**tpl))
    await db.commit()


async def get_app_setting(db: AsyncSession, key: str) -> str | None:
    row = (await db.execute(select(AppSetting).where(AppSetting.key == key))).scalar_one_or_none()
    return row.value if row else None


async def set_app_setting(db: AsyncSession, key: str, value: str | None) -> None:
    row = (await db.execute(select(AppSetting).where(AppSetting.key == key))).scalar_one_or_none()
    if row is None:
        db.add(AppSetting(key=key, value=value))
    else:
        row.value = value
    await db.commit()

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
