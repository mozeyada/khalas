import asyncio
import os
import sys

# Add backend dir to python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
from app.core.security import get_password_hash, utc_now
from app.repositories.users import UserRepository

from app.db.mongodb import connect_to_mongo, disconnect_from_mongo

async def seed_users():
    print("Connecting to MongoDB...")
    await connect_to_mongo()
    
    # Use the URI directly from the settings which has the DB name
    client = AsyncIOMotorClient(settings.mongodb_uri)
    db = client[settings.mongodb_db_name]
    
    print("Dropping existing collections to start fresh...")
    collections = await db.list_collection_names()
    for coll in collections:
        await db.drop_collection(coll)
    print("Database cleared.")

    user_repo = UserRepository()
    timestamp = utc_now()
    default_pwd_hash = get_password_hash("Password123!")

    # Define the users to create
    users_to_create = [
        # Global Admin
        {
            "name_en": "Mahmoud Admin", "name_ar": "محمود أدمن",
            "email": "m.zeyada91@gmail.com", "phone": "01000000001",
            "role": "admin"
        },
        # Admin's Clinic
        {
            "name_en": "Mahmoud Clinic", "name_ar": "عيادة محمود",
            "email": "m.zeyada91+clinic@gmail.com", "phone": "01000000002",
            "role": "provider", "provider_type": "clinic"
        },
        # Admin's Patient
        {
            "name_en": "Mahmoud Patient", "name_ar": "محمود مريض",
            "email": "m.zeyada91+patient@gmail.com", "phone": "01000000003",
            "role": "patient"
        },
        # Salesman
        {
            "name_en": "Salesman", "name_ar": "رجل مبيعات",
            "email": "sales@khalas.com", "phone": "01100000001",
            "role": "salesman"
        },
        # Salesman's Clinic
        {
            "name_en": "Salesman Clinic", "name_ar": "عيادة المبيعات",
            "email": "sales+clinic@khalas.com", "phone": "01100000002",
            "role": "provider", "provider_type": "clinic"
        },
        # Salesman's Patient
        {
            "name_en": "Salesman Patient", "name_ar": "مريض المبيعات",
            "email": "sales+patient@khalas.com", "phone": "01100000003",
            "role": "patient"
        },
        # Mohamed Sakr (Salesman)
        {
            "name_en": "Mohamed Sakr", "name_ar": "محمد صقر",
            "email": "m.sakr@khalas.com", "phone": "01200000001",
            "role": "salesman"
        },
        # Mohamed Sakr's Clinic
        {
            "name_en": "Sakr Clinic", "name_ar": "عيادة صقر",
            "email": "m.sakr+clinic@khalas.com", "phone": "01200000002",
            "role": "provider", "provider_type": "clinic"
        },
        # Mohamed Sakr's Patient
        {
            "name_en": "Sakr Patient", "name_ar": "المريض صقر",
            "email": "m.sakr+patient@khalas.com", "phone": "01200000003",
            "role": "patient"
        }
    ]

    for u in users_to_create:
        doc = {
            "name_en": u["name_en"],
            "name_ar": u["name_ar"],
            "email": u["email"],
            "phone": u["phone"],
            "role": u["role"],
            "provider_type": u.get("provider_type"),
            "is_active": True,
            "hashed_password": default_pwd_hash,
            "preferred_channel": "whatsapp",
            "created_at": timestamp,
            "updated_at": timestamp,
        }
        await user_repo.create(doc)
        print(f"Created {u['role']} user: {u['email']} (Phone: {u['phone']}) - Password: Password123!")

    await disconnect_from_mongo()
    print("Seed complete!")

if __name__ == "__main__":
    asyncio.run(seed_users())
