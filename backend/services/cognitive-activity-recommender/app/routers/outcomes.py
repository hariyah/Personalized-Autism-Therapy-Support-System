from fastapi import APIRouter, HTTPException, Depends
from typing import List
from bson import ObjectId
from app.schemas import ActivityOutcomeCreate, ActivityOutcomeResponse
from app.database import get_database
from app.auth import get_current_user_id

router = APIRouter(prefix="/outcomes", tags=["outcomes"])


@router.post("", response_model=ActivityOutcomeResponse, status_code=201)
async def create_outcome(
    outcome: ActivityOutcomeCreate,
    user_id: str = Depends(get_current_user_id)
):
    db = get_database()
    
    # Validate profile exists and belongs to user
    if not ObjectId.is_valid(outcome.profile_id):
        raise HTTPException(status_code=400, detail="Invalid profile ID")
    profile = await db.profiles.find_one({"_id": ObjectId(outcome.profile_id), "user_id": user_id})
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    # Activity ID is now a string reference to CSV activity (no MongoDB validation needed)
    
    outcome_dict = outcome.model_dump()
    result = await db.outcomes.insert_one(outcome_dict)
    created = await db.outcomes.find_one({"_id": result.inserted_id})
    return ActivityOutcomeResponse(**created)


@router.get("", response_model=List[ActivityOutcomeResponse])
async def list_outcomes(
    profile_id: str = None,
    activity_id: str = None,
    user_id: str = Depends(get_current_user_id)
):
    db = get_database()
    query = {}
    
    if profile_id:
        if not ObjectId.is_valid(profile_id):
            raise HTTPException(status_code=400, detail="Invalid profile ID")
        # Verify profile belongs to user
        profile = await db.profiles.find_one({"_id": ObjectId(profile_id), "user_id": user_id})
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        query["profile_id"] = profile_id
    
    if activity_id:
        if not ObjectId.is_valid(activity_id):
            raise HTTPException(status_code=400, detail="Invalid activity ID")
        query["activity_id"] = activity_id
    
    outcomes = await db.outcomes.find(query).sort("completed_at", -1).to_list(1000)
    return [ActivityOutcomeResponse(**o) for o in outcomes]


@router.get("/{outcome_id}", response_model=ActivityOutcomeResponse)
async def get_outcome(outcome_id: str):
    db = get_database()
    if not ObjectId.is_valid(outcome_id):
        raise HTTPException(status_code=400, detail="Invalid outcome ID")
    
    outcome = await db.outcomes.find_one({"_id": ObjectId(outcome_id)})
    if not outcome:
        raise HTTPException(status_code=404, detail="Outcome not found")
    return ActivityOutcomeResponse(**outcome)

