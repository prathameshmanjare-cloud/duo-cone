import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1 import (
    admin,
    auth,
    catalog,
    categories,
    chat,
    contact,
    orders,
    products,
    rfq,
    stripe_webhook,
)
from app.config.settings import get_settings
from app.db.seed_data import ensure_seed_data
from app.db.bootstrap import ensure_admin_user, ensure_schema_upgrades
from app.db.session import Base, SessionLocal, engine

# import models so metadata is populated before create_all
from app.models import catalog as _catalog_models  # noqa: F401
from app.models import commerce as _commerce_models  # noqa: F401

logging.basicConfig(level=logging.INFO)
settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    log = logging.getLogger("duocon")
    if settings.auto_create_tables:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        log.info("Ensured database tables exist")
        try:
            async with SessionLocal() as db:
                await ensure_schema_upgrades(db)
        except Exception:  # noqa: BLE001
            log.exception("Schema upgrade failed")
    if settings.auto_seed:
        try:
            async with SessionLocal() as db:
                await ensure_seed_data(db)
        except Exception:  # noqa: BLE001 — never block startup on seeding
            log.exception("Auto-seed failed")
    if settings.bootstrap_admin_email and settings.bootstrap_admin_password:
        try:
            async with SessionLocal() as db:
                await ensure_admin_user(
                    db, settings.bootstrap_admin_email, settings.bootstrap_admin_password
                )
        except Exception:  # noqa: BLE001 — never block startup
            log.exception("Admin bootstrap failed")
    yield


app = FastAPI(title=settings.app_name, debug=settings.debug, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request, exc):  # noqa: ANN001
    logging.getLogger("duocon.error").exception("Unhandled error on %s", request.url)
    return JSONResponse(status_code=500, content={"type": "internal_error", "title": "Internal server error"})


def _fingerprint(secret: str) -> dict:
    """Masked shape of a configured secret — safe to expose publicly, but
    enough to catch a truncated/mangled env var (e.g. Stripe key pasted as
    just "sk_test_") without ever revealing the value itself."""
    if not secret:
        return {"configured": False}
    head = secret[:8]
    tail = secret[-4:] if len(secret) > 12 else ""
    return {"configured": True, "length": len(secret), "starts": head, "ends": tail}


@app.get("/healthz")
async def healthz():
    return {
        "status": "ok",
        # masked fingerprints only — never the secret values — so a
        # mis-set env var (wrong length / truncated / wrong prefix) is
        # visible from the outside without pulling deploy logs
        "stripe_secret_key": _fingerprint(settings.stripe_secret_key),
        "stripe_webhook_secret": _fingerprint(settings.stripe_webhook_secret),
    }


app.include_router(products.router, prefix="/api/v1")
app.include_router(categories.router, prefix="/api/v1")
app.include_router(catalog.router, prefix="/api/v1")
app.include_router(rfq.router, prefix="/api/v1")
app.include_router(contact.router, prefix="/api/v1")
app.include_router(orders.router, prefix="/api/v1")
app.include_router(stripe_webhook.router, prefix="/api/v1")
app.include_router(chat.router, prefix="/api/v1")
app.include_router(auth.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")
