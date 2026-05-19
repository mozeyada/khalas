"""Availability schemas."""

from __future__ import annotations

from pydantic import Field, field_validator

from app.schemas.common import APIModel


class AvailabilityEntry(APIModel):
    """Single availability row for a staff member."""

    day_of_week: int = Field(ge=0, le=6)
    start_time: str
    end_time: str
    is_active: bool = True

    @field_validator("start_time", "end_time")
    @classmethod
    def validate_time(cls, value: str) -> str:
        """Validate HH:MM 24-hour times."""
        parts = value.split(":")
        if len(parts) != 2:
            raise ValueError("Time must be in HH:MM format.")
        hour, minute = parts
        if len(hour) != 2 or len(minute) != 2:
            raise ValueError("Time must be in HH:MM format.")
        if not (hour.isdigit() and minute.isdigit()):
            raise ValueError("Time must be in HH:MM format.")
        if not (0 <= int(hour) <= 23 and 0 <= int(minute) <= 59):
            raise ValueError("Time must be in HH:MM format.")
        return value


class AvailabilityUpdateRequest(APIModel):
    """Request body for replacing staff availability."""

    slots: list[AvailabilityEntry]
