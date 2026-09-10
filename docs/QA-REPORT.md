# DuoCone — End-to-End QA Report

**Date:** 2026-09-11
**Scope:** Full backend API + frontend flow audit — auth, user creation, RFQ,
checkout, payment, email, admin, catalog.
**Environment:** local — Postgres 16 (docker), FastAPI on `:8000` (seeded,
1922 products / 24 brands / 3 categories), Vite frontend on `:5173`.

---

## TL;DR

| Area | Status |
|------|--------|
| User registration / login / JWT / refresh | ✅ Works |
| Catalog: products, detail, brands, categories, search, cross-ref | ✅ Works |
| RFQ submit (DB row created) | ⚠️ Works, but no email + weak validation |
| Live-chat bot + handoff | ✅ Works (rule-based, no LLM key needed) |
| Admin API (stats, CRUD, exports, auth gating) | ✅ Works |
| **Order confirmation / any email** | ❌ **Not sent — all stubbed to log lines** |
| **Payment** | ❌ **Not implemented anywhere** |
| **Checkout / order creation** | ❌ **Frontend fakes it; no API, no DB row** |
| **Contact form** | ❌ **`POST /contact` returns 404** |
| **Account → Orders / RFQs / Addresses / Wishlist** | ❌ Hard-coded "None yet" placeholders |
| Pagination input validation | 🐞 `page=0` / negative → **HTTP 500** |

---

## 1. What works (verified live)

### Auth & user creation — solid
- `POST /auth/register` → 201, creates `users` row, argon2id hash, returns
  access + refresh tokens. Verified row in DB.
- Duplicate email → `409 Email already registered`.
- `password` < 8 chars → `422`. Invalid email → `422`.
- `POST /auth/login` → correct; wrong password → `401`.
- `GET /auth/me` with bearer → returns profile; no/invalid token → `401`.
- `POST /auth/refresh` with refresh token → new pair; passing an **access**
  token → `401` (token `type` claim is enforced). Good.
- New users get `is_verified = false` and there is **no way to become
  verified** — no verification email is sent (see §3) and no verify endpoint
  exists.

### Catalog
- `GET /products` (filters, sort, pagination) — OK for valid input.
- `GET /products/{slug}` — OK; unknown slug → `404`.
- `GET /products/{slug}/related`, `/brands`, `/categories`,
  `/categories/{slug}` — OK.
- `GET /search?q=`, `GET /cross-reference?ref=` — OK; missing param → `422`;
  `< 2` chars → `[]`; SQL-injection string is safely parameterised (`200`, no
  error).
- `GET /media/{id}` — serves bytes with long cache header.

### RFQ / chat
- `POST /rfq` → `200 {id, number}`, writes `rfqs` + `rfq_items`.
- `POST /chat` → rule-based answer + quick replies (no `LLM_API_KEY` needed).
- `POST /chat/handoff` → creates a `CHAT-…` RFQ row.

### Admin (`/api/v1/admin/*`)
- `/stats`, `/products` (+ CRUD, images, inventory, cross-refs), `/orders`,
  `/rfqs`, `/users` (+ CRUD, password reset), `/brands`, `/categories`,
  `/export/*` (CSV) — all `200` with an admin token.
- Auth gating correct: no token → `401`; **non-admin** token → `403`.
- Admin bootstrap works via `python -m scripts.create_admin` or
  `BOOTSTRAP_ADMIN_EMAIL` / `_PASSWORD` env on startup.

### CORS
- Pre-flight from `http://localhost:5173` → allowed origin echoed.
- Request from a foreign `Origin` → **no** `access-control-allow-origin`
  header (browser would block). Correct.

---

## 2. Bugs

### B1 — Pagination input crashes the API (HTTP 500) — *Medium*
`GET /api/v1/products?page=0` , `?page=-5` , `?page_size=-1`
→ `500 Internal Server Error` (asyncpg raises on negative `OFFSET`/`LIMIT`;
in prod the global handler masks it as a generic 500).
Cause: `list_products(... page: int = 1, page_size: int = 24)` in
`backend/app/api/v1/products.py:29-30` has **no bounds**.
Fix: `page: int = Query(1, ge=1)`, `page_size: int = Query(24, ge=1, le=100)`.

### B2 — `page_size` has no upper limit — *Medium*
`GET /products?page_size=100000` → `200` and returns **all 1922 rows** in one
response. Unbounded query = slow response + memory pressure; trivially abusable.
Fix: same as B1 (`le=100`), matching the admin routes which already cap at 50.

### B3 — RFQ accepts invalid / junk email — *Low→Medium*
`POST /rfq {"email":"notemail", "items":[...]}` → `200`.
`RfqIn.email` is `str`, not `EmailStr`. Same for `chat/handoff`.
Sales team gets un-contactable leads. The browser form has
`type="email" required`, so this only bites API clients / scripts / bots.
Fix: use `pydantic.EmailStr`.

### B4 — RFQ accepts empty `items` — *Low*
`POST /rfq {"email": "...", "items": []}` → `200`, creates an RFQ with zero
lines. Add `min_length=1` to `items`.

### B5 — Negative `price_min` / dimension filters not rejected — *Low*
`?price_min=-100` → `200` (no crash, just meaningless). Cosmetic; add `ge=0`.

---

## 3. Not implemented (design gaps, not regressions)

### G1 — No email is ever sent
`app/integrations/email/__init__.py` is **empty**.
`app/background/tasks.py` — `notify_rfq`, `notify_order`,
`send_verification_email` are all `logger.info(...)` with `TODO` comments.
Confirmed in the running log:
`INFO:duocon.background:RFQ RFQ-… received from … -> notify sales …` — a log
line, no SMTP/SendGrid call. `SENDGRID_API_KEY` is blank.
**Impact:** no RFQ confirmation to customer, no sales notification, no order
confirmation, no email verification, no password-reset mail.

### G2 — No payment integration
No Stripe / PayPal / Adyen — no dependency, no route, no config key, no code.
`Order.status` enum has `paid` but nothing ever sets it outside the admin
status dropdown.

### G3 — Checkout is a front-end mock
`frontend/src/routes/Checkout/Checkout.tsx` → `onSubmit()`:
```
// TODO: POST /api/v1/checkout once backend order endpoint is wired.
const orderId = crypto.randomUUID();
clear();
navigate(`/order-success/${orderId}`);
```
No API call, no `orders` row, no payment, no email. `/order-success/:id` shows
a static success page for any random UUID. `admin/stats` `orders_total` stays
`0` no matter how many "orders" a user places.
Backend has **no** `/checkout`, `/orders`, or `/cart` route (`404`).

### G4 — Contact form is broken
`frontend` `api.submitContact()` → `POST /api/v1/contact` → **404** (route
does not exist). The form catches the error and tells the user to email
`sales@duo-cone.com` directly, so it fails "gracefully" — but no contact
message is ever delivered or stored.

### G5 — Account area is placeholder
`routes/Account/Account.tsx` — `AccountOrders`, `AccountRfqs`,
`AccountAddresses`, `AccountWishlist` return literal
`<p>No orders yet.</p>` etc. No API calls. Also `POST /rfq` never attaches
`user_id` even when the caller is authenticated, so a "my RFQs" view could
not be built without a backend change too.

### G6 — Cart is client-only
`store/cart.ts` is `zustand` + `localStorage`. `carts` / `cart_items` tables
exist but have no API. Cart is lost across devices; fine for a mock, not for
production B2B.

---

## 4. Recommended priority

1. **Decide the commerce model.** If the site is quote-first (RFQ), *remove*
   Cart/Checkout/Order-success from the UI so users aren't misled into
   thinking they placed a real order. If real orders are wanted, build
   `POST /api/v1/orders` + a payment provider + confirmation email.
2. **Wire email** (`notify_rfq` at minimum) — a real SendGrid/Mailgun call in
   `app/background/tasks.py`. Without it every RFQ silently disappears into a
   log file in production.
3. **Add `POST /api/v1/contact`** (or point the form at `POST /rfq`).
4. **B1/B2** — add `Query(ge=…, le=…)` bounds to `list_products`. One-line
   fix, stops a 500 and an unbounded query.
5. **B3/B4** — `EmailStr` + `min_length=1` on `RfqIn`.
6. Fill in the Account pages (needs `GET /auth/me/rfqs`, `/orders`,
   `/addresses`) or hide the tabs.

---

## 5. Repro commands

```bash
# stack
docker compose up -d db
cd backend && .venv/bin/python -m uvicorn app.main:app --port 8000

# B1 — 500
curl -s -o /dev/null -w '%{http_code}\n' 'http://localhost:8000/api/v1/products?page=0'

# B2 — dumps all rows
curl -s 'http://localhost:8000/api/v1/products?page_size=100000' | python3 -c 'import sys,json;print(len(json.load(sys.stdin)["items"]))'

# B3 — junk email accepted
curl -s -X POST localhost:8000/api/v1/rfq -H 'content-type: application/json' \
  -d '{"email":"notemail","items":[{"sku":"x","qty":1}]}'

# G4 — contact 404
curl -s -o /dev/null -w '%{http_code}\n' -X POST localhost:8000/api/v1/contact -d '{}'

# G1 — no email, just a log line (watch uvicorn output)
curl -s -X POST localhost:8000/api/v1/rfq -H 'content-type: application/json' \
  -d '{"email":"a@b.com","items":[{"sku":"x","qty":1}]}'
```
