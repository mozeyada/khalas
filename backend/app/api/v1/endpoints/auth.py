"""Authentication endpoints."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Request, status

from app.api.deps import get_current_user
from app.core.rate_limit import limiter
from app.repositories.users import UserRepository
from app.schemas.auth import (
    AuthTokensData,
    LoginOtpRequest,
    OtpChallengeData,
    RefreshTokenRequest,
    RegisterRequest,
    VerifyOtpRequest,
)
from app.schemas.common import ApiResponse
from app.schemas.user import UserProfile
from app.services.auth import AuthService
from app.services.serializers import serialize_user

router = APIRouter(prefix="/auth", tags=["auth"])


def get_auth_service() -> AuthService:
    """Build the auth service dependency."""
    return AuthService(user_repository=UserRepository())


@router.post("/register", response_model=ApiResponse[OtpChallengeData], status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def register_user(
    request: Request,
    payload: RegisterRequest,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> ApiResponse[OtpChallengeData]:
    """Register a new user and issue a mock OTP."""
    challenge = await auth_service.register(payload)
    return ApiResponse(data=challenge)


@router.post("/login/request-otp", response_model=ApiResponse[OtpChallengeData], status_code=status.HTTP_200_OK)
@limiter.limit("5/minute")
async def request_login_otp(
    request: Request,
    payload: LoginOtpRequest,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> ApiResponse[OtpChallengeData]:
    """Issue a mock OTP for an existing user."""
    challenge = await auth_service.request_login_otp(payload.phone)
    return ApiResponse(data=challenge)


@router.post("/login/verify-otp", response_model=ApiResponse[AuthTokensData], status_code=status.HTTP_200_OK)
@limiter.limit("10/minute")
async def verify_login_otp(
    request: Request,
    payload: VerifyOtpRequest,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> ApiResponse[AuthTokensData]:
    """Verify an OTP and return an access and refresh token pair."""
    tokens = await auth_service.verify_otp(phone=payload.phone, otp_code=payload.otp_code)
    return ApiResponse(data=tokens)


@router.post("/refresh", response_model=ApiResponse[AuthTokensData], status_code=status.HTTP_200_OK)
@limiter.limit("20/minute")
async def refresh_token_pair(
    request: Request,
    payload: RefreshTokenRequest,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> ApiResponse[AuthTokensData]:
    """Rotate the current refresh token pair."""
    tokens = await auth_service.refresh_tokens(payload.refresh_token)
    return ApiResponse(data=tokens)


@router.get("/me", response_model=ApiResponse[UserProfile], status_code=status.HTTP_200_OK)
async def get_me(
    current_user: Annotated[dict, Depends(get_current_user)],
) -> ApiResponse[UserProfile]:
    """Return the currently authenticated user."""
    return ApiResponse(data=serialize_user(current_user))
