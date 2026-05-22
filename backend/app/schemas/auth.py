"""Authentication schemas."""

from __future__ import annotations

from datetime import datetime
import re

from pydantic import EmailStr, Field, field_validator

from app.schemas.common import APIModel
from app.schemas.user import Role, UserProfile


class RegisterRequest(APIModel):
    """Payload for creating a new user and issuing an OTP."""

    phone: str
    email: EmailStr
    name_ar: str
    name_en: str
    role: Role = "patient"

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        """Validate the phone number format."""
        if re.fullmatch(r"\+20\d{10}", value) is None:
            raise ValueError("Phone must be in +20XXXXXXXXXX format.")
        return value


class LoginOtpRequest(APIModel):
    """Payload for requesting a login OTP."""

    phone: str

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        """Validate the phone number format."""
        if re.fullmatch(r"\+20\d{10}", value) is None:
            raise ValueError("Phone must be in +20XXXXXXXXXX format.")
        return value


class VerifyOtpRequest(APIModel):
    """Payload for verifying an OTP and logging in."""

    phone: str
    otp_code: str = Field(min_length=4, max_length=4)

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        """Validate the phone number format."""
        if re.fullmatch(r"\+20\d{10}", value) is None:
            raise ValueError("Phone must be in +20XXXXXXXXXX format.")
        return value


class RefreshTokenRequest(APIModel):
    """Payload for refreshing a JWT pair."""

    refresh_token: str


class OtpChallengeData(APIModel):
    """Response body for OTP issuance."""

    phone: str
    otp_expires_at: datetime
    role: Role


class AuthTokensData(APIModel):
    """Issued access and refresh tokens."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    access_token_expires_at: datetime
    refresh_token_expires_at: datetime
    user: UserProfile
