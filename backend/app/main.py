import logging
import re
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

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
from app.db.bootstrap import ensure_admin_user, ensure_email_templates, ensure_schema_upgrades
from app.db.session import Base, SessionLocal, engine
from app.middleware.rate_limit import limiter

# import models so metadata is populated before create_all
from app.models import catalog as _catalog_models  # noqa: F401
from app.models import commerce as _commerce_models  # noqa: F401

logging.basicConfig(level=logging.INFO)
settings = get_settings()
settings.assert_safe_for_production()


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
        try:
            async with SessionLocal() as db:
                await ensure_email_templates(db)
        except Exception:  # noqa: BLE001 — never block startup on seeding
            log.exception("Email template seeding failed")
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


# interactive API docs are a map of every endpoint — dev only
_docs_enabled = not settings.is_production
app = FastAPI(
    title=settings.app_name,
    debug=settings.debug,
    lifespan=lifespan,
    docs_url="/docs" if _docs_enabled else None,
    redoc_url="/redoc" if _docs_enabled else None,
    openapi_url="/openapi.json" if _docs_enabled else None,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# auth is a bearer token in the Authorization header, never a cookie, so
# credentialed CORS isn't needed
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

_SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    # the API only ever returns JSON, files and images — nothing to execute
    "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
}
if settings.is_production:
    _SECURITY_HEADERS["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains"


@app.middleware("http")
async def security_headers(request: Request, call_next):  # noqa: ANN001
    response = await call_next(request)
    if _docs_enabled and request.url.path in ("/docs", "/redoc"):
        return response  # Swagger UI needs to load its own scripts
    for name, value in _SECURITY_HEADERS.items():
        response.headers.setdefault(name, value)
    return response


@app.exception_handler(Exception)
async def unhandled_exception_handler(request, exc):  # noqa: ANN001
    logging.getLogger("duocon.error").exception("Unhandled error on %s", request.url)
    return JSONResponse(status_code=500, content={"type": "internal_error", "title": "Internal server error"})


_KEY_PREFIX = re.compile(r"^[a-z]+_(?:live_|test_)?")


def _fingerprint(secret: str) -> dict:
    """Shape of a configured secret — enough to catch a truncated/mangled env
    var (e.g. a Stripe key pasted as just "sk_test_") via its length and type
    prefix, without exposing a single character of the key material."""
    if not secret:
        return {"configured": False}
    m = _KEY_PREFIX.match(secret)
    return {"configured": True, "length": len(secret), "prefix": m.group(0) if m else ""}


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
