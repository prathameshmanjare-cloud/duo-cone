"""Regression tests for the security hardening (pricing, auth, limits, headers)."""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

import jwt
import pytest

from app.api.v1.orders import session_matches_order
from app.auth.security import hash_password
from app.background import tasks
from app.config.settings import Settings, get_settings
from app.db.session import SessionLocal
from app.models.catalog import Product
from app.models.commerce import Order, User

ADDRESS = {
    "name": "Buyer",
    "line1": "Street 1",
    "city": "Berlin",
    "postal_code": "10115",
    "country_code": "DE",
}


async def _product(**kw) -> Product:
    tag = uuid.uuid4().hex[:8]
    fields = {"slug": f"p-{tag}", "sku": f"SKU-{tag}", "name": f"Seal {tag}", "price_cents": 10_000}
    fields.update(kw)
    async with SessionLocal() as db:
        p = Product(**fields)
        db.add(p)
        await db.commit()
        await db.refresh(p)
        return p


def _order_body(product_id, qty=2, price=1):
    return {
        "email": "buyer@example.com",
        "currency": "EUR",
        "shipping_address": ADDRESS,
        "payment_method": "invoice",
        "terms_accepted": True,
        "items": [
            {"product_id": str(product_id), "sku": "FAKE", "name": "FAKE", "qty": qty,
             "unit_price_cents": price}
        ],
    }


# ------------------------------------------------------------- pricing ----
async def test_order_ignores_client_price(client):
    p = await _product(price_cents=10_000, sale_price_cents=9_000)
    r = await client.post("/api/v1/orders", json=_order_body(p.id, qty=2, price=1))
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["subtotal_cents"] == 18_000  # sale price x2, not the client's 1 cent
    assert body["items"][0]["unit_price_cents"] == 9_000
    assert body["items"][0]["sku"] == p.sku and body["items"][0]["name"] == p.name


async def test_order_rejects_unavailable_products(client):
    rfq_only = await _product(is_rfq_only=True)
    inactive = await _product(is_active=False)
    for pid in (rfq_only.id, inactive.id, uuid.uuid4()):
        r = await client.post("/api/v1/orders", json=_order_body(pid))
        assert r.status_code == 422, r.text
    body = _order_body(rfq_only.id)
    del body["items"][0]["product_id"]
    assert (await client.post("/api/v1/orders", json=body)).status_code == 422


async def test_shipping_estimate_uses_catalog_price(client):
    p = await _product(price_cents=10_000)
    r = await client.post(
        "/api/v1/orders/shipping-estimate",
        json={"country_code": "DE", "items": [{"product_id": str(p.id), "qty": 1, "unit_price_cents": 0}]},
    )
    assert r.status_code == 200 and r.json()["tax_cents"] > 1_900


async def test_shipping_zones(client):
    p = await _product(price_cents=10_000)
    items = [{"product_id": str(p.id), "qty": 1}]

    async def estimate(cc):
        return await client.post(
            "/api/v1/orders/shipping-estimate", json={"country_code": cc, "items": items}
        )

    de = (await estimate("DE")).json()
    assert de["shipping_cents"] == 1_200 and de["tax_cents"] == round((10_000 + 1_200) * 0.19)
    fr = (await estimate("FR")).json()
    assert fr["shipping_cents"] == 2_500 and fr["tax_cents"] == 0
    assert (await estimate("US")).status_code == 422


async def test_order_outside_europe_requires_enquiry(client):
    p = await _product()
    body = _order_body(p.id)
    body["shipping_address"] = {**ADDRESS, "country_code": "US"}
    r = await client.post("/api/v1/orders", json=body)
    assert r.status_code == 422 and "enquiry" in r.text


def test_stripe_amount_must_match_order():
    order = Order(total_cents=12_345, currency="EUR")
    assert session_matches_order({"amount_total": 12_345, "currency": "eur"}, order)
    assert not session_matches_order({"amount_total": 1, "currency": "eur"}, order)
    assert not session_matches_order({"amount_total": 12_345, "currency": "usd"}, order)


# ---------------------------------------------------------------- auth ----
async def _register(client, email=None, password="correct-horse-1"):
    email = email or f"u{uuid.uuid4().hex[:8]}@example.com"
    r = await client.post("/api/v1/auth/register", json={"email": email, "password": password})
    assert r.status_code == 201, r.text
    return email, r.json()


async def test_password_change_revokes_existing_tokens(client):
    email, tokens = await _register(client)
    auth = {"Authorization": f"Bearer {tokens['access_token']}"}
    assert (await client.get("/api/v1/auth/me", headers=auth)).status_code == 200

    async with SessionLocal() as db:
        from sqlalchemy import select

        u = (await db.execute(select(User).where(User.email == email))).scalar_one()
        u.password_hash = hash_password("a-new-password-2")
        await db.commit()

    assert (await client.get("/api/v1/auth/me", headers=auth)).status_code == 401
    r = await client.post("/api/v1/auth/refresh", json={"refresh_token": tokens["refresh_token"]})
    assert r.status_code == 401


async def test_token_without_password_binding_rejected(client):
    email, tokens = await _register(client)
    sub = jwt.decode(tokens["access_token"], options={"verify_signature": False})["sub"]
    now = datetime.now(timezone.utc)
    legacy = jwt.encode(
        {"sub": sub, "type": "access", "iat": now, "exp": now + timedelta(minutes=5)},
        get_settings().jwt_secret,
        algorithm="HS256",
    )
    r = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {legacy}"})
    assert r.status_code == 401


async def test_register_cannot_grant_admin(client):
    email = f"u{uuid.uuid4().hex[:8]}@example.com"
    r = await client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "correct-horse-1", "is_admin": True, "is_verified": True},
    )
    me = await client.get(
        "/api/v1/auth/me", headers={"Authorization": f"Bearer {r.json()['access_token']}"}
    )
    assert me.json()["is_admin"] is False


async def test_admin_routes_require_admin(client):
    _, tokens = await _register(client)
    auth = {"Authorization": f"Bearer {tokens['access_token']}"}
    assert (await client.get("/api/v1/admin/stats")).status_code == 401
    assert (await client.get("/api/v1/admin/stats", headers=auth)).status_code == 403
    assert (await client.get("/api/v1/admin/users", headers=auth)).status_code == 403


async def test_login_locks_account_after_repeated_failures(client):
    email, _ = await _register(client)
    for _ in range(10):
        r = await client.post("/api/v1/auth/login", json={"email": email, "password": "wrong-pass"})
        assert r.status_code == 401
    # even the right password is refused while locked
    r = await client.post("/api/v1/auth/login", json={"email": email, "password": "correct-horse-1"})
    assert r.status_code == 429


async def test_login_rejects_huge_password(client):
    r = await client.post(
        "/api/v1/auth/login", json={"email": "a@example.com", "password": "x" * 10_000}
    )
    assert r.status_code == 422


async def test_public_form_rate_limited(client):
    body = {"name": "n", "email": "a@example.com", "message": "hi"}
    codes = [(await client.post("/api/v1/contact", json=body)).status_code for _ in range(6)]
    assert codes[:5] == [201] * 5 and codes[5] == 429


# --------------------------------------------------- output / headers ----
async def test_product_description_is_sanitized(client):
    p = await _product(description_html='<p>ok</p><script>alert(1)</script><img src=x onerror=alert(1)>')
    html = (await client.get(f"/api/v1/products/{p.slug}")).json()["description_html"]
    assert "<script" not in html and "onerror" not in html and "<p>ok</p>" in html


async def test_security_headers_and_cors(client):
    r = await client.get("/healthz")
    assert r.headers["x-content-type-options"] == "nosniff"
    assert r.headers["x-frame-options"] == "DENY"
    assert "default-src 'none'" in r.headers["content-security-policy"]
    assert "ends" not in r.json()["stripe_secret_key"]

    ok = await client.options(
        "/api/v1/products",
        headers={"Origin": "https://duo-cone.com", "Access-Control-Request-Method": "GET"},
    )
    assert ok.headers.get("access-control-allow-origin") == "https://duo-cone.com"
    evil = await client.options(
        "/api/v1/products",
        headers={"Origin": "https://evil.example", "Access-Control-Request-Method": "GET"},
    )
    assert "access-control-allow-origin" not in evil.headers


# ---------------------------------------------------------------- misc ----
async def test_email_escapes_visitor_input(monkeypatch):
    sent = []
    monkeypatch.setattr(tasks, "send_email", lambda **kw: sent.append(kw))
    await tasks.notify_contact(
        name='<a href="https://phish.example">Click</a>',
        email="victim@example.com",
        message="<script>x</script>",
    )
    assert sent
    for mail in sent:
        assert "<a href=\"https://phish.example\"" not in mail["html"]
        assert "<script>" not in mail["html"]


def test_production_refuses_weak_config():
    with pytest.raises(RuntimeError):
        Settings(environment="production", jwt_secret="change-me-in-env").assert_safe_for_production()
    with pytest.raises(RuntimeError):
        Settings(environment="production", jwt_secret="y" * 44, debug=True).assert_safe_for_production()
    Settings(environment="production", jwt_secret="y" * 44, debug=False).assert_safe_for_production()
