"""Password hashing (argon2) + JWT issue/verify."""

from __future__ import annotations

import hashlib
import hmac
import uuid
from datetime import datetime, timedelta, timezone

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

from app.config.settings import get_settings

settings = get_settings()
_hasher = PasswordHasher()


def hash_password(raw: str) -> str:
    return _hasher.hash(raw)


def verify_password(raw: str, hashed: str) -> bool:
    try:
        return _hasher.verify(hashed, raw)
    except VerifyMismatchError:
        return False
    except Exception:  # noqa: BLE001 — malformed hash, treat as mismatch
        return False


# a real argon2 hash of a random value, verified against when the email is
# unknown so a login attempt takes the same time whether or not it exists
_DUMMY_HASH = _hasher.hash(uuid.uuid4().hex)


def burn_verify_time(raw: str) -> None:
    verify_password(raw, _DUMMY_HASH)


def password_fingerprint(password_hash: str) -> str:
    """Short keyed digest of the stored hash. Embedded in tokens so that every
    token issued before a password change stops working after it, without
    exposing any part of the hash itself inside the (readable) JWT."""
    return hmac.new(
        settings.jwt_secret.encode(), password_hash.encode(), hashlib.sha256
    ).hexdigest()[:32]


def token_matches_password(payload: dict, password_hash: str) -> bool:
    return hmac.compare_digest(str(payload.get("pwd", "")), password_fingerprint(password_hash))


def needs_rehash(hashed: str) -> bool:
    try:
        return _hasher.check_needs_rehash(hashed)
    except Exception:  # noqa: BLE001
        return False


def _encode(sub: str, token_type: str, expires_delta: timedelta, password_hash: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": sub,
        "type": token_type,
        "iat": now,
        "exp": now + expires_delta,
        "jti": uuid.uuid4().hex,
        "pwd": password_fingerprint(password_hash),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def create_access_token(user_id: str | uuid.UUID, password_hash: str) -> str:
    return _encode(
        str(user_id), "access", timedelta(minutes=settings.access_token_expire_minutes), password_hash
    )


def create_refresh_token(user_id: str | uuid.UUID, password_hash: str) -> str:
    return _encode(
        str(user_id), "refresh", timedelta(days=settings.refresh_token_expire_days), password_hash
    )


def create_password_reset_token(user_id: str | uuid.UUID, password_hash: str) -> str:
    """Stateless reset token — signature covers the current password hash so
    it stops working the moment the password actually changes (single use
    without a DB column)."""
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "type": "reset",
        "iat": now,
        "exp": now + timedelta(minutes=30),
        "jti": uuid.uuid4().hex,
        "pwd": password_fingerprint(password_hash),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_token(token: str, expected_type: str | None = None) -> dict:
    """Raise jwt.PyJWTError on any problem (expired, bad sig, wrong type)."""
    data = jwt.decode(
        token,
        settings.jwt_secret,
        algorithms=[settings.jwt_algorithm],
        options={"require": ["exp", "sub", "type"]},
    )
    if expected_type and data.get("type") != expected_type:
        raise jwt.InvalidTokenError(f"expected {expected_type} token")
    return data
