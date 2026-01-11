from fastapi import APIRouter, HTTPException, Depends
from typing import List
from datetime import datetime
from bson import ObjectId
from app.schemas import ChildProfile, ChildProfileCreate, ChildProfileUpdate
from app.database import get_database
from app.auth import get_current_user_id

router = APIRouter(prefix="/profiles", tags=["profiles"])


@router.post("", response_model=ChildProfile, status_code=201)
async def create_profile(
    profile: ChildProfileCreate,
    user_id: str = Depends(get_current_user_id)
):
    db = get_database()
    profile_dict = profile.model_dump()
    profile_dict["user_id"] = user_id
    result = await db.profiles.insert_one(profile_dict)
    created = await db.profiles.find_one({"_id": result.inserted_id})
    return ChildProfile(**created)


@router.get("", response_model=List[ChildProfile])
async def list_profiles(user_id: str = Depends(get_current_user_id)):
    db = get_database()
    profiles = await db.profiles.find({"user_id": user_id}).to_list(1000)
    return [ChildProfile(**p) for p in profiles]


@router.get("/{profile_id}", response_model=ChildProfile)
async def get_profile(
    profile_id: str,
    user_id: str = Depends(get_current_user_id)
):
    db = get_database()
    if not ObjectId.is_valid(profile_id):
        raise HTTPException(status_code=400, detail="Invalid profile ID")
    
    profile = await db.profiles.find_one({"_id": ObjectId(profile_id), "user_id": user_id})
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return ChildProfile(**profile)


@router.put("/{profile_id}", response_model=ChildProfile)
async def update_profile(
    profile_id: str,
    profile_update: ChildProfileUpdate,
    user_id: str = Depends(get_current_user_id)
):
    db = get_database()
    if not ObjectId.is_valid(profile_id):
        raise HTTPException(status_code=400, detail="Invalid profile ID")
    
    # Verify ownership
    profile = await db.profiles.find_one({"_id": ObjectId(profile_id), "user_id": user_id})
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    update_data = {k: v for k, v in profile_update.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    update_data["updated_at"] = datetime.utcnow()
    
    result = await db.profiles.update_one(
        {"_id": ObjectId(profile_id), "user_id": user_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    updated = await db.profiles.find_one({"_id": ObjectId(profile_id)})
    return ChildProfile(**updated)


@router.delete("/{profile_id}", status_code=204)
async def delete_profile(
    profile_id: str,
    user_id: str = Depends(get_current_user_id)
):
    db = get_database()
    if not ObjectId.is_valid(profile_id):
        raise HTTPException(status_code=400, detail="Invalid profile ID")
    
    # Verify ownership
    profile = await db.profiles.find_one({"_id": ObjectId(profile_id), "user_id": user_id})
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    result = await db.profiles.delete_one({"_id": ObjectId(profile_id), "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    # Also delete associated outcomes
    await db.outcomes.delete_many({"profile_id": profile_id})
    return None

