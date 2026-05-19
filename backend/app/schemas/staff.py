"""Staff member schemas."""

from __future__ import annotations

from app.schemas.common import APIModel, IdentifierModel, TimestampedModel


class StaffCreateRequest(APIModel):
    """Payload for creating a staff member."""

    user_id: str | None = None
    name_ar: str
    name_en: str
    title_ar: str | None = None
    title_en: str | None = None
    specialty_ar: str | None = None
    specialty_en: str | None = None
    bio_ar: str | None = None
    bio_en: str | None = None
    photo_url: str | None = None
    is_bookable: bool = True
    is_active: bool = True


class StaffUpdateRequest(StaffCreateRequest):
    """Payload for updating a staff member."""


class StaffResponse(IdentifierModel, TimestampedModel):
    """Staff record returned by provider APIs."""

    venue_id: str
    user_id: str | None = None
    name_ar: str
    name_en: str
    title_ar: str | None = None
    title_en: str | None = None
    specialty_ar: str | None = None
    specialty_en: str | None = None
    bio_ar: str | None = None
    bio_en: str | None = None
    photo_url: str | None = None
    is_bookable: bool = True
    is_active: bool = True


class PublicStaffResponse(IdentifierModel):
    """Public-facing staff payload."""

    venue_id: str
    name_ar: str
    name_en: str
    title_ar: str | None = None
    title_en: str | None = None
    specialty_ar: str | None = None
    specialty_en: str | None = None
    bio_ar: str | None = None
    bio_en: str | None = None
    photo_url: str | None = None
