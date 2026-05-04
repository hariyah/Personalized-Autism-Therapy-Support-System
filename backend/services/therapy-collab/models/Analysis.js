const mongoose = require('mongoose');

const analysisSchema = new mongoose.Schema({
    child: { type: mongoose.Schema.Types.ObjectId, ref: 'Child', required: true },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    inputType: { type: String, enum: ['audio', 'text'], default: 'audio' },
    transcript: { type: String, required: true },
    issueLabel: { type: String, required: true }, // e.g., 'aggression'
    issueTop3: [{
        label: String,
        confidence: Number
    }],
    urgencyLabel: { type: String, enum: ['low', 'medium', 'high'], required: true },
    urgencyTop3: [{
        label: String,
        confidence: Number
    }],
    summary: { type: String, required: true },
    resultSummary: { type: String, default: '' },
    treatmentSuggestions: [{ type: String }],
    audioFilename: { type: String }, // For voice notes
    isReviewed: { type: Boolean, default: false },
    doctorReview: {
        doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        doctorName: { type: String, default: '' },
        reviewedAt: Date,
        finalSummary: { type: String, default: '' },
        finalTreatmentSuggestions: [{ type: String }],
        treatmentStatus: {
            type: String,
            enum: ['recommended', 'ongoing', 'monitoring', 'adjusted', 'completed'],
            default: 'recommended'
        },
        careStage: {
            type: String,
            enum: ['awaiting_review', 'reviewed', 'ongoing', 'follow_up', 'completed'],
            default: 'awaiting_review'
        },
        followUpPlan: { type: String, default: '' },
        nextReviewDate: Date,
        reportIssuedAt: Date
    },
    doctorNotes: [{
        doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        note: String,
        recommendations: String,
        createdAt: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

module.exports = mongoose.model('Analysis', analysisSchema);
