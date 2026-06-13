"""Authentication schemas."""

from __future__ import annotations

from datetime import datetime
from typing import Literal
import re

from pydantic import EmailStr, Field, field_validator

from app.schemas.common import APIModel
from app.schemas.user import Role, UserProfile


class RegisterRequest(APIModel):
    """Payload for creating a new user and issuing an OTP."""

    phone: str | None = None
    email: EmailStr | None = None
    name_ar: str
    name_en: str
    role: Role = "patient"
    provider_type: Literal["doctor", "clinic"] | None = None
    preferred_channel: Literal["email", "whatsapp", "both"] | None = None
    password: str | None = Field(default=None, min_length=8)

    from pydantic import model_validator
    @model_validator(mode="after")
    def validate_contact_info(self) -> RegisterRequest:
        if not self.phone and not self.email:
            raise ValueError("At least one of phone or email must be provided.")
        if self.role == "provider" and not self.provider_type:
            raise ValueError("provider_type must be provided for provider role.")
        return self

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str | None) -> str | None:
        """Validate the phone number format."""
        if value is not None and re.fullmatch(r"\+20\d{10}", value) is None:
            raise ValueError("Phone must be in +20XXXXXXXXXX format.")
        return value


class LoginOtpRequest(APIModel):
    """Payload for requesting a login OTP."""

    identifier: str


class LoginPasswordRequest(APIModel):
    """Payload for logging in with a password."""
    
    identifier: str  # Can be phone or email
    password: str


class ForgotPasswordRequest(APIModel):
    """Payload for requesting a password reset token."""
    
    identifier: str


class ResetPasswordRequest(APIModel):
    """Payload for resetting the password with a token."""
    
    token: str
    new_password: str = Field(min_length=8)


class ChangePasswordRequest(APIModel):
    """Payload for changing password while authenticated."""
    
    current_password: str
    new_password: str = Field(min_length=8)


class UpdateProfileRequest(APIModel):
    """Payload for updating user profile information."""
    
    name_ar: str | None = None
    name_en: str | None = None
    email: EmailStr | None = None
    preferred_channel: Literal["email", "whatsapp", "both"] | None = None


class VerifyOtpRequest(APIModel):
    """Payload for verifying an OTP and logging in."""

    identifier: str
    otp_code: str = Field(min_length=4, max_length=4)


class RefreshTokenRequest(APIModel):
    """Payload for refreshing a JWT pair."""

    refresh_token: str


class OtpChallengeData(APIModel):
    """Response body for OTP issuance."""

    identifier: str
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

