"""User schemas."""

from __future__ import annotations

from typing import Literal

from pydantic import Field

from app.schemas.common import IdentifierModel, TimestampedModel

Role = Literal["patient", "provider", "admin"]


class UserProfile(IdentifierModel, TimestampedModel):
    """Public user profile exposed via the API."""

    phone: str
    email: str | None = None
    name_ar: str
    name_en: str
    role: Role
    is_active: bool = True


class UserCreatePayload:
    """Internal payload used for user creation."""

    def __init__(
        self,
        *,
        phone: str,
        name_ar: str,
        name_en: str,
        role: Role,
        email: str | None = None,
    ) -> None:
        self.phone = phone
        self.name_ar = name_ar
        self.name_en = name_en
        self.role = role
        self.email = email
