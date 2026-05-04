import bcrypt
from pymongo import MongoClient
from datetime import datetime
import os

# Configuration (matching backend/services/autism-profile-builder/.env.example)
MONGODB_URI = "mongodb://localhost:27017"
DB_NAME = "autism_profile"

def seed_users():
    client = MongoClient(MONGODB_URI)
    db = client[DB_NAME]
    guardians_col = db["guardians"]

    # Clear existing test users to ensure fresh start
    emails = ["parent@test.com", "doctor@test.com"]
    guardians_col.delete_many({"email": {"$in": emails}})
    print(f"Cleared existing test users: {', '.join(emails)}")

    # Password for both users
    password = "password123"
    password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    users = [
        {
            "email": "parent@test.com",
            "password_hash": password_hash,
            "fullName": "Test Parent",
            "phone": "1234567890",
            "relationship": "Parent",
            "role": "parent",
            "createdAt": datetime.utcnow().isoformat(),
        },
        {
            "email": "doctor1@gmail.com",
            "password_hash": password_hash,
            "fullName": "Test Doctor",
            "phone": "0987654321",
            "relationship": "Doctor",
            "role": "doctor",
            "createdAt": datetime.utcnow().isoformat(),
        }
    ]

    for user in users:
        # Clear existing to ensure fresh role
        guardians_col.delete_one({"email": user["email"]})
        
        # Insert
        result = guardians_col.insert_one(user)
        print(f"Created/Reset user: {user['email']} ({user['role']})")

    print("\nSeed credentials:")
    print("Role: Parent -> Email: parent@test.com, Password: password123")
    print("Role: Doctor -> Email: doctor1@gmail.com, Password: password123")

if __name__ == "__main__":
    try:
        seed_users()
    except Exception as e:
        print(f"Error seeding users: {e}")
        print("Make sure MongoDB is running at localhost:27017")
