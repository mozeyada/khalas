"""Staff repository."""

from __future__ import annotations

from bson.errors import InvalidId

from app.db.mongodb import get_collection
from app.db.utils import to_object_id
from app.models.collections import STAFF_COLLECTION


class StaffRepository:
    """Data access for staff records."""

    @property
    def collection(self):
        """Return the MongoDB collection."""
        return get_collection(STAFF_COLLECTION)

    async def find_by_id(self, staff_id: str) -> dict | None:
        """Return a staff member by id."""
        try:
            return await self.collection.find_one({"_id": to_object_id(staff_id)})
        except InvalidId:
            return None

    async def list_by_venue(self, venue_id: str) -> list[dict]:
        """List staff members for a venue."""
        cursor = self.collection.find({"venue_id": venue_id}).sort("created_at", 1)
        return await cursor.to_list(length=None)

    async def create(self, payload: dict) -> dict:
        """Insert a staff member and return it."""
        result = await self.collection.insert_one(payload)
        return await self.collection.find_one({"_id": result.inserted_id})

    async def update_by_id(self, staff_id: str, update: dict) -> dict | None:
        """Update a staff member by id."""
        try:
            object_id = to_object_id(staff_id)
        except InvalidId:
            return None
        await self.collection.update_one({"_id": object_id}, {"$set": update})
        return await self.collection.find_one({"_id": object_id})

