"""Venue schemas."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import Field, field_validator

from app.schemas.common import APIModel, IdentifierModel, TimestampedModel

SubscriptionStatus = Literal["trial", "active", "suspended"]


class VenueCreateRequest(APIModel):
    """Payload for creating a venue."""

    slug: str
    name_ar: str
    name_en: str
    category: str
    description_ar: str | None = None
    description_en: str | None = None
    governorate: str
    area: str
    address_ar: str
    address_en: str
    phone: str
    email: str | None = None
    website: str | None = None
    logo_url: str | None = None
    cover_photo_url: str | None = None
    photos: list[str] = Field(default_factory=list)

    @field_validator("slug")
    @classmethod
    def validate_slug(cls, value: str) -> str:
        """Enforce a URL-safe slug."""
        if not value or value.lower() != value:
            raise ValueError("Slug must be lowercase.")
        for character in value:
            if character.isalnum() or character == "-":
                continue
            raise ValueError("Slug must contain only lowercase letters, numbers, and hyphens.")
        return value


class VenueUpdateRequest(APIModel):
    """Payload for updating a venue."""

    name_ar: str
    name_en: str
    category: str
    description_ar: str | None = None
    description_en: str | None = None
    governorate: str
    area: str
    address_ar: str
    address_en: str
    phone: str
    email: str | None = None
    website: str | None = None
    logo_url: str | None = None
    cover_photo_url: str | None = None
    photos: list[str] = Field(default_factory=list)


class TeamMemberInviteRequest(APIModel):
    """Payload to invite a team member to a venue."""

    phone: str


class VenueResponse(IdentifierModel, TimestampedModel):
    """Venue record returned by provider APIs."""

    slug: str
    name_ar: str
    name_en: str
    category: str
    description_ar: str | None = None
    description_en: str | None = None
    governorate: str
    area: str
    address_ar: str
    address_en: str
    phone: str
    email: str | None = None
    website: str | None = None
    logo_url: str | None = None
    cover_photo_url: str | None = None
    photos: list[str]
    is_approved: bool
    subscription_status: SubscriptionStatus
    trial_ends_at: datetime
    billing_notes: str | None = None
    owner_id: str
    staff_users: list[str] = Field(default_factory=list)


class PublicVenueResponse(IdentifierModel):
    """Public-facing venue payload."""

    slug: str
    name_ar: str
    name_en: str
    category: str
    description_ar: str | None = None
    description_en: str | None = None
    governorate: str
    area: str
    address_ar: str
    address_en: str
    phone: str
    email: str | None = None
    website: str | None = None
    logo_url: str | None = None
    cover_photo_url: str | None = None
    photos: list[str]
