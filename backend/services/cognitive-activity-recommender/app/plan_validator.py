"""Validators for activity plan structure and constraints."""
from typing import List, Dict, Any
from app.schemas import StructuredActivityPlan, ScheduledActivity


def validate_plan_length(plan: StructuredActivityPlan) -> tuple[bool, str]:
    """Validate that plan has correct number of activities based on plan_type.
    
    Returns:
        (is_valid, error_message)
    """
    # Count total activities across all schedule entries
    total_activities = sum(len(day.activities) for day in plan.schedule)
    
    if plan.plan_type == "Daily":
        if total_activities < 5:
            return False, f"Daily plan must have 5-7 activities, but has {total_activities}"
        if total_activities > 7:
            return False, f"Daily plan must have 5-7 activities, but has {total_activities}"
    elif plan.plan_type == "Weekly":
        if total_activities < 8:
            return False, f"Weekly plan must have 8-12 activities, but has {total_activities}"
        if total_activities > 12:
            return False, f"Weekly plan must have 8-12 activities, but has {total_activities}"
    
    return True, ""


def validate_activities_from_candidates(
    plan: StructuredActivityPlan,
    candidate_ids: List[str]
) -> tuple[bool, str]:
    """Validate that all activities in plan come from candidate list.
    
    Args:
        plan: The structured activity plan
        candidate_ids: List of activity IDs from candidate set
        
    Returns:
        (is_valid, error_message)
    """
    candidate_set = set(candidate_ids)
    
    for day in plan.schedule:
        for activity in day.activities:
            if activity.activity_id not in candidate_set:
                return False, f"Activity {activity.activity_name} (ID: {activity.activity_id}) not in candidate set"
    
    return True, ""


def validate_no_duplicates(plan: StructuredActivityPlan) -> tuple[bool, str]:
    """Validate that there are no duplicate activities in the plan.
    
    Checks for duplicates by both activity_id and activity_name (case-insensitive).
    
    Returns:
        (is_valid, error_message)
    """
    seen_ids = set()
    seen_names = set()
    
    for phase in plan.schedule:
        for activity in phase.activities:
            act_id = activity.activity_id
            act_name = activity.activity_name.lower().strip()
            
            if act_id in seen_ids:
                return False, f"Duplicate activity_id found: {activity.activity_name} (ID: {act_id})"
            if act_name in seen_names:
                return False, f"Duplicate activity_name found: {activity.activity_name} (ID: {act_id})"
            
            seen_ids.add(act_id)
            seen_names.add(act_name)
    
    return True, ""


def ensure_calming_activity(plan: StructuredActivityPlan) -> bool:
    """Check if plan includes at least one calming activity/time block."""
    for phase in plan.schedule:
        if phase.phase == "Calming" and len(phase.activities) > 0:
            return True
    return False

