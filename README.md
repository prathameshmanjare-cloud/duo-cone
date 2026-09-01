# DuoCon — E-Commerce Platform

Full architecture: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Stack
- `frontend/` — React + Vite + TS, React Router, TanStack Query, Zustand, React Hook Form + Zod.
- `backend/` — FastAPI (async SQLAlchemy 2.0 + asyncpg), Postgres.
- `scripts/`, `backend/scripts/woo_migrate.py` — WooCommerce migration.

## Run locally

```bash
# 1. Postgres
docker compose up -d db

# 2. Backend
cd backend
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
cp .env.example .env   # edit DATABASE_URL if needed
.venv/bin/python -m scripts.seed          # creates tables + sample products
.venv/bin/uvicorn app.main:app --reload   # http://localhost:8000/docs

# 3. Frontend
cd frontend
npm install
cp .env.example .env
npm run dev   # http://localhost:5173
```

## Status

Phase 1–6 of the [roadmap](docs/ARCHITECTURE.md#20-implementation-roadmap) scaffolded:
catalog models/API/repositories, cart (client-side, Zustand+persist), RFQ API + form,
all 27 routes wired with loading/empty/error states, design tokens, responsive layout,
accessibility basics (skip link, semantic landmarks, focus states).

**Not yet wired (stubbed/TODO in code):**
- Auth (JWT issuing, hashing) — forms exist, no backend endpoints yet.
- Checkout → real `/api/v1/checkout` order creation (currently client-only mock).
- Email (SendGrid/Mailgun), WhatsApp webhook, chatbot — architecture defined, providers not implemented.
- Alembic migrations (schema currently created via `Base.metadata.create_all` in `seed.py` for dev).
- WooCommerce migration script is implemented but untested against a live Woo API (needs `WOO_*` env vars).
- Product images repo (`product-images`) not yet created — `IMAGE_BASE_URL` points at a placeholder.

Next: run `docker compose up -d db` + backend seed to see the catalog live, then tackle
auth + checkout completion per the roadmap.
# duo-cone
