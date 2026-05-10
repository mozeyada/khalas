"""MongoDB connection management."""

from __future__ import annotations

import logging

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.core.config import settings

logger = logging.getLogger(__name__)

client: AsyncIOMotorClient | None = None
database: AsyncIOMotorDatabase | None = None


async def connect_to_mongo() -> None:
    """Create the MongoDB client and ping the server when configured."""
    global client, database

    if not settings.mongodb_uri:
        logger.warning("MONGODB_URI is not set; skipping MongoDB startup ping.")
        return

    client = AsyncIOMotorClient(settings.mongodb_uri, tz_aware=True)
    await client.admin.command("ping")
    database = client[settings.mongodb_db_name]
    logger.info("MongoDB connection established for database '%s'.", settings.mongodb_db_name)


async def disconnect_from_mongo() -> None:
    """Close the MongoDB client if it exists."""
    global client, database

    if client is not None:
        client.close()
        logger.info("MongoDB connection closed.")

    client = None
    database = None

