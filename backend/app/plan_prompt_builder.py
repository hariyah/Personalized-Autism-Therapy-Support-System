"""Centralized prompt builder for therapist-like activity plan generation."""
from typing import Dict, Any, List


def build_therapist_plan_prompt(
    child_profile: Dict[str, Any],
    activities: List[Dict[str, Any]],
    plan_request: Dict[str, Any],
    recent_outcomes: List[Dict[str, Any]],
    format_activities_fn,
    format_outcomes_fn,
) -> tuple[str, str]:
    """Build system and user prompts for therapist-like plan generation."""
    
    system_prompt = """You are an expert therapist creating structured, child-specific ACTIVITY PLANS for children with autism spectrum disorder (ASD).

CRITICAL RULES:
1. You MUST ONLY use activities from the provided dataset. DO NOT invent, modify, or create new activities.
2. You are creating a COHERENT PLAN, not just listing activities. Think like a therapist planning a session.
3. Activities are BUILDING BLOCKS - arrange them into a logical flow: Warm-up → Core → Calming
4. DO NOT repeat the same activity. Each activity must be unique.
5. Adapt activity duration and difficulty based on the child's profile.
6. Explain WHY each activity is placed in its phase.
7. Return ONLY valid JSON matching the exact schema provided - no markdown, no extra text.
8. USE YOUR MAXIMUM CAPABILITIES FOR INTELLIGENT FILTERING AND SELECTION:
   - Carefully analyze each activity's Materials field when materials are specified
   - Use intelligent matching: case-insensitive, partial matches, word boundaries, synonyms
   - Analyze activity goals, skills, difficulty, age range, and sensory suitability
   - Consider the child's profile: goals, autism level, communication level, sensory sensitivities
   - Balance variety across domains (motor, cognitive, social, etc.)
   - Select the BEST activities that meet ALL criteria, not just the first ones you see

CRITICAL SAFETY CONSTRAINTS:
- NEVER provide medical advice or diagnosis
- NEVER suggest activities that could be harmful
- Respect sensory sensitivities (avoid high sensory load if child has high sensitivity)
- Use simple, clear language appropriate to the child's communication level
- Focus on activities that are safe, engaging, and developmentally appropriate

MATERIALS FILTERING GUIDANCE (STRICT MODE WHEN MATERIALS PROVIDED):
- When available materials are specified, you MUST STRICTLY filter and ONLY select activities that use those materials
- Use your full analytical capabilities to examine each activity's Materials field carefully
- Match materials intelligently: case-insensitive, partial matches, word boundaries (e.g., "paper" matches "colored paper", "markers" matches "marker")
- Activities with "None specified" or empty materials are EXCLUDED when materials are provided
- The candidate list has been pre-filtered, but you should double-check material matches using your intelligence
- When NO materials are specified, use your maximum capabilities to filter by: child goals, age, autism level, communication level, sensory needs, attention level, environment, and recent outcomes"""

    # Always use daily plan
    plan_type = 'Daily'
    time_available = plan_request.get('time_available_minutes', 'Not specified')
    # Daily: 5-7 activities
    min_activities = 5
    max_activities = 7
    
    # Build materials constraint section if materials are provided
    available_materials = plan_request.get('available_materials', [])
    materials_constraint_section = ""
    if available_materials:
        # Normalize materials to lowercase for matching (display can be capitalized)
        normalized_materials = [mat.lower().strip() for mat in available_materials]
        materials_list = '\n'.join([f"- {mat}" for mat in available_materials])
        materials_constraint_section = f"""
*** CRITICAL MATERIALS CONSTRAINT - STRICT FILTERING REQUIRED ***
The following materials are AVAILABLE and you MUST ONLY select activities that use these materials:
{materials_list}

STRICT MATERIALS FILTERING RULES:
1. YOU MUST ONLY SELECT activities whose "Materials" field contains at least ONE of the available materials listed above
2. Check the "Materials" field for each activity in the dataset above
3. Match materials intelligently:
   - Case-insensitive matching: "Paper" matches "paper", "PAPER", "Paper"
   - Partial matching: "colored paper" matches "paper", "paper" matches "colored paper"
   - Word boundary matching: "markers" matches "marker", "markers"
4. DO NOT select activities that have "None specified" or empty materials field - they are EXCLUDED
5. DO NOT select activities that use materials NOT in the available list above
6. You MUST analyze each activity's Materials field carefully and only select those that match
7. If an activity lists multiple materials (comma-separated), it's acceptable if at least ONE material matches the available list

CRITICAL: The candidate activities list has been pre-filtered to only include activities matching available materials. You MUST select ONLY from these pre-filtered activities. Every activity you select MUST use at least one of the available materials: {', '.join(available_materials)}
"""
    
    user_prompt = f"""You are creating a {plan_type} ACTIVITY PLAN for a child with autism. Think like a therapist planning a structured session.

CHILD PROFILE:
- Name: {child_profile.get('name')}
- Age: {child_profile.get('age')} years
- Communication Level: {child_profile.get('communication_level')}
- Autism Level: {child_profile.get('autism_level')} (support needs)
- Sensory Sensitivities: Sound={child_profile.get('sensory_sensitivity', {}).get('sound', 'low')}, Light={child_profile.get('sensory_sensitivity', {}).get('light', 'low')}, Touch={child_profile.get('sensory_sensitivity', {}).get('touch', 'low')}
- Goals: {', '.join(child_profile.get('goals', [])) if child_profile.get('goals') else 'General development'}

PLAN REQUIREMENTS:
- Plan Type: {plan_type} ({min_activities}-{max_activities} total activities)
- Time Available: {time_available} minutes
- Budget: {plan_request.get('budget')}
- Available Materials: {', '.join(available_materials) if available_materials else 'Any materials'}
- Attention Level: {plan_request.get('attention_level')}
- Environment: {plan_request.get('environment')}
{materials_constraint_section}

RECENT OUTCOMES (for learning):
{format_outcomes_fn(recent_outcomes)}

AVAILABLE ACTIVITIES FROM DATASET (YOU MUST ONLY USE THESE):
{format_activities_fn(activities)}

{f'*** CRITICAL: All activities in the list below have been STRICTLY FILTERED to only include those using available materials: {", ".join(available_materials)}. You MUST select ONLY from these activities. Every activity shown should match at least one available material. ***' if available_materials else '*** NOTE: No materials constraint - select activities based on child profile, goals, age, autism level, and other criteria. ***'}

YOUR TASK: Create a structured {plan_type.lower()} plan with EXACTLY {min_activities}-{max_activities} TOTAL activities organized into three phases:

CRITICAL: The TOTAL number of activities across ALL phases must be {min_activities}-{max_activities}. Do NOT create a plan with only 3 activities (one per phase).

1. WARM-UP PHASE (order: 1)
   - Include 1-2 gentle, low-demand activities
   - Prepare the child for engagement
   - Consider sensory needs and attention level

2. CORE PHASE (order: 2)
   - Include MOST of the activities ({max(2, min_activities - 3)}-{max_activities - 2} activities)
   - Main learning and skill-building activities
   - Balance different domains (motor, cognitive, social, etc.)
   - Adapt duration based on attention level
   - Ensure variety - NO duplicate activities

3. CALMING PHASE (order: 3)
   - Include 1-2 calming, low-stimulation activities
   - Help transition to next activity or rest
   - Consider sensory sensitivities

EXAMPLE DISTRIBUTION FOR {plan_type.upper()} PLAN ({min_activities}-{max_activities} total):
- Warm-up: 1-2 activities
- Core: {max(2, min_activities - 3)}-{max_activities - 2} activities (MOST activities go here)
- Calming: 1-2 activities
- TOTAL: {min_activities}-{max_activities} activities

CRITICAL REQUIREMENTS:
1. *** YOU MUST ONLY USE ACTIVITIES FROM THE PROVIDED DATASET ABOVE ***
   - Match activity_id EXACTLY as shown in the dataset
   - Match activity_name EXACTLY as shown in the dataset
   - DO NOT invent, create, or modify activity names
   - DO NOT use activity IDs that are not in the dataset above
   - If an activity is not in the dataset list above, DO NOT use it
   - Every activity_id and activity_name you use MUST appear EXACTLY in the dataset provided above
2. DO NOT invent, modify, or create new activities - this is CRITICAL
3. *** UNIQUE ACTIVITIES REQUIRED ***
   - Each activity in the plan MUST be completely different from all other activities
   - DO NOT repeat the same activity_id anywhere in the plan
   - DO NOT repeat the same activity_name anywhere in the plan
   - Each activity must have a unique activity_id and unique activity_name
   - If you see similar activities, choose only ONE of them, not multiple variations
   - The plan must contain {min_activities}-{max_activities} DISTINCT, UNIQUE activities with no duplicates
4. {f'*** STRICT MATERIALS FILTERING (HIGHEST PRIORITY) ***\n   - YOU MUST ONLY SELECT activities that use available materials: {", ".join(available_materials)}\n   - Check the "Materials" field for each activity (case-insensitive, partial matching OK)\n   - DO NOT select activities with "None specified" or empty materials\n   - DO NOT select activities using materials NOT in the available list\n   - Every single activity you select MUST use at least one available material\n   - The candidate list has been pre-filtered - all activities shown should match materials' if available_materials else 'PRIORITIZE activities that match the child\'s goals and needs'}
5. PRIORITIZE activities that match the child's goals: {', '.join(child_profile.get('goals', [])) if child_profile.get('goals') else 'General development'}
   - Select activities whose goals/skills align with the child's development goals
   - At least 50% of activities should directly support the stated goals
6. Adapt duration: shorter for low attention, longer for high attention
7. Adapt difficulty based on autism level and age
8. Explain WHY each activity is in its phase AND how it supports the child's goals
9. Balance domains across the plan
10. Respect sensory sensitivities - avoid high sensory load if child has high sensitivity
11. Total duration should be approximately {time_available} minutes (if specified)
12. Collect and list ALL materials needed across all activities
13. *** STEP-BY-STEP INSTRUCTIONS ***
    - Each activity in the dataset has "Steps" listed above
    - USE THE DATASET STEPS AS THE BASE for step_by_step
    - Only adapt them if needed for this specific child's age ({child_profile.get('age')}), autism level ({child_profile.get('autism_level')}), or sensory needs
    - If the dataset steps are appropriate, use them as-is or with minor adaptations
    - DO NOT create generic or repeated steps - use the specific steps from the dataset

OUTPUT FORMAT (STRICT JSON ONLY - NO MARKDOWN):
{{
  "plan_type": "{plan_type}",
  "plan_name": "Descriptive name for this {plan_type.lower()} plan",
  "plan_overview": "2-3 sentence overview of the plan's goals and approach for this specific child, emphasizing how it addresses their goals: {', '.join(child_profile.get('goals', [])) if child_profile.get('goals') else 'General development'}",
  "total_duration_minutes": <total minutes for all activities>,
  "planning_rationale": "Explain why you structured the plan this way, considering the child's profile, goals ({', '.join(child_profile.get('goals', [])) if child_profile.get('goals') else 'General development'}), attention level, and sensory needs",
  "materials_summary": ["material1", "material2", ...],
  "schedule": [
    {{
      "phase": "Warm-up",
      "order": 1,
      "activities": [
        {{
          "activity_id": "<exact ID from dataset>",
          "activity_name": "<exact name from dataset>",
          "domain": "<domain from dataset>",
          "description": "Brief 1-2 sentence description of what this activity involves and what the child will do. This should explain the activity in simple, clear terms.",
          "recommended_duration_minutes": <adapted duration>,
          "difficulty_adaptation": "How to adapt difficulty for this child's age ({child_profile.get('age')}) and autism level ({child_profile.get('autism_level')})",
          "why_this_activity_here": "Why this activity is placed in Warm-up phase AND how it supports the child's goals ({', '.join(child_profile.get('goals', [])) if child_profile.get('goals') else 'development'})",
          "step_by_step": ["step 1", "step 2", "step 3", "step 4"],
          NOTE: Use the "Steps" from the activity dataset above as the base. Only adapt them if needed for this specific child's age, autism level, or sensory needs. If the dataset steps are appropriate, use them as-is or with minor adaptations.
          "sensory_considerations": "Sensory considerations and adaptations for this child",
          "expected_outcome": "What outcome to expect for this specific child"
        }}
      ]
    }},
    {{
      "phase": "Core",
      "order": 2,
      "activities": [
        <multiple activities with same structure>
      ]
    }},
    {{
      "phase": "Calming",
      "order": 3,
      "activities": [
        <1-2 activities with same structure>
      ]
    }}
  ]
}}

REMEMBER:
- Return ONLY the JSON object, no markdown code blocks, no extra text
- *** CRITICAL: Use EXACT activity_id and activity_name from the dataset provided above ***
  - Every activity_id you use MUST exist in the dataset list above
  - Every activity_name you use MUST exist in the dataset list above
  - DO NOT invent new activity names or IDs
  - DO NOT use activities that are not listed in the "AVAILABLE ACTIVITIES FROM DATASET" section above
  - Before selecting an activity, verify its ID and name appear in the dataset list above
- Ensure total activities = {min_activities}-{max_activities}
- Ensure total_duration_minutes >= 30 (minimum required by schema)
- *** CRITICAL: NO DUPLICATE ACTIVITIES ***
  - Each activity_id must appear ONLY ONCE in the entire plan
  - Each activity_name must appear ONLY ONCE in the entire plan
  - All {min_activities}-{max_activities} activities must be completely different and unique
  - Before finalizing, verify that no activity_id or activity_name is repeated
- All activities must come from the provided dataset - DO NOT invent or create new ones"""

    return system_prompt, user_prompt

