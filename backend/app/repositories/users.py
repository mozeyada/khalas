"""User repository."""

from __future__ import annotations

from datetime import datetime

from bson.errors import InvalidId

from app.db.mongodb import get_collection
from app.db.utils import to_object_id
from app.models.collections import USERS_COLLECTION


class UserRepository:
    """Data access for user records."""

    @property
    def collection(self):
        """Return the MongoDB collection."""
        return get_collection(USERS_COLLECTION)

    async def find_by_identifier(self, identifier: str) -> dict | None:
        """Return a user by phone or email."""
        return await self.collection.find_one({
            "$or": [{"phone": identifier}, {"email": identifier}]
        })

    async def find_by_id(self, user_id: str) -> dict | None:
        """Return a user by identifier."""
        try:
            return await self.collection.find_one({"_id": to_object_id(user_id)})
        except InvalidId:
            return None

    async def create(self, payload: dict) -> dict:
        """Insert a new user and return it."""
        result = await self.collection.insert_one(payload)
        return await self.collection.find_one({"_id": result.inserted_id})

    async def update_by_id(self, user_id: str, update: dict) -> dict | None:
        """Update a user by id and return the updated document."""
        try:
            object_id = to_object_id(user_id)
        except InvalidId:
            return None
        await self.collection.update_one({"_id": object_id}, {"$set": update})
        return await self.collection.find_one({"_id": object_id})

    async def update_otp_fields(
        self,
        user_id: str,
        *,
        otp_code: str | None,
        otp_expires_at: datetime | None,
    ) -> dict | None:
        """Update OTP fields for a user."""
        return await self.update_by_id(
            user_id,
            {
                "otp_code": otp_code,
                "otp_expires_at": otp_expires_at,
                "updated_at": datetime.now(datetime.UTC),
            },
        )

    async def list_all(self, *, skip: int = 0, limit: int = 50) -> list[dict]:
        """List all users (admin use)."""
        cursor = self.collection.find({}).sort("created_at", -1).skip(skip).limit(limit)
        return await cursor.to_list(length=None)


