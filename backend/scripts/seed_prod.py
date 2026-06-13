import asyncio
import os
import sys

# Ensure backend directory is in path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.api.v1.endpoints.admin import admin_seed_test_users
from app.db.mongodb import connect_to_mongo

async def seed_data():
    print("Initializing database connection...")
    await connect_to_mongo()
    
    print("Seeding data...")
    fake_admin_user = {"_id": "seed-script-fake-id"}
    result = await admin_seed_test_users(current_user=fake_admin_user)
    print("Seed complete:")
    print(result.data["message"])

if __name__ == "__main__":
    asyncio.run(seed_data())
