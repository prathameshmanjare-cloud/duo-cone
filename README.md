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

## Security tests

```bash
docker run -d --rm --name duocone-test -e POSTGRES_PASSWORD=pw -e POSTGRES_DB=t -p 127.0.0.1:55432:5432 postgres:16-alpine
cd backend && .venv/bin/pip install -r requirements-dev.txt
TEST_DATABASE_URL=postgresql+asyncpg://postgres:pw@127.0.0.1:55432/t .venv/bin/pytest
```

With `ENVIRONMENT=production` the API refuses to start unless `JWT_SECRET` is
random and ≥32 chars and `DEBUG=false`; `/docs` and `/openapi.json` are off.

## Status

Live in production:

- Storefront (Vercel): https://duo-cone.com, https://duo-cone.vercel.app
- API (Render, auto-deploys from `main`): https://duo-cone.onrender.com — health check at `/healthz`
- Postgres (Render)

Built and working: catalog (1,000+ products), search and cross-reference lookup,
cart, checkout creating real orders (invoice or Stripe card/PayPal/SEPA),
server-side pricing, customer register/login/password reset/account page, RFQ
and contact forms, rule-based support chatbot with hand-off (Tidio live chat
when `VITE_TIDIO_PUBLIC_KEY` is set), transactional email (SendGrid, Mailgun
or SMTP), invoice PDFs on paid orders, admin CMS (below).

## Admin CMS

- Backend: `app/api/v1/auth.py` (JWT login/refresh/me, argon2) + `app/api/v1/admin.py`
  (`/api/v1/admin/*`, gated by `require_admin`): dashboard stats, product CRUD +
  inline price/sale/stock/active/quote-only, `PUT .../inventory`, brand CRUD,
  category CRUD, orders list + status, RFQs list + status.
  Also: users admin (`/admin/users` — verify, grant/revoke admin, reset password,
  delete), per-product cross-references and images editors, and CSV + PDF export
  on every list (`GET /api/v1/admin/export/{products,orders,rfqs,users,brands,categories}?fmt=csv|pdf`,
  honours the same filters), email settings (test send, alert address) and
  editable customer email templates.
- Frontend: `/admin` (login-gated section in the same app) —
  `src/routes/Admin/*`, `src/lib/adminApi.ts`, `src/store/auth.ts`.
- Create the first admin:
  `cd backend && .venv/bin/python -m scripts.create_admin --email you@duo-cone.com --password '...'`
  (or set `BOOTSTRAP_ADMIN_EMAIL` / `BOOTSTRAP_ADMIN_PASSWORD` for shell-less hosts).

**Known gaps:**
- Stripe is in test mode and no webhook secret is set; payments are confirmed
  when the customer returns to the success page (`/orders/{number}/sync-payment`).
- Contact-form messages are stored and emailed but have no admin page.
- WhatsApp integration is not implemented (`app/integrations/whatsapp` is empty).
- No migration tool: tables are created with `create_all` and new columns are
  added by `ensure_schema_upgrades` (`app/db/bootstrap.py`) on startup.
- WooCommerce migration script is untested against a live Woo API (needs `WOO_*` env vars).
- Render free plan: the API sleeps when idle, and a free Postgres expires with
  no backups — move both to paid plans before relying on the data.
