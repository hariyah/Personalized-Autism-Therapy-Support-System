"""Reinforcement learning module for activity recommendations based on outcomes."""
import logging
from typing import List, Dict, Any, Optional
from collections import defaultdict
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class ActivityScorer:
    """Scores activities based on historical outcomes for reinforcement learning."""
    
    def __init__(self):
        self.activity_scores = defaultdict(lambda: {
            'total_outcomes': 0,
            'total_engagement': 0,
            'total_success': 0,
            'total_stress': 0,
            'recent_outcomes': [],  # Last 10 outcomes for this activity
            'last_used': None,
        })
    
    def update_from_outcomes(self, outcomes: List[Dict[str, Any]]) -> None:
        """Update activity scores based on outcomes."""
        logger.info(f"[RL] Processing {len(outcomes)} outcomes for reinforcement learning")
        
        if not outcomes:
            logger.info("[RL] No outcomes available - using neutral scores for all activities")
            return
        
        for outcome in outcomes:
            activity_id = str(outcome.get('activity_id', ''))
            if not activity_id:
                continue
            
            engagement = outcome.get('engagement', 3)
            success = outcome.get('success', 3)
            stress = outcome.get('stress', 3)
            activity_name = outcome.get('activity_name', 'Unknown')
            completed_at = outcome.get('completed_at')
            
            score_data = self.activity_scores[activity_id]
            old_outcomes = score_data['total_outcomes']
            score_data['total_outcomes'] += 1
            score_data['total_engagement'] += engagement
            score_data['total_success'] += success
            score_data['total_stress'] += stress
            
            logger.info(
                f"[RL] Updated activity {activity_id} ({activity_name[:50]}...): "
                f"Engagement={engagement}/5, Success={success}/5, Stress={stress}/5 "
                f"(Total outcomes: {old_outcomes} -> {score_data['total_outcomes']})"
            )
            
            # Keep recent outcomes (last 10)
            if completed_at:
                try:
                    if isinstance(completed_at, str):
                        completed_at = datetime.fromisoformat(completed_at.replace('Z', '+00:00'))
                    elif isinstance(completed_at, datetime):
                        pass
                    else:
                        completed_at = datetime.utcnow()
                except:
                    completed_at = datetime.utcnow()
                
                score_data['recent_outcomes'].append({
                    'engagement': engagement,
                    'success': success,
                    'stress': stress,
                    'completed_at': completed_at,
                })
                # Keep only last 10
                score_data['recent_outcomes'] = sorted(
                    score_data['recent_outcomes'],
                    key=lambda x: x['completed_at'],
                    reverse=True
                )[:10]
    
    def get_activity_score(self, activity_id: str) -> float:
        """Get reinforcement learning score for an activity (0.0 to 1.0).
        
        Higher score = better activity based on past outcomes.
        """
        score_data = self.activity_scores.get(str(activity_id))
        if not score_data or score_data['total_outcomes'] == 0:
            return 0.5  # Neutral score for activities with no history
        
        # Calculate weighted score
        # Engagement and success are positive, stress is negative
        avg_engagement = score_data['total_engagement'] / score_data['total_outcomes']
        avg_success = score_data['total_success'] / score_data['total_outcomes']
        avg_stress = score_data['total_stress'] / score_data['total_outcomes']
        
        # Normalize to 0-1 scale (all are 1-5)
        engagement_score = (avg_engagement - 1) / 4.0
        success_score = (avg_success - 1) / 4.0
        stress_penalty = (avg_stress - 1) / 4.0  # Higher stress = lower score
        
        # Weighted combination: 40% engagement, 40% success, 20% stress (inverse)
        base_score = (0.4 * engagement_score + 0.4 * success_score + 0.2 * (1 - stress_penalty))
        
        # Boost for activities with more outcomes (more reliable)
        reliability_boost = min(0.1, score_data['total_outcomes'] * 0.01)
        
        # Recency boost: prefer activities that were successful recently
        recency_boost = 0.0
        if score_data['recent_outcomes']:
            recent_avg_success = sum(o['success'] for o in score_data['recent_outcomes'][:3]) / min(3, len(score_data['recent_outcomes']))
            recency_boost = ((recent_avg_success - 1) / 4.0) * 0.1
        
        final_score = min(1.0, base_score + reliability_boost + recency_boost)
        final_score = max(0.0, final_score)
        
        
        return final_score
    
    def get_activity_boost(self, activity_id: str) -> float:
        """Get boost multiplier for activity ranking (0.5 to 2.0).
        
        Returns a multiplier to apply to semantic similarity scores.
        """
        score = self.get_activity_score(activity_id)
        # Convert 0-1 score to 0.5-2.0 multiplier
        # High scores (0.8+) get 2.0x boost, low scores (0.2-) get 0.5x penalty
        if score >= 0.8:
            boost = 2.0
        elif score >= 0.6:
            boost = 1.5
        elif score >= 0.4:
            boost = 1.0
        elif score >= 0.2:
            boost = 0.75
        else:
            boost = 0.5
        
        return boost
    
    def should_avoid_activity(self, activity_id: str) -> bool:
        """Check if activity should be avoided based on poor outcomes."""
        score_data = self.activity_scores.get(str(activity_id))
        if not score_data or score_data['total_outcomes'] < 2:
            return False  # Need at least 2 outcomes to avoid
        
        # Avoid if recent outcomes show high stress and low success
        if score_data['recent_outcomes']:
            recent = score_data['recent_outcomes'][:3]
            avg_stress = sum(o['stress'] for o in recent) / len(recent)
            avg_success = sum(o['success'] for o in recent) / len(recent)
            
            # Avoid if stress >= 4 and success <= 2
            if avg_stress >= 4 and avg_success <= 2:
                logger.warning(
                    f"[RL] Activity {activity_id} marked to AVOID: "
                    f"Recent avg stress={avg_stress:.2f} (high) and success={avg_success:.2f} (low) "
                    f"from {len(recent)} recent outcomes"
                )
                return True
        
        return False


def build_learning_enhanced_query(
    base_query: str,
    outcomes: List[Dict[str, Any]],
    profile: Dict[str, Any]
) -> str:
    """Enhance search query with learning from outcomes."""
    if not outcomes:
        logger.info("[RL] No outcomes available - using base query without RL enhancement")
        return base_query
    
    logger.info(f"[RL] Enhancing search query with learning from {len(outcomes)} outcomes")
    
    # Analyze outcomes to extract patterns
    successful_activities = []
    unsuccessful_activities = []
    
    for outcome in outcomes:
        activity_id = str(outcome.get('activity_id', ''))
        activity_name = outcome.get('activity_name', 'Unknown')
        engagement = outcome.get('engagement', 3)
        success = outcome.get('success', 3)
        stress = outcome.get('stress', 3)
        
        # Consider successful if engagement >= 4, success >= 4, stress <= 2
        if engagement >= 4 and success >= 4 and stress <= 2:
            successful_activities.append(activity_id)
            logger.info(
                f"[RL] Successful activity identified: {activity_id} ({activity_name[:40]}...) - "
                f"Engagement={engagement}, Success={success}, Stress={stress}"
            )
        # Consider unsuccessful if engagement <= 2, success <= 2, or stress >= 4
        elif engagement <= 2 or success <= 2 or stress >= 4:
            unsuccessful_activities.append(activity_id)
            logger.info(
                f"[RL] Unsuccessful activity identified: {activity_id} ({activity_name[:40]}...) - "
                f"Engagement={engagement}, Success={success}, Stress={stress}"
            )
    
    query_parts = [base_query]
    
    # Add learning signals
    if successful_activities:
        query_parts.append("Similar to activities that were highly engaging and successful")
        logger.info(f"[RL] Query enhancement: Added signal for {len(successful_activities)} successful activities")
    
    if unsuccessful_activities:
        query_parts.append("Avoid activities similar to those with low engagement or high stress")
        logger.info(f"[RL] Query enhancement: Added signal to avoid {len(unsuccessful_activities)} unsuccessful activities")
    
    # Analyze patterns in successful outcomes
    high_engagement_count = sum(1 for o in outcomes if o.get('engagement', 3) >= 4)
    if high_engagement_count >= len(outcomes) * 0.7:
        query_parts.append("Focus on highly engaging activities")
        logger.info(f"[RL] Query enhancement: {high_engagement_count}/{len(outcomes)} outcomes had high engagement - focusing on engaging activities")
    
    enhanced_query = " | ".join(query_parts)
    logger.info(f"[RL] Enhanced query: {enhanced_query}")
    return enhanced_query

