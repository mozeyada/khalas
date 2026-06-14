"""Dossier endpoints — patient pre-visit medical file uploads."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import require_role
from app.repositories.appointments import AppointmentRepository
from app.repositories.dossier import DossierRepository
from app.repositories.venues import VenueRepository
from app.schemas.common import ApiResponse
from app.schemas.dossier import DossierResponse, DossierUpsertRequest

router = APIRouter(tags=["dossier"])

MAX_FILES = 5
MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB base64 ~ 6.8 MB raw


def _serialize_dossier(doc: dict) -> dict:
    """Normalize ObjectId → string for the response."""
    return {**doc, "_id": str(doc["_id"])}


@router.post(
    "/dossier/{appointment_id}",
    response_model=ApiResponse[DossierResponse],
    status_code=status.HTTP_200_OK,
)
async def upsert_dossier(
    appointment_id: str,
    payload: DossierUpsertRequest,
    current_user: Annotated[dict, Depends(require_role("patient"))],
) -> ApiResponse[DossierResponse]:
    """Patient creates or updates their pre-visit dossier for a specific appointment."""
    # Verify appointment belongs to this patient
    appointment = await AppointmentRepository().find_by_id(appointment_id)
    if appointment is None or appointment.get("patient_id") != str(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found.",
        )
    if appointment.get("status") in ("cancelled", "completed"):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot update dossier for a cancelled or completed appointment.",
        )

    # Validate file count
    files = payload.files or []
    if len(files) > MAX_FILES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Maximum {MAX_FILES} files allowed.",
        )

    # Validate file sizes
    for f in files:
        # base64 length ≈ actual bytes * 1.33
        approx_bytes = len(f.file_data_base64.encode()) * 0.75
        if approx_bytes > MAX_FILE_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File '{f.filename}' exceeds the 5 MB size limit.",
            )

    data = payload.model_dump(exclude_none=True)
    doc = await DossierRepository().upsert(
        appointment_id=appointment_id,
        patient_id=str(current_user["_id"]),
        payload=data,
    )
    return ApiResponse(data=_serialize_dossier(doc))


@router.get(
    "/dossier/{appointment_id}",
    response_model=ApiResponse[DossierResponse],
    status_code=status.HTTP_200_OK,
)
async def get_dossier(
    appointment_id: str,
    current_user: Annotated[dict, Depends(require_role("patient", "provider", "admin"))],
) -> ApiResponse[DossierResponse]:
    """Fetch a dossier — accessible by the owning patient or the appointment's provider."""
    appointment = await AppointmentRepository().find_by_id(appointment_id)
    if appointment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found.")

    user_id = str(current_user["_id"])
    user_role = current_user.get("role")

    if user_role == "patient":
        if appointment.get("patient_id") != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
    elif user_role == "provider":
        # Provider must own the venue that this appointment belongs to
        venue = await VenueRepository().find_by_id(appointment["venue_id"])
        if venue is None or venue["owner_id"] != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
    # admin has full access

    doc = await DossierRepository().find_by_appointment_id(appointment_id)
    if doc is None:
        return ApiResponse(data=None)
    return ApiResponse(data=_serialize_dossier(doc))


@router.delete(
    "/dossier/{appointment_id}/files/{file_index}",
    response_model=ApiResponse[DossierResponse],
    status_code=status.HTTP_200_OK,
)
async def delete_dossier_file(
    appointment_id: str,
    file_index: int,
    current_user: Annotated[dict, Depends(require_role("patient"))],
) -> ApiResponse[DossierResponse]:
    """Patient removes a single file from their dossier by position index."""
    appointment = await AppointmentRepository().find_by_id(appointment_id)
    if appointment is None or appointment.get("patient_id") != str(current_user["_id"]):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found.")

    doc = await DossierRepository().delete_file(appointment_id, file_index)
    if doc is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dossier not found.")
    return ApiResponse(data=_serialize_dossier(doc))
