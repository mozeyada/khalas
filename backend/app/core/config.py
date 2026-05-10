"""Application settings."""

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


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


@lru_cache
def get_settings() -> Settings:
    """Return a cached settings instance."""
    return Settings()


settings = get_settings()

