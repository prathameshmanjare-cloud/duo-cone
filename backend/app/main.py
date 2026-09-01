import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1 import catalog, categories, products, rfq
from app.config.settings import get_settings

logging.basicConfig(level=logging.INFO)
settings = get_settings()

app = FastAPI(title=settings.app_name, debug=settings.debug)

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
