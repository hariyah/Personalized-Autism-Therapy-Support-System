const mongoose = require('mongoose');

const doctorPatientSchema = new mongoose.Schema({
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    child: { type: mongoose.Schema.Types.ObjectId, ref: 'Child', required: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    assignedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Ensure unique assignment
doctorPatientSchema.index({ doctor: 1, child: 1 }, { unique: true });

module.exports = mongoose.model('DoctorPatient', doctorPatientSchema);
