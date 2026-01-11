# Reinforcement Learning System

## Overview
The recommendation engine now uses reinforcement learning to improve activity recommendations based on logged outcomes. The system learns from each activity outcome (engagement, stress, success scores) and adjusts future recommendations accordingly.

## How It Works

### 1. Outcome Tracking
- When users log activity outcomes, the system tracks:
  - **Engagement** (1-5): How engaged the child was
  - **Success** (1-5): How successful the activity was
  - **Stress** (1-5): Stress level during the activity
  - **Notes**: Additional observations

### 2. Activity Scoring (`ActivityScorer`)
Each activity gets a score (0.0 to 1.0) based on historical outcomes:

**Score Calculation:**
- **Engagement Score**: 40% weight
- **Success Score**: 40% weight  
- **Stress Penalty**: 20% weight (inverse - lower stress = higher score)
- **Reliability Boost**: +0.01 per outcome (max +0.1) - more data = more reliable
- **Recency Boost**: Recent successful outcomes get extra weight

**Boost Multipliers:**
- Score ≥ 0.8: **2.0x boost** (highly successful activities)
- Score ≥ 0.6: **1.5x boost** (successful activities)
- Score ≥ 0.4: **1.0x** (neutral)
- Score ≥ 0.2: **0.75x** (mixed results)
- Score < 0.2: **0.5x** (poor results)

### 3. Activity Avoidance
Activities are automatically avoided if:
- At least 2 outcomes recorded
- Recent outcomes (last 3) show:
  - Average stress ≥ 4 AND
  - Average success ≤ 2

### 4. Search Query Enhancement
The semantic search query is enhanced with learning signals:
- "Similar to activities that were highly engaging and successful"
- "Avoid activities similar to those with low engagement or high stress"
- "Focus on highly engaging activities" (if 70%+ outcomes had high engagement)

### 5. Re-ranking
After semantic search, activities are:
1. Scored using RL system
2. Re-ranked by RL boost multiplier
3. Activities with poor outcomes are filtered out
4. Successful activities are boosted to the top

## Integration Points

### Backend
- **`reinforcement_learning.py`**: Core RL logic
  - `ActivityScorer`: Tracks and scores activities
  - `build_learning_enhanced_query()`: Enhances search queries
  
- **`recommendation_engine.py`**: 
  - Fetches last 10 outcomes for learning
  - Updates activity scorer
  - Applies RL scores and re-ranks activities
  - Passes RL metadata to LLM for context

### Frontend
- **`ProfileDetail.tsx`**: 
  - Opens `OutcomeModal` when user clicks "Log Activity Outcome"
  - Refreshes outcomes after submission
  - Works with new `ScheduledActivity` structure

- **`OutcomeModal.tsx`**: 
  - Collects engagement, stress, success (1-5 scales)
  - Optional notes field
  - Submits to `/outcomes` endpoint

## Example Flow

1. **User generates plan** → System fetches last 10 outcomes
2. **RL system scores activities** → Successful activities get boost
3. **Search query enhanced** → Includes learning signals
4. **Activities re-ranked** → Best-scoring activities prioritized
5. **User logs outcome** → System updates scores
6. **Next plan generation** → Uses updated scores for better recommendations

## Benefits

- **Personalization**: Recommendations improve over time for each child
- **Safety**: Automatically avoids activities that cause stress
- **Engagement**: Prioritizes activities that keep children engaged
- **Adaptive**: System learns from both successes and failures
- **Transparent**: RL scores and boosts are logged for debugging

## Future Enhancements

- Domain-level learning (learn which activity types work best)
- Time-based patterns (activities that work better at certain times)
- Seasonal adjustments (activities that work better in different seasons)
- Collaborative filtering (learn from similar children's outcomes)

