"""Availability repository."""

from __future__ import annotations

from app.db.mongodb import get_collection
from app.models.collections import AVAILABILITY_COLLECTION


class AvailabilityRepository:
    """Data access for staff availability."""

    @property
    def collection(self):
        """Return the MongoDB collection."""
        return get_collection(AVAILABILITY_COLLECTION)

    async def list_by_staff(self, staff_id: str) -> list[dict]:
        """List availability rows for a staff member."""
        cursor = self.collection.find({"staff_id": staff_id}).sort([("day_of_week", 1), ("start_time", 1)])
        return await cursor.to_list(length=None)

    async def replace_for_staff(self, staff_id: str, rows: list[dict]) -> list[dict]:
        """Replace availability rows for a staff member."""
        await self.collection.delete_many({"staff_id": staff_id})
        if rows:
            await self.collection.insert_many(rows)
        return await self.list_by_staff(staff_id)
