"""Non-blocking side effects run via FastAPI BackgroundTasks.

Each function renders a small HTML email and hands it to
``app.integrations.email.send_email`` which picks a provider (SendGrid /
Mailgun / console-log fallback). Nothing here raises — a failed notification
must never roll back the request that queued it.
"""

from __future__ import annotations

import logging

from app.config.settings import get_settings
from app.integrations.email import send_email

logger = logging.getLogger("duocon.background")
settings = get_settings()

_BRAND = "DuoCone"


def _wrap(title: str, body_html: str) -> str:
    return (
        f'<div style="font-family:system-ui,Segoe UI,Roboto,Arial,sans-serif;'
        f'max-width:560px;margin:0 auto;color:#1a1a1a">'
        f'<h2 style="color:#07549a;margin:0 0 16px">{title}</h2>'
        f"{body_html}"
        f'<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">'
        f'<p style="font-size:12px;color:#6b7280">{_BRAND} — mechanical face seals. '
        f"This is an automated message.</p></div>"
    )


def _rows(pairs: list[tuple[str, str]]) -> str:
    return "".join(
        f'<tr><td style="padding:4px 12px 4px 0;color:#6b7280">{k}</td>'
        f'<td style="padding:4px 0"><strong>{v}</strong></td></tr>'
        for k, v in pairs
    )


def _money(cents: int, currency: str = "EUR") -> str:
    return f"{cents / 100:,.2f} {currency}"


# --------------------------------------------------------------------- RFQ ----
async def notify_rfq(
    rfq_number: str,
    email: str,
    *,
    company: str | None = None,
    item_count: int | None = None,
    message: str | None = None,
) -> None:
    try:
        detail = _rows(
            [p for p in [
                ("Reference", rfq_number),
                ("From", email),
                ("Company", company or "—"),
                ("Line items", str(item_count) if item_count is not None else "—"),
            ]]
        )
        if message:
            detail += (
                f'<tr><td style="padding:4px 12px 4px 0;color:#6b7280;vertical-align:top">'
                f'Message</td><td style="padding:4px 0">{message}</td></tr>'
            )
        table = f'<table style="border-collapse:collapse;font-size:14px">{detail}</table>'

        send_email(
            to=settings.sales_email,
            subject=f"New RFQ {rfq_number} from {email}",
            html=_wrap("New request for quote", table),
            reply_to=email,
        )
        send_email(
            to=email,
            subject=f"We received your RFQ ({rfq_number})",
            html=_wrap(
                "Thanks — your RFQ is in",
                f"<p>Your reference is <strong>{rfq_number}</strong>. "
                f"Our engineering team replies within one business day.</p>{table}",
            ),
            reply_to=settings.sales_email,
        )
        logger.info("RFQ %s notifications sent (customer + %s)", rfq_number, settings.sales_email)
    except Exception:  # noqa: BLE001
        logger.exception("notify_rfq failed for %s", rfq_number)


# ------------------------------------------------------------------- order ----
async def notify_order(
    order_number: str,
    email: str,
    *,
    total_cents: int = 0,
    currency: str = "EUR",
    item_lines: list[str] | None = None,
) -> None:
    try:
        lines = "".join(f"<li>{ln}</li>" for ln in (item_lines or [])) or "<li>—</li>"
        body = (
            f"<p>Order <strong>{order_number}</strong> is confirmed and now "
            f"<strong>pending</strong>. We invoice verified B2B accounts (net 30); "
            f"otherwise payment is arranged before dispatch.</p>"
            f'<ul style="font-size:14px">{lines}</ul>'
            f"<p style=\"font-size:14px\">Total: <strong>{_money(total_cents, currency)}</strong> "
            f"(excl. VAT)</p>"
        )
        send_email(
            to=email,
            subject=f"Order {order_number} confirmed",
            html=_wrap("Order received", body),
            reply_to=settings.sales_email,
        )
        send_email(
            to=settings.sales_email,
            subject=f"New order {order_number} — {_money(total_cents, currency)}",
            html=_wrap("New order", body),
            reply_to=email,
        )
        logger.info("Order %s notifications sent", order_number)
    except Exception:  # noqa: BLE001
        logger.exception("notify_order failed for %s", order_number)


# ------------------------------------------------------------ contact form ----
async def notify_contact(
    name: str,
    email: str,
    message: str,
    *,
    company: str | None = None,
    phone: str | None = None,
    product: str | None = None,
) -> None:
    try:
        inner = _rows(
            [
                ("Name", name),
                ("Email", email),
                ("Phone", phone or "—"),
                ("Company", company or "—"),
                ("Product / ref", product or "—"),
            ]
        )
        table = f'<table style="border-collapse:collapse;font-size:14px">{inner}</table>'
        body = f'{table}<p style="margin-top:16px">{message}</p>'
        send_email(
            to=settings.sales_email,
            subject=f"Contact form — {name}",
            html=_wrap("New contact enquiry", body),
            reply_to=email,
        )
        send_email(
            to=email,
            subject="We received your message",
            html=_wrap(
                "Thanks for reaching out",
                "<p>Our German-based team replies within one business day.</p>" + body,
            ),
            reply_to=settings.sales_email,
        )
        logger.info("Contact enquiry from %s notified to %s", email, settings.sales_email)
    except Exception:  # noqa: BLE001
        logger.exception("notify_contact failed for %s", email)


# --------------------------------------------------------- email verify -------
async def send_verification_email(email: str, token: str) -> None:
    try:
        base = settings.api_public_url or "http://localhost:8000"
        link = f"{base}/api/v1/auth/verify?token={token}"
        send_email(
            to=email,
            subject="Confirm your DuoCone account",
            html=_wrap(
                "Confirm your email",
                f'<p>Click to verify your address:</p>'
                f'<p><a href="{link}" style="color:#07549a">{link}</a></p>',
            ),
        )
        logger.info("Verification email sent to %s", email)
    except Exception:  # noqa: BLE001
        logger.exception("send_verification_email failed for %s", email)
