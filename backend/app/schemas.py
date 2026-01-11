from pydantic import BaseModel, Field, model_validator
from typing import List, Optional, Literal, Annotated
from datetime import datetime
from bson import ObjectId
from pydantic_core import core_schema


class PyObjectId(ObjectId):
    @classmethod
    def __get_pydantic_core_schema__(
        cls, source_type, handler
    ):
        def validate(value):
            if isinstance(value, ObjectId):
                return value
            if isinstance(value, str):
                if ObjectId.is_valid(value):
                    return ObjectId(value)
            raise ValueError("Invalid ObjectId")
        
        def serialize(value):
            return str(value)
        
        return core_schema.json_or_python_schema(
            json_schema=core_schema.str_schema(),
            python_schema=core_schema.union_schema([
                core_schema.is_instance_schema(ObjectId),
                core_schema.chain_schema([
                    core_schema.str_schema(),
                    core_schema.no_info_plain_validator_function(validate),
                ])
            ]),
            serialization=core_schema.plain_serializer_function_ser_schema(
                serialize,
                return_schema=core_schema.str_schema(),
            ),
        )


# User schemas
class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: str = Field(..., pattern=r'^[^@]+@[^@]+\.[^@]+$')


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)


class UserLogin(BaseModel):
    username: str
    password: str


class User(UserBase):
    id: Annotated[PyObjectId, Field(alias="_id")] = Field(default_factory=PyObjectId)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class ChildProfileBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    age: int = Field(..., ge=2, le=18)
    communication_level: Literal["nonverbal", "limited", "verbal"]
    autism_level: Literal["Level 1", "Level 2", "Level 3"] = Field(
        ..., description="Autism support level: Level 1 (mild support), Level 2 (moderate support), Level 3 (high support)"
    )
    sensory_sensitivity: dict[str, Literal["low", "med", "high"]] = Field(
        ..., description="Keys: sound, light, touch"
    )
    goals: List[Literal["attention", "memory", "social", "motor", "emotion"]] = Field(
        default_factory=list
    )


class ChildProfileCreate(ChildProfileBase):
    pass


class ChildProfileUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    age: Optional[int] = Field(None, ge=2, le=18)
    communication_level: Optional[Literal["nonverbal", "limited", "verbal"]] = None
    autism_level: Optional[Literal["Level 1", "Level 2", "Level 3"]] = None
    sensory_sensitivity: Optional[dict[str, Literal["low", "med", "high"]]] = None
    goals: Optional[List[Literal["attention", "memory", "social", "motor", "emotion"]]] = None


class ChildProfile(ChildProfileBase):
    id: Annotated[PyObjectId, Field(alias="_id")] = Field(default_factory=PyObjectId)
    user_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    @model_validator(mode='before')
    @classmethod
    def migrate_old_fields(cls, data: dict):
        """Migrate old cognitive_level to new autism_level format for backward compatibility."""
        if isinstance(data, dict):
            # If we have cognitive_level but not autism_level, migrate it
            if 'cognitive_level' in data and 'autism_level' not in data:
                cognitive_level = data.get('cognitive_level')
                # Map old values to new format
                level_map = {
                    'low': 'Level 3',
                    'medium': 'Level 2',
                    'high': 'Level 1'
                }
                data['autism_level'] = level_map.get(cognitive_level, 'Level 2')
            
            # Remove old fields if present (they're no longer in schema)
            data.pop('interests', None)
            data.pop('triggers', None)
        return data
        
        # Attach validator to class
        cls.__pydantic_validators__ = getattr(cls, '__pydantic_validators__', [])
        cls.__pydantic_validators__.append(migrate_cognitive_level)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class ActivityBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    category: Literal["attention", "memory", "social", "motor", "emotion", "mixed"]
    skill_targets: List[str] = Field(..., min_items=1)
    materials: List[str] = Field(default_factory=list)
    steps: List[str] = Field(..., min_items=1)
    duration_minutes: int = Field(..., ge=5, le=120)
    difficulty: Literal["easy", "medium", "hard"]
    sensory_load: dict[str, Literal["low", "med", "high"]] = Field(
        ..., description="Keys: sound, light, touch"
    )
    safety_notes: str = Field(default="", max_length=500)
    suitable_ages: List[int] = Field(..., min_items=1, description="List of ages")


class ActivityCreate(ActivityBase):
    pass


class ActivityUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    category: Optional[Literal["attention", "memory", "social", "motor", "emotion", "mixed"]] = None
    skill_targets: Optional[List[str]] = None
    materials: Optional[List[str]] = None
    steps: Optional[List[str]] = None
    duration_minutes: Optional[int] = Field(None, ge=5, le=120)
    difficulty: Optional[Literal["easy", "medium", "hard"]] = None
    sensory_load: Optional[dict[str, Literal["low", "med", "high"]]] = None
    safety_notes: Optional[str] = Field(None, max_length=500)
    suitable_ages: Optional[List[int]] = None


class Activity(ActivityBase):
    id: Annotated[PyObjectId, Field(alias="_id")] = Field(default_factory=PyObjectId)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class PlanRequest(BaseModel):
    budget: Literal["low", "medium", "high"] = Field(..., description="Budget constraint for activities: low, medium, or high")
    available_materials: List[str] = Field(default_factory=list, description="List of materials available from the dataset")
    attention_level: Literal["low", "medium", "high"] = Field(..., description="Child's current attention level")
    environment: Literal["home", "therapy", "school", "outdoor"] = Field(..., description="Environment where activities will take place")
    plan_type: Literal["daily", "weekly"] = Field(..., description="Type of plan: daily (5-7 activities) or weekly (8-12 activities)")
    time_available_minutes: Optional[int] = Field(None, ge=30, le=480, description="Total time available in minutes")


class RecommendationRequest(BaseModel):
    profile_id: str
    plan_request: PlanRequest


class ScheduledActivity(BaseModel):
    """Activity within a plan phase."""
    activity_id: str = Field(..., description="ID from candidate activities (must match dataset)")
    activity_name: str = Field(..., description="Name from candidate activities (must match dataset exactly)")
    domain: str = Field(..., description="Domain from dataset")
    description: str = Field(..., max_length=300, description="Brief 1-2 sentence description of what this activity involves")
    recommended_duration_minutes: int = Field(..., ge=5, le=120, description="Adapted duration for this child")
    difficulty_adaptation: str = Field(..., max_length=500, description="How to adapt difficulty for this child")
    why_this_activity_here: str = Field(..., max_length=500, description="Why this activity is placed in this phase")
    step_by_step: List[str] = Field(..., min_items=1, max_items=10, description="Step-by-step instructions adapted for child")
    sensory_considerations: str = Field(..., max_length=500, description="Sensory considerations and adaptations")
    expected_outcome: str = Field(..., max_length=500, description="Expected outcome for this child")


# New timetable-style schemas for two-stage planning
class TimetableBlock(BaseModel):
    """A time block in the timetable."""
    time_range: str = Field(..., description="Time range like '09:00-09:15' or '04:00-04:05'")
    phase: Literal["Warm-up", "Core", "Calming"] = Field(..., description="Phase of the activity")
    activity_id: str = Field(..., description="Activity ID from candidates")
    activity_name: str = Field(..., description="Activity name from dataset")
    domain: str = Field(..., description="Domain from dataset")
    why: str = Field(..., max_length=500, description="1-2 sentences explaining why this activity")
    steps: List[str] = Field(..., min_items=1, max_items=10, description="Step-by-step instructions")


class TimetableDay(BaseModel):
    """A day in the timetable."""
    day: str = Field(..., description="Day label: 'Today' for Daily, 'Day 1', 'Day 2', etc. for Weekly")
    start_time: Optional[str] = Field(None, description="Optional start time like '09:00'")
    blocks: List[TimetableBlock] = Field(..., min_items=1, description="Time blocks for this day")


class TimetablePlan(BaseModel):
    """Timetable-style activity plan."""
    plan_type: Literal["Daily", "Weekly"] = Field(..., description="Type of plan")
    plan_title: str = Field(..., max_length=200, description="Title of the plan")
    overview: str = Field(..., max_length=1000, description="Overview of the plan")
    total_duration_minutes: int = Field(..., ge=30, le=480, description="Total duration")
    materials_needed: List[str] = Field(default_factory=list, description="All materials needed")
    timetable: List[TimetableDay] = Field(..., min_items=1, description="Timetable with days and time blocks")
    caregiver_notes: str = Field(..., max_length=1000, description="Notes for caregivers")


class ActivitySelectionResponse(BaseModel):
    """Response from Stage 1: Activity selection."""
    selected_activity_ids: List[str] = Field(..., min_items=6, max_items=12, description="Selected activity IDs from candidates")


# New timetable-style schemas
class TimetableBlock(BaseModel):
    """A time block in the timetable."""
    time_range: str = Field(..., description="Time range like '09:00-09:15' or '04:00-04:05'")
    phase: Literal["Warm-up", "Core", "Calming"] = Field(..., description="Phase of the activity")
    activity_id: str = Field(..., description="Activity ID from candidates")
    activity_name: str = Field(..., description="Activity name from dataset")
    domain: str = Field(..., description="Domain from dataset")
    why: str = Field(..., max_length=500, description="1-2 sentences explaining why this activity")
    steps: List[str] = Field(..., min_items=1, max_items=10, description="Step-by-step instructions")


class TimetableDay(BaseModel):
    """A day in the timetable."""
    day: str = Field(..., description="Day label: 'Today' for Daily, 'Day 1', 'Day 2', etc. for Weekly")
    start_time: Optional[str] = Field(None, description="Optional start time like '09:00'")
    blocks: List[TimetableBlock] = Field(..., min_items=1, description="Time blocks for this day")


class TimetablePlan(BaseModel):
    """Timetable-style activity plan."""
    plan_type: Literal["Daily", "Weekly"] = Field(..., description="Type of plan")
    plan_title: str = Field(..., max_length=200, description="Title of the plan")
    overview: str = Field(..., max_length=1000, description="Overview of the plan")
    total_duration_minutes: int = Field(..., ge=30, le=480, description="Total duration")
    materials_needed: List[str] = Field(default_factory=list, description="All materials needed")
    timetable: List[TimetableDay] = Field(..., min_items=1, description="Timetable with days and time blocks")
    caregiver_notes: str = Field(..., max_length=1000, description="Notes for caregivers")


class TimeBlock(BaseModel):
    """A time block (Warm-up, Core, Calming) with activities."""
    time_block: Literal["Warm-up", "Core", "Calming"] = Field(...)
    activities: List[ScheduledActivity] = Field(..., min_items=1)


class PlanPhase(BaseModel):
    """A phase in the activity plan (Warm-up, Core, or Calming)."""
    phase: Literal["Warm-up", "Core", "Calming"] = Field(..., description="Phase of the plan")
    order: int = Field(..., ge=1, description="Order of this phase (1=Warm-up, 2=Core, 3=Calming)")
    activities: List[ScheduledActivity] = Field(..., min_items=1, description="Activities in this phase")


class StructuredActivityPlan(BaseModel):
    """Therapist-like structured activity plan with phase-based organization."""
    plan_type: Literal["Daily", "Weekly"] = Field(..., description="Type of plan: Daily or Weekly")
    plan_name: str = Field(..., max_length=200, description="Name/title of the plan")
    plan_overview: str = Field(..., max_length=1000, description="Overview of the plan goals and approach")
    total_duration_minutes: int = Field(..., ge=30, le=480, description="Total duration of the plan")
    planning_rationale: str = Field(..., max_length=1000, description="Explanation of why this plan structure was chosen")
    materials_summary: List[str] = Field(default_factory=list, description="All materials needed for the plan")
    schedule: List[PlanPhase] = Field(..., min_items=3, max_items=3, description="Three phases: Warm-up, Core, Calming (in order)")


# Keep old ActivityRecommendation for backward compatibility during transition
class ActivityRecommendation(BaseModel):
    activity_id: str
    activity_name: str
    reason: str = Field(..., max_length=500)
    difficulty_adaptation: str = Field(..., max_length=500)
    step_by_step_instructions: List[str]
    sensory_safe_variants: List[str] = Field(default_factory=list)
    expected_benefit: str = Field(..., max_length=500)
    success_checklist: List[str] = Field(..., min_items=1)


class ActivityPlan(BaseModel):
    """Legacy plan structure - kept for backward compatibility."""
    plan_name: str = Field(..., description="Name/title of the activity plan")
    plan_overview: str = Field(..., description="Overview of the plan and its goals")
    duration_days: int = Field(..., ge=1, le=30, description="Number of days the plan covers")
    total_activities: int = Field(..., ge=1, description="Total number of activities in the plan")
    activities: List[ActivityRecommendation] = Field(..., description="List of activities in the plan")
    schedule: Optional[str] = Field(None, description="Suggested schedule for activities")
    materials_needed: List[str] = Field(default_factory=list, description="All materials needed for the plan")
    estimated_cost: str = Field(..., description="Estimated cost based on budget")
    success_indicators: List[str] = Field(default_factory=list, description="Overall success indicators for the plan")


class RecommendationResponse(BaseModel):
    """Response containing structured daily/weekly plan."""
    plan: StructuredActivityPlan = Field(..., description="Structured daily/weekly plan")
    generated_at: datetime = Field(default_factory=datetime.utcnow)


class ActivityOutcome(BaseModel):
    profile_id: str
    activity_id: str
    engagement: int = Field(..., ge=1, le=5)
    stress: int = Field(..., ge=1, le=5)
    success: int = Field(..., ge=1, le=5)
    notes: str = Field(default="", max_length=1000)
    completed_at: datetime = Field(default_factory=datetime.utcnow)


class ActivityOutcomeCreate(ActivityOutcome):
    pass


class ActivityOutcomeResponse(ActivityOutcome):
    id: Annotated[PyObjectId, Field(alias="_id")] = Field(default_factory=PyObjectId)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

