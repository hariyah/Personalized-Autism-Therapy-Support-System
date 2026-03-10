const mongoose = require('mongoose');

const childSchema = new mongoose.Schema({
    name: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    gender: { type: String, enum: ['male', 'female', 'other'], required: true },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    diagnosisDetails: {
        diagnosisType: String,
        severity: { type: String, enum: ['mild', 'moderate', 'severe'] },
        diagnosisDate: Date
    },
    assignedDoctors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    interests: [String],
    financialStatus: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    socialStatus: { type: String, enum: ['alone', 'with-parent', 'group', 'community'], default: 'alone' },
    currentEmotion: { type: String, default: 'neutral' },
    emotionHistory: [{
        emotion: String,
        originalLabel: String,
        confidence: Number,
        margin: Number,
        emotions: { type: Map, of: Number },
        timestamp: { type: Date, default: Date.now },
        source: { type: String, default: 'manual' }
    }]
}, { timestamps: true });

// Virtual for age
childSchema.virtual('age').get(function () {
    if (!this.dateOfBirth) return null;
    const diff_ms = Date.now() - this.dateOfBirth.getTime();
    const age_dt = new Date(diff_ms);
    return Math.abs(age_dt.getUTCFullYear() - 1970);
});

childSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Child', childSchema);
