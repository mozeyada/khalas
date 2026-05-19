"""Service repository."""

from __future__ import annotations

from bson.errors import InvalidId

from app.db.mongodb import get_collection
from app.db.utils import to_object_id
from app.models.collections import SERVICES_COLLECTION


class ServiceRepository:
    """Data access for service records."""

    @property
    def collection(self):
        """Return the MongoDB collection."""
        return get_collection(SERVICES_COLLECTION)

    async def find_by_id(self, service_id: str) -> dict | None:
        """Return a service by id."""
        try:
            return await self.collection.find_one({"_id": to_object_id(service_id)})
        except InvalidId:
            return None

    async def list_by_staff(self, staff_id: str) -> list[dict]:
        """List services for a staff member."""
        cursor = self.collection.find({"staff_id": staff_id}).sort("created_at", 1)
        return await cursor.to_list(length=None)

    async def create(self, payload: dict) -> dict:
        """Insert a service and return it."""
        result = await self.collection.insert_one(payload)
        return await self.collection.find_one({"_id": result.inserted_id})

    async def update_by_id(self, service_id: str, update: dict) -> dict | None:
        """Update a service by id."""
        try:
            object_id = to_object_id(service_id)
        except InvalidId:
            return None
        await self.collection.update_one({"_id": object_id}, {"$set": update})
        return await self.collection.find_one({"_id": object_id})

