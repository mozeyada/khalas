"""Public search endpoint."""

from __future__ import annotations

from fastapi import APIRouter, Query

from app.repositories.venues import VenueRepository
from app.schemas.common import ApiResponse
from app.schemas.venue import PublicVenueResponse
from app.services.serializers import serialize_public_venue

router = APIRouter(tags=["search"])


@router.get("/search", response_model=ApiResponse[list[PublicVenueResponse]], status_code=200)
async def search_venues(
    q: str | None = Query(default=None, max_length=200),
    governorate: str | None = Query(default=None, max_length=100),
    category: str | None = Query(default=None, max_length=100),
    limit: int = Query(default=20, ge=1, le=100),
    skip: int = Query(default=0, ge=0),
) -> ApiResponse[list[PublicVenueResponse]]:
    """Search public approved venues by keyword, governorate, and category."""
    venues = await VenueRepository().search(
        q=q,
        governorate=governorate,
        category=category,
        limit=limit,
        skip=skip,
    )
    return ApiResponse(data=[serialize_public_venue(venue) for venue in venues])
