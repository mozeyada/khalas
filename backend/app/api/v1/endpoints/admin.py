"""Admin moderation and management endpoints."""

from __future__ import annotations

import hashlib
import hmac
import os
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel

from app.api.deps import require_role
from app.core.security import utc_now, create_access_token, create_refresh_token
from app.repositories.users import UserRepository
from app.repositories.venues import VenueRepository
from app.schemas.common import ApiResponse
from app.schemas.user import UserProfile
from app.schemas.venue import VenueResponse
from app.schemas.auth import AuthTokensData
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
    provider_type: str | None = None


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
    if payload.role == "provider" and payload.provider_type not in ["doctor", "clinic"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid provider_type.")
    
    update_data = {
        "role": payload.role,
        "provider_type": payload.provider_type if payload.role == "provider" else None,
        "updated_at": utc_now(),
    }
    user = await UserRepository().update_by_id(user_id, update_data)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    return ApiResponse(data=serialize_user(user))


@router.post("/users/{user_id}/impersonate", response_model=ApiResponse[AuthTokensData], status_code=status.HTTP_200_OK)
async def admin_impersonate_user(
    user_id: str,
    current_user: Annotated[dict, Depends(require_role("admin"))],
) -> ApiResponse[AuthTokensData]:
    """Issue auth tokens for any user to allow admin impersonation."""
    user = await UserRepository().find_by_id(user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    
    if user["role"] == "admin":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot impersonate other admins.")
        
    access_token, access_expires_at = create_access_token(str(user["_id"]), user["role"])
    refresh_token, refresh_expires_at = create_refresh_token(str(user["_id"]), user["role"])
    
    await UserRepository().update_by_id(str(user["_id"]), {
        "refresh_token": refresh_token,
        "updated_at": utc_now(),
    })
    
    tokens_data = AuthTokensData(
        access_token=access_token,
        refresh_token=refresh_token,
        access_token_expires_at=access_expires_at,
        refresh_token_expires_at=refresh_expires_at,
        user=serialize_user(user)
    )
    return ApiResponse(data=tokens_data)


@router.post("/seed-test-users", response_model=ApiResponse[dict], status_code=status.HTTP_200_OK)
async def admin_seed_test_users(
    current_user: Annotated[dict, Depends(require_role("admin"))],
) -> ApiResponse[dict]:
    """Wipe current users and seed the specific test accounts requested."""
    # Since dropping collections dynamically in motor can be tricky during requests,
    # we'll just delete all users and venues to ensure a clean slate for the test.
    from app.repositories.users import UserRepository
    from app.repositories.venues import VenueRepository
    from app.core.security import get_password_hash, utc_now

    user_repo = UserRepository()
    venue_repo = VenueRepository()
    
    # 1. Delete all non-admin users except the current admin executing this
    await user_repo.collection.delete_many({"_id": {"$ne": current_user["_id"]}})
    
    # 2. Optionally delete all venues
    await venue_repo.collection.delete_many({})

    timestamp = utc_now()
    default_pwd_hash = get_password_hash("Password123!")

    # 3. Create requested users
    users_to_create = [
        # Admin's Clinic
        {
            "name_en": "Mahmoud Clinic", "name_ar": "عيادة محمود",
            "email": "m.zeyada91+clinic@gmail.com", "phone": "+201000000002",
            "role": "provider", "provider_type": "clinic"
        },
        # Admin's Patient
        {
            "name_en": "Mahmoud Patient", "name_ar": "محمود مريض",
            "email": "m.zeyada91+patient@gmail.com", "phone": "+201000000003",
            "role": "patient"
        },
        # Salesman
        {
            "name_en": "Salesman", "name_ar": "رجل مبيعات",
            "email": "sales@khalas.com", "phone": "+201100000001",
            "role": "salesman"
        },
        # Salesman's Clinic
        {
            "name_en": "Salesman Clinic", "name_ar": "عيادة المبيعات",
            "email": "sales+clinic@khalas.com", "phone": "+201100000002",
            "role": "provider", "provider_type": "clinic"
        },
        # Salesman's Patient
        {
            "name_en": "Salesman Patient", "name_ar": "مريض المبيعات",
            "email": "sales+patient@khalas.com", "phone": "+201100000003",
            "role": "patient"
        },
        # Mohamed Sakr (Salesman)
        {
            "name_en": "Mohamed Sakr", "name_ar": "محمد صقر",
            "email": "m.sakr@khalas.com", "phone": "+201200000001",
            "role": "salesman"
        },
        # Mohamed Sakr's Clinic
        {
            "name_en": "Sakr Clinic", "name_ar": "عيادة صقر",
            "email": "m.sakr+clinic@khalas.com", "phone": "+201200000002",
            "role": "provider", "provider_type": "clinic"
        },
        # Mohamed Sakr's Patient
        {
            "name_en": "Sakr Patient", "name_ar": "المريض صقر",
            "email": "m.sakr+patient@khalas.com", "phone": "+201200000003",
            "role": "patient"
        }
    ]

    created_count = 0
    
    from app.repositories.staff import StaffRepository
    from app.repositories.services import ServiceRepository
    from app.repositories.availability import AvailabilityRepository
    import re
    
    staff_repo = StaffRepository()
    service_repo = ServiceRepository()
    availability_repo = AvailabilityRepository()
    
    # Optional: Clear out test staff/services/availability before seeding
    await staff_repo.collection.delete_many({})
    await service_repo.collection.delete_many({})
    await availability_repo.collection.delete_many({})

    for u in users_to_create:
        doc = {
            "name_en": u["name_en"],
            "name_ar": u["name_ar"],
            "email": u["email"],
            "phone": u["phone"],
            "role": u["role"],
            "provider_type": u.get("provider_type"),
            "is_active": True,
            "hashed_password": default_pwd_hash,
            "preferred_channel": "whatsapp",
            "created_at": timestamp,
            "updated_at": timestamp,
        }
        created_user = await user_repo.create(doc)
        created_count += 1
        
        # Auto-provision clinic ecosystem if role is provider
        if u["role"] == "provider":
            clean_name = u["name_en"].replace("Dr. ", "").replace("Dr.", "").strip()
            slug_base = re.sub(r'[^a-z0-9]', '-', clean_name.lower())
            slug_base = re.sub(r'-+', '-', slug_base).strip('-')
            if not slug_base:
                slug_base = "clinic"
                
            existing_venues = await venue_repo.collection.count_documents({"slug": {"$regex": f"^{slug_base}"}})
            final_slug = slug_base if existing_venues == 0 else f"{slug_base}-{existing_venues+1}"
            
            venue_doc = {
                "owner_id": str(created_user["_id"]),
                "name_ar": u["name_ar"],
                "name_en": u["name_en"],
                "slug": final_slug,
                "address_ar": "العنوان غير محدد",
                "address_en": "Address not specified",
                "phone": u["phone"],
                "governorate": "Cairo",
                "area": "Nasr City",
                "category": "clinic",
                "is_approved": True,
                "subscription_status": "trial",
                "staff_users": [str(created_user["_id"])],
                "created_at": timestamp,
                "updated_at": timestamp,
            }
            created_venue = await venue_repo.create(venue_doc)
            
            staff_doc = {
                "venue_id": str(created_venue["_id"]),
                "name_ar": u["name_ar"],
                "name_en": u["name_en"],
                "title_ar": "طبيب",
                "title_en": "Doctor",
                "specialty_ar": "عام",
                "specialty_en": "General",
                "is_active": True,
                "is_bookable": True,
                "created_at": timestamp,
                "updated_at": timestamp,
            }
            created_staff = await staff_repo.create(staff_doc)
            
            service_doc = {
                "staff_id": str(created_staff["_id"]),
                "venue_id": str(created_venue["_id"]),
                "category": "clinic",
                "name_ar": "كشف طبي",
                "name_en": "Consultation",
                "duration_minutes": 30,
                "price": 50000, # 500 EGP
                "is_active": True,
                "created_at": timestamp,
                "updated_at": timestamp,
            }
            await service_repo.create(service_doc)
            
            availability_rows = []
            for day in range(7):
                availability_rows.append({
                    "staff_id": str(created_staff["_id"]),
                    "day_of_week": day,
                    "start_time": "09:00",
                    "end_time": "17:00",
                    "is_active": True,
                    "created_at": timestamp,
                    "updated_at": timestamp,
                })
            await availability_repo.replace_for_staff(str(created_staff["_id"]), availability_rows)

    return ApiResponse(data={"message": f"Successfully cleared data and seeded {created_count} test users with their clinics. Password is 'Password123!'."})
