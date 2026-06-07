"""Serialization helpers for MongoDB documents."""

from __future__ import annotations

from app.db.utils import stringify_object_id
from app.schemas.appointment import AppointmentResponse
from app.schemas.service import PublicServiceResponse, ServiceResponse
from app.schemas.staff import PublicStaffResponse, StaffResponse
from app.schemas.user import UserProfile
from app.schemas.venue import PublicVenueResponse, VenueResponse


def serialize_user(document: dict) -> UserProfile:
    """Serialize a user document into an API schema."""
    payload = {
        "_id": stringify_object_id(document["_id"]),
        "phone": document["phone"],
        "email": document.get("email"),
        "name_ar": document["name_ar"],
        "name_en": document["name_en"],
        "role": document["role"],
        "provider_type": document.get("provider_type"),
        "is_active": document["is_active"],
        "preferred_channel": document.get("preferred_channel", "whatsapp"),
        "created_at": document["created_at"],
        "updated_at": document["updated_at"],
    }
    return UserProfile.model_validate(payload)


def serialize_venue(document: dict) -> VenueResponse:
    """Serialize a venue document into an API schema."""
    payload = {
        "_id": stringify_object_id(document["_id"]),
        "slug": document["slug"],
        "name_ar": document["name_ar"],
        "name_en": document["name_en"],
        "category": document["category"],
        "description_ar": document.get("description_ar"),
        "description_en": document.get("description_en"),
        "governorate": document["governorate"],
        "area": document["area"],
        "address_ar": document["address_ar"],
        "address_en": document["address_en"],
        "phone": document["phone"],
        "email": document.get("email"),
        "website": document.get("website"),
        "logo_url": document.get("logo_url"),
        "cover_photo_url": document.get("cover_photo_url"),
        "photos": document.get("photos", []),
        "is_approved": document["is_approved"],
        "subscription_status": document["subscription_status"],
        "trial_ends_at": document.get("trial_ends_at", document["created_at"]),
        "billing_notes": document.get("billing_notes"),
        "owner_id": document["owner_id"],
        "staff_users": document.get("staff_users", []),
        "created_at": document["created_at"],
        "updated_at": document["updated_at"],
    }
    return VenueResponse.model_validate(payload)


def serialize_public_venue(document: dict) -> PublicVenueResponse:
    """Serialize a venue document for public consumption."""
    payload = {
        "_id": stringify_object_id(document["_id"]),
        "slug": document["slug"],
        "name_ar": document["name_ar"],
        "name_en": document["name_en"],
        "category": document["category"],
        "description_ar": document.get("description_ar"),
        "description_en": document.get("description_en"),
        "governorate": document["governorate"],
        "area": document["area"],
        "address_ar": document["address_ar"],
        "address_en": document["address_en"],
        "phone": document["phone"],
        "email": document.get("email"),
        "website": document.get("website"),
        "logo_url": document.get("logo_url"),
        "cover_photo_url": document.get("cover_photo_url"),
        "photos": document.get("photos", []),
    }
    return PublicVenueResponse.model_validate(payload)


def serialize_staff(document: dict) -> StaffResponse:
    """Serialize a staff document into an API schema."""
    payload = {
        "_id": stringify_object_id(document["_id"]),
        "venue_id": document["venue_id"],
        "user_id": document.get("user_id"),
        "name_ar": document["name_ar"],
        "name_en": document["name_en"],
        "title_ar": document.get("title_ar"),
        "title_en": document.get("title_en"),
        "specialty_ar": document.get("specialty_ar"),
        "specialty_en": document.get("specialty_en"),
        "bio_ar": document.get("bio_ar"),
        "bio_en": document.get("bio_en"),
        "photo_url": document.get("photo_url"),
        "is_bookable": document["is_bookable"],
        "is_active": document["is_active"],
        "created_at": document["created_at"],
        "updated_at": document["updated_at"],
    }
    return StaffResponse.model_validate(payload)


def serialize_public_staff(document: dict) -> PublicStaffResponse:
    """Serialize a staff document for public consumption."""
    payload = {
        "_id": stringify_object_id(document["_id"]),
        "venue_id": document["venue_id"],
        "name_ar": document["name_ar"],
        "name_en": document["name_en"],
        "title_ar": document.get("title_ar"),
        "title_en": document.get("title_en"),
        "specialty_ar": document.get("specialty_ar"),
        "specialty_en": document.get("specialty_en"),
        "bio_ar": document.get("bio_ar"),
        "bio_en": document.get("bio_en"),
        "photo_url": document.get("photo_url"),
    }
    return PublicStaffResponse.model_validate(payload)


def serialize_service(document: dict) -> ServiceResponse:
    """Serialize a service document into an API schema."""
    payload = {
        "_id": stringify_object_id(document["_id"]),
        "staff_id": document["staff_id"],
        "venue_id": document["venue_id"],
        "name_ar": document["name_ar"],
        "name_en": document["name_en"],
        "description_ar": document.get("description_ar"),
        "description_en": document.get("description_en"),
        "duration_minutes": document["duration_minutes"],
        "buffer_minutes": document["buffer_minutes"],
        "price": document["price"],
        "category": document["category"],
        "is_active": document["is_active"],
        "created_at": document["created_at"],
        "updated_at": document["updated_at"],
    }
    return ServiceResponse.model_validate(payload)


def serialize_public_service(document: dict) -> PublicServiceResponse:
    """Serialize a service document for public consumption."""
    payload = {
        "_id": stringify_object_id(document["_id"]),
        "staff_id": document["staff_id"],
        "venue_id": document["venue_id"],
        "name_ar": document["name_ar"],
        "name_en": document["name_en"],
        "description_ar": document.get("description_ar"),
        "description_en": document.get("description_en"),
        "duration_minutes": document["duration_minutes"],
        "buffer_minutes": document["buffer_minutes"],
        "price": document["price"],
        "category": document["category"],
    }
    return PublicServiceResponse.model_validate(payload)


def serialize_appointment(document: dict) -> AppointmentResponse:
    """Serialize an appointment document into an API schema."""
    payload = {
        "_id": stringify_object_id(document["_id"]),
        "venue_id": document["venue_id"],
        "staff_id": document["staff_id"],
        "service_id": document["service_id"],
        "patient_id": document.get("patient_id"),
        "patient_name": document.get("patient_name"),
        "patient_phone": document.get("patient_phone"),
        "slot_datetime": document["slot_datetime"],
        "duration_minutes": document["duration_minutes"],
        "status": document["status"],
        "payment_method": document["payment_method"],
        "payment_status": document["payment_status"],
        "deposit_amount": document.get("deposit_amount"),
        "price_at_booking": document["price_at_booking"],
        "notes": document.get("notes"),
        "cancellation_reason": document.get("cancellation_reason"),
        "cancelled_by": document.get("cancelled_by"),
        "reminder_sent": document["reminder_sent"],
        "created_at": document["created_at"],
        "updated_at": document["updated_at"],
    }
    return AppointmentResponse.model_validate(payload)
