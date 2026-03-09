const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
    title: { type: String, required: true },
    category: { type: String, enum: ['social', 'behavioral', 'emotional'], required: true },
    description: { type: String, required: true },
    duration: String,
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'] },
    materials: [String],
    benefits: [String],
    ageRange: String,
    icon: String,
    costLevel: { type: String, enum: ['free', 'low', 'medium', 'high'] },
    socialRequirement: { type: String, enum: ['none', 'low', 'medium', 'high'] },
    emotionMapping: {
        happy: Number,
        sad: Number,
        anxious: Number,
        calm: Number,
        excited: Number,
        frustrated: Number,
        neutral: Number
    },
    interestTags: [String]
}, { timestamps: true });

module.exports = mongoose.model('Activity', activitySchema);
