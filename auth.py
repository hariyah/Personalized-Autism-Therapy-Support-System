import os
import bcrypt
import streamlit as st
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

# MongoDB Connection
@st.cache_resource
def init_db():
    uri = os.getenv("MONGO_URI")
    if not uri:
        st.warning("MONGO_URI not found in .env file. Please add it to use authentication.")
        return None
    try:
        client = MongoClient(uri)
        db = client["autism_app_db"]
        return db.users
    except Exception as e:
        st.error(f"Failed to connect to MongoDB: {e}")
        return None

def hash_password(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

def verify_password(stored_hash, password):
    return bcrypt.checkpw(password.encode('utf-8'), stored_hash)

def create_user(username, email, password):
    users_collection = init_db()
    if users_collection is None:
        return False, "Database connection failed."
    
    if users_collection.find_one({"username": username}):
        return False, "Username already exists."
    
    if users_collection.find_one({"email": email}):
        return False, "Email already registered."

    hashed_pw = hash_password(password)
    user_data = {
        "username": username,
        "email": email,
        "password": hashed_pw
    }
    
    users_collection.insert_one(user_data)
    return True, "Account created successfully!"

def authenticate_user(username, password):
    users_collection = init_db()
    if users_collection is None:
        return None
    
    user = users_collection.find_one({"username": username})
    if user and verify_password(user['password'], password):
        return user
    return None
