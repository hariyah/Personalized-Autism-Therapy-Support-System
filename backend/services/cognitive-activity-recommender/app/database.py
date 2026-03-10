from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings


class Database:
    client: AsyncIOMotorClient = None


db = Database()


async def connect_to_mongo():
    db.client = AsyncIOMotorClient(settings.mongodb_uri)
    await db.client.admin.command('ping')
    print("Connected to MongoDB")


async def close_mongo_connection():
    db.client.close()
    print("Disconnected from MongoDB")


def get_database():
    return db.client[settings.mongodb_db_name]

