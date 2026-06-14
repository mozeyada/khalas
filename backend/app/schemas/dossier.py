"""Dossier schemas — patient pre-visit medical file uploads."""

from __future__ import annotations

from datetime import datetime

from app.schemas.common import APIModel, IdentifierModel, TimestampedModel


class DossierFileItem(APIModel):
    """A single file attached to a dossier."""

    filename: str
    file_type: str  # e.g. image/jpeg, application/pdf
    file_data_base64: str  # raw base64 of the file bytes
    label: str | None = None  # e.g. "Chest X-ray", "Blood test results"
    uploaded_at: datetime


class DossierUpsertRequest(APIModel):
    """Patient-submitted dossier payload."""

    chief_complaint_ar: str | None = None
    chief_complaint_en: str | None = None
    files: list[DossierFileItem] | None = None  # full list replaces existing


class DossierResponse(IdentifierModel, TimestampedModel):
    """Dossier returned by the API."""

    appointment_id: str
    patient_id: str
    chief_complaint_ar: str | None = None
    chief_complaint_en: str | None = None
    files: list[DossierFileItem] = []
