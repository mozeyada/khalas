"""Application settings."""

from __future__ import annotations

import logging
import os
import secrets
from functools import lru_cache

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger(__name__)


def _resolve_secret(env_key: str, *, file_path: str = "") -> str | None:
    """Multi-tiered secret resolution: env → local file → ephemeral (non-prod only).

    Resolution order:
    1. Environment variable ``env_key``.
    2. Local file at ``file_path`` (development convenience).
    3. Cryptographically random ephemeral value (non-production only) –
       logs a CRITICAL warning because ephemeral keys break across restarts
       and are not suitable for horizontal scaling.

    Returns ``None`` when none of the tiers resolves and the environment is
    ``production`` (callers must then error out).
    """
    value = os.getenv(env_key)
    if value:
        return value.strip()

    if file_path and os.path.exists(file_path):
        with open(file_path) as fh:
            value = fh.read().strip()
        if value:
            return value

    return None


class Settings(BaseSettings):
    """Runtime configuration loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    environment: str = Field(default="development")
    project_name: str = Field(default="khalas-api")
    api_v1_prefix: str = Field(default="/api/v1")
    frontend_origin: str = Field(default="http://localhost:3000")
    mongodb_uri: str | None = Field(default=None)
    mongodb_db_name: str = Field(default="khalas")

    # Secrets – do NOT supply default literal values here.
    # _resolve_secret() provides the multi-tiered fallback.
    jwt_secret_key: str = Field(default="")
    jwt_refresh_secret_key: str = Field(default="")

    jwt_algorithm: str = Field(default="HS256")
    access_token_expire_minutes: int = Field(default=15)
    refresh_token_expire_days: int = Field(default=7)
    otp_expire_minutes: int = Field(default=10)

    @model_validator(mode="after")
    def _resolve_jwt_secrets(self) -> "Settings":
        """Resolve JWT secrets with a multi-tiered fallback.

        In production the app errors out if secrets are not set.
        In non-production an ephemeral key is generated and a CRITICAL
        warning is logged to flag the misconfiguration.
        """
        for attr, env_key, file_path in [
            ("jwt_secret_key", "JWT_SECRET_KEY", "jwt_secret.txt"),
            ("jwt_refresh_secret_key", "JWT_REFRESH_SECRET_KEY", "jwt_refresh_secret.txt"),
        ]:
            current = getattr(self, attr)
            # Already set via env file or direct env – keep it.
            if current:
                continue

            resolved = _resolve_secret(env_key, file_path=file_path)
            if resolved:
                object.__setattr__(self, attr, resolved)
                continue

            if self.environment == "production":
                raise RuntimeError(
                    f"[SECURITY] {env_key} is not set. "
                    "Refusing to start in production without a real secret. "
                    "Set the environment variable or a secrets manager entry."
                )

            ephemeral = secrets.token_hex(32)
            object.__setattr__(self, attr, ephemeral)
            logger.critical(
                "[SECURITY] %s is not set. Generating an ephemeral secret (%s). "
                "This instance is isolated – tokens will be invalid after restart "
                "and across multiple instances. Set the env var before going to production.",
                env_key,
                attr,
            )

        return self


@lru_cache
def get_settings() -> Settings:
    """Return a cached settings instance."""
    return Settings()


settings = get_settings()
