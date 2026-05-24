"""Appointment booking and management endpoints."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import require_role
from app.core.security import utc_now
from app.repositories.appointments import AppointmentRepository
from app.repositories.availability import AvailabilityRepository
from app.repositories.services import ServiceRepository
from app.repositories.staff import StaffRepository
from app.repositories.venues import VenueRepository
from app.schemas.appointment import (
    AppointmentCancelRequest,
    AppointmentCreateRequest,
    AppointmentResponse,
    ProviderAppointmentStatusUpdateRequest,
)
from app.schemas.common import ApiResponse
from app.services.appointments import AppointmentService
from app.services.notifications import (
    notify_appointment_booked,
    notify_appointment_cancelled,
    notify_appointment_confirmed,
)
from app.services.serializers import serialize_appointment
from app.repositories.users import UserRepository

router = APIRouter(tags=["appointments"])


def get_appointment_service() -> AppointmentService:
    """Build the appointment service dependency."""
    return AppointmentService(
        appointment_repository=AppointmentRepository(),
        availability_repository=AvailabilityRepository(),
        service_repository=ServiceRepository(),
        staff_repository=StaffRepository(),
        venue_repository=VenueRepository(),
    )


@router.post("/appointments", response_model=ApiResponse[AppointmentResponse], status_code=status.HTTP_201_CREATED)
async def create_appointment(
    payload: AppointmentCreateRequest,
    current_user: Annotated[dict, Depends(require_role("patient", "admin", "salesman"))],
    appointment_service: Annotated[AppointmentService, Depends(get_appointment_service)],
) -> ApiResponse[AppointmentResponse]:
    """Book an appointment for the authenticated patient."""
    service = await ServiceRepository().find_by_id(payload.service_id)
    if service is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found.")
    appointment = await appointment_service.create_appointment(
        staff_id=service["staff_id"],
        patient_id=str(current_user["_id"]),
        payload=payload,
    )
    serialized = serialize_appointment(appointment)
    # Fire-and-forget notification – does not block the response.
    import asyncio
    asyncio.create_task(notify_appointment_booked(appointment, current_user))
    return ApiResponse(data=serialized)


@router.get("/appointments/mine", response_model=ApiResponse[list[AppointmentResponse]], status_code=status.HTTP_200_OK)
async def list_my_appointments(
    current_user: Annotated[dict, Depends(require_role("patient", "admin", "salesman"))],
) -> ApiResponse[list[AppointmentResponse]]:
    """List the authenticated patient's appointments."""
    appointments = await AppointmentRepository().list_upcoming_for_patient(str(current_user["_id"]), utc_now())
    return ApiResponse(data=[serialize_appointment(item) for item in appointments])


@router.post("/appointments/{appointment_id}/cancel", response_model=ApiResponse[AppointmentResponse], status_code=status.HTTP_200_OK)
async def cancel_my_appointment(
    appointment_id: str,
    payload: AppointmentCancelRequest,
    current_user: Annotated[dict, Depends(require_role("patient", "admin", "salesman"))],
) -> ApiResponse[AppointmentResponse]:
    """Cancel a patient-owned appointment."""
    repository = AppointmentRepository()
    appointment = await repository.find_by_id(appointment_id)
    if appointment is None or appointment["patient_id"] != str(current_user["_id"]):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found.")
    if appointment["status"] == "cancelled":
        return ApiResponse(data=serialize_appointment(appointment))
    if appointment["slot_datetime"] <= utc_now():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Past appointments cannot be cancelled.")
    updated = await repository.update_by_id(
        appointment_id,
        {
            "status": "cancelled",
            "cancellation_reason": payload.cancellation_reason,
            "cancelled_by": "patient",
            "updated_at": utc_now(),
        },
    )
    assert updated is not None
    import asyncio
    asyncio.create_task(notify_appointment_cancelled(updated, current_user, "patient"))
    return ApiResponse(data=serialize_appointment(updated))


@router.get("/provider/appointments", response_model=ApiResponse[list[AppointmentResponse]], status_code=status.HTTP_200_OK)
async def list_provider_appointments(
    current_user: Annotated[dict, Depends(require_role("provider"))],
) -> ApiResponse[list[AppointmentResponse]]:
    """List appointments across all provider-owned venues."""
    venues = await VenueRepository().list_by_owner(str(current_user["_id"]))
    venue_ids = [str(venue["_id"]) for venue in venues]
    appointments = await AppointmentRepository().list_for_provider_venues(venue_ids)
    return ApiResponse(data=[serialize_appointment(item) for item in appointments])


@router.patch("/provider/appointments/{appointment_id}/status", response_model=ApiResponse[AppointmentResponse], status_code=status.HTTP_200_OK)
async def update_provider_appointment_status(
    appointment_id: str,
    payload: ProviderAppointmentStatusUpdateRequest,
    current_user: Annotated[dict, Depends(require_role("provider"))],
) -> ApiResponse[AppointmentResponse]:
    """Update the status of an appointment across provider-owned venues."""
    repository = AppointmentRepository()
    appointment = await repository.find_by_id(appointment_id)
    if appointment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found.")
    venue = await VenueRepository().find_by_id(appointment["venue_id"])
    if venue is None or venue["owner_id"] != str(current_user["_id"]):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found.")
    update = {
        "status": payload.status,
        "updated_at": utc_now(),
    }
    if payload.status == "cancelled":
        update["cancellation_reason"] = payload.cancellation_reason
        update["cancelled_by"] = "staff"
    updated = await repository.update_by_id(appointment_id, update)
    assert updated is not None
    import asyncio
    if payload.status == "confirmed":
        user = await UserRepository().find_by_id(appointment["patient_id"])
        if user:
            asyncio.create_task(notify_appointment_confirmed(updated, user))
    elif payload.status == "cancelled":
        user = await UserRepository().find_by_id(appointment["patient_id"])
        if user:
            asyncio.create_task(notify_appointment_cancelled(updated, user, "staff"))
    return ApiResponse(data=serialize_appointment(updated))
