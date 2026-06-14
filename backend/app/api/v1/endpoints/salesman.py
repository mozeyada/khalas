"""Salesman management and demo endpoints."""

from __future__ import annotations

import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from pymongo.errors import DuplicateKeyError

from app.api.deps import require_role
from app.core.security import utc_now, get_password_hash
from app.repositories.availability import AvailabilityRepository
from app.repositories.services import ServiceRepository
from app.repositories.staff import StaffRepository
from app.repositories.users import UserRepository
from app.repositories.venues import VenueRepository
from app.schemas.common import ApiResponse
from app.schemas.venue import VenueResponse
from app.services.serializers import serialize_venue

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/salesman", tags=["salesman"])


class DemoClinicRequest(BaseModel):
    """Payload for quickly setting up a demo clinic."""
    clinic_name: str
    slug: str
    specialty: str
    governorate: str
    doctor_phone: str


class SendWelcomeRequest(BaseModel):
    """Payload for sending welcome message."""
    language: str
    password: str | None = None


@router.post("/demo-clinic", response_model=ApiResponse[VenueResponse], status_code=status.HTTP_201_CREATED)
async def create_demo_clinic(
    payload: DemoClinicRequest,
    current_user: Annotated[dict, Depends(require_role("salesman", "admin"))],
) -> ApiResponse[VenueResponse]:
    """Instantly generate a full working clinic for a demo.
    
    1. Finds or creates a provider account using doctor_phone.
    2. Creates a venue (draft/unapproved).
    3. Creates a staff member.
    4. Creates a default service.
    5. Sets default availability.
    """
    timestamp = utc_now()
    user_repo = UserRepository()
    
    # 1. Find or create Provider User
    provider_user = await user_repo.find_by_identifier(payload.doctor_phone)
    if provider_user is None:
        document = {
            "phone": payload.doctor_phone,
            "name_ar": "طبيب",
            "name_en": "Doctor",
            "email": None,
            "is_active": True,
            "otp_code": None,
            "otp_expires_at": None,
            "refresh_token": None,
            "created_at": timestamp,
            "updated_at": timestamp,
            "role": "provider",
            "preferred_channel": "whatsapp",
            "hashed_password": None,
            "reset_token": None,
            "reset_token_expires_at": None,
        }
        provider_user = await user_repo.create(document)
        
    if provider_user["role"] != "provider":
        provider_user = await user_repo.update_by_id(str(provider_user["_id"]), {"role": "provider", "updated_at": timestamp})
        if not provider_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="User exists but could not be upgraded to a provider. Cannot attach clinic."
            )

    # 2. Create Venue
    venue_doc = {
        "slug": payload.slug,
        "name_ar": payload.clinic_name,
        "name_en": payload.clinic_name,
        "category": payload.specialty,
        "governorate": payload.governorate,
        "area": "منطقة تجريبية",
        "address_ar": "عنوان تجريبي",
        "address_en": "Demo Address",
        "latitude": None,
        "longitude": None,
        "phone": payload.doctor_phone,
        "is_approved": False, # Draft state!
        "subscription_status": "trial",
        "trial_ends_at": timestamp,
        "billing_notes": "Created via Demo Setup",
        "owner_id": str(provider_user["_id"]),
        "created_by": str(current_user["_id"]),
        "created_at": timestamp,
        "updated_at": timestamp,
    }
    
    try:
        venue = await VenueRepository().create(venue_doc)
    except DuplicateKeyError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Clinic slug already exists.") from exc

    # 3. Create Staff
    staff_doc = {
        "venue_id": str(venue["_id"]),
        "name_ar": "دكتور",
        "name_en": "Doctor",
        "title_ar": "أخصائي",
        "title_en": "Specialist",
        "bio_ar": "حساب تجريبي",
        "bio_en": "Demo Account",
        "photo_url": None,
        "is_bookable": True,
        "is_active": True,
        "created_at": timestamp,
        "updated_at": timestamp,
    }
    staff = await StaffRepository().create(staff_doc)

    # 4. Create Service
    service_doc = {
        "staff_id": str(staff["_id"]),
        "venue_id": str(venue["_id"]),
        "category": payload.specialty,
        "name_ar": "كشف",
        "name_en": "Consultation",
        "description_ar": "كشف تجريبي",
        "description_en": "Demo Consultation",
        "duration_minutes": 30,
        "buffer_minutes": 0,
        "price": 200.0,
        "is_active": True,
        "created_at": timestamp,
        "updated_at": timestamp,
    }
    await ServiceRepository().create(service_doc)

    # 5. Create Default Availability (Mon-Fri, 9am to 5pm)
    availability_rows = []
    for day in range(0, 5): # 0=Monday, 4=Friday
        availability_rows.append({
            "staff_id": str(staff["_id"]),
            "day_of_week": day,
            "start_time": "09:00",
            "end_time": "17:00",
            "is_active": True,
            "created_at": timestamp,
            "updated_at": timestamp,
        })
    await AvailabilityRepository().replace_for_staff(str(staff["_id"]), availability_rows)

    return ApiResponse(data=serialize_venue(venue))

@router.get("/clinics", response_model=ApiResponse[list[VenueResponse]])
async def get_salesman_clinics(
    current_user: Annotated[dict, Depends(require_role("salesman", "admin"))],
) -> ApiResponse[list[VenueResponse]]:
    """Get all clinics created by this salesman."""
    user_id = str(current_user["_id"])
    repo = VenueRepository()
    
    # We need a custom query here or a new method in VenueRepository
    # Since we are using standard PyMongo we can directly query
    cursor = repo.collection.find({"created_by": user_id}).sort("created_at", -1)
    venues = await cursor.to_list(length=100)
    
    return ApiResponse(data=[serialize_venue(v) for v in venues])


@router.post("/clinics/{venue_id}/send-welcome", response_model=ApiResponse[dict], status_code=status.HTTP_200_OK)
async def salesman_send_welcome(
    venue_id: str,
    payload: SendWelcomeRequest,
    current_user: Annotated[dict, Depends(require_role("salesman", "admin"))],
) -> ApiResponse[dict]:
    """Send welcome message to a clinic owner."""
    venue = await VenueRepository().find_by_id(venue_id)
    if not venue:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Clinic not found.")
    
    # Ensure this salesman owns the clinic or is admin
    if current_user["role"] != "admin" and venue.get("created_by") != str(current_user["_id"]):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only send messages to clinics you onboarded.")
        
    owner = await UserRepository().find_by_id(venue["owner_id"])
    if not owner:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Clinic owner not found.")

    from app.services.notifications import send_clinic_welcome_msg
    import asyncio
    asyncio.create_task(send_clinic_welcome_msg(venue, owner, payload.language, payload.password))

    return ApiResponse(data={"message": "Welcome message sent."})


from app.schemas.auth import AuthTokensData
from app.core.security import create_access_token, create_refresh_token, hash_token

@router.post("/clinics/{venue_id}/impersonate", response_model=ApiResponse[AuthTokensData], status_code=status.HTTP_200_OK)
async def salesman_impersonate_clinic(
    venue_id: str,
    current_user: Annotated[dict, Depends(require_role("salesman", "admin"))],
) -> ApiResponse[AuthTokensData]:
    """Impersonate the clinic owner of a clinic onboarded by this salesman."""
    venue = await VenueRepository().find_by_id(venue_id)
    if not venue:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Clinic not found.")
    
    if current_user["role"] != "admin" and venue.get("created_by") != str(current_user["_id"]):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only impersonate clinics you onboarded.")
        
    owner = await UserRepository().find_by_id(venue["owner_id"])
    if not owner:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Clinic owner not found.")
        
    access_token, access_expires_at = create_access_token(str(owner["_id"]), owner["role"])
    refresh_token, refresh_expires_at = create_refresh_token(str(owner["_id"]), owner["role"])
    
    await UserRepository().update_by_id(str(owner["_id"]), {
        "refresh_token": hash_token(refresh_token),
        "updated_at": utc_now(),
    })
    
    from app.services.serializers import serialize_user
    tokens_data = AuthTokensData(
        access_token=access_token,
        refresh_token=refresh_token,
        access_token_expires_at=access_expires_at,
        refresh_token_expires_at=refresh_expires_at,
        user=serialize_user(owner)
    )
    return ApiResponse(data=tokens_data)


@router.post("/impersonate-patient", response_model=ApiResponse[AuthTokensData], status_code=status.HTTP_200_OK)
async def salesman_impersonate_patient(
    current_user: Annotated[dict, Depends(require_role("salesman", "admin"))],
) -> ApiResponse[AuthTokensData]:
    """Log the salesman into a dummy patient account to test the booking flow."""
    user_repo = UserRepository()
    patient_phone = current_user["phone"] + "000"
    
    patient_user = await user_repo.find_by_identifier(patient_phone)
    if not patient_user:
        patient_user = await user_repo.create({
            "phone": patient_phone,
            "name_ar": current_user.get("name_ar", "Test") + " (مريض)",
            "name_en": current_user.get("name_en", "Test") + " (Patient)",
            "email": current_user.get("email", "") + "+patient@khalas.com" if current_user.get("email") else None,
            "is_active": True,
            "role": "patient",
            "preferred_channel": "whatsapp",
            "created_at": utc_now(),
            "updated_at": utc_now(),
        })
        
    access_token, access_expires_at = create_access_token(str(patient_user["_id"]), patient_user["role"])
    refresh_token, refresh_expires_at = create_refresh_token(str(patient_user["_id"]), patient_user["role"])
    
    await user_repo.update_by_id(str(patient_user["_id"]), {
        "refresh_token": hash_token(refresh_token),
        "updated_at": utc_now(),
    })
    
    from app.services.serializers import serialize_user
    tokens_data = AuthTokensData(
        access_token=access_token,
        refresh_token=refresh_token,
        access_token_expires_at=access_expires_at,
        refresh_token_expires_at=refresh_expires_at,
        user=serialize_user(patient_user)
    )
    return ApiResponse(data=tokens_data)
