const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');
const Child = require('../models/Child');
const { protect } = require('../middleware/auth');

const upload = multer({ storage: multer.memoryStorage() });
const AI_PREDICT_URL = process.env.AI_PREDICT_URL || 'http://localhost:7005/predict';

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

// Update child current emotion manually
router.post('/update/:childId', async (req, res) => {
    try {
        const { emotion } = req.body;
        const normalized = normalizeEmotion(emotion);
        const child = await Child.findByIdAndUpdate(
            req.params.childId,
            {
                currentEmotion: normalized,
                $push: {
                    emotionHistory: {
                        emotion: normalized,
                        timestamp: new Date(),
                        source: 'manual'
                    }
                }
            },
            { new: true }
        );
        res.json({ success: true, child });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Recognize emotion from image using AI Service
router.post('/recognize/:childId', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, message: 'No image uploaded' });

        const formData = new FormData();
        const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
        formData.append('file', blob, req.file.originalname);

        const response = await axios.post(AI_PREDICT_URL, formData);

        const { emotion: predictedEmotion, confidence, allPredictions } = response.data;
        const normalized = normalizeEmotion(predictedEmotion);

        // Compute margin
        const probs = Object.values(allPredictions || {}).sort((a, b) => b - a);
        const margin = probs.length >= 2 ? (probs[0] - probs[1]) : confidence;

        const timestamp = new Date();
        const emotionEntry = {
            emotion: normalized,
            originalLabel: predictedEmotion,
            confidence,
            emotions: allPredictions,
            margin,
            timestamp,
            source: 'ml_model'
        };

        const child = await Child.findById(req.params.childId);
        if (!child) return res.status(404).json({ success: false, message: 'Child not found' });

        child.emotionHistory.push(emotionEntry);

        // Confidence Gating (Integrated from PATSS)
        const MIN_CONF = 0.4;
        const MIN_MARGIN = 0.05;

        if (confidence >= MIN_CONF && margin >= MIN_MARGIN) {
            child.currentEmotion = normalized;
        }

        await child.save();

        res.json({
            success: true,
            child,
            prediction: {
                emotion: normalized,
                original: predictedEmotion,
                confidence,
                margin,
                allPredictions
            }
        });
    } catch (error) {
        console.error('Emotion Recognition Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
