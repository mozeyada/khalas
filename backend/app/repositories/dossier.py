"""Dossier repository — patient pre-visit medical file uploads."""

from __future__ import annotations

from bson.errors import InvalidId

from app.db.mongodb import get_collection
from app.db.utils import to_object_id
from app.models.collections import DOSSIER_COLLECTION


class DossierRepository:
    """Data access for patient dossiers."""

    @property
    def collection(self):
        """Return the MongoDB collection."""
        return get_collection(DOSSIER_COLLECTION)

    async def find_by_appointment_id(self, appointment_id: str) -> dict | None:
        """Return a dossier by appointment_id."""
        return await self.collection.find_one({"appointment_id": appointment_id})

    async def find_by_patient_id(self, patient_id: str) -> list[dict]:
        """Return all dossiers belonging to a patient."""
        cursor = self.collection.find({"patient_id": patient_id}).sort("created_at", -1)
        return await cursor.to_list(length=None)

    async def has_dossier(self, appointment_id: str) -> bool:
        """Quick check: does an appointment have a dossier?"""
        count = await self.collection.count_documents({"appointment_id": appointment_id})
        return count > 0

    async def has_dossiers_for_appointments(self, appointment_ids: list[str]) -> set[str]:
        """Return set of appointment_ids that have a dossier (for bulk badge rendering)."""
        cursor = self.collection.find(
            {"appointment_id": {"$in": appointment_ids}},
            {"appointment_id": 1},
        )
        docs = await cursor.to_list(length=None)
        return {d["appointment_id"] for d in docs}

    async def upsert(self, appointment_id: str, patient_id: str, payload: dict) -> dict:
        """Create or update a dossier. Returns the final document."""
        from app.core.security import utc_now
        now = utc_now()

        existing = await self.find_by_appointment_id(appointment_id)
        if existing is None:
            doc = {
                "appointment_id": appointment_id,
                "patient_id": patient_id,
                **payload,
                "created_at": now,
                "updated_at": now,
            }
            result = await self.collection.insert_one(doc)
            return await self.collection.find_one({"_id": result.inserted_id})
        else:
            update = {**payload, "updated_at": now}
            await self.collection.update_one(
                {"appointment_id": appointment_id},
                {"$set": update},
            )
            return await self.collection.find_one({"appointment_id": appointment_id})

    async def delete_file(self, appointment_id: str, file_index: int) -> dict | None:
        """Remove a file from the files list by index."""
        from app.core.security import utc_now
        doc = await self.find_by_appointment_id(appointment_id)
        if doc is None:
            return None
        files = doc.get("files", [])
        if file_index < 0 or file_index >= len(files):
            return doc
        files.pop(file_index)
        await self.collection.update_one(
            {"appointment_id": appointment_id},
            {"$set": {"files": files, "updated_at": utc_now()}},
        )
        return await self.find_by_appointment_id(appointment_id)
