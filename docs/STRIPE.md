# Stripe payments

Card payments use **Stripe Checkout (hosted)**. The storefront never sees card
data — the browser is redirected to `checkout.stripe.com` and back.

## Flow

1. `POST /api/v1/orders` with `payment_method: "card"` creates the `orders`
   row (`status = pending`, `payment_method = card`) and a Stripe Checkout
   Session, then returns `checkout_url`.
2. Frontend redirects the browser to `checkout_url`.
3. On success Stripe redirects to
   `FRONTEND_URL/order-success/<number>?paid=1`; on cancel to
   `FRONTEND_URL/checkout?cancelled=1`.
4. Stripe calls `POST /api/v1/stripe/webhook`. On
   `checkout.session.completed` / `checkout.session.async_payment_succeeded`
   the order flips to `status = paid`, `paid_at` is set,
   `stripe_payment_intent` is stored, and a confirmation email is sent.
   The handler is idempotent (safe to replay).

Invoice orders (`payment_method: "invoice"`, the fallback) skip Stripe
entirely and are confirmed immediately with `status = pending`.

## Config

| env var | notes |
|---|---|
| `STRIPE_SECRET_KEY` | `sk_test_…` / `sk_live_…`. **Blank → card payments disabled**, checkout offers invoice only, `POST /orders` with `card` returns `503`. |
| `STRIPE_WEBHOOK_SECRET` | `whsec_…` from the Stripe dashboard endpoint (or `stripe listen`). Blank → webhook returns `503`. |
| `STRIPE_PUBLISHABLE_KEY` | not needed for hosted Checkout; reserved for a future Elements form. |
| `FRONTEND_URL` | storefront origin for the success/cancel redirects. |

On Render these are `sync: false` in `render.yaml` — set them in the
dashboard.

## Local testing

```bash
# 1. real test keys in backend/.env
STRIPE_SECRET_KEY=sk_test_xxx
FRONTEND_URL=http://localhost:5173

# 2. forward webhooks (Stripe CLI)
stripe listen --forward-to localhost:8000/api/v1/stripe/webhook
#   -> prints whsec_… ; put it in STRIPE_WEBHOOK_SECRET and restart uvicorn

# 3. place a card order in the UI; card 4242 4242 4242 4242, any future date/CVC
```

### Without Stripe keys (what CI / this repo can verify)

* `POST /orders {payment_method:"card"}` → `503` (graceful fallback message)
* `POST /orders {payment_method:"invoice"}` → `201`, confirmation email queued
* `POST /stripe/webhook` with a valid HMAC signature over
  `checkout.session.completed` → order flips to `paid` (idempotent on replay);
  bad signature → `400`. (Tested with a self-signed event + a dummy
  `STRIPE_WEBHOOK_SECRET`.)
