"""
Common auth: verify JWT issued by autism-profile-builder (guardians).
Uses same SECRET_KEY as profile-builder. No login/register here - use gateway /api/auth or profile-builder.
"""
from typing import Optional
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.config import settings

security = HTTPBearer()

# Same secret as autism-profile-builder so tokens from /api/auth/login (profile-builder) are valid here
def _get_jwt_secret() -> str:
    return settings.secret_key or settings.auth_secret_key or "dev-secret-change-in-production"


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify JWT from autism-profile (guardian) auth. Payload has 'id' (guardian_id) and 'email'."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        token = credentials.credentials
        payload = jwt.decode(
            token,
            _get_jwt_secret(),
            algorithms=["HS256"],
            options={"verify_exp": False},
        )
        user_id: Optional[str] = payload.get("id")  # autism-profile uses "id", not "sub"
        if not user_id:
            raise credentials_exception
        email: str = payload.get("email", "")
        return {"id": user_id, "email": email}
    except JWTError:
        raise credentials_exception


async def get_current_user_id(current_user: dict = Depends(get_current_user)) -> str:
    """Get the current user's ID (guardian_id from autism-profile token)."""
    return current_user["id"]
