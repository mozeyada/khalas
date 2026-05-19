"""Shared API schemas."""

from __future__ import annotations

from datetime import datetime
from typing import Generic, TypeVar

from pydantic import BaseModel, ConfigDict, Field

T = TypeVar("T")


class APIModel(BaseModel):
    """Base schema configuration for API models."""

    model_config = ConfigDict(populate_by_name=True, extra="forbid")


class ApiResponse(APIModel, Generic[T]):
    """Standard API response envelope."""

    success: bool = True
    data: T | None = None
    error: str | None = None


class TimestampedModel(APIModel):
    """Shared timestamp fields."""

    created_at: datetime
    updated_at: datetime


class IdentifierModel(APIModel):
    """Shared identifier field."""

    id: str = Field(alias="_id")
