import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.core.config import settings

async def main():
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client[settings.DATABASE_NAME]
    users = await db.users.find().to_list(100)
    for u in users:
        print(f"Role: {u.get('role')}, Email: {u.get('email')}, Phone: {u.get('phone')}, Name: {u.get('name_en')}")
        
if __name__ == "__main__":
    asyncio.run(main())
