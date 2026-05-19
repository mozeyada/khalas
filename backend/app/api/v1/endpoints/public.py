"""Public venue, staff, service, and slot endpoints."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query, status

from app.repositories.availability import AvailabilityRepository
from app.repositories.services import ServiceRepository
from app.repositories.staff import StaffRepository
from app.repositories.venues import VenueRepository
from app.schemas.appointment import SlotsAvailabilityResponse
from app.schemas.common import ApiResponse
from app.schemas.service import PublicServiceResponse
from app.schemas.staff import PublicStaffResponse
from app.schemas.venue import PublicVenueResponse
from app.services.appointments import AppointmentService
from app.services.serializers import (
    serialize_public_service,
    serialize_public_staff,
    serialize_public_venue,
)
from app.repositories.appointments import AppointmentRepository

router = APIRouter(tags=["public"])


def get_appointment_service() -> AppointmentService:
    """Build the appointment service dependency."""
    return AppointmentService(
        appointment_repository=AppointmentRepository(),
        availability_repository=AvailabilityRepository(),
        service_repository=ServiceRepository(),
        staff_repository=StaffRepository(),
        venue_repository=VenueRepository(),
    )


@router.get("/venues/{slug}", response_model=ApiResponse[PublicVenueResponse], status_code=status.HTTP_200_OK)
async def get_public_venue(slug: str) -> ApiResponse[PublicVenueResponse]:
    """Return the public venue page payload."""
    venue = await VenueRepository().find_by_slug(slug)
    if venue is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Venue not found.")
    return ApiResponse(data=serialize_public_venue(venue))


@router.get("/venues/{slug}/staff", response_model=ApiResponse[list[PublicStaffResponse]], status_code=status.HTTP_200_OK)
async def list_public_venue_staff(slug: str) -> ApiResponse[list[PublicStaffResponse]]:
    """List active bookable staff for a venue."""
    venue = await VenueRepository().find_by_slug(slug)
    if venue is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Venue not found.")
    staff = await StaffRepository().list_by_venue(str(venue["_id"]))
    visible_staff = [member for member in staff if member["is_active"] and member["is_bookable"]]
    return ApiResponse(data=[serialize_public_staff(member) for member in visible_staff])


@router.get("/staff/{staff_id}", response_model=ApiResponse[PublicStaffResponse], status_code=status.HTTP_200_OK)
async def get_public_staff(staff_id: str) -> ApiResponse[PublicStaffResponse]:
    """Return the public staff profile payload."""
    staff = await StaffRepository().find_by_id(staff_id)
    if staff is None or not staff["is_active"]:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Staff member not found.")
    return ApiResponse(data=serialize_public_staff(staff))


@router.get("/staff/{staff_id}/services", response_model=ApiResponse[list[PublicServiceResponse]], status_code=status.HTTP_200_OK)
async def list_public_staff_services(staff_id: str) -> ApiResponse[list[PublicServiceResponse]]:
    """List active services for a staff member."""
    staff = await StaffRepository().find_by_id(staff_id)
    if staff is None or not staff["is_active"]:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Staff member not found.")
    services = await ServiceRepository().list_by_staff(staff_id)
    visible_services = [service for service in services if service["is_active"]]
    return ApiResponse(data=[serialize_public_service(service) for service in visible_services])


@router.get("/staff/{staff_id}/slots", response_model=ApiResponse[SlotsAvailabilityResponse], status_code=status.HTTP_200_OK)
async def list_public_staff_slots(
    staff_id: str,
    service_id: str = Query(...),
    date: str | None = Query(default=None),
) -> ApiResponse[SlotsAvailabilityResponse]:
    """Return available slots for a staff member and service over the next 7 days."""
    data = await get_appointment_service().get_available_slots(
        staff_id=staff_id,
        service_id=service_id,
        requested_date=date,
    )
    return ApiResponse(data=data)
