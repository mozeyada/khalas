"""Helpers for MongoDB document access and serialization."""

from __future__ import annotations

from bson import ObjectId


def to_object_id(value: str) -> ObjectId:
    """Convert a string id into an ObjectId."""
    return ObjectId(value)


def stringify_object_id(value: ObjectId) -> str:
    """Convert an ObjectId into its string form."""
    return str(value)
