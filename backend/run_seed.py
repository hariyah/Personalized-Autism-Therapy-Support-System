"""Simple script to seed the database with sample activities."""
import asyncio
from app.database import connect_to_mongo, close_mongo_connection
from app.seed_data import seed_activities


async def main():
    await connect_to_mongo()
    await seed_activities()
    await close_mongo_connection()
    print("Done!")


if __name__ == "__main__":
    asyncio.run(main())

