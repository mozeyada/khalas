import asyncio
import os
import sys

# Adjust python path to be able to import app modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.config import settings
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.security import get_password_hash, utc_now

async def create_demo_user():
    print(f"Connecting to {settings.mongodb_db_name}...")
    client = AsyncIOMotorClient(settings.mongodb_uri)
    db = client[settings.mongodb_db_name]

    demo_phone = "+201000000000"
    demo_email = "demo@khalas.com"
    demo_password = "password123"

    user = await db.users.find_one({"email": demo_email})
    if user:
        print(f"Demo user already exists! Email: {demo_email}, Password: {demo_password}")
        return

    timestamp = utc_now()
    new_user = {
        "phone": demo_phone,
        "name_ar": "حساب تجريبي",
        "name_en": "Demo User",
        "email": demo_email,
        "is_active": True,
        "otp_code": None,
        "otp_expires_at": None,
        "refresh_token": None,
        "created_at": timestamp,
        "updated_at": timestamp,
        "role": "patient",
        "preferred_channel": "email",
        "hashed_password": get_password_hash(demo_password),
        "reset_token": None,
        "reset_token_expires_at": None,
    }

    result = await db.users.insert_one(new_user)
    print("========================================")
    print("✅ Demo user created successfully!")
    print(f"ID: {result.inserted_id}")
    print(f"Email: {demo_email}")
    print(f"Password: {demo_password}")
    print(f"Role: patient")
    print("========================================")

if __name__ == "__main__":
    asyncio.run(create_demo_user())
