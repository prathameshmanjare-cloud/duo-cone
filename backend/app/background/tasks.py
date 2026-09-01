"""Non-blocking side effects run via FastAPI BackgroundTasks.

Kept provider-agnostic: swap the body for real SendGrid/Mailgun/Twilio calls
without touching call sites in the API routers.
"""

import logging

from app.config.settings import get_settings

logger = logging.getLogger("duocon.background")
settings = get_settings()


async def notify_rfq(rfq_number: str, email: str) -> None:
    # TODO: wire to EmailService (SendGrid/Mailgun) once provider creds are set.
    logger.info("RFQ %s received from %s -> notify sales (%s) + confirm customer", rfq_number, email, settings.sales_email)


async def notify_order(order_number: str, email: str) -> None:
    logger.info("Order %s placed by %s -> send confirmation email", order_number, email)


async def send_verification_email(email: str, token: str) -> None:
    logger.info("Verification email queued for %s (token=%s...)", email, token[:8])
