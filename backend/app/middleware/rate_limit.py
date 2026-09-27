"""Per-client-IP rate limiting (slowapi) for public write/auth endpoints.

Storage is in-process memory: correct for the single Render instance this
runs on. If the API is ever scaled to several instances, point ``storage_uri``
at a shared Redis so limits are counted across all of them.
"""

from __future__ import annotations

import os

from limits import parse
from limits.storage import MemoryStorage
from limits.strategies import MovingWindowRateLimiter
from slowapi import Limiter
from starlette.requests import Request


def client_ip(request: Request) -> str:
    """Best-effort real client IP.

    On Render, traffic arrives through Cloudflare, which sets
    ``True-Client-IP`` itself (a client-supplied value is overwritten), and
    Render rewrites the first ``X-Forwarded-For`` hop to the real client — which
    uvicorn's ``--proxy-headers`` already puts in ``request.client``. Elsewhere
    (local dev) the socket peer address is used and headers are ignored, so a
    client can't dodge limits by sending a fake header.
    """
    if os.environ.get("RENDER"):
        true_ip = request.headers.get("true-client-ip", "").strip()
        if true_ip:
            return true_ip
    return request.client.host if request.client else "unknown"


limiter = Limiter(key_func=client_ip, headers_enabled=False)


# Account-level throttle for login, independent of IP, so a password can't be
# brute-forced from many addresses at once.
_account_storage = MemoryStorage()
_account_limiter = MovingWindowRateLimiter(_account_storage)
_LOGIN_FAILURES_PER_ACCOUNT = parse("10/15minutes")


def login_blocked(email: str) -> bool:
    return not _account_limiter.test(_LOGIN_FAILURES_PER_ACCOUNT, "login-fail", email)


def record_login_failure(email: str) -> None:
    _account_limiter.hit(_LOGIN_FAILURES_PER_ACCOUNT, "login-fail", email)


def reset_login_failures(email: str) -> None:
    _account_limiter.clear(_LOGIN_FAILURES_PER_ACCOUNT, "login-fail", email)
