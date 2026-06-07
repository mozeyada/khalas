"""QR code payload endpoint for appointment check-in."""

from __future__ import annotations

import hashlib
import hmac
import os
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.api.deps import require_role
from app.repositories.appointments import AppointmentRepository

router = APIRouter(tags=["qr"])

# HMAC secret for signing QR payloads.
# TODO(security): Move to a dedicated secret in env/KMS for production.
_QR_SECRET = os.getenv("QR_HMAC_SECRET", "").encode() or os.urandom(32)


class QRPayload(BaseModel):
    """Signed QR payload for appointment check-in."""
    appointment_id: str
    patient_id: str
    slot_datetime: str
    signature: str


@router.get(
    "/appointments/{appointment_id}/qr",
    response_model=QRPayload,
    status_code=status.HTTP_200_OK,
)
async def get_appointment_qr(
    appointment_id: str,
    current_user: Annotated[dict, Depends(require_role("patient"))],
) -> QRPayload:
    """Return a signed QR payload for clinic check-in.

    The signature is an HMAC-SHA256 of appointment_id:patient_id:slot_datetime
    using the QR_HMAC_SECRET environment variable.
    """
    repository = AppointmentRepository()
    appointment = await repository.find_by_id(appointment_id)
    if appointment is None or appointment["patient_id"] != str(current_user["_id"]):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found.")
    if appointment["status"] == "cancelled":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Cancelled appointments have no QR code.")

    slot_str = appointment["slot_datetime"].isoformat()
    message = f"{appointment_id}:{appointment['patient_id']}:{slot_str}".encode()
    mac = hmac.new(_QR_SECRET, message, hashlib.sha256)
    signature = mac.hexdigest()

    return QRPayload(
        appointment_id=appointment_id,
        patient_id=appointment["patient_id"],
        slot_datetime=slot_str,
        signature=signature,
    )


@router.post(
    "/appointments/{appointment_id}/check-in",
    response_model=dict,
    status_code=status.HTTP_200_OK,
)
async def check_in_appointment(
    appointment_id: str,
    payload: QRPayload,
    current_user: Annotated[dict, Depends(require_role("provider"))],
) -> dict:
    """Verify QR signature and check the patient in."""
    if payload.appointment_id != appointment_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Appointment ID mismatch.")
        
    repository = AppointmentRepository()
    appointment = await repository.find_by_id(appointment_id)
    if appointment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found.")
        
    # Verify signature
    slot_str = appointment["slot_datetime"].isoformat()
    message = f"{appointment_id}:{appointment['patient_id']}:{slot_str}".encode()
    mac = hmac.new(_QR_SECRET, message, hashlib.sha256)
    expected_signature = mac.hexdigest()
    
    if not hmac.compare_digest(expected_signature, payload.signature):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid QR signature.")

    if appointment["status"] not in ["scheduled", "confirmed"]:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Cannot check in appointment with status {appointment['status']}.")
        
    from app.core.security import utc_now
    await repository.update(appointment_id, {"status": "arrived", "updated_at": utc_now()})
    
    return {"message": "Check-in successful", "patient_id": appointment["patient_id"]}
