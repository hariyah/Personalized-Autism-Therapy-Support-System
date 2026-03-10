const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    child: { type: mongoose.Schema.Types.ObjectId, ref: 'Child', required: true },
    content: { type: String, required: true }, // For text: message, For voice: dataUrl
    audioFilename: { type: String },
    messageType: { type: String, enum: ['text', 'voice'], default: 'text' },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
