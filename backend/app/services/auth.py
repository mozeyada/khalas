"""Authentication service logic."""

from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass

import jwt
from fastapi import HTTPException, status
from pymongo.errors import DuplicateKeyError

from app.core.security import (
    build_otp_expiry,
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
    generate_otp_code,
    hash_token,
    utc_now,
    get_password_hash,
    verify_password,
)
from app.repositories.users import UserRepository
from app.repositories.venues import VenueRepository
from app.repositories.staff import StaffRepository
from app.repositories.services import ServiceRepository
from app.repositories.availability import AvailabilityRepository
from app.schemas.auth import (
    AuthTokensData, 
    OtpChallengeData, 
    RegisterRequest, 
    LoginPasswordRequest, 
    ForgotPasswordRequest, 
    ResetPasswordRequest,
    ChangePasswordRequest,
    UpdateProfileRequest
)
from app.services.notifications import send_otp_email
from app.services.serializers import serialize_user

logger = logging.getLogger(__name__)


@dataclass
class AuthService:
    """Encapsulate OTP and JWT auth flows."""

    user_repository: UserRepository

    async def register(self, request: RegisterRequest) -> OtpChallengeData:
        """Create a user and issue an OTP."""
        existing = await self.user_repository.find_by_identifier(request.phone)
        if existing is not None:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A user with this phone already exists.")

        if request.email:
            existing_email = await self.user_repository.find_by_identifier(request.email)
            if existing_email is not None and str(existing_email["_id"]) != str(existing.get("_id") if existing else ""):
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A user with this email already exists.")

        timestamp = utc_now()
        otp_code = generate_otp_code()
        otp_expires_at = build_otp_expiry()
        document = {
            "phone": request.phone,
            "name_ar": request.name_ar,
            "name_en": request.name_en,
            "email": request.email,
            "is_active": True,
            "otp_code": otp_code,
            "otp_expires_at": otp_expires_at,
            "refresh_token": None,
            "created_at": timestamp,
            "updated_at": timestamp,
            "role": request.role,
            "provider_type": request.provider_type if request.role == "provider" else None,
            "preferred_channel": request.preferred_channel or ("email" if request.email else "whatsapp"),
            "hashed_password": get_password_hash(request.password) if request.password else None,
            "reset_token": None,
            "reset_token_expires_at": None,
        }
        try:
            created_user = await self.user_repository.create(document)
            
            # Auto-provision clinic ecosystem if role is provider
            if request.role == "provider":
                venue_repo = VenueRepository()
                staff_repo = StaffRepository()
                service_repo = ServiceRepository()
                availability_repo = AvailabilityRepository()
                
                # 1. Create Venue
                # Strip out "Dr." or "د." prefix for slug if present
                clean_name = request.name_en.replace("Dr. ", "").replace("Dr.", "").strip()
                import re
                slug_base = re.sub(r'[^a-z0-9]', '-', clean_name.lower())
                slug_base = re.sub(r'-+', '-', slug_base).strip('-')
                if not slug_base:
                    slug_base = "clinic"
                
                # Ensure unique slug
                existing_venues = await venue_repo.collection.count_documents({"slug": {"$regex": f"^{slug_base}"}})
                final_slug = slug_base if existing_venues == 0 else f"{slug_base}-{existing_venues+1}"
                
                venue_doc = {
                    "owner_id": str(created_user["_id"]),
                    "name_ar": request.name_ar,
                    "name_en": request.name_en,
                    "slug": final_slug,
                    "address_ar": "العنوان غير محدد",
                    "address_en": "Address not specified",
                    "phone": request.phone,
                    "governorate": "Cairo",
                    "area": "Nasr City",
                    "category": "clinic",
                    "is_approved": True,  # Approved by default for instant onboarding
                    "subscription_status": "trial",
                    "staff_users": [str(created_user["_id"])],
                    "created_at": timestamp,
                    "updated_at": timestamp,
                }
                created_venue = await venue_repo.create(venue_doc)
                
                # 2. Create Staff
                staff_doc = {
                    "venue_id": str(created_venue["_id"]),
                    "name_ar": request.name_ar,
                    "name_en": request.name_en,
                    "title_ar": "طبيب",
                    "title_en": "Doctor",
                    "specialty_ar": "عام",
                    "specialty_en": "General",
                    "is_active": True,
                    "is_bookable": True,
                    "created_at": timestamp,
                    "updated_at": timestamp,
                }
                created_staff = await staff_repo.create(staff_doc)
                
                # 3. Create Service
                service_doc = {
                    "staff_id": str(created_staff["_id"]),
                    "venue_id": str(created_venue["_id"]),
                    "category": "clinic",
                    "name_ar": "كشف طبي",
                    "name_en": "Consultation",
                    "duration_minutes": 30,
                    "price": 50000, # 500 EGP in piasters
                    "is_active": True,
                    "created_at": timestamp,
                    "updated_at": timestamp,
                }
                await service_repo.create(service_doc)
                
                # 4. Create Availability
                availability_rows = []
                for day in range(7):
                    availability_rows.append({
                        "staff_id": str(created_staff["_id"]),
                        "day_of_week": day,
                        "start_time": "09:00",
                        "end_time": "17:00",
                        "is_active": True,
                        "created_at": timestamp,
                        "updated_at": timestamp,
                    })
                await availability_repo.replace_for_staff(str(created_staff["_id"]), availability_rows)
                
        except DuplicateKeyError as exc:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A user with this email already exists.") from exc
        
        channel = document["preferred_channel"]
        if channel == "email" and request.email:
            asyncio.create_task(
                send_otp_email(
                    to_email=request.email,
                    name=request.name_ar or request.name_en,
                    otp_code=otp_code,
                )
            )
        else: # defaults to whatsapp if no email or channel=whatsapp
            from app.services.notifications import send_otp_whatsapp
            asyncio.create_task(
                send_otp_whatsapp(
                    phone=request.phone,
                    otp_code=otp_code,
                )
            )

        logger.info("[KHALAS OTP] %s -> %s (%s queued)", request.phone, otp_code, channel)
        return OtpChallengeData(phone=request.phone, otp_expires_at=otp_expires_at, role=request.role)

    async def request_login_otp(self, identifier: str) -> OtpChallengeData:
        """Issue a fresh OTP to an existing user."""
        user = await self.user_repository.find_by_identifier(identifier)
        if user is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
        if not user["is_active"]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is inactive.")

        otp_code = generate_otp_code()
        otp_expires_at = build_otp_expiry()
        await self.user_repository.update_by_id(
            str(user["_id"]),
            {
                "otp_code": otp_code,
                "otp_expires_at": otp_expires_at,
                "updated_at": utc_now(),
            },
        )
        logger.info("[KHALAS OTP] %s -> %s", identifier, otp_code)
        
        is_email_input = "@" in identifier
        if is_email_input or (user.get("preferred_channel") == "email" and user.get("email")):
            name = user.get("name_ar") or user.get("name_en") or ""
            asyncio.create_task(
                send_otp_email(
                    to_email=user.get("email") if not is_email_input else identifier,
                    name=name,
                    otp_code=otp_code,
                )
            )
        else: # defaults to whatsapp
            from app.services.notifications import send_otp_whatsapp
            asyncio.create_task(
                send_otp_whatsapp(
                    phone=user.get("phone", identifier),
                    otp_code=otp_code,
                )
            )
            
        return OtpChallengeData(identifier=identifier, otp_expires_at=otp_expires_at, role=user["role"])

    async def verify_otp(self, *, identifier: str, otp_code: str) -> AuthTokensData:
        """Validate an OTP and issue tokens."""
        user = await self.user_repository.find_by_identifier(identifier)
        if user is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
        if user.get("otp_code") != otp_code:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid OTP code.")
        if user.get("otp_expires_at") is None or user["otp_expires_at"] < utc_now():
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="OTP code has expired.")

        access_token, access_expires_at = create_access_token(str(user["_id"]), user["role"])
        refresh_token, refresh_expires_at = create_refresh_token(str(user["_id"]), user["role"])
        updated_user = await self.user_repository.update_by_id(
            str(user["_id"]),
            {
                "otp_code": None,
                "otp_expires_at": None,
                "refresh_token": hash_token(refresh_token),
                "updated_at": utc_now(),
            },
        )
        assert updated_user is not None
        return AuthTokensData(
            access_token=access_token,
            refresh_token=refresh_token,
            access_token_expires_at=access_expires_at,
            refresh_token_expires_at=refresh_expires_at,
            user=serialize_user(updated_user),
        )

    async def refresh_tokens(self, refresh_token: str) -> AuthTokensData:
        """Rotate a refresh token pair."""
        try:
            payload = decode_refresh_token(refresh_token)
        except jwt.InvalidTokenError as exc:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token.") from exc

        if payload.get("type") != "refresh":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token.")

        user = await self.user_repository.find_by_id(payload["sub"])
        if user is None or not user["is_active"]:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not available.")
        if user.get("refresh_token") != hash_token(refresh_token):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token mismatch.")

        access_token, access_expires_at = create_access_token(str(user["_id"]), user["role"])
        new_refresh_token, refresh_expires_at = create_refresh_token(str(user["_id"]), user["role"])
        updated_user = await self.user_repository.update_by_id(
            str(user["_id"]),
            {
                "refresh_token": hash_token(new_refresh_token),
                "updated_at": utc_now(),
            },
        )
        assert updated_user is not None
        return AuthTokensData(
            access_token=access_token,
            refresh_token=new_refresh_token,
            access_token_expires_at=access_expires_at,
            refresh_token_expires_at=refresh_expires_at,
            user=serialize_user(updated_user),
        )

    async def login_with_password(self, request: LoginPasswordRequest) -> AuthTokensData:
        """Log in using identifier and password."""
        user = await self.user_repository.find_by_identifier(request.identifier)
        if user is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
        if not user.get("is_active"):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is inactive.")
        if not user.get("hashed_password"):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This account does not have a password set. Please log in with OTP.")

        if not verify_password(request.password, user["hashed_password"]):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid password.")

        access_token, access_expires_at = create_access_token(str(user["_id"]), user["role"])
        refresh_token, refresh_expires_at = create_refresh_token(str(user["_id"]), user["role"])
        
        updated_user = await self.user_repository.update_by_id(
            str(user["_id"]),
            {
                "refresh_token": hash_token(refresh_token),
                "updated_at": utc_now(),
            },
        )
        assert updated_user is not None
        return AuthTokensData(
            access_token=access_token,
            refresh_token=refresh_token,
            access_token_expires_at=access_expires_at,
            refresh_token_expires_at=refresh_expires_at,
            user=serialize_user(updated_user),
        )

    async def request_password_reset(self, request: ForgotPasswordRequest) -> dict:
        """Generate a reset token and queue it for delivery."""
        user = await self.user_repository.find_by_identifier(request.identifier)
        if user is None:
            # Return success to avoid user enumeration
            return {"detail": "If your account exists, a reset code will be sent to you."}
        
        if not user.get("is_active"):
            return {"detail": "If your account exists, a reset code will be sent to you."}

        import secrets
        reset_token = secrets.token_hex(3).upper()
        # Using a 1 hour expiry
        from datetime import timedelta
        reset_expires_at = utc_now() + timedelta(hours=1)
        
        await self.user_repository.update_by_id(
            str(user["_id"]),
            {
                "reset_token": hash_token(reset_token),
                "reset_token_expires_at": reset_expires_at,
                "updated_at": utc_now(),
            },
        )

        channel = user.get("preferred_channel", "whatsapp")
        is_email_input = "@" in request.identifier
        
        # Reuse existing OTP notification mechanism, but we really should have a proper reset notification
        # For simplicity in this iteration, we send the reset token like an OTP
        if is_email_input or (channel == "email" and user.get("email")):
            name = user.get("name_ar") or user.get("name_en") or ""
            # Truncating token to 6 chars just so it fits in the current OTP email template if needed,
            # but ideally we send the full link
            asyncio.create_task(
                send_otp_email(
                    to_email=user.get("email") if not is_email_input else request.identifier,
                    name=name,
                    otp_code=reset_token,
                )
            )
        else:
            from app.services.notifications import send_otp_whatsapp
            asyncio.create_task(
                send_otp_whatsapp(
                    phone=user["phone"],
                    otp_code=reset_token,
                )
            )
            
        logger.info("[KHALAS PASSWORD RESET] %s -> FULL TOKEN: %s", request.identifier, reset_token)
        return {"detail": "If your account exists, a reset code will be sent to you."}

    async def reset_password(self, request: ResetPasswordRequest) -> dict:
        """Reset the user's password using a valid token."""
        # Find user by hashed reset token. 
        # In MongoDB we can do a direct query for it.
        # But wait, our UserRepository doesn't have a `find_by_reset_token` yet.
        # Let's add that logic.
        hashed = hash_token(request.token)
        user = await self.user_repository.collection.find_one({"reset_token": hashed})
        
        if user is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired reset token.")
            
        if user.get("reset_token_expires_at") is None or user["reset_token_expires_at"] < utc_now():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired reset token.")

        await self.user_repository.update_by_id(
            str(user["_id"]),
            {
                "hashed_password": get_password_hash(request.new_password),
                "reset_token": None,
                "reset_token_expires_at": None,
                "updated_at": utc_now(),
            },
        )
        return {"detail": "Password has been reset successfully."}

    async def change_password(self, user_id: str, request: ChangePasswordRequest) -> dict:
        """Change the password for an authenticated user."""
        user = await self.user_repository.find_by_id(user_id)
        if user is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

        if user.get("hashed_password") and not verify_password(request.current_password, user["hashed_password"]):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Incorrect current password.")

        await self.user_repository.update_by_id(
            user_id,
            {
                "hashed_password": get_password_hash(request.new_password),
                "updated_at": utc_now(),
            },
        )
        return {"detail": "Password updated successfully."}

    async def update_profile(self, user_id: str, request: UpdateProfileRequest) -> dict:
        """Update the basic profile information of an authenticated user."""
        user = await self.user_repository.find_by_id(user_id)
        if user is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

        updates = {"updated_at": utc_now()}
        if request.name_ar is not None:
            updates["name_ar"] = request.name_ar
        if request.name_en is not None:
            updates["name_en"] = request.name_en
        if request.email is not None:
            # Check for duplicate email
            if request.email != user.get("email"):
                existing = await self.user_repository.find_by_identifier(request.email)
                if existing and str(existing["_id"]) != user_id:
                    raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email is already in use.")
            updates["email"] = request.email
        if request.preferred_channel is not None:
            updates["preferred_channel"] = request.preferred_channel

        updated_user = await self.user_repository.update_by_id(user_id, updates)
        return serialize_user(updated_user)
