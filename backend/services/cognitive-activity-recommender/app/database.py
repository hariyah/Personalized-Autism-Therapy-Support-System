import logging
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

logger = logging.getLogger(__name__)


class Database:
    client: AsyncIOMotorClient | None = None


db = Database()


async def connect_to_mongo():
    client = AsyncIOMotorClient(settings.mongodb_uri)
    await client.admin.command("ping")
    db.client = client
    logger.info("Connected to MongoDB")


async def close_mongo_connection():
    if db.client is not None:
        db.client.close()
        db.client = None
        logger.info("Disconnected from MongoDB")


def get_database():
    """Return the profiles database. Lazily create the Motor client if lifespan did not run."""
    if db.client is None:
        logger.warning(
            "MongoDB client was not initialized via lifespan; creating AsyncIOMotorClient lazily."
        )
        db.client = AsyncIOMotorClient(settings.mongodb_uri)
    return db.client[settings.mongodb_db_name]

