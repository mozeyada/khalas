"""Appointment repository."""

from __future__ import annotations

from datetime import datetime

from bson.errors import InvalidId

from app.db.mongodb import get_collection
from app.db.utils import to_object_id
from app.models.collections import APPOINTMENTS_COLLECTION


class AppointmentRepository:
    """Data access for appointments."""

    @property
    def collection(self):
        """Return the MongoDB collection."""
        return get_collection(APPOINTMENTS_COLLECTION)

    async def find_by_id(self, appointment_id: str) -> dict | None:
        """Return an appointment by id."""
        try:
            return await self.collection.find_one({"_id": to_object_id(appointment_id)})
        except InvalidId:
            return None

    async def create(self, payload: dict, *, session=None) -> dict:
        """Insert an appointment and return it."""
        result = await self.collection.insert_one(payload, session=session)
        return await self.collection.find_one({"_id": result.inserted_id}, session=session)

    async def update_by_id(self, appointment_id: str, update: dict) -> dict | None:
        """Update an appointment and return it."""
        try:
            object_id = to_object_id(appointment_id)
        except InvalidId:
            return None
        await self.collection.update_one({"_id": object_id}, {"$set": update})
        return await self.collection.find_one({"_id": object_id})

    async def list_for_patient(self, patient_id: str) -> list[dict]:
        """List appointments for a patient."""
        cursor = self.collection.find({"patient_id": patient_id}).sort("slot_datetime", 1)
        return await cursor.to_list(length=None)

    async def list_upcoming_for_patient(self, patient_id: str, now: datetime) -> list[dict]:
        """List upcoming appointments for a patient."""
        cursor = self.collection.find(
            {
                "patient_id": patient_id,
                "slot_datetime": {"$gte": now},
                "status": {"$in": ["pending", "confirmed"]},
            }
        ).sort("slot_datetime", 1)
        return await cursor.to_list(length=None)

    async def list_for_provider_venues(self, venue_ids: list[str]) -> list[dict]:
        """List appointments across a provider's venues."""
        cursor = self.collection.find({"venue_id": {"$in": venue_ids}}).sort("slot_datetime", 1)
        return await cursor.to_list(length=None)

    async def list_for_staff_between(
        self,
        *,
        staff_id: str,
        range_start: datetime,
        range_end: datetime,
        statuses: list[str],
        session=None,
    ) -> list[dict]:
        """List staff appointments within a time range."""
        cursor = self.collection.find(
            {
                "staff_id": staff_id,
                "status": {"$in": statuses},
                "slot_datetime": {"$lt": range_end},
                "occupied_until": {"$gt": range_start},
            },
            session=session,
        )
        return await cursor.to_list(length=None)
