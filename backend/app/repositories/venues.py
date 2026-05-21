"""Venue repository."""

from __future__ import annotations

from bson.errors import InvalidId

from app.db.mongodb import get_collection
from app.db.utils import to_object_id
from app.models.collections import VENUES_COLLECTION


class VenueRepository:
    """Data access for venue records."""

    @property
    def collection(self):
        """Return the MongoDB collection."""
        return get_collection(VENUES_COLLECTION)

    async def find_by_slug(self, slug: str) -> dict | None:
        """Return a venue by slug."""
        return await self.collection.find_one({"slug": slug})

    async def find_by_id(self, venue_id: str) -> dict | None:
        """Return a venue by id."""
        try:
            return await self.collection.find_one({"_id": to_object_id(venue_id)})
        except InvalidId:
            return None

    async def list_by_owner(self, owner_id: str) -> list[dict]:
        """List venues owned by a provider."""
        cursor = self.collection.find({"owner_id": owner_id}).sort("created_at", 1)
        return await cursor.to_list(length=None)

    async def create(self, payload: dict) -> dict:
        """Insert a venue and return it."""
        result = await self.collection.insert_one(payload)
        return await self.collection.find_one({"_id": result.inserted_id})

    async def update_by_id(self, venue_id: str, update: dict) -> dict | None:
        """Update a venue by id."""
        try:
            object_id = to_object_id(venue_id)
        except InvalidId:
            return None
        await self.collection.update_one({"_id": object_id}, {"$set": update})
        return await self.collection.find_one({"_id": object_id})

    async def search(
        self,
        *,
        q: str | None,
        governorate: str | None,
        category: str | None,
        limit: int = 20,
        skip: int = 0,
    ) -> list[dict]:
        """Full-text search on approved venues with optional filters."""
        query: dict = {"is_approved": True}
        if q:
            query["$text"] = {"$search": q}
        if governorate:
            query["governorate"] = governorate
        if category:
            query["category"] = category
        sort = [("score", {"$meta": "textScore"})] if q else [("created_at", -1)]
        cursor = self.collection.find(
            query,
            {"score": {"$meta": "textScore"}} if q else {},
        ).sort(sort).skip(skip).limit(limit)
        return await cursor.to_list(length=None)

    async def list_all(self, *, skip: int = 0, limit: int = 50) -> list[dict]:
        """List all venues (admin use)."""
        cursor = self.collection.find({}).sort("created_at", -1).skip(skip).limit(limit)
        return await cursor.to_list(length=None)

