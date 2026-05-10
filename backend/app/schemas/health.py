"""Health response schemas."""

from pydantic import BaseModel


class HealthData(BaseModel):
    """Health payload data."""

    status: str
    service: str


class HealthResponse(BaseModel):
    """Standard API response for the health endpoint."""

    success: bool
    data: HealthData
    error: str | None = None

