"""Appointment domain services."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, timedelta

from fastapi import HTTPException, status

from app.core.security import utc_now
from app.db.mongodb import get_client
from app.repositories.appointments import AppointmentRepository
from app.repositories.availability import AvailabilityRepository
from app.repositories.services import ServiceRepository
from app.repositories.staff import StaffRepository
from app.repositories.venues import VenueRepository
from app.schemas.appointment import AppointmentCreateRequest, ProviderWalkInCreateRequest, SlotResponse, SlotsAvailabilityResponse
from app.services.scheduling import (
    CAIRO_TZ,
    build_candidate_slots,
    cairo_date_range,
    cairo_range_to_utc,
    parse_requested_date,
    slot_is_available,
    slot_to_cairo_string,
)


@dataclass
class AppointmentService:
    """Booking and slot generation logic."""

    appointment_repository: AppointmentRepository
    availability_repository: AvailabilityRepository
    service_repository: ServiceRepository
    staff_repository: StaffRepository
    venue_repository: VenueRepository

    async def get_service_context(self, *, staff_id: str, service_id: str) -> tuple[dict, dict, dict]:
        """Load and validate the staff, service, and venue chain."""
        staff = await self.staff_repository.find_by_id(staff_id)
        if staff is None or not staff["is_active"] or not staff["is_bookable"]:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Staff member not found.")

        service = await self.service_repository.find_by_id(service_id)
        if service is None or service["staff_id"] != staff_id or not service["is_active"]:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found.")

        venue = await self.venue_repository.find_by_id(staff["venue_id"])
        if venue is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Venue not found.")
        if venue["subscription_status"] == "suspended":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This venue is currently unavailable.")

        return staff, service, venue

    async def get_available_slots(
        self,
        *,
        staff_id: str,
        service_id: str,
        requested_date: str | None,
    ) -> SlotsAvailabilityResponse:
        """Generate available slots for the next 7 days."""
        _, service, _ = await self.get_service_context(staff_id=staff_id, service_id=service_id)
        start_date = parse_requested_date(requested_date)
        date_from, date_to = cairo_date_range(start_date)
        availability_rows = await self.availability_repository.list_by_staff(staff_id)
        candidate_slots = build_candidate_slots(
            start_date=start_date,
            days=7,
            availability_rows=availability_rows,
            duration_minutes=service["duration_minutes"],
            buffer_minutes=service.get("buffer_minutes", 0),
        )
        range_start, range_end = cairo_range_to_utc(date_from, date_to)
        existing = await self.appointment_repository.list_for_staff_between(
            staff_id=staff_id,
            range_start=range_start,
            range_end=range_end,
            statuses=["pending", "confirmed"],
        )
        blocked_ranges = [(item["slot_datetime"], item["occupied_until"]) for item in existing]
        slots = [
            SlotResponse(
                slot_datetime=slot,
                slot_datetime_cairo=slot_to_cairo_string(slot),
                duration_minutes=service["duration_minutes"],
                buffer_minutes=service.get("buffer_minutes", 0),
            )
            for slot in candidate_slots
            if slot_is_available(slot, service["duration_minutes"], blocked_ranges)
        ]
        return SlotsAvailabilityResponse(
            staff_id=staff_id,
            service_id=service_id,
            date_from=date_from,
            date_to=date_to,
            slots=slots,
        )

    async def create_appointment(
        self,
        *,
        staff_id: str,
        patient_id: str,
        payload: AppointmentCreateRequest,
    ) -> dict:
        """Create an appointment after validating slot availability.

        The final conflict check and insert are wrapped in a MongoDB
        transaction to prevent double-booking under concurrent load.
        Atlas M0 free-tier does not support multi-document transactions;
        the code gracefully degrades to the optimistic check-then-insert
        pattern on OperationFailure and logs a warning.
        """
        _, service, venue = await self.get_service_context(staff_id=staff_id, service_id=payload.service_id)
        slot_datetime = payload.slot_datetime.astimezone(tz=UTC) if payload.slot_datetime.tzinfo else payload.slot_datetime.replace(tzinfo=UTC)
        available_slots = await self.get_available_slots(
            staff_id=staff_id,
            service_id=payload.service_id,
            requested_date=slot_datetime.astimezone(CAIRO_TZ).date().isoformat(),
        )
        if slot_datetime not in {slot.slot_datetime for slot in available_slots.slots}:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="The selected slot is not available.")

        occupied_until = slot_datetime + timedelta(minutes=service["duration_minutes"] + service.get("buffer_minutes", 0))
        timestamp = utc_now()
        document = {
            "venue_id": str(venue["_id"]),
            "staff_id": staff_id,
            "service_id": payload.service_id,
            "patient_id": patient_id,
            "slot_datetime": slot_datetime,
            "occupied_until": occupied_until,
            "duration_minutes": service["duration_minutes"],
            "buffer_minutes_at_booking": service.get("buffer_minutes", 0),
            "status": "pending",
            "payment_method": "cash",
            "payment_status": "unpaid",
            "deposit_amount": None,
            "price_at_booking": service["price"],
            "notes": payload.notes,
            "cancellation_reason": None,
            "cancelled_by": None,
            "reminder_sent": False,
            "created_at": timestamp,
            "updated_at": timestamp,
        }

        try:
            motor_client = get_client()
            async with await motor_client.start_session() as session:
                async with session.start_transaction():
                    conflicts = await self.appointment_repository.list_for_staff_between(
                        staff_id=staff_id,
                        range_start=slot_datetime,
                        range_end=occupied_until,
                        statuses=["pending", "confirmed"],
                        session=session,
                    )
                    if conflicts:
                        raise HTTPException(
                            status_code=status.HTTP_409_CONFLICT,
                            detail="The selected slot is no longer available.",
                        )
                    return await self.appointment_repository.create(document, session=session)
        except HTTPException:
            raise
        except Exception:
            # Atlas M0 or other environments that don't support transactions
            # fall back to the optimistic check-then-insert approach.
            import logging
            logging.getLogger(__name__).warning(
                "MongoDB transaction unavailable – falling back to optimistic booking insert."
            )
            conflicts = await self.appointment_repository.list_for_staff_between(
                staff_id=staff_id,
                range_start=slot_datetime,
                range_end=occupied_until,
                statuses=["pending", "confirmed"],
            )
            if conflicts:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="The selected slot is no longer available.",
                )
            return await self.appointment_repository.create(document)

    async def create_walkin_appointment(
        self,
        *,
        staff_id: str,
        payload: ProviderWalkInCreateRequest,
    ) -> dict:
        """Create a walk-in appointment from the provider dashboard."""
        _, service, venue = await self.get_service_context(staff_id=staff_id, service_id=payload.service_id)
        slot_datetime = payload.slot_datetime.astimezone(tz=UTC) if payload.slot_datetime.tzinfo else payload.slot_datetime.replace(tzinfo=UTC)
        available_slots = await self.get_available_slots(
            staff_id=staff_id,
            service_id=payload.service_id,
            requested_date=slot_datetime.astimezone(CAIRO_TZ).date().isoformat(),
        )
        if slot_datetime not in {slot.slot_datetime for slot in available_slots.slots}:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="The selected slot is not available.")

        occupied_until = slot_datetime + timedelta(minutes=service["duration_minutes"] + service.get("buffer_minutes", 0))
        timestamp = utc_now()
        document = {
            "venue_id": str(venue["_id"]),
            "staff_id": staff_id,
            "service_id": payload.service_id,
            "patient_id": None,
            "patient_name": payload.patient_name,
            "patient_phone": payload.patient_phone,
            "slot_datetime": slot_datetime,
            "occupied_until": occupied_until,
            "duration_minutes": service["duration_minutes"],
            "buffer_minutes_at_booking": service.get("buffer_minutes", 0),
            "status": "confirmed", # Walk-ins are automatically confirmed
            "payment_method": "cash",
            "payment_status": "unpaid",
            "deposit_amount": None,
            "price_at_booking": service["price"],
            "notes": payload.notes,
            "cancellation_reason": None,
            "cancelled_by": None,
            "reminder_sent": False,
            "created_at": timestamp,
            "updated_at": timestamp,
        }

        try:
            motor_client = get_client()
            async with await motor_client.start_session() as session:
                async with session.start_transaction():
                    conflicts = await self.appointment_repository.list_for_staff_between(
                        staff_id=staff_id,
                        range_start=slot_datetime,
                        range_end=occupied_until,
                        statuses=["pending", "confirmed"],
                        session=session,
                    )
                    if conflicts:
                        raise HTTPException(
                            status_code=status.HTTP_409_CONFLICT,
                            detail="The selected slot is no longer available.",
                        )
                    return await self.appointment_repository.create(document, session=session)
        except HTTPException:
            raise
        except Exception:
            import logging
            logging.getLogger(__name__).warning(
                "MongoDB transaction unavailable – falling back to optimistic booking insert."
            )
            conflicts = await self.appointment_repository.list_for_staff_between(
                staff_id=staff_id,
                range_start=slot_datetime,
                range_end=occupied_until,
                statuses=["pending", "confirmed"],
            )
            if conflicts:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="The selected slot is no longer available.",
                )
            return await self.appointment_repository.create(document)
