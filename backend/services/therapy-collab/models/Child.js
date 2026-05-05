const mongoose = require('mongoose');

const childSchema = new mongoose.Schema({
    name: { type: String, required: true },
    dateOfBirth: {
        type: Date,
        required: true,
        validate: {
            validator(value) {
                return value instanceof Date && !Number.isNaN(value.getTime()) && value <= new Date();
            },
            message: 'Date of birth cannot be in the future.'
        }
    },
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
    const birthDate = new Date(this.dateOfBirth);
    if (Number.isNaN(birthDate.getTime())) return null;

    const today = new Date();
    if (birthDate > today) return null;

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const hasNotHadBirthdayYet =
        monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate());

    if (hasNotHadBirthdayYet) {
        age -= 1;
    }

    return age >= 0 ? age : null;
});

childSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Child', childSchema);
