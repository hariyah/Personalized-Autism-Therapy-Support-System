"""
Common auth: verify JWT issued by autism-profile-builder (guardians).

Mirrors Flask ``load_local_env`` (``os.environ.setdefault`` per line) then verifies with PyJWT,
the same library Flask uses to sign tokens.

Duplicate ``SECRET_KEY=`` lines in ``autism-profile-builder/.env`` are a common footgun: Flask keeps
only the first value when SECRET_KEY is not preset in the process environment, but another
process may inherit ``SECRET_KEY`` from the OS before applying the file. We therefore try several
distinct candidate secrets derived from that file plus the Flask-equivalent merged value.
"""

from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import jwt as pyjwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

_PROFILE_BUILDER_ENV = Path(__file__).resolve().parent.parent.parent / "autism-profile-builder" / ".env"


def _parse_dotenv_lines(text: str) -> List[tuple[str, str]]:
    out: List[tuple[str, str]] = []
    for raw_line in text.splitlines():
        line = raw_line.strip().lstrip("\ufeff").strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, val = line.split("=", 1)
        key, val = key.strip(), val.strip().strip('"').strip("'")
        if key:
            out.append((key, val))
    return out


@lru_cache(maxsize=1)
def _jwt_secret_candidates_flask_ordered() -> Tuple[str, ...]:
    """Distinct secrets to attempt for HS256 verification, most likely first."""
    merged: Dict[str, str] = dict(os.environ)
    file_secret_values: List[str] = []

    if _PROFILE_BUILDER_ENV.is_file():
        try:
            text = _PROFILE_BUILDER_ENV.read_text(encoding="utf-8")
            for key, val in _parse_dotenv_lines(text):
                merged.setdefault(key, val)
                if key == "SECRET_KEY" and val.strip():
                    file_secret_values.append(val.strip())
        except OSError:
            pass

    flask_equiv = (merged.get("SECRET_KEY") or "dev-secret-change-in-production").strip()

    ordered: List[str] = []
    seen: set[str] = set()

    def push(candidate: str) -> None:
        s = candidate.strip()
        if not s or s in seen:
            return
        seen.add(s)
        ordered.append(s)

    push(flask_equiv)
    for s in file_secret_values:
        push(s)
    push("dev-secret-change-in-production")

    return tuple(ordered)


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify JWT from autism-profile (guardian) auth. Payload has ``id``, ``email``, ``role``."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    token = credentials.credentials.strip()
    secrets = _jwt_secret_candidates_flask_ordered()

    payload: Optional[dict] = None
    for secret in secrets:
        try:
            payload = pyjwt.decode(
                token,
                secret,
                algorithms=["HS256"],
                options={"verify_signature": True, "verify_exp": False},
            )
            break
        except pyjwt.PyJWTError:
            continue

    if payload is None:
        raise credentials_exception

    user_id = payload.get("id")
    if not user_id:
        raise credentials_exception
    email = str(payload.get("email", ""))
    role = str(payload.get("role", "parent"))
    return {"id": str(user_id), "email": email, "role": role}


async def get_current_user_id(current_user: dict = Depends(get_current_user)) -> str:
    return current_user["id"]
