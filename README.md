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

## Admin CMS

- Backend: `app/api/v1/auth.py` (JWT login/refresh/me, argon2) + `app/api/v1/admin.py`
  (`/api/v1/admin/*`, gated by `require_admin`): dashboard stats, product CRUD +
  inline price/sale/stock/active/quote-only, `PUT .../inventory`, brand CRUD,
  category CRUD, orders list + status, RFQs list + status.
  Also: users admin (`/admin/users` — verify, grant/revoke admin, reset password,
  delete), per-product cross-references and images editors, and CSV + PDF export
  on every list (`GET /api/v1/admin/export/{products,orders,rfqs,users,brands,categories}?fmt=csv|pdf`,
  honours the same filters).
- Frontend: `/admin` (login-gated section in the same app) —
  `src/routes/Admin/*`, `src/lib/adminApi.ts`, `src/store/auth.ts`.
- Create the first admin:
  `cd backend && .venv/bin/python -m scripts.create_admin --email you@duo-cone.com --password '...'`
  (or set `BOOTSTRAP_ADMIN_EMAIL` / `BOOTSTRAP_ADMIN_PASSWORD` for shell-less hosts).

**Not yet wired (stubbed/TODO in code):**
- Customer-facing auth (register/login forms exist; endpoints now live, UI not wired).
- Checkout → real `/api/v1/checkout` order creation (currently client-only mock).
- Email (SendGrid/Mailgun), WhatsApp webhook, chatbot — architecture defined, providers not implemented.
- Alembic migrations (schema currently created via `Base.metadata.create_all` in `seed.py` for dev).
- WooCommerce migration script is implemented but untested against a live Woo API (needs `WOO_*` env vars).
- Product images repo (`product-images`) not yet created — `IMAGE_BASE_URL` points at a placeholder.

Next: run `docker compose up -d db` + backend seed to see the catalog live, then tackle
auth + checkout completion per the roadmap.
# duo-cone
