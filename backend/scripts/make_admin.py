import asyncio
import sys
import os

# Add backend directory to sys.path so we can import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

async def main():
    if len(sys.argv) < 2:
        print("Usage: python make_admin.py <phone_number_or_email>")
        sys.exit(1)
        
    identifier = sys.argv[1]
    client = AsyncIOMotorClient(settings.mongodb_uri)
    db = client[settings.mongodb_db_name]
    
    # Try finding by phone or email
    user = await db.users.find_one({"$or": [{"phone": identifier}, {"email": identifier}]})
    
    if not user:
        print(f"User with identifier {identifier} not found.")
        sys.exit(1)
        
    await db.users.update_one({"_id": user["_id"]}, {"$set": {"role": "admin"}})
    print(f"Success: User {identifier} is now an admin!")

if __name__ == "__main__":
    asyncio.run(main())
