"""Transactional email.

One `send_email(...)` entry point that dispatches to a provider chosen by
``settings.email_provider``:

* ``sendgrid`` — POST https://api.sendgrid.com/v3/mail/send
* ``mailgun``  — POST https://api.mailgun.net/v3/<domain>/messages
* ``smtp``     — smtplib to any SMTP server (STARTTLS or implicit TLS)
* ``console``  — no network; logs the full message. Also the automatic
  fallback whenever the selected provider has no credentials configured, so
  the app is fully functional in dev / on hosts without mail creds.

Never raises: returns ``True`` on accepted send, ``False`` otherwise, so a
failed notification can't break the request that triggered it.
"""

from __future__ import annotations

import logging
import smtplib
import ssl
from dataclasses import dataclass
from email.message import EmailMessage as MIMEEmailMessage

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
    if p == "smtp" and settings.smtp_host:
        return "smtp"
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


def _send_smtp(msg: EmailMessage) -> bool:
    mime = MIMEEmailMessage()
    mime["From"] = f"{settings.email_from_name} <{settings.email_from}>"
    mime["To"] = ", ".join(msg.recipients)
    mime["Subject"] = msg.subject
    if msg.reply_to:
        mime["Reply-To"] = msg.reply_to
    mime.set_content(msg.text_body)
    mime.add_alternative(msg.html, subtype="html")

    host, port = settings.smtp_host, settings.smtp_port
    if settings.smtp_ssl:
        server = smtplib.SMTP_SSL(host, port, timeout=_TIMEOUT, context=ssl.create_default_context())
    else:
        server = smtplib.SMTP(host, port, timeout=_TIMEOUT)
    try:
        server.ehlo()
        if settings.smtp_starttls and not settings.smtp_ssl:
            server.starttls(context=ssl.create_default_context())
            server.ehlo()
        if settings.smtp_user:
            server.login(settings.smtp_user, settings.smtp_password)
        server.send_message(mime, from_addr=settings.email_from, to_addrs=msg.recipients)
        return True
    finally:
        try:
            server.quit()
        except Exception:  # noqa: BLE001
            pass


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
        if provider == "smtp":
            return _send_smtp(msg)
        return _send_console(msg)
    except Exception:  # noqa: BLE001 — a notification must never break its caller
        logger.exception("send_email failed (provider=%s, subject=%r)", provider, subject)
        return False


def send_email_diagnostic(
    to: str | list[str],
    subject: str,
    html: str,
    text: str | None = None,
) -> tuple[bool, str | None]:
    """Same dispatch as send_email, but surfaces the exception message on
    failure instead of swallowing it — used only by the admin "send test
    email" endpoint so an operator can see *why* a send failed (e.g. the
    SMTP server's auth-rejection response) without pulling server logs.
    Never include credential values in the message: smtplib/httpx error
    text only ever echoes the remote server's own response, never a
    request payload, so this stays safe to return to the admin UI."""
    msg = EmailMessage(to=to, subject=subject, html=html, text=text)
    provider = _effective_provider()
    try:
        if provider == "sendgrid":
            return _send_sendgrid(msg), None
        if provider == "mailgun":
            return _send_mailgun(msg), None
        if provider == "smtp":
            return _send_smtp(msg), None
        return _send_console(msg), None
    except Exception as exc:  # noqa: BLE001
        logger.exception("send_email_diagnostic failed (provider=%s, subject=%r)", provider, subject)
        return False, f"{type(exc).__name__}: {exc}"
