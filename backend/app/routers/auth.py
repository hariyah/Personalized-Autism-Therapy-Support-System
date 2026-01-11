from fastapi import APIRouter, HTTPException, status, Depends, Form
from bson import ObjectId
from app.schemas import UserCreate, UserLogin, Token, User
from app.auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user,
)
from app.database import get_database

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post("/register", response_model=User, status_code=201)
async def register(user_data: UserCreate):
    """Register a new user."""
    db = get_database()
    
    # Check if username already exists
    existing_user = await db.users.find_one({"username": user_data.username})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    # Check if email already exists
    existing_email = await db.users.find_one({"email": user_data.email})
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    user_dict = user_data.model_dump()
    user_dict["password_hash"] = get_password_hash(user_dict.pop("password"))
    user_dict["created_at"] = __import__("datetime").datetime.utcnow()
    
    result = await db.users.insert_one(user_dict)
    created = await db.users.find_one({"_id": result.inserted_id})
    
    # Remove password hash from response
    created.pop("password_hash", None)
    return User(**created)


@router.post("/login", response_model=Token)
async def login(
    username: str = Form(...),
    password: str = Form(...),
):
    """Login and get access token."""
    db = get_database()
    
    # Find user by username
    user = await db.users.find_one({"username": username})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verify password
    if not verify_password(password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token = create_access_token(data={"sub": str(user["_id"])})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(user["_id"]),
            "username": user["username"],
            "email": user["email"],
        },
    }


@router.get("/me", response_model=dict)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Get current user information."""
    return current_user

