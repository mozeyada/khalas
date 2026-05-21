"""API v1 router registration."""

from fastapi import APIRouter

from app.api.v1.endpoints.admin import router as admin_router
from app.api.v1.endpoints.appointments import router as appointments_router
from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.health import router as health_router
from app.api.v1.endpoints.provider import router as provider_router
from app.api.v1.endpoints.public import router as public_router
from app.api.v1.endpoints.qr import router as qr_router
from app.api.v1.endpoints.search import router as search_router

api_router = APIRouter()
api_router.include_router(admin_router)
api_router.include_router(appointments_router)
api_router.include_router(auth_router)
api_router.include_router(health_router)
api_router.include_router(provider_router)
api_router.include_router(public_router)
api_router.include_router(qr_router)
api_router.include_router(search_router)
