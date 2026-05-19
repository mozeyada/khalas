"""Authentication service logic."""

from __future__ import annotations

import logging
from dataclasses import dataclass

import jwt
from fastapi import HTTPException, status
from pymongo.errors import DuplicateKeyError

from app.core.security import (
    build_otp_expiry,
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
    generate_otp_code,
    hash_token,
    utc_now,
)
from app.repositories.users import UserRepository
from app.schemas.auth import AuthTokensData, OtpChallengeData, RegisterRequest
from app.services.serializers import serialize_user

logger = logging.getLogger(__name__)


@dataclass
class AuthService:
    """Encapsulate OTP and JWT auth flows."""

    user_repository: UserRepository

    async def register(self, request: RegisterRequest) -> OtpChallengeData:
        """Create a user and issue an OTP."""
        existing = await self.user_repository.find_by_phone(request.phone)
        if existing is not None:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A user with this phone already exists.")

        timestamp = utc_now()
        otp_code = generate_otp_code()
        otp_expires_at = build_otp_expiry()
        document = {
            "phone": request.phone,
            "name_ar": request.name_ar,
            "name_en": request.name_en,
            "role": request.role,
            "is_active": True,
            "otp_code": otp_code,
            "otp_expires_at": otp_expires_at,
            "refresh_token": None,
            "created_at": timestamp,
            "updated_at": timestamp,
        }
        if request.email is not None:
            document["email"] = request.email
        try:
            await self.user_repository.create(document)
        except DuplicateKeyError as exc:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A user with this email already exists.") from exc
        logger.info("[KHALAS OTP] %s -> %s", request.phone, otp_code)
        return OtpChallengeData(phone=request.phone, otp_expires_at=otp_expires_at, role=request.role)

    async def request_login_otp(self, phone: str) -> OtpChallengeData:
        """Issue a fresh OTP to an existing user."""
        user = await self.user_repository.find_by_phone(phone)
        if user is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
        if not user["is_active"]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is inactive.")

        otp_code = generate_otp_code()
        otp_expires_at = build_otp_expiry()
        await self.user_repository.update_by_id(
            str(user["_id"]),
            {
                "otp_code": otp_code,
                "otp_expires_at": otp_expires_at,
                "updated_at": utc_now(),
            },
        )
        logger.info("[KHALAS OTP] %s -> %s", phone, otp_code)
        return OtpChallengeData(phone=phone, otp_expires_at=otp_expires_at, role=user["role"])

    async def verify_otp(self, *, phone: str, otp_code: str) -> AuthTokensData:
        """Validate an OTP and issue tokens."""
        user = await self.user_repository.find_by_phone(phone)
        if user is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
        if user.get("otp_code") != otp_code:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid OTP code.")
        if user.get("otp_expires_at") is None or user["otp_expires_at"] < utc_now():
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="OTP code has expired.")

        access_token, access_expires_at = create_access_token(str(user["_id"]), user["role"])
        refresh_token, refresh_expires_at = create_refresh_token(str(user["_id"]), user["role"])
        updated_user = await self.user_repository.update_by_id(
            str(user["_id"]),
            {
                "otp_code": None,
                "otp_expires_at": None,
                "refresh_token": hash_token(refresh_token),
                "updated_at": utc_now(),
            },
        )
        assert updated_user is not None
        return AuthTokensData(
            access_token=access_token,
            refresh_token=refresh_token,
            access_token_expires_at=access_expires_at,
            refresh_token_expires_at=refresh_expires_at,
            user=serialize_user(updated_user),
        )

    async def refresh_tokens(self, refresh_token: str) -> AuthTokensData:
        """Rotate a refresh token pair."""
        try:
            payload = decode_refresh_token(refresh_token)
        except jwt.InvalidTokenError as exc:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token.") from exc

        if payload.get("type") != "refresh":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token.")

        user = await self.user_repository.find_by_id(payload["sub"])
        if user is None or not user["is_active"]:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not available.")
        if user.get("refresh_token") != hash_token(refresh_token):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token mismatch.")

        access_token, access_expires_at = create_access_token(str(user["_id"]), user["role"])
        new_refresh_token, refresh_expires_at = create_refresh_token(str(user["_id"]), user["role"])
        updated_user = await self.user_repository.update_by_id(
            str(user["_id"]),
            {
                "refresh_token": hash_token(new_refresh_token),
                "updated_at": utc_now(),
            },
        )
        assert updated_user is not None
        return AuthTokensData(
            access_token=access_token,
            refresh_token=new_refresh_token,
            access_token_expires_at=access_expires_at,
            refresh_token_expires_at=refresh_expires_at,
            user=serialize_user(updated_user),
        )
