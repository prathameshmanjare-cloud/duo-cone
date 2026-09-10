"""Transactional email.

One `send_email(...)` entry point that dispatches to a provider chosen by
``settings.email_provider``:

* ``sendgrid`` — POST https://api.sendgrid.com/v3/mail/send
* ``mailgun``  — POST https://api.mailgun.net/v3/<domain>/messages
* ``console``  — no network; logs the full message. Also the automatic
  fallback whenever the selected provider has no API key configured, so the
  app is fully functional in dev / on hosts without mail creds.

Never raises: returns ``True`` on accepted send, ``False`` otherwise, so a
failed notification can't break the request that triggered it.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass

import httpx

from app.config.settings import get_settings

logger = logging.getLogger("duocon.email")
settings = get_settings()

_TIMEOUT = 10.0


@dataclass(slots=True)
class EmailMessage:
    to: str | list[str]
    subject: str
    html: str
    text: str | None = None
    reply_to: str | None = None

    @property
    def recipients(self) -> list[str]:
        return [self.to] if isinstance(self.to, str) else list(self.to)

    @property
    def text_body(self) -> str:
        if self.text:
            return self.text
        # crude html->text so a text/plain part always exists
        import re

        stripped = re.sub(r"<[^>]+>", "", self.html)
        return re.sub(r"\n\s*\n\s*\n+", "\n\n", stripped).strip()


def _effective_provider() -> str:
    p = (settings.email_provider or "").lower()
    if p == "sendgrid" and settings.sendgrid_api_key:
        return "sendgrid"
    if p == "mailgun" and settings.mailgun_api_key and settings.mailgun_domain:
        return "mailgun"
    return "console"


def _send_sendgrid(msg: EmailMessage) -> bool:
    payload = {
        "personalizations": [{"to": [{"email": r} for r in msg.recipients]}],
        "from": {"email": settings.email_from},
        "subject": msg.subject,
        "content": [
            {"type": "text/plain", "value": msg.text_body},
            {"type": "text/html", "value": msg.html},
        ],
    }
    if msg.reply_to:
        payload["reply_to"] = {"email": msg.reply_to}
    r = httpx.post(
        "https://api.sendgrid.com/v3/mail/send",
        json=payload,
        headers={"Authorization": f"Bearer {settings.sendgrid_api_key}"},
        timeout=_TIMEOUT,
    )
    ok = r.status_code in (200, 201, 202)
    if not ok:
        logger.error("SendGrid send failed %s: %s", r.status_code, r.text[:300])
    return ok


def _send_mailgun(msg: EmailMessage) -> bool:
    data = {
        "from": settings.email_from,
        "to": msg.recipients,
        "subject": msg.subject,
        "text": msg.text_body,
        "html": msg.html,
    }
    if msg.reply_to:
        data["h:Reply-To"] = msg.reply_to
    r = httpx.post(
        f"https://api.mailgun.net/v3/{settings.mailgun_domain}/messages",
        auth=("api", settings.mailgun_api_key),
        data=data,
        timeout=_TIMEOUT,
    )
    ok = r.status_code in (200, 201, 202)
    if not ok:
        logger.error("Mailgun send failed %s: %s", r.status_code, r.text[:300])
    return ok


def _send_console(msg: EmailMessage) -> bool:
    logger.info(
        "EMAIL (console provider — not delivered)\n"
        "  to:      %s\n"
        "  from:    %s\n"
        "  replyTo: %s\n"
        "  subject: %s\n"
        "  ---\n%s",
        ", ".join(msg.recipients),
        settings.email_from,
        msg.reply_to or "-",
        msg.subject,
        msg.text_body,
    )
    return True


def send_email(
    to: str | list[str],
    subject: str,
    html: str,
    text: str | None = None,
    reply_to: str | None = None,
) -> bool:
    msg = EmailMessage(to=to, subject=subject, html=html, text=text, reply_to=reply_to)
    provider = _effective_provider()
    try:
        if provider == "sendgrid":
            return _send_sendgrid(msg)
        if provider == "mailgun":
            return _send_mailgun(msg)
        return _send_console(msg)
    except Exception:  # noqa: BLE001 — a notification must never break its caller
        logger.exception("send_email failed (provider=%s, subject=%r)", provider, subject)
        return False
