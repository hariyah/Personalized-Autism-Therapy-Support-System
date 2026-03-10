"""Recommendation engine using RAG with FAISS vector search."""
import json
import logging
from typing import List, Dict, Any, Optional, Tuple
from app.llm_providers import get_llm_provider
from app.schemas import StructuredActivityPlan, RecommendationResponse, ScheduledActivity, PlanPhase
from app.database import get_database
from app.reinforcement_learning import ActivityScorer, build_learning_enhanced_query
from app.plan_prompt_builder import build_therapist_plan_prompt
from bson import ObjectId

logger = logging.getLogger(__name__)


class RecommendationEngine:
    def __init__(self):
        self._llm_provider = None
        self._vector_store = None
        self._current_plan_request = {}
        self._activity_scorer = ActivityScorer()
    
    @property
    def llm_provider(self):
        if self._llm_provider is None:
            self._llm_provider = get_llm_provider()
        return self._llm_provider
    
    @property
    def vector_store(self):
        if self._vector_store is None:
            try:
                from app.vector_store import ActivityVectorStore
                self._vector_store = ActivityVectorStore()
                if not self._vector_store.load():
                    logger.error("Vector store files not found")
                    raise RuntimeError("Vector store not found. Please run: python app/load_activities.py first.")
            except ImportError as e:
                logger.error(f"Import error: {str(e)}")
                raise RuntimeError(
                    "FAISS dependencies not installed. Please run: pip install faiss-cpu sentence-transformers pandas"
                ) from e
            except Exception as e:
                logger.error(f"Error loading vector store: {type(e).__name__}: {str(e)}")
                raise
        return self._vector_store

    async def generate_recommendations(
        self,
        profile_id: str,
        plan_request: Dict[str, Any],
        user_id: str,
    ) -> RecommendationResponse:
        # Store plan_request for use in fallback methods
        self._current_plan_request = plan_request
        try:
            db = get_database()
            
            # Fetch child profile and verify ownership
            profile = await db.profiles.find_one({"_id": ObjectId(profile_id), "user_id": user_id})
            if not profile:
                logger.error(f"Profile {profile_id} not found for user {user_id}")
                raise ValueError(f"Profile {profile_id} not found")
            
            # Fetch recent outcomes (last 10 for learning, last 3 for context)
            all_recent_outcomes = await db.outcomes.find(
                {"profile_id": profile_id}
            ).sort("completed_at", -1).limit(10).to_list(10)
            recent_outcomes = all_recent_outcomes[:3]  # Last 3 for LLM context
            
            # Update activity scorer with outcomes for reinforcement learning
            logger.info(f"[RL] ===== REINFORCEMENT LEARNING UPDATE =====")
            logger.info(f"[RL] Loading {len(all_recent_outcomes)} outcomes for profile {profile_id}")
            self._activity_scorer.update_from_outcomes(all_recent_outcomes)
            logger.info(f"[RL] Activity scorer updated with outcomes")
            
            # Build semantic search query from profile and plan request
            base_query = self._build_search_query(profile, plan_request, recent_outcomes)
            # Enhance query with learning from outcomes
            search_query = build_learning_enhanced_query(base_query, all_recent_outcomes, profile)
            
            # Apply filters for safety
            filters = self._build_filters(profile)
            
            # Perform semantic search - get more candidates for better variety
            candidate_activities = self.vector_store.search(
                query=search_query,
                k=50,  # Get more candidates to ensure variety
                filters=filters
            )
            
            # Apply reinforcement learning: boost/penalize activities based on outcomes
            logger.info(f"[RL] ===== APPLYING REINFORCEMENT LEARNING =====")
            logger.info(f"[RL] Processing {len(candidate_activities)} candidate activities")
            scored_activities = self._apply_reinforcement_learning(candidate_activities)
            logger.info(f"[RL] Applied RL scores to {len(scored_activities)} activities (some may have been filtered out)")
            
            # Further filter by triggers and refine
            filtered_activities = self._apply_safety_filters(profile, scored_activities)
            
            # Ensure variety - remove duplicates and similar activities
            diverse_activities = self._ensure_activity_variety(filtered_activities, profile)
            
            # STRICTLY filter by available materials if specified
            available_materials = plan_request.get('available_materials', [])
            min_activities_required = 5  # Daily plan minimum
            if available_materials:
                # STRICT FILTER: Only keep activities that use available materials
                materials_filtered = self._strict_filter_by_materials(diverse_activities, available_materials)
                
                if len(materials_filtered) < min_activities_required:
                    logger.warning(f"Only {len(materials_filtered)} activities match materials (need {min_activities_required}). This may limit plan generation.")
                    # Still use only materials-matching activities (strict mode)
                    diverse_activities = materials_filtered
                else:
                    diverse_activities = materials_filtered
            
            # Take top 30-40 diverse activities for LLM to do intelligent filtering and selection
            # Give LLM more candidates to work with for better selection
            max_candidates = max(40, min_activities_required * 6)  # At least 6x the minimum for good selection
            top_activities = diverse_activities[:max_candidates] if len(diverse_activities) >= max_candidates else diverse_activities
            
            # Log RL impact on final selection
            rl_boosted_in_final = [a for a in top_activities if a.get('_rl_boost', 1.0) > 1.0]
            rl_penalized_in_final = [a for a in top_activities if a.get('_rl_boost', 1.0) < 1.0]
            logger.info(
                f"[RL] Final candidate selection: {len(top_activities)} activities | "
                f"RL-boosted: {len(rl_boosted_in_final)} | "
                f"RL-penalized: {len(rl_penalized_in_final)} | "
                f"Neutral: {len(top_activities) - len(rl_boosted_in_final) - len(rl_penalized_in_final)}"
            )
            # Generate activity plan using LLM with RAG context
            llm_response = await self.llm_provider.generate_activity_plan(
                child_profile=self._profile_to_dict(profile),
                activities=[self._csv_activity_to_dict(a) for a in top_activities],
                plan_request=plan_request,
                recent_outcomes=recent_outcomes,
            )
            
            # Parse LLM response
            plan = self._parse_llm_plan_response(llm_response, top_activities, plan_request)
            
            return RecommendationResponse(plan=plan)
        except Exception as e:
            logger.error(f"Error in generate_recommendations: {type(e).__name__}: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
            raise

    def _build_search_query(
        self,
        profile: Dict[str, Any],
        plan_request: Dict[str, Any],
        recent_outcomes: List[Dict[str, Any]]
    ) -> str:
        """Build a semantic search query from profile and plan request."""
        query_parts = []
        
        # Prioritize goals - make them prominent in the query
        goals = profile.get("goals", [])
        if goals:
            # Emphasize goals by repeating them and using strong language
            goals_text = ', '.join(goals)
            query_parts.append(f"Activities specifically targeting: {goals_text}")
            query_parts.append(f"Skill-building activities for {goals_text}")
            query_parts.append(f"Development activities focused on {goals_text}")
        
        # Add autism level
        autism_level = profile.get("autism_level", "")
        if autism_level:
            query_parts.append(f"Autism level: {autism_level}")
        
        # Add communication level
        comm_level = profile.get("communication_level", "")
        if comm_level:
            query_parts.append(f"Communication: {comm_level}")
        
        # Add plan request context
        budget = plan_request.get("budget", "")
        available_materials = plan_request.get("available_materials", [])
        attention_level = plan_request.get("attention_level", "")
        environment = plan_request.get("environment", "")
        
        if budget:
            query_parts.append(f"Budget: {budget}")
        if available_materials:
            query_parts.append(f"Available materials: {', '.join(available_materials)}")
        if attention_level:
            query_parts.append(f"Attention level: {attention_level}")
        if environment:
            query_parts.append(f"Environment: {environment}")
        
        # Add age
        age = profile.get("age")
        if age:
            query_parts.append(f"Age {age} years")
        
        return " | ".join(query_parts)

    def _parse_age_range(self, age_range_str: str) -> Optional[Tuple[int, int]]:
        """Parse age range string like '4-6' into (min_age, max_age)."""
        if not age_range_str or not isinstance(age_range_str, str):
            return None
        try:
            if '-' in age_range_str:
                parts = age_range_str.split('-')
                if len(parts) == 2:
                    min_age = int(parts[0].strip())
                    max_age = int(parts[1].strip())
                    return (min_age, max_age)
        except (ValueError, AttributeError):
            pass
        return None

    def _matches_age_range(self, child_age: int, activity_age_range: str) -> bool:
        """Check if child age overlaps with activity age range."""
        parsed = self._parse_age_range(activity_age_range)
        if parsed is None:
            return True  # If we can't parse, allow it (lenient)
        min_age, max_age = parsed
        return min_age <= child_age <= max_age

    def _build_filters(self, profile: Dict[str, Any]) -> Dict[str, Any]:
        """Build filters for vector search."""
        return {
            "age": profile.get("age"),
            "sensory_sensitivity": profile.get("sensory_sensitivity", {}),
            "autism_level": profile.get("autism_level"),
        }

    def _apply_safety_filters(
        self, profile: Dict[str, Any], activities: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Filter activities based on triggers, age range, and sensory safety."""
        filtered = []
        triggers = profile.get("triggers", [])
        child_age = profile.get("age")
        sensory_sensitivity = profile.get("sensory_sensitivity", {})
        
        for activity in activities:
            skip = False
            
            # 1. Age range filter - enforce strict overlap
            if child_age is not None:
                age_range = activity.get("age_range", "")
                if not self._matches_age_range(child_age, age_range):
                    skip = True
                    continue
            
            # 2. Autism level filter - match with CSV autism_level_suitability
            autism_level = profile.get("autism_level", "")
            if autism_level:
                activity_autism_level = activity.get("autism_level_suitability", "")
                # Direct matching: profile has "Level 1", "Level 2", or "Level 3", CSV has "Level 1 (mild support)", etc.
                if autism_level not in activity_autism_level:
                    continue
            
            # 3. Sensory safety filter
            activity_sensory = activity.get("sensory_suitability", "").lower()
            
            # If child has high sensitivity to sound/light/touch, avoid sensory-seeking activities
            if any(level in ['high', 'med'] for level in sensory_sensitivity.values()):
                if 'sensory-seeking' in activity_sensory:
                    continue
            
            filtered.append(activity)
        
        return filtered

    def _apply_reinforcement_learning(
        self, activities: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Apply reinforcement learning scores to activities and re-rank."""
        scored = []
        avoided_count = 0
        boosted_count = 0
        penalized_count = 0
        neutral_count = 0
        
        logger.info(f"[RL] Evaluating {len(activities)} activities for RL scoring...")
        
        for idx, activity in enumerate(activities):
            activity_id = str(activity.get("id", ""))
            activity_name = activity.get("activity_name", "Unknown")[:50]
            
            # Check if activity should be avoided
            if self._activity_scorer.should_avoid_activity(activity_id):
                avoided_count += 1
                logger.warning(f"[RL] [{idx+1}/{len(activities)}] AVOIDED: {activity_id} ({activity_name}) - Poor outcomes")
                continue
            
            # Get RL boost multiplier
            boost = self._activity_scorer.get_activity_boost(activity_id)
            activity_score = self._activity_scorer.get_activity_score(activity_id)
            
            # Track boost/penalty status
            if boost > 1.0:
                boosted_count += 1
                status = "BOOSTED"
            elif boost < 1.0:
                penalized_count += 1
                status = "PENALIZED"
            else:
                neutral_count += 1
                status = "NEUTRAL"
            
            logger.info(
                f"[RL] [{idx+1}/{len(activities)}] {status}: {activity_id} ({activity_name}) | "
                f"RL Score={activity_score:.3f} | Boost={boost:.2f}x"
            )
            
            # Add RL metadata to activity
            activity_copy = activity.copy()
            activity_copy['_rl_score'] = activity_score
            activity_copy['_rl_boost'] = boost
            
            # Store original position for reference
            activity_copy['_original_position'] = len(scored)
            
            scored.append(activity_copy)
        
        # Re-rank by RL boost (multiply semantic similarity by boost)
        # Activities are already sorted by similarity, so we'll boost high-scoring ones
        logger.info(f"[RL] Re-ranking activities by RL boost multiplier...")
        scored.sort(key=lambda x: x.get('_rl_boost', 1.0), reverse=True)
        
        # Log top boosted activities
        top_boosted = sorted(scored, key=lambda x: x.get('_rl_boost', 1.0), reverse=True)[:5]
        if top_boosted:
            logger.info(f"[RL] Top 5 boosted activities:")
            for i, act in enumerate(top_boosted, 1):
                logger.info(
                    f"[RL]   {i}. {act.get('activity_name', 'Unknown')[:50]} | "
                    f"Boost={act.get('_rl_boost', 1.0):.2f}x | Score={act.get('_rl_score', 0.5):.3f}"
                )
        
        logger.info(
            f"[RL] ===== RL SUMMARY =====\n"
            f"[RL] Total processed: {len(activities)} | "
            f"Kept: {len(scored)} | "
            f"Avoided: {avoided_count} | "
            f"Boosted (>1.0x): {boosted_count} | "
            f"Penalized (<1.0x): {penalized_count} | "
            f"Neutral (1.0x): {neutral_count}"
        )
        
        return scored

    def _ensure_activity_variety(
        self, activities: List[Dict[str, Any]], profile: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Ensure variety: no duplicates, mix domains, prioritize goal-matching activities."""
        if not activities:
            return []
        
        diverse = []
        seen_domains = set()
        seen_names = set()
        seen_ids = set()
        
        # Get profile goals for prioritization
        goals = set(profile.get("goals", []))
        
        # Separate activities into goal-matching and others
        goal_matching = []
        others = []
        
        for activity in activities:
            activity_name = activity.get("activity_name", "").lower()
            activity_id = str(activity.get("id", ""))
            domain = activity.get("domain", "").lower()
            goal = activity.get("goal", "").lower()
            skills = activity.get("skills_targeted", [])
            if isinstance(skills, str):
                skills = [s.lower() for s in skills.split(',') if s.strip()]
            
            # Check if activity matches any profile goal
            matches_goal = False
            if goals:
                # Check if activity goal matches profile goal
                for profile_goal in goals:
                    profile_goal_lower = profile_goal.lower()
                    if (profile_goal_lower in goal or 
                        profile_goal_lower in activity_name or
                        any(profile_goal_lower in skill for skill in skills)):
                        matches_goal = True
                        break
            
            if matches_goal:
                goal_matching.append(activity)
            else:
                others.append(activity)
        
        # Prioritize goal-matching activities first
        prioritized = goal_matching + others
        
        for activity in prioritized:
            activity_name = activity.get("activity_name", "").lower()
            activity_id = str(activity.get("id", ""))
            domain = activity.get("domain", "").lower()
            goal = activity.get("goal", "").lower()
            
            # Skip exact duplicates by name or ID
            if activity_name in seen_names or activity_id in seen_ids:
                continue
            
            seen_names.add(activity_name)
            seen_ids.add(activity_id)
            
            # Prefer activities from different domains
            domain_key = f"{domain}_{goal}"
            if domain_key not in seen_domains or len(diverse) < 10:
                diverse.append(activity)
                seen_domains.add(domain_key)
            elif len(diverse) < 30:  # Still add more if we have space
                # Check if it's sufficiently different
                is_different = True
                for existing in diverse[:10]:  # Compare with first 10
                    existing_name = existing.get("activity_name", "").lower()
                    # Skip if names are too similar
                    if activity_name in existing_name or existing_name in activity_name:
                        is_different = False
                        break
                
                if is_different:
                    diverse.append(activity)
        
        return diverse

    def _strict_filter_by_materials(
        self, activities: List[Dict[str, Any]], available_materials: List[str]
    ) -> List[Dict[str, Any]]:
        """STRICTLY filter activities to only those that use available materials."""
        if not available_materials:
            return activities
        
        # Normalize available materials to lowercase
        available_materials_lower = [mat.lower().strip() for mat in available_materials]
        
        matching_activities = []
        
        for activity in activities:
            activity_materials = activity.get('materials', '')
            if isinstance(activity_materials, str):
                activity_materials_list = [m.strip().lower() for m in activity_materials.split(',') if m.strip()]
            elif isinstance(activity_materials, list):
                activity_materials_list = [str(m).strip().lower() for m in activity_materials if m]
            else:
                activity_materials_list = []
            
            # Skip activities with no materials specified (strict mode)
            if not activity_materials_list:
                continue
            
            # Check if any material matches (case-insensitive, with partial matching)
            matches = False
            for mat in activity_materials_list:
                # Exact match
                if mat in available_materials_lower:
                    matches = True
                    break
                # Partial match (e.g., "colored paper" contains "paper")
                for avail_mat in available_materials_lower:
                    if avail_mat in mat or mat in avail_mat:
                        matches = True
                        break
                if matches:
                    break
            
            if matches:
                matching_activities.append(activity)
        
        return matching_activities

    def _prioritize_materials_match(
        self, activities: List[Dict[str, Any]], available_materials: List[str]
    ) -> List[Dict[str, Any]]:
        """Prioritize activities that use available materials, but keep all activities."""
        if not available_materials:
            return activities
        
        # Normalize available materials to lowercase
        available_materials_lower = [mat.lower().strip() for mat in available_materials]
        
        matching_activities = []
        non_matching_activities = []
        no_materials_activities = []
        
        for activity in activities:
            activity_materials = activity.get('materials', '')
            if isinstance(activity_materials, str):
                activity_materials_list = [m.strip().lower() for m in activity_materials.split(',') if m.strip()]
            elif isinstance(activity_materials, list):
                activity_materials_list = [str(m).strip().lower() for m in activity_materials if m]
            else:
                activity_materials_list = []
            
            # Check if activity has no materials specified
            if not activity_materials_list or (len(activity_materials_list) == 1 and activity_materials_list[0] == 'none'):
                no_materials_activities.append(activity)
                continue
            
            # Check if any material matches (case-insensitive)
            matches = False
            for mat in activity_materials_list:
                if mat in available_materials_lower or any(avail_mat in mat or mat in avail_mat for avail_mat in available_materials_lower):
                    matches = True
                    break
            
            if matches:
                matching_activities.append(activity)
            else:
                non_matching_activities.append(activity)
        
        # Return: matching first, then no-materials (acceptable), then non-matching
        prioritized = matching_activities + no_materials_activities + non_matching_activities
        return prioritized

    def _csv_activity_to_dict(self, activity: Dict[str, Any]) -> Dict[str, Any]:
        """Convert CSV activity format to dict for LLM."""
        # Parse step instructions (might be a string)
        steps = activity.get("step_instructions", "")
        if isinstance(steps, str):
            # Try to split by sentences or keep as single step
            step_list = [s.strip() for s in steps.split('.') if s.strip()]
            if not step_list:
                step_list = [steps]
        else:
            step_list = steps if isinstance(steps, list) else [str(steps)]
        
        # Parse materials (might be a string)
        materials = activity.get("materials", "")
        if isinstance(materials, str):
            material_list = [m.strip() for m in materials.split(',') if m.strip()]
        else:
            material_list = materials if isinstance(materials, list) else [str(materials)]
        
        # Parse skills (might be a string)
        skills = activity.get("skills_targeted", "")
        if isinstance(skills, str):
            skill_list = [s.strip() for s in skills.split(',') if s.strip()]
        else:
            skill_list = skills if isinstance(skills, list) else [str(skills)]
        
        # Get RL score if available
        rl_score = activity.get('_rl_score', None)
        rl_boost = activity.get('_rl_boost', 1.0)
        
        result = {
            "id": str(activity.get("id", "")),
            "activity_name": activity.get("activity_name", ""),
            "domain": activity.get("domain", ""),
            "difficulty": activity.get("difficulty", ""),
            "goal": activity.get("goal", ""),
            "skills_targeted": skill_list,
            "materials": material_list,
            "time_required_minutes": activity.get("time_required_minutes", 15),
            "step_instructions": step_list,
            "age_range": activity.get("age_range", ""),
            "sensory_suitability": activity.get("sensory_suitability", ""),
            "autism_level_suitability": activity.get("autism_level_suitability", ""),
            "environment_fit": activity.get("environment_fit", ""),
            "cost_level": activity.get("cost_level", ""),
            "learning_style_fit": activity.get("learning_style_fit", ""),
            "source_type": "synthetic",  # Default since CSV column removed
        }
        
        # Add RL metadata for LLM context (optional, helps LLM understand why activity was selected)
        if rl_score is not None:
            result["_rl_score"] = round(rl_score, 2)
            result["_rl_boost"] = round(rl_boost, 2)
            if rl_boost > 1.2:
                result["_rl_note"] = "This activity has been successful in the past"
            elif rl_boost < 0.8:
                result["_rl_note"] = "This activity has mixed results, use with caution"
        
        return result

    def _profile_to_dict(self, profile: Dict[str, Any]) -> Dict[str, Any]:
        """Convert MongoDB profile to dict for LLM."""
        return {
            "name": profile.get("name"),
            "age": profile.get("age"),
            "communication_level": profile.get("communication_level"),
            "autism_level": profile.get("autism_level"),
            "sensory_sensitivity": profile.get("sensory_sensitivity", {}),
            "goals": profile.get("goals", []),
        }
    
    # Removed two-stage timetable planning methods - reverting to single-stage phase-based planning
    def _parse_llm_plan_response(
        self, llm_response: str, activities: List[Dict[str, Any]], plan_request: Dict[str, Any]
    ) -> StructuredActivityPlan:
        """Parse LLM JSON response and create a structured activity plan."""
        try:
            # Try to parse JSON and validate structure
            response_text = llm_response.strip()
            
            # Remove markdown code blocks if present
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.startswith("```"):
                response_text = response_text[3:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            response_text = response_text.strip()
            
            data = json.loads(response_text)
            
            # Try to parse as new structured format
            if "plan_type" in data or ("schedule" in data and isinstance(data.get("schedule"), list)):
                # New format detected - parse it
                parsed_plan = self._parse_structured_plan(data, activities, plan_request)
                # Double-check activity count - if still only 3, use fallback
                total_acts = sum(len(phase.activities) for phase in parsed_plan.schedule)
                if total_acts < 5:
                    logger.warning(f"Parsed plan has only {total_acts} activities (expected 5-7), using fallback")
                    return self._create_fallback_plan(activities, plan_request)
                return parsed_plan
            else:
                # Old format or invalid - use fallback
                logger.warning("LLM response not in expected structured format, using fallback")
                return self._create_fallback_plan(activities, plan_request)
                
        except json.JSONDecodeError as e:
            logger.warning(f"Failed to parse LLM response as JSON: {e}")
            return self._create_fallback_plan(activities, plan_request)
        except Exception as e:
            logger.error(f"Error parsing LLM response: {type(e).__name__}: {str(e)}")
            return self._create_fallback_plan(activities, plan_request)
    
    def _parse_structured_plan(
        self, data: Dict[str, Any], activities: List[Dict[str, Any]], plan_request: Dict[str, Any]
    ):
        """Parse structured phase-based plan from LLM JSON response."""
        from app.schemas import StructuredActivityPlan, PlanPhase, ScheduledActivity
        
        # Create activity lookup by ID and name
        activity_lookup = {}
        for act in activities:
            act_id = str(act.get('id', ''))
            act_name = act.get('activity_name', '')
            activity_lookup[act_id] = act
            activity_lookup[act_name.lower()] = act
        
        # Extract plan metadata
        plan_type = data.get('plan_type', plan_request.get('plan_type', 'daily').capitalize())
        plan_name = data.get('plan_name', f'{plan_type} Activity Plan')
        plan_overview = data.get('plan_overview', 'Structured activity plan')
        total_duration = data.get('total_duration_minutes', 60)
        planning_rationale = data.get('planning_rationale', 'Plan structured to support child development')
        
        # Parse schedule phases
        schedule_data = data.get('schedule', [])
        phases = []
        seen_activity_ids = set()  # Track to prevent duplicates by ID
        seen_activity_names = set()  # Track to prevent duplicates by name (case-insensitive)
        
        for phase_data in schedule_data:
            phase_name = phase_data.get('phase', '')
            order = phase_data.get('order', len(phases) + 1)
            phase_activities_data = phase_data.get('activities', [])
            
            phase_activities = []
            for act_data in phase_activities_data:
                # Get activity from dataset
                act_id = str(act_data.get('activity_id', ''))
                act_name = act_data.get('activity_name', '').strip()
                act_name_lower = act_name.lower()
                
                # Check for duplicates by ID or name
                if act_id in seen_activity_ids:
                    logger.warning(f"Skipping duplicate activity by ID: {act_name} (ID: {act_id})")
                    continue
                if act_name_lower in seen_activity_names:
                    logger.warning(f"Skipping duplicate activity by name: {act_name} (ID: {act_id})")
                    continue
                
                seen_activity_ids.add(act_id)
                seen_activity_names.add(act_name_lower)
                
                # Find activity in dataset
                dataset_activity = activity_lookup.get(act_id) or activity_lookup.get(act_name.lower())
                if not dataset_activity:
                    logger.warning(f"Activity not found in dataset: {act_name} (ID: {act_id}), skipping")
                    continue
                
                # Prioritize step_instructions from dataset, only use LLM steps if they're different/adapted
                dataset_steps = dataset_activity.get('step_instructions', [])
                if isinstance(dataset_steps, str):
                    dataset_steps = [s.strip() for s in dataset_steps.split('.') if s.strip()]
                elif not isinstance(dataset_steps, list):
                    dataset_steps = []
                
                llm_steps = act_data.get('step_by_step', [])
                
                # Use dataset steps as primary source, only use LLM steps if they exist and are different
                # This prevents duplication and ensures we use the original activity instructions
                if dataset_steps:
                    steps = dataset_steps[:10]  # Use dataset steps (up to 10)
                    # If LLM provided adapted steps and they're significantly different, we could merge them
                    # But for now, prioritize dataset steps to avoid duplication
                elif llm_steps:
                    steps = llm_steps[:10]  # Fallback to LLM steps if no dataset steps
                else:
                    steps = ["Follow the activity instructions"]  # Last resort
                
                phase_activities.append(
                    ScheduledActivity(
                        activity_id=act_id,
                        activity_name=act_name,
                        domain=act_data.get('domain', dataset_activity.get('domain', 'Mixed')),
                        description=act_data.get('description', f"This activity involves {act_name.lower()} and supports {dataset_activity.get('goal', 'development goals')}."),
                        recommended_duration_minutes=act_data.get('recommended_duration_minutes', dataset_activity.get('time_required_minutes', 20)),
                        difficulty_adaptation=act_data.get('difficulty_adaptation', 'Adapt based on child needs'),
                        why_this_activity_here=act_data.get('why_this_activity_here', 'Activity fits this phase'),
                        step_by_step=steps[:10],  # Max 10 steps
                        sensory_considerations=act_data.get('sensory_considerations', 'Consider child sensory sensitivities'),
                        expected_outcome=act_data.get('expected_outcome', 'Positive engagement and skill development')
                    )
                )
            
            if phase_activities:
                phases.append(
                    PlanPhase(
                        phase=phase_name,
                        order=order,
                        activities=phase_activities
                    )
                )
        
        # Ensure we have all three phases
        phase_names = {p.phase for p in phases}
        if 'Warm-up' not in phase_names or 'Core' not in phase_names or 'Calming' not in phase_names:
            logger.warning("Missing required phases, using fallback")
            return self._create_fallback_plan(activities, plan_request)
        
        # Sort phases by order
        phases.sort(key=lambda p: p.order)
        
        # Validate total activity count (always daily now)
        total_activities = sum(len(phase.activities) for phase in phases)
        min_count = 5
        max_count = 7
        
        if total_activities < min_count or total_activities > max_count:
            logger.warning(f"Plan has {total_activities} activities, expected {min_count}-{max_count}. Using fallback.")
            return self._create_fallback_plan(activities, plan_request)
        
        # Collect all materials from all activities
        all_materials = set()
        for phase in phases:
            for activity in phase.activities:
                # Get materials from the original dataset activity
                dataset_activity = activity_lookup.get(activity.activity_id) or activity_lookup.get(activity.activity_name.lower())
                if dataset_activity:
                    materials = dataset_activity.get('materials', [])
                    if isinstance(materials, str):
                        materials = [m.strip() for m in materials.split(',') if m.strip()]
                    all_materials.update(materials)
        
        return StructuredActivityPlan(
            plan_type=plan_type,
            plan_name=plan_name,
            plan_overview=plan_overview,
            total_duration_minutes=total_duration,
            planning_rationale=planning_rationale,
            materials_summary=sorted(list(all_materials)),
            schedule=phases
        )

    def _create_default_schedule(
        self, activities, duration_days: int
    ) -> str:
        """Create a default schedule with time frames when LLM doesn't provide one."""
        schedule_parts = []
        activities_per_day = max(1, len(activities) // duration_days)
        day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        
        activity_idx = 0
        for day in range(1, duration_days + 1):
            if activity_idx >= len(activities):
                break
            day_name = day_names[(day - 1) % 7]
            day_activities = []
            
            # Assign 1-2 activities per day
            for i in range(min(activities_per_day, len(activities) - activity_idx)):
                if activity_idx >= len(activities):
                    break
                act = activities[activity_idx]
                time_slot = "Morning (9:00 AM)" if i == 0 else "Afternoon (2:00 PM)"
                duration = "30 min"
                day_activities.append(f"{time_slot} - {act.activity_name} ({duration})")
                activity_idx += 1
            
            if day_activities:
                schedule_parts.append(f"Day {day} ({day_name}): {'; '.join(day_activities)}")
        
        return ". ".join(schedule_parts)

    def _create_fallback_plan(
        self, activities: List[Dict[str, Any]], plan_request: Dict[str, Any]
    ) -> StructuredActivityPlan:
        """Create basic structured activity plan when LLM parsing fails."""
        from app.schemas import ScheduledActivity, PlanPhase, StructuredActivityPlan
        
        # Always use daily plan
        plan_type = 'daily'
        plan_type_capitalized = 'Daily'
        # Daily: 5-7 activities (use 6 as target - middle of range)
        target_count = 6
        
        # Select unique activities up to target count (ensure no duplicates by ID and name)
        selected_activities = []
        seen_names = set()
        seen_ids = set()
        for act in activities:
            if len(selected_activities) >= target_count:
                break
            act_id = str(act.get('id', ''))
            act_name = act.get('activity_name', '').strip().lower()
            
            # Skip if we've seen this ID or name before
            if act_id in seen_ids or act_name in seen_names:
                continue
            
            selected_activities.append(act)
            seen_names.add(act_name)
            seen_ids.add(act_id)
        
        # Create scheduled activities
        scheduled_acts = []
        for act in selected_activities:
            act_id = str(act.get('id', ''))
            # Get step_instructions from dataset
            steps = act.get('step_instructions', [])
            if isinstance(steps, str):
                # Split by periods or newlines
                steps = [s.strip() for s in steps.replace('\n', '.').split('.') if s.strip()]
            elif not isinstance(steps, list):
                steps = []
            
            # Limit to 10 steps and ensure we have at least one
            steps = steps[:10] if steps else ["Follow the activity instructions"]
            
            # Create a simple description based on activity name and goal
            act_name = act.get('activity_name', 'Unknown Activity')
            act_goal = act.get('goal', 'development goals')
            description = f"This activity involves {act_name.lower()} and helps support {act_goal}."
            
            scheduled_acts.append(
                ScheduledActivity(
                    activity_id=act_id,
                    activity_name=act_name,
                    domain=act.get('domain', 'Mixed'),
                    description=description,
                    recommended_duration_minutes=act.get('time_required_minutes', 20),
                    difficulty_adaptation="Adjust based on child's autism level and age.",
                    why_this_activity_here="Activity selected to support child development goals.",
                    step_by_step=steps[:10],
                    sensory_considerations="Consider child's sensory sensitivities when implementing.",
                    expected_outcome=f"Supports {act_goal}."
                )
            )
        
        # Distribute activities into phases: Warm-up (1-2), Core (rest), Calming (1-2)
        # Always ensure we have all three phases with at least one activity each (required by schema)
        if len(scheduled_acts) == 0:
            # Edge case: no activities - create a minimal plan with placeholder
            logger.warning("No activities available for fallback plan, creating minimal plan")
            # This shouldn't happen, but handle it gracefully
            from app.schemas import ScheduledActivity
            placeholder = ScheduledActivity(
                activity_id="0",
                activity_name="No activities available",
                domain="Mixed",
                description="Placeholder activity - no activities are currently available in the dataset.",
                recommended_duration_minutes=10,
                difficulty_adaptation="Please add more activities to the dataset.",
                why_this_activity_here="Placeholder due to insufficient activities.",
                step_by_step=["Contact administrator to add more activities."],
                sensory_considerations="N/A",
                expected_outcome="System will work once more activities are available."
            )
            scheduled_acts = [placeholder, placeholder, placeholder]
        
        # Distribute activities across three phases
        # Strategy: 1-2 for warm-up, most for core, 1-2 for calming
        num_acts = len(scheduled_acts)
        
        # Distribute activities across three phases
        # Strategy: 1-2 for warm-up, most for core, 1-2 for calming
        # Always ensure each phase has at least 1 activity
        if num_acts == 1:
            # Only one activity - duplicate it for all three phases
            warmup_acts = scheduled_acts[:1]
            core_acts = scheduled_acts[:1]
            calming_acts = scheduled_acts[:1]
        elif num_acts == 2:
            # Two activities - one in warm-up, one in core, duplicate one for calming
            warmup_acts = scheduled_acts[:1]
            core_acts = scheduled_acts[1:2]
            calming_acts = scheduled_acts[1:2]  # Use second activity for calming
        else:
            # Three or more activities - distribute properly
            warmup_count = min(2, max(1, num_acts // 4))  # 1-2 activities
            calming_count = min(2, max(1, num_acts // 4))  # 1-2 activities
            core_count = num_acts - warmup_count - calming_count
            
            # Ensure core has at least one activity
            if core_count < 1:
                if warmup_count > 1:
                    warmup_count -= 1
                    core_count += 1
                elif calming_count > 1:
                    calming_count -= 1
                    core_count += 1
            
            warmup_acts = scheduled_acts[:warmup_count]
            core_acts = scheduled_acts[warmup_count:warmup_count + core_count]
            calming_acts = scheduled_acts[warmup_count + core_count:]
        
        # Verify all phases have at least one activity (required by PlanPhase schema)
        if not warmup_acts or not core_acts or not calming_acts:
            logger.warning(f"Phase distribution issue: warmup={len(warmup_acts)}, core={len(core_acts)}, calming={len(calming_acts)}")
            # Redistribute to ensure all have at least one
            if not warmup_acts:
                warmup_acts = [scheduled_acts[0]]
            if not core_acts:
                core_acts = [scheduled_acts[min(1, len(scheduled_acts)-1)]]
            if not calming_acts:
                calming_acts = [scheduled_acts[-1]]
        
        # Always create all three phases (required by schema: min_items=3, max_items=3)
        phases = [
            PlanPhase(phase="Warm-up", order=1, activities=warmup_acts),
            PlanPhase(phase="Core", order=2, activities=core_acts),
            PlanPhase(phase="Calming", order=3, activities=calming_acts)
        ]
        
        # Final validation: ensure we have exactly 3 phases
        if len(phases) != 3:
            logger.error(f"Expected 3 phases but got {len(phases)}")
            raise ValueError(f"Must have exactly 3 phases, got {len(phases)}")
        
        # Calculate total duration
        total_duration = sum(act.recommended_duration_minutes for act in scheduled_acts)
        
        # Ensure minimum duration of 30 minutes (schema requirement)
        if total_duration < 30:
            logger.warning(f"Total duration {total_duration} is less than 30, adjusting to 30")
            total_duration = 30
        
        # Collect all materials from all activities
        all_materials = set()
        for act in selected_activities:
            materials = act.get('materials', [])
            if isinstance(materials, str):
                materials = [m.strip() for m in materials.split(',') if m.strip()]
            all_materials.update(materials)
        
        return StructuredActivityPlan(
            plan_type=plan_type_capitalized,
            plan_name=f"Basic {plan_type_capitalized} Activity Plan",
            plan_overview=f"A {plan_type} plan tailored to the child's needs and available resources.",
            total_duration_minutes=total_duration,
            planning_rationale="Plan structured to provide a balanced progression from warm-up activities through core learning to calming transitions.",
            materials_summary=sorted(list(all_materials)),
            schedule=phases
        )
