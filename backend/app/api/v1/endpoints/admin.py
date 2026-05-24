"""Admin moderation and management endpoints."""

from __future__ import annotations

import hashlib
import hmac
import os
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel

from app.api.deps import require_role
from app.core.security import utc_now
from app.repositories.users import UserRepository
from app.repositories.venues import VenueRepository
from app.schemas.common import ApiResponse
from app.schemas.user import UserProfile
from app.schemas.venue import VenueResponse
from app.services.serializers import serialize_user, serialize_venue

router = APIRouter(prefix="/admin", tags=["admin"])


class VenueApprovalRequest(BaseModel):
    """Toggle venue approval."""
    is_approved: bool


class VenueSubscriptionRequest(BaseModel):
    """Update subscription status."""
    subscription_status: str
    billing_notes: str | None = None


class UserRoleRequest(BaseModel):
    """Update user role."""
    role: str


# ── Venue moderation ──────────────────────────────────────────────────────────

@router.get("/venues", response_model=ApiResponse[list[VenueResponse]], status_code=status.HTTP_200_OK)
async def admin_list_venues(
    current_user: Annotated[dict, Depends(require_role("admin"))],
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
) -> ApiResponse[list[VenueResponse]]:
    """List all venues for admin moderation."""
    venues = await VenueRepository().list_all(skip=skip, limit=limit)
    return ApiResponse(data=[serialize_venue(venue) for venue in venues])


@router.patch("/venues/{venue_id}/approve", response_model=ApiResponse[VenueResponse], status_code=status.HTTP_200_OK)
async def admin_approve_venue(
    venue_id: str,
    payload: VenueApprovalRequest,
    current_user: Annotated[dict, Depends(require_role("admin"))],
) -> ApiResponse[VenueResponse]:
    """Set venue approval status."""
    venue = await VenueRepository().update_by_id(venue_id, {
        "is_approved": payload.is_approved,
        "updated_at": utc_now(),
    })
    if venue is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Venue not found.")
    return ApiResponse(data=serialize_venue(venue))


@router.patch("/venues/{venue_id}/subscription", response_model=ApiResponse[VenueResponse], status_code=status.HTTP_200_OK)
async def admin_update_venue_subscription(
    venue_id: str,
    payload: VenueSubscriptionRequest,
    current_user: Annotated[dict, Depends(require_role("admin"))],
) -> ApiResponse[VenueResponse]:
    """Update venue subscription status and billing notes."""
    venue = await VenueRepository().update_by_id(venue_id, {
        "subscription_status": payload.subscription_status,
        "billing_notes": payload.billing_notes,
        "updated_at": utc_now(),
    })
    if venue is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Venue not found.")
    return ApiResponse(data=serialize_venue(venue))


# ── User management ───────────────────────────────────────────────────────────

@router.get("/users", response_model=ApiResponse[list[UserProfile]], status_code=status.HTTP_200_OK)
async def admin_list_users(
    current_user: Annotated[dict, Depends(require_role("admin"))],
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
) -> ApiResponse[list[UserProfile]]:
    """List all users (admin view)."""
    users = await UserRepository().list_all(skip=skip, limit=limit)
    return ApiResponse(data=[serialize_user(user) for user in users])


@router.patch("/users/{user_id}/deactivate", response_model=ApiResponse[UserProfile], status_code=status.HTTP_200_OK)
async def admin_deactivate_user(
    user_id: str,
    current_user: Annotated[dict, Depends(require_role("admin"))],
) -> ApiResponse[UserProfile]:
    """Deactivate a user account and invalidate their refresh token."""
    user = await UserRepository().update_by_id(user_id, {
        "is_active": False,
        "refresh_token": None,  # Invalidate all sessions
        "updated_at": utc_now(),
    })
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    return ApiResponse(data=serialize_user(user))


@router.patch("/users/{user_id}/role", response_model=ApiResponse[UserProfile], status_code=status.HTTP_200_OK)
async def admin_update_user_role(
    user_id: str,
    payload: UserRoleRequest,
    current_user: Annotated[dict, Depends(require_role("admin"))],
) -> ApiResponse[UserProfile]:
    """Change a user's role."""
    if payload.role not in ["admin", "provider", "patient", "salesman"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid role.")
    
    user = await UserRepository().update_by_id(user_id, {
        "role": payload.role,
        "updated_at": utc_now(),
    })
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    return ApiResponse(data=serialize_user(user))
