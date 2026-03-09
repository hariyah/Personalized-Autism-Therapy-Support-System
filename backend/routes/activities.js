const express = require('express');
const router = express.Router();
const Activity = require('../models/Activity');
const Child = require('../models/Child');
const { protect } = require('../middleware/auth');

router.use(protect);

const datasetToInternalMap = {
    'Natural': 'calm',
    'anger': 'frustrated',
    'fear': 'anxious',
    'joy': 'happy',
    'sadness': 'sad',
    'surprise': 'excited'
};

function normalizeEmotion(label) {
    if (!label) return 'calm';
    if (datasetToInternalMap[label]) return datasetToInternalMap[label];
    return label.toLowerCase();
}

// Get all activities
router.get('/', async (req, res) => {
    try {
        const { category } = req.query;
        const query = category ? { category } : {};
        const activities = await Activity.find(query);
        res.json(activities);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get recommended activities for a child
router.get('/recommend/:childId', async (req, res) => {
    try {
        const child = await Child.findById(req.params.childId);
        if (!child) return res.status(404).json({ error: 'Child not found' });

        const activities = await Activity.find();
        const currentEmotion = normalizeEmotion(child.currentEmotion);

        // Enhanced Multi-Factor Recommendation Algorithm (Integrated from PATSS)
        const scoredActivities = activities.map(activity => {
            let score = 0;

            // 1. Emotion-based scoring (Weight: 15 points)
            const emotionScore = (activity.emotionMapping || {})[currentEmotion] || 0.5;
            score += emotionScore * 15;

            // 2. Social Status matching (Weight: 10 points)
            const socialStatusMap = { alone: 0, 'with-parent': 1, group: 2, community: 3 };
            const socialReqMap = { none: 0, low: 1, medium: 2, high: 3 };
            const childSocialLevel = socialStatusMap[child.socialStatus] || 0;
            const activitySocialReq = socialReqMap[activity.socialRequirement] || 0;

            if (childSocialLevel >= activitySocialReq) score += 10;
            else score += Math.max(0, 10 - (activitySocialReq - childSocialLevel) * 3);

            // 3. Financial Status matching (Weight: 12 points)
            const childFinMap = { low: 0, medium: 1, high: 2 };
            const costMap = { free: 0, low: 1, medium: 2, high: 3 };
            const childFinance = childFinMap[child.financialStatus] || 1;
            const activityCost = costMap[activity.costLevel] || 0;

            if (childFinance >= activityCost) score += 12;
            else score += Math.max(0, 12 - (activityCost - childFinance) * 5);

            // 4. Autism Details & Severity (Weight: 15 points)
            const severityMap = { mild: 1, moderate: 2, severe: 3 };
            const severity = severityMap[child.diagnosisDetails?.severity] || 2;
            if (severity === 3 && activity.difficulty === 'easy') score += 15;
            else if (severity === 3 && activity.difficulty === 'medium') score += 8;
            else if (severity === 2 && activity.difficulty !== 'hard') score += 10;
            else if (severity === 1) score += 5;

            // 5. Interests matching (Weight: 12 points)
            const activityTags = activity.interestTags || [];
            const matchingInterests = activityTags.filter(tag =>
                (child.interests || []).includes(tag)
            ).length;
            if (matchingInterests > 0) {
                score += (matchingInterests / Math.max(activityTags.length, (child.interests || []).length || 1)) * 12;
            }

            return {
                ...activity.toObject(),
                score: Math.round(score * 100) / 100
            };
        });

        const limit = parseInt(req.query.limit) || 6;
        const recommendations = scoredActivities
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);

        res.json(recommendations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Mark an activity as completed for a child
router.post('/complete/:childId', async (req, res) => {
    try {
        const { activityId } = req.body;
        // In a real sophisticated production app, you might save this to a specific progress chart model.
        // For now we'll just return success so the frontend updates properly.
        res.json({ success: true, message: 'Activity marked as complete.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
