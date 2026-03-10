"""Prompt builders for two-stage timetable planning."""
from typing import Dict, Any, List


def build_activity_selection_prompt(
    child_profile: Dict[str, Any],
    activities: List[Dict[str, Any]],
    plan_request: Dict[str, Any],
    recent_outcomes: List[Dict[str, Any]],
    recently_used_ids: List[str],
    format_activities_fn,
    format_outcomes_fn,
) -> tuple[str, str]:
    """Build prompt for Stage 1: Activity selection."""
    
    plan_type = plan_request.get('plan_type', 'daily')
    is_daily = plan_type == 'daily'
    min_activities = 6 if is_daily else 8
    max_activities = 8 if is_daily else 12
    
    system_prompt = """You are an expert activity planner selecting activities for a child with autism spectrum disorder (ASD).

CRITICAL RULES:
1. You MUST select EXACTLY the required number of activities from the provided candidates.
2. You MUST ONLY use activity_id values that exist in the candidates list.
3. DO NOT invent, modify, or create new activities.
4. DO NOT repeat the same activity_id.
5. Prioritize activities that match the child's goals.
6. Consider recent outcomes to avoid activities with poor results.
7. Return ONLY valid JSON with selected_activity_ids array - no markdown, no extra text."""

    # Build recently used warning
    recently_used_text = ""
    if recently_used_ids:
        recently_used_text = f"\n\nRECENTLY USED ACTIVITIES (avoid unless they had high success scores):\n{', '.join(recently_used_ids[:10])}\nAvoid repeating these unless past outcomes show high engagement (>=4) and success (>=4)."
    
    user_prompt = f"""Select EXACTLY {min_activities}-{max_activities} activities for a {plan_type.upper()} plan.

CHILD PROFILE:
- Name: {child_profile.get('name')}
- Age: {child_profile.get('age')} years
- Communication Level: {child_profile.get('communication_level')}
- Autism Level: {child_profile.get('autism_level')}
- Goals: {', '.join(child_profile.get('goals', [])) if child_profile.get('goals') else 'General development'}
- Sensory Sensitivities: Sound={child_profile.get('sensory_sensitivity', {}).get('sound', 'low')}, Light={child_profile.get('sensory_sensitivity', {}).get('light', 'low')}, Touch={child_profile.get('sensory_sensitivity', {}).get('touch', 'low')}

PLAN REQUIREMENTS:
- Plan Type: {plan_type.upper()} ({min_activities}-{max_activities} activities REQUIRED)
- Budget: {plan_request.get('budget')}
- Available Materials: {', '.join(plan_request.get('available_materials', [])) if plan_request.get('available_materials') else 'Any materials'}
- Attention Level: {plan_request.get('attention_level')}
- Environment: {plan_request.get('environment')}

RECENT OUTCOMES:
{format_outcomes_fn(recent_outcomes)}{recently_used_text}

AVAILABLE CANDIDATE ACTIVITIES (YOU MUST SELECT FROM THESE ONLY):
{format_activities_fn(activities)}

YOUR TASK:
Select EXACTLY {min_activities}-{max_activities} unique activity_id values from the candidates above.

SELECTION CRITERIA:
1. Prioritize activities that match child's goals: {', '.join(child_profile.get('goals', [])) if child_profile.get('goals') else 'General development'}
2. Ensure variety: include at least 3 different domains (daily) or 4 different domains (weekly)
3. Avoid recently used activities unless they had high success (engagement >=4, success >=4)
4. Consider budget and available materials
5. Match autism level and sensory needs
6. Balance difficulty levels

OUTPUT FORMAT (STRICT JSON ONLY):
{{
  "selected_activity_ids": ["id1", "id2", "id3", ...]
}}

CRITICAL:
- Return EXACTLY {min_activities}-{max_activities} activity_id values
- All IDs must exist in the candidates list
- No duplicates
- Return ONLY the JSON object, no markdown, no extra text"""

    return system_prompt, user_prompt


def build_timetable_scheduling_prompt(
    child_profile: Dict[str, Any],
    selected_activities: List[Dict[str, Any]],
    plan_request: Dict[str, Any],
    format_activities_fn,
) -> tuple[str, str]:
    """Build prompt for Stage 2: Timetable scheduling."""
    
    plan_type = plan_request.get('plan_type', 'daily')
    is_daily = plan_type == 'daily'
    time_available = plan_request.get('time_available_minutes', 120)
    
    system_prompt = """You are an expert therapist creating a TIMETABLE-STYLE activity plan for a child with autism spectrum disorder (ASD).

CRITICAL RULES:
1. You MUST create a REAL, FOLLOWABLE TIMETABLE with specific time blocks.
2. You MUST use ONLY the selected activities provided (no inventing).
3. Daily plans: ONE session with time blocks (e.g., 15-25 minutes each) organized into Warm-up → Core → Calming phases.
4. Weekly plans: MULTIPLE DAYS (Day 1, Day 2, etc.) with short sessions per day, varying domains across days.
5. Include ALL three phases (Warm-up, Core, Calming) in the plan.
6. Vary domains: at least 3 domains (daily) or 4 domains (weekly).
7. Return ONLY valid JSON matching the exact schema - no markdown, no extra text.

CRITICAL SAFETY CONSTRAINTS:
- NEVER provide medical advice or diagnosis
- NEVER suggest activities that could be harmful
- Respect sensory sensitivities
- Use simple, clear language appropriate to the child's communication level"""

    if is_daily:
        timetable_instructions = """DAILY PLAN STRUCTURE:
- ONE session labeled "Today"
- Start time: suggest a time (e.g., "09:00")
- Time blocks: 15-25 minutes each
- Phases: Warm-up (1-2 activities) → Core (main activities) → Calming (1-2 activities)
- Total duration: approximately {time_available} minutes
- Ensure at least 3 different domains"""
    else:
        timetable_instructions = """WEEKLY PLAN STRUCTURE:
- MULTIPLE DAYS: Day 1, Day 2, Day 3, Day 4, Day 5 (or Day 1-7)
- Each day: short session (15-30 minutes) with time blocks
- Vary domains across days: ensure at least 4 different domains across the week
- Each day should include Warm-up, Core, and Calming phases
- Distribute activities across days (not all in one day)
- Total duration: approximately {time_available} minutes across all days"""
    
    user_prompt = f"""Create a TIMETABLE-STYLE {plan_type.upper()} plan for a child with autism.

CHILD PROFILE:
- Name: {child_profile.get('name')}
- Age: {child_profile.get('age')} years
- Communication Level: {child_profile.get('communication_level')}
- Autism Level: {child_profile.get('autism_level')}
- Goals: {', '.join(child_profile.get('goals', [])) if child_profile.get('goals') else 'General development'}
- Sensory Sensitivities: Sound={child_profile.get('sensory_sensitivity', {}).get('sound', 'low')}, Light={child_profile.get('sensory_sensitivity', {}).get('light', 'low')}, Touch={child_profile.get('sensory_sensitivity', {}).get('touch', 'low')}

PLAN REQUIREMENTS:
- Plan Type: {plan_type.upper()}
- Time Available: {time_available} minutes
- Budget: {plan_request.get('budget')}
- Available Materials: {', '.join(plan_request.get('available_materials', [])) if plan_request.get('available_materials') else 'Any materials'}
- Attention Level: {plan_request.get('attention_level')}
- Environment: {plan_request.get('environment')}

SELECTED ACTIVITIES (YOU MUST USE ALL OF THESE):
{format_activities_fn(selected_activities)}

{timetable_instructions}

OUTPUT FORMAT (STRICT JSON ONLY):
{{
  "plan_type": "{plan_type.capitalize()}",
  "plan_title": "Descriptive title for this {plan_type} plan",
  "overview": "2-3 sentence overview emphasizing how it addresses the child's goals",
  "total_duration_minutes": <total minutes>,
  "materials_needed": ["material1", "material2", ...],
  "timetable": [
    {{
      "day": "Today" OR "Day 1",
      "start_time": "09:00" (optional),
      "blocks": [
        {{
          "time_range": "09:00-09:15",
          "phase": "Warm-up" OR "Core" OR "Calming",
          "activity_id": "<exact ID from selected activities>",
          "activity_name": "<exact name from selected activities>",
          "domain": "<domain from selected activities>",
          "why": "1-2 sentences explaining why this activity fits here",
          "steps": ["step 1", "step 2", "step 3"]
        }}
      ]
    }}
  ],
  "caregiver_notes": "Practical notes for caregivers implementing this plan"
}}

CRITICAL REQUIREMENTS:
1. Use ALL selected activities (no skipping)
2. Include ALL three phases (Warm-up, Core, Calming)
3. Daily: ONE day labeled "Today"
4. Weekly: MULTIPLE days (Day 1, Day 2, etc.) - NOT just one day
5. Vary domains: at least 3 domains (daily) or 4 domains (weekly)
6. Time ranges must be realistic and sequential
7. Return ONLY the JSON object, no markdown, no extra text"""

    return system_prompt, user_prompt


def build_repair_prompt(
    validation_errors: List[str],
    selected_activities: List[Dict[str, Any]],
    plan_request: Dict[str, Any],
    format_activities_fn,
) -> tuple[str, str]:
    """Build repair prompt when validation fails."""
    
    plan_type = plan_request.get('plan_type', 'daily')
    is_daily = plan_type == 'daily'
    
    system_prompt = """You are fixing an invalid activity plan. The previous attempt failed validation.

CRITICAL:
1. You MUST fix ALL validation errors listed below.
2. You MUST use ONLY the selected activities provided.
3. Return ONLY valid JSON matching the exact schema - no markdown, no extra text."""

    user_prompt = f"""The previous plan failed validation with these errors:
{chr(10).join(f'- {error}' for error in validation_errors)}

SELECTED ACTIVITIES (YOU MUST USE ONLY THESE):
{format_activities_fn(selected_activities)}

FIX THE PLAN:
1. Address ALL validation errors listed above
2. Ensure the plan matches the required structure
3. Use ONLY the selected activities provided
4. Return the corrected plan in the same JSON format

OUTPUT FORMAT (STRICT JSON ONLY):
{{
  "plan_type": "{plan_type.capitalize()}",
  "plan_title": "...",
  "overview": "...",
  "total_duration_minutes": <number>,
  "materials_needed": ["..."],
  "timetable": [
    {{
      "day": "Today" OR "Day 1",
      "start_time": "HH:MM" (optional),
      "blocks": [
        {{
          "time_range": "HH:MM-HH:MM",
          "phase": "Warm-up" OR "Core" OR "Calming",
          "activity_id": "<from selected activities>",
          "activity_name": "<from selected activities>",
          "domain": "<from selected activities>",
          "why": "1-2 sentences",
          "steps": ["step 1", "step 2"]
        }}
      ]
    }}
  ],
  "caregiver_notes": "..."
}}

Return ONLY the corrected JSON, no markdown, no extra text."""

    return system_prompt, user_prompt

