"""Security helpers for OTP and JWT flows."""

from __future__ import annotations

import hashlib
import secrets
from datetime import UTC, datetime, timedelta
from typing import Any

import jwt

from app.core.config import settings


def utc_now() -> datetime:
    """Return the current UTC timestamp."""
    return datetime.now(UTC)


def generate_otp_code(length: int = 4) -> str:
    """Generate a numeric OTP code."""
    digits = [str(secrets.randbelow(10)) for _ in range(length)]
    return "".join(digits)


def build_otp_expiry() -> datetime:
    """Return the OTP expiry timestamp."""
    return utc_now() + timedelta(minutes=settings.otp_expire_minutes)


def create_access_token(subject: str, role: str) -> tuple[str, datetime]:
    """Create a signed short-lived access token."""
    expires_at = utc_now() + timedelta(minutes=settings.access_token_expire_minutes)
    payload: dict[str, Any] = {
        "sub": subject,
        "role": role,
        "type": "access",
        "exp": expires_at,
    }
    token = jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
    return token, expires_at


def create_refresh_token(subject: str, role: str) -> tuple[str, datetime]:
    """Create a signed refresh token."""
    expires_at = utc_now() + timedelta(days=settings.refresh_token_expire_days)
    payload: dict[str, Any] = {
        "sub": subject,
        "role": role,
        "type": "refresh",
        "exp": expires_at,
    }
    token = jwt.encode(payload, settings.jwt_refresh_secret_key, algorithm=settings.jwt_algorithm)
    return token, expires_at


def decode_access_token(token: str) -> dict[str, Any]:
    """Decode and validate an access token."""
    return jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])


def decode_refresh_token(token: str) -> dict[str, Any]:
    """Decode and validate a refresh token."""
    return jwt.decode(token, settings.jwt_refresh_secret_key, algorithms=[settings.jwt_algorithm])


def hash_token(token: str) -> str:
    """Hash a token before persisting it."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()
