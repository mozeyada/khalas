"""Health check endpoints."""

from fastapi import APIRouter, status

from app.schemas.health import HealthData, HealthResponse

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse, status_code=status.HTTP_200_OK)
async def health_check() -> HealthResponse:
    """Return the API health status payload."""
    return HealthResponse(
        success=True,
        data=HealthData(status="ok", service="khalas-api"),
        error=None,
    )

