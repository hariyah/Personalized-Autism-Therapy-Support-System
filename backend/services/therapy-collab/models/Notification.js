const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['new_analysis', 'doctor_note', 'reminder', 'alert', 'system'], default: 'system' },
    severity: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
    title: { type: String, required: true },
    message: { type: String, required: true },
    child: { type: mongoose.Schema.Types.ObjectId, ref: 'Child' },
    analysis: { type: mongoose.Schema.Types.ObjectId, ref: 'Analysis' },
    messageRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
    action_url: { type: String }, // URL to navigate to on click
    metadata: { type: Object, default: {} }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
