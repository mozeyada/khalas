"""Provider management endpoints."""

from __future__ import annotations

from collections import defaultdict
from datetime import timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.errors import DuplicateKeyError

from app.api.deps import require_role
from app.core.security import utc_now
from app.repositories.availability import AvailabilityRepository
from app.repositories.services import ServiceRepository
from app.repositories.staff import StaffRepository
from app.repositories.venues import VenueRepository
from app.schemas.availability import AvailabilityEntry, AvailabilityUpdateRequest
from app.schemas.common import ApiResponse
from app.schemas.service import ServiceCreateRequest, ServiceResponse, ServiceUpdateRequest
from app.schemas.staff import StaffCreateRequest, StaffResponse, StaffUpdateRequest
from app.schemas.user import Role, UserProfile
from app.schemas.venue import VenueCreateRequest, VenueResponse, VenueUpdateRequest, TeamMemberInviteRequest
from app.services.serializers import serialize_service, serialize_staff, serialize_venue

router = APIRouter(prefix="/provider", tags=["provider"])


def validate_availability(slots: list[AvailabilityEntry]) -> None:
    """Validate that availability rows do not overlap and have positive ranges."""
    grouped: dict[int, list[AvailabilityEntry]] = defaultdict(list)
    for slot in slots:
        if slot.start_time >= slot.end_time:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Availability start_time must be earlier than end_time.",
            )
        grouped[slot.day_of_week].append(slot)

    for day_slots in grouped.values():
        ordered = sorted(day_slots, key=lambda slot: (slot.start_time, slot.end_time))
        for previous, current in zip(ordered, ordered[1:], strict=False):
            if current.start_time < previous.end_time:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Availability slots cannot overlap on the same day.",
                )


async def require_owned_venue(venue_id: str, user_id: str) -> dict:
    """Return a venue if it belongs to the provider or they are staff."""
    venue = await VenueRepository().find_by_id(venue_id)
    if venue is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Venue not found.")
    if venue["owner_id"] != user_id and user_id not in venue.get("staff_users", []):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Venue does not belong to this provider.")
    return venue


async def require_owned_staff(staff_id: str, owner_id: str) -> tuple[dict, dict]:
    """Return staff and its venue when owned by the provider."""
    staff = await StaffRepository().find_by_id(staff_id)
    if staff is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Staff member not found.")
    venue = await require_owned_venue(staff["venue_id"], owner_id)
    return staff, venue


async def require_owned_service(service_id: str, owner_id: str) -> tuple[dict, dict, dict]:
    """Return service, staff, and venue when owned by the provider."""
    service = await ServiceRepository().find_by_id(service_id)
    if service is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found.")
    staff, venue = await require_owned_staff(service["staff_id"], owner_id)
    return service, staff, venue


@router.get("/venues", response_model=ApiResponse[list[VenueResponse]], status_code=status.HTTP_200_OK)
async def list_provider_venues(
    current_user: Annotated[dict, Depends(require_role("provider"))],
) -> ApiResponse[list[VenueResponse]]:
    """List venues owned by the authenticated provider."""
    venues = await VenueRepository().list_by_owner(str(current_user["_id"]))
    return ApiResponse(data=[serialize_venue(venue) for venue in venues])


@router.post("/venues", response_model=ApiResponse[VenueResponse], status_code=status.HTTP_201_CREATED)
async def create_provider_venue(
    payload: VenueCreateRequest,
    current_user: Annotated[dict, Depends(require_role("provider"))],
) -> ApiResponse[VenueResponse]:
    """Create a new venue for the authenticated provider."""
    timestamp = utc_now()
    document = {
        **payload.model_dump(),
        "is_approved": False,
        "subscription_status": "trial",
        "trial_ends_at": timestamp + timedelta(days=30),
        "billing_notes": None,
        "owner_id": str(current_user["_id"]),
        "created_at": timestamp,
        "updated_at": timestamp,
    }
    try:
        venue = await VenueRepository().create(document)
    except DuplicateKeyError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Venue slug already exists.") from exc
    return ApiResponse(data=serialize_venue(venue))


@router.put("/venues/{venue_id}", response_model=ApiResponse[VenueResponse], status_code=status.HTTP_200_OK)
async def update_provider_venue(
    venue_id: str,
    payload: VenueUpdateRequest,
    current_user: Annotated[dict, Depends(require_role("provider"))],
) -> ApiResponse[VenueResponse]:
    """Update an existing venue owned by the provider."""
    await require_owned_venue(venue_id, str(current_user["_id"]))
    venue = await VenueRepository().update_by_id(
        venue_id,
        {
            **payload.model_dump(),
            "updated_at": utc_now(),
        },
    )
    if venue is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Venue not found.")
    return ApiResponse(data=serialize_venue(venue))


@router.get("/venues/{venue_id}/team", response_model=ApiResponse[list[UserProfile]], status_code=status.HTTP_200_OK)
async def list_venue_team(
    venue_id: str,
    current_user: Annotated[dict, Depends(require_role("provider"))],
) -> ApiResponse[list[UserProfile]]:
    """List all team members who have access to this venue."""
    venue = await require_owned_venue(venue_id, str(current_user["_id"]))
    
    user_ids = [venue["owner_id"]] + venue.get("staff_users", [])
    from app.repositories.users import UserRepository
    users = await UserRepository().list_by_ids(user_ids)
    
    data = [UserProfile.model_validate({
        "_id": str(u["_id"]),
        "phone": u.get("phone"),
        "email": u.get("email"),
        "name_ar": u.get("name_ar", ""),
        "name_en": u.get("name_en", ""),
        "role": u.get("role", "provider"),
        "is_active": u.get("is_active", True),
        "preferred_channel": u.get("preferred_channel", "whatsapp"),
        "created_at": u.get("created_at"),
        "updated_at": u.get("updated_at"),
    }) for u in users]
    
    return ApiResponse(data=data)


@router.post("/venues/{venue_id}/team", response_model=ApiResponse[list[UserProfile]], status_code=status.HTTP_201_CREATED)
async def invite_team_member(
    venue_id: str,
    payload: TeamMemberInviteRequest,
    current_user: Annotated[dict, Depends(require_role("provider"))],
) -> ApiResponse[list[UserProfile]]:
    """Invite a new team member by phone number. Creates an account if missing."""
    venue = await require_owned_venue(venue_id, str(current_user["_id"]))
    # Only owner can add team members
    if venue["owner_id"] != str(current_user["_id"]):
         raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the venue owner can invite team members.")
         
    from app.repositories.users import UserRepository
    user_repo = UserRepository()
    target_user = await user_repo.find_by_identifier(payload.phone)
    
    if target_user is None:
        timestamp = utc_now()
        document = {
            "phone": payload.phone,
            "name_ar": "عضو فريق",
            "name_en": "Team Member",
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
        target_user = await user_repo.create(document)
        
    target_id = str(target_user["_id"])
    if target_id == venue["owner_id"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot invite the venue owner.")
        
    staff_users = venue.get("staff_users", [])
    if target_id not in staff_users:
        staff_users.append(target_id)
        await VenueRepository().update_by_id(venue_id, {"staff_users": staff_users, "updated_at": utc_now()})
        
    return await list_venue_team(venue_id, current_user)


@router.post("/venues/{venue_id}/staff", response_model=ApiResponse[StaffResponse], status_code=status.HTTP_201_CREATED)
async def create_staff_member(
    venue_id: str,
    payload: StaffCreateRequest,
    current_user: Annotated[dict, Depends(require_role("provider"))],
) -> ApiResponse[StaffResponse]:
    """Add a staff member to a provider-owned venue."""
    await require_owned_venue(venue_id, str(current_user["_id"]))
    timestamp = utc_now()
    document = {
        **payload.model_dump(),
        "venue_id": venue_id,
        "created_at": timestamp,
        "updated_at": timestamp,
    }
    staff = await StaffRepository().create(document)
    return ApiResponse(data=serialize_staff(staff))


@router.put("/staff/{staff_id}", response_model=ApiResponse[StaffResponse], status_code=status.HTTP_200_OK)
async def update_staff_member(
    staff_id: str,
    payload: StaffUpdateRequest,
    current_user: Annotated[dict, Depends(require_role("provider"))],
) -> ApiResponse[StaffResponse]:
    """Update a staff member belonging to the provider."""
    await require_owned_staff(staff_id, str(current_user["_id"]))
    staff = await StaffRepository().update_by_id(
        staff_id,
        {
            **payload.model_dump(),
            "updated_at": utc_now(),
        },
    )
    if staff is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Staff member not found.")
    return ApiResponse(data=serialize_staff(staff))


@router.post("/staff/{staff_id}/services", response_model=ApiResponse[ServiceResponse], status_code=status.HTTP_201_CREATED)
async def create_service(
    staff_id: str,
    payload: ServiceCreateRequest,
    current_user: Annotated[dict, Depends(require_role("provider"))],
) -> ApiResponse[ServiceResponse]:
    """Add a service to a staff member in a provider-owned venue."""
    staff, venue = await require_owned_staff(staff_id, str(current_user["_id"]))
    timestamp = utc_now()
    document = {
        **payload.model_dump(),
        "staff_id": staff_id,
        "venue_id": staff["venue_id"],
        "category": venue["category"],
        "created_at": timestamp,
        "updated_at": timestamp,
    }
    service = await ServiceRepository().create(document)
    return ApiResponse(data=serialize_service(service))


@router.put("/services/{service_id}", response_model=ApiResponse[ServiceResponse], status_code=status.HTTP_200_OK)
async def update_service(
    service_id: str,
    payload: ServiceUpdateRequest,
    current_user: Annotated[dict, Depends(require_role("provider"))],
) -> ApiResponse[ServiceResponse]:
    """Update a provider-owned service."""
    _, staff, venue = await require_owned_service(service_id, str(current_user["_id"]))
    service = await ServiceRepository().update_by_id(
        service_id,
        {
            **payload.model_dump(),
            "staff_id": str(staff["_id"]),
            "venue_id": staff["venue_id"],
            "category": venue["category"],
            "updated_at": utc_now(),
        },
    )
    if service is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found.")
    return ApiResponse(data=serialize_service(service))


@router.get("/staff/{staff_id}/availability", response_model=ApiResponse[list[AvailabilityEntry]], status_code=status.HTTP_200_OK)
async def get_staff_availability(
    staff_id: str,
    current_user: Annotated[dict, Depends(require_role("provider"))],
) -> ApiResponse[list[AvailabilityEntry]]:
    """Return the saved schedule for a provider-owned staff member."""
    await require_owned_staff(staff_id, str(current_user["_id"]))
    rows = await AvailabilityRepository().list_by_staff(staff_id)
    data = [
        AvailabilityEntry.model_validate(
            {
                "day_of_week": row["day_of_week"],
                "start_time": row["start_time"],
                "end_time": row["end_time"],
                "is_active": row["is_active"],
            }
        )
        for row in rows
    ]
    return ApiResponse(data=data)


@router.put("/staff/{staff_id}/availability", response_model=ApiResponse[list[AvailabilityEntry]], status_code=status.HTTP_200_OK)
async def update_staff_availability(
    staff_id: str,
    payload: AvailabilityUpdateRequest,
    current_user: Annotated[dict, Depends(require_role("provider"))],
) -> ApiResponse[list[AvailabilityEntry]]:
    """Replace the schedule for a provider-owned staff member."""
    await require_owned_staff(staff_id, str(current_user["_id"]))
    validate_availability(payload.slots)
    rows = [
        {
            "staff_id": staff_id,
            "day_of_week": slot.day_of_week,
            "start_time": slot.start_time,
            "end_time": slot.end_time,
            "is_active": slot.is_active,
            "created_at": utc_now(),
            "updated_at": utc_now(),
        }
        for slot in payload.slots
    ]
    saved_rows = await AvailabilityRepository().replace_for_staff(staff_id, rows)
    data = [
        AvailabilityEntry.model_validate(
            {
                "day_of_week": row["day_of_week"],
                "start_time": row["start_time"],
                "end_time": row["end_time"],
                "is_active": row["is_active"],
            }
        )
        for row in saved_rows
    ]
    return ApiResponse(data=data)
