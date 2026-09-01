import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1 import catalog, categories, products, rfq
from app.config.settings import get_settings
from app.db.seed_data import ensure_seed_data
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
    if settings.auto_seed:
        try:
            async with SessionLocal() as db:
                await ensure_seed_data(db)
        except Exception:  # noqa: BLE001 — never block startup on seeding
            log.exception("Auto-seed failed")
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


@app.get("/healthz")
async def healthz():
    return {"status": "ok"}


app.include_router(products.router, prefix="/api/v1")
app.include_router(categories.router, prefix="/api/v1")
app.include_router(catalog.router, prefix="/api/v1")
app.include_router(rfq.router, prefix="/api/v1")
