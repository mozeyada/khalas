"""MongoDB connection management."""

from __future__ import annotations

import logging
from collections.abc import Sequence

from pymongo import ASCENDING, IndexModel
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.core.config import settings
from app.models.collections import (
    AVAILABILITY_COLLECTION,
    APPOINTMENTS_COLLECTION,
    SERVICES_COLLECTION,
    STAFF_COLLECTION,
    USERS_COLLECTION,
    VENUES_COLLECTION,
)

logger = logging.getLogger(__name__)

client: AsyncIOMotorClient | None = None
database: AsyncIOMotorDatabase | None = None


async def connect_to_mongo() -> None:
    """Create the MongoDB client and ping the server when configured."""
    global client, database

    if not settings.mongodb_uri:
        logger.warning("MONGODB_URI is not set; skipping MongoDB startup ping.")
        return

    try:
        client = AsyncIOMotorClient(settings.mongodb_uri, tz_aware=True, serverSelectionTimeoutMS=5000)
        await client.admin.command("ping")
        database = client[settings.mongodb_db_name]
        await create_indexes(database)
        logger.info("MongoDB connection established for database '%s'.", settings.mongodb_db_name)
    except Exception as exc:  # noqa: BLE001
        logger.error(
            "MongoDB startup connection failed — service will start without DB: %s",
            exc,
        )
        client = None
        database = None


async def disconnect_from_mongo() -> None:
    """Close the MongoDB client if it exists."""
    global client, database

    if client is not None:
        client.close()
        logger.info("MongoDB connection closed.")

    client = None
    database = None


def get_database() -> AsyncIOMotorDatabase:
    """Return the active MongoDB database handle."""
    if database is None:
        raise RuntimeError("MongoDB is not connected.")
    return database


def get_collection(name: str):
    """Return a typed collection by name."""
    return get_database()[name]


async def create_indexes(db: AsyncIOMotorDatabase) -> None:
    """Create the indexes required for the current milestone."""
    index_map: dict[str, Sequence[IndexModel]] = {
        USERS_COLLECTION: (
            IndexModel([("phone", ASCENDING)], unique=True),
            IndexModel(
                [("email", ASCENDING)],
                unique=True,
                partialFilterExpression={"email": {"$type": "string"}},
            ),
            IndexModel([("role", ASCENDING)]),
        ),
        VENUES_COLLECTION: (
            IndexModel([("slug", ASCENDING)], unique=True),
            IndexModel([("owner_id", ASCENDING)]),
            IndexModel([("category", ASCENDING)]),
            IndexModel([("governorate", ASCENDING)]),
        ),
        STAFF_COLLECTION: (
            IndexModel([("venue_id", ASCENDING)]),
            IndexModel([("user_id", ASCENDING)], sparse=True),
            IndexModel([("is_active", ASCENDING)]),
        ),
        SERVICES_COLLECTION: (
            IndexModel([("staff_id", ASCENDING)]),
            IndexModel([("venue_id", ASCENDING)]),
            IndexModel([("category", ASCENDING)]),
            IndexModel([("is_active", ASCENDING)]),
        ),
        AVAILABILITY_COLLECTION: (
            IndexModel([("staff_id", ASCENDING), ("day_of_week", ASCENDING)]),
        ),
        APPOINTMENTS_COLLECTION: (
            IndexModel([("patient_id", ASCENDING), ("slot_datetime", ASCENDING)]),
            IndexModel([("staff_id", ASCENDING), ("slot_datetime", ASCENDING)]),
            IndexModel([("venue_id", ASCENDING), ("slot_datetime", ASCENDING)]),
            IndexModel([("status", ASCENDING)]),
        ),
    }

    for collection_name, indexes in index_map.items():
        if collection_name == USERS_COLLECTION:
            existing_indexes = await db[collection_name].index_information()
            if "email_1" in existing_indexes:
                await db[collection_name].drop_index("email_1")
        if indexes:
            await db[collection_name].create_indexes(list(indexes))
