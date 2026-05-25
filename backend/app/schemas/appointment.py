"""Appointment and slot schemas."""

from __future__ import annotations

from datetime import date, datetime
from typing import Literal

from pydantic import Field

from app.schemas.common import APIModel, IdentifierModel, TimestampedModel

AppointmentStatus = Literal["pending", "confirmed", "cancelled", "completed", "no_show"]
PaymentMethod = Literal["cash"]
PaymentStatus = Literal["unpaid"]
CancelledBy = Literal["patient", "staff", "admin"] | None


class SlotResponse(APIModel):
    """Publicly available slot returned for booking."""

    slot_datetime: datetime
    slot_datetime_cairo: str
    duration_minutes: int
    buffer_minutes: int


class SlotsAvailabilityResponse(APIModel):
    """Slots grouped for a staff member and service."""

    staff_id: str
    service_id: str
    date_from: date
    date_to: date
    slots: list[SlotResponse]


class AppointmentCreateRequest(APIModel):
    """Payload for creating an appointment."""

    service_id: str
    slot_datetime: datetime
    notes: str | None = None


class ProviderWalkInCreateRequest(APIModel):
    """Payload for provider to create a walk-in appointment."""

    service_id: str
    slot_datetime: datetime
    patient_name: str
    patient_phone: str | None = None
    notes: str | None = None


class AppointmentResponse(IdentifierModel, TimestampedModel):
    """Appointment record returned via the API."""

    venue_id: str
    staff_id: str
    service_id: str
    patient_id: str | None = None
    patient_name: str | None = None
    patient_phone: str | None = None
    slot_datetime: datetime
    duration_minutes: int
    status: AppointmentStatus
    payment_method: PaymentMethod
    payment_status: PaymentStatus
    deposit_amount: int | None = None
    price_at_booking: int
    notes: str | None = None
    cancellation_reason: str | None = None
    cancelled_by: CancelledBy = None
    reminder_sent: bool = False


class AppointmentCancelRequest(APIModel):
    """Payload for patient cancellation."""

    cancellation_reason: str | None = None


class ProviderAppointmentStatusUpdateRequest(APIModel):
    """Payload for provider appointment status updates."""

    status: Literal["confirmed", "cancelled", "completed", "no_show"]
    cancellation_reason: str | None = None
