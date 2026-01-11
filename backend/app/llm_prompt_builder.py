"""Helper for building structured LLM prompts for activity plan generation."""
from typing import List, Dict, Any


def build_structured_prompt(
    child_profile: Dict[str, Any],
    activities: List[Dict[str, Any]],
    plan_request: Dict[str, Any],
    recent_outcomes: List[Dict[str, Any]],
    format_activities_fn,
    format_outcomes_fn,
) -> tuple[str, str]:
    """Build system and user prompts for structured daily/weekly plan generation.
    
    Returns:
        (system_prompt, user_prompt)
    """
    plan_type = plan_request.get('plan_type', 'weekly')
    plan_type_capitalized = plan_type.capitalize()
    # Daily: 5-7 activities, Weekly: 8-12 activities
    min_activities = 5 if plan_type == 'daily' else 8
    max_activities = 7 if plan_type == 'daily' else 12
    
    system_prompt = """You are a supportive AI assistant helping therapists and parents create structured activity plans for children with autism spectrum disorder (ASD).

CRITICAL RULES:
1. You MUST ONLY select activities from the provided candidate list. Use the exact activity_id and activity_name.
2. NEVER invent or create new activities not in the candidate list.
3. Return ONLY valid JSON - no markdown code blocks, no explanations, no additional text.
4. The JSON must match the exact schema provided below.

CRITICAL SAFETY CONSTRAINTS:
- NEVER provide medical advice or diagnosis
- NEVER suggest activities that could be harmful
- Respect sensory sensitivities
- Use simple, clear language appropriate to the child's communication level
- Focus on activities that are safe, engaging, and developmentally appropriate"""

    user_prompt = f"""Child Profile:
- Name: {child_profile.get('name')}
- Age: {child_profile.get('age')}
- Communication Level: {child_profile.get('communication_level')}
- Autism Level: {child_profile.get('autism_level')}
- Sensory Sensitivities: {child_profile.get('sensory_sensitivity')}
- Goals: {', '.join(child_profile.get('goals', []))}

Plan Requirements:
- Plan Type: {plan_type_capitalized} (MUST have {min_activities}-{max_activities} total activities)
- Budget: {plan_request.get('budget')}
- Available Materials: {', '.join(plan_request.get('available_materials', [])) if plan_request.get('available_materials') else 'None specified'}
- Attention Level: {plan_request.get('attention_level')}
- Environment: {plan_request.get('environment')}
- Time Available: {plan_request.get('time_available_minutes', 'Not specified')} minutes

Recent Activity Outcomes (last 3):
{format_outcomes_fn(recent_outcomes)}

CANDIDATE ACTIVITIES (YOU MUST ONLY SELECT FROM THIS LIST):
{format_activities_fn(activities)}

IMPORTANT: You can ONLY use activities from the candidate list above. Match by activity_id exactly.

Create a {plan_type_capitalized} plan with EXACTLY {min_activities}-{max_activities} activities total across all schedule entries.

For {plan_type} plans:
- Daily: Use "Today" as the day name, organize into Warm-up, Core, and Calming time blocks
- Weekly: Use "Day 1", "Day 2", etc., organize into Warm-up, Core, and Calming time blocks across days

REQUIRED JSON SCHEMA (return ONLY this, no markdown):
{{
  "plan_type": "{plan_type_capitalized}",
  "plan_name": "string",
  "plan_overview": "string",
  "total_duration_minutes": number,
  "materials_summary": ["material1", "material2"],
  "schedule": [
    {{
      "day": "Today" or "Day 1",
      "time_block": "Warm-up" or "Core" or "Calming",
      "activities": [
        {{
          "activity_id": "exact_id_from_candidate_list",
          "activity_name": "exact_name_from_candidate_list",
          "domain": "Speech|Fine Motor|Sensory|Gross Motor|Writing",
          "source_type": "synthetic|public_reference",
          "recommended_duration_minutes": number,
          "difficulty_adaptation": "string",
          "why_this_fits": "2-3 sentences referencing profile + constraints",
          "materials": ["material1", "material2"],
          "step_by_step": ["step 1", "step 2", "step 3", "step 4"],
          "sensory_safe_variant": "string",
          "expected_benefit": "string",
          "success_checklist": ["indicator1", "indicator2", "indicator3"]
        }}
      ]
    }}
  ]
}}

RULES:
- Total activities MUST be {min_activities}-{max_activities}
- All activity_id values MUST match IDs from candidate list
- For Daily plans, include at least one Calming time block
- For Weekly plans, include Calming blocks across multiple days
- Keep step_by_step concise (4 steps max) and caregiver-friendly
- Respect time_available_minutes constraint
- Return ONLY JSON, no markdown formatting"""

    return system_prompt, user_prompt

