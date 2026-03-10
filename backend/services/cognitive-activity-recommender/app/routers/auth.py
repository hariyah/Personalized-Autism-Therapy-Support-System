"""
Auth router: only /auth/me (validate token and return current user).
Login and register are handled by autism-profile-builder; use gateway /api/auth/login and /api/auth/register.
"""
from fastapi import APIRouter, Depends
from app.auth import get_current_user

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.get("/me")
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Return current user from JWT (guardian id and email from common auth)."""
    return current_user
