"""Test harness: runs the real app against a throwaway Postgres.

    docker run -d --rm --name duocone-test -e POSTGRES_PASSWORD=pw -e POSTGRES_DB=t \\
        -p 127.0.0.1:55432:5432 postgres:16-alpine
    TEST_DATABASE_URL=postgresql+asyncpg://postgres:pw@127.0.0.1:55432/t pytest

The database is wiped on every run — never point this at real data.
"""

from __future__ import annotations

import os

import pytest

_TEST_DB = os.environ.get("TEST_DATABASE_URL")
if not _TEST_DB:
    pytest.skip("TEST_DATABASE_URL not set", allow_module_level=True)

# env beats backend/.env, so no real keys are used and nothing leaves the machine
os.environ.update(
    DATABASE_URL=_TEST_DB,
    ENVIRONMENT="test",
    DEBUG="false",
    JWT_SECRET="test-secret-" + "x" * 40,
    AUTO_CREATE_TABLES="false",
    AUTO_SEED="false",
    BOOTSTRAP_ADMIN_EMAIL="",
    BOOTSTRAP_ADMIN_PASSWORD="",
    STRIPE_SECRET_KEY="",
    STRIPE_WEBHOOK_SECRET="",
    SENDGRID_API_KEY="",
    MAILGUN_API_KEY="",
    SMTP_HOST="",
    CORS_ORIGINS='["https://duo-cone.com"]',
)

import httpx  # noqa: E402

from app.db.session import Base, engine  # noqa: E402
from app.main import app  # noqa: E402
from app.middleware import rate_limit  # noqa: E402


@pytest.fixture(scope="session", autouse=True)
async def _schema():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


@pytest.fixture(autouse=True)
def _fresh_limits():
    rate_limit.limiter.reset()
    rate_limit._account_storage.reset()


@pytest.fixture
async def client():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as c:
        yield c
