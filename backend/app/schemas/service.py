"""Service schemas."""

from __future__ import annotations

from pydantic import Field

from app.schemas.common import APIModel, IdentifierModel, TimestampedModel


class ServiceCreateRequest(APIModel):
    """Payload for creating a service."""

    name_ar: str
    name_en: str
    description_ar: str | None = None
    description_en: str | None = None
    duration_minutes: int = Field(gt=0, le=480)
    buffer_minutes: int = Field(default=0, ge=0, le=180)
    price: int = Field(ge=0)
    is_active: bool = True


class ServiceUpdateRequest(ServiceCreateRequest):
    """Payload for updating a service."""


class ServiceResponse(IdentifierModel, TimestampedModel):
    """Service record returned by provider APIs."""

    staff_id: str
    venue_id: str
    name_ar: str
    name_en: str
    description_ar: str | None = None
    description_en: str | None = None
    duration_minutes: int
    buffer_minutes: int
    price: int
    category: str
    is_active: bool


class PublicServiceResponse(IdentifierModel):
    """Public-facing service payload."""

    staff_id: str
    venue_id: str
    name_ar: str
    name_en: str
    description_ar: str | None = None
    description_en: str | None = None
    duration_minutes: int
    buffer_minutes: int
    price: int
    category: str
