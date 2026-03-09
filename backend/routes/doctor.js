const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const User = require('../models/User');
const Child = require('../models/Child');
const Analysis = require('../models/Analysis');
const Notification = require('../models/Notification');
const { protect, authorize } = require('../middleware/auth');

const AI_URL = process.env.AI_URL || "http://localhost:8000/analyze-voice";
const AI_TEXT_URL = process.env.AI_TEXT_URL || "http://localhost:8000/analyze-text";
const upload = multer({ storage: multer.memoryStorage() });

router.use(protect);
router.use(authorize('doctor'));

// @route   GET /api/doctor/patients
router.get('/patients', async (req, res) => {
    try {
        const patients = await Child.find({ assignedDoctors: req.user._id }).populate('parent', 'name email phone');
        res.json({ success: true, patients });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   GET /api/doctor/patients/:id
router.get('/patients/:id', async (req, res) => {
    try {
        const patient = await Child.findOne({ _id: req.params.id, assignedDoctors: req.user._id }).populate('parent', 'name email phone');
        if (!patient) return res.status(404).json({ success: false, message: 'Patient not assigned or not found' });
        res.json({ success: true, patient });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   GET /api/doctor/patients/:id/analyses
router.get('/patients/:id/analyses', async (req, res) => {
    try {
        const analyses = await Analysis.find({ child: req.params.id }).sort('-createdAt');
        res.json({ success: true, analyses });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   POST /api/doctor/patients/:id/analyses
router.post('/patients/:id/analyses', upload.single('audio'), async (req, res) => {
    try {
        const { inputType, transcript: textInput } = req.body;
        let aiResult;

        // Process through AI service
        if (inputType === 'audio' && req.file) {
            const formData = new FormData();
            formData.append('file', req.file.buffer, {
                filename: req.file.originalname || 'recording.webm',
                contentType: req.file.mimetype
            });
            const aiResponse = await axios.post(AI_URL, formData, {
                headers: formData.getHeaders()
            });
            aiResult = aiResponse.data;
        } else if (inputType === 'text' && textInput) {
            const aiResponse = await axios.post(AI_TEXT_URL, { text: textInput });
            aiResult = aiResponse.data;
        } else {
            return res.status(400).json({ success: false, message: 'Invalid input type or missing data' });
        }

        if (aiResult.error) {
            return res.status(500).json({ success: false, message: aiResult.error });
        }

        // Create analysis with AI results
        const analysis = await Analysis.create({
            child: req.params.id,
            performedBy: req.user._id,
            inputType: inputType,
            transcript: aiResult.transcript || textInput,
            issueLabel: aiResult.issue_label,
            issueTop3: aiResult.issue_top3?.map(i => ({ label: i.label, confidence: i.score })) || [],
            urgencyLabel: aiResult.urgency_label,
            urgencyTop3: aiResult.urgency_top3?.map(u => ({ label: u.label, confidence: u.score })) || [],
            summary: aiResult.summary,
            audioFilename: aiResult.audio_filename
        });

        // Notify parent
        const child = await Child.findById(req.params.id);
        await Notification.create({
            user: child.parent,
            type: 'new_analysis',
            severity: analysis.urgencyLabel,
            title: 'New Analysis Available',
            message: `Dr. ${req.user.name} has performed a new analysis for ${child.name}.`,
            child: child._id,
            analysis: analysis._id,
            action_url: `/parent/children/${child._id}?tab=analyses`
        });

        res.status(201).json({ success: true, analysis });
    } catch (error) {
        console.error('Analysis error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   GET /api/doctor/dashboard/stats
router.get('/dashboard/stats', async (req, res) => {
    try {
        const patientIds = await Child.find({ assignedDoctors: req.user._id }).distinct('_id');
        const pendingReviews = await Analysis.countDocuments({ child: { $in: patientIds }, isReviewed: false });
        const highUrgency = await Analysis.countDocuments({ child: { $in: patientIds }, urgencyLabel: 'high', createdAt: { $gt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } });

        res.json({ success: true, stats: { totalPatients: patientIds.length, pendingReviews, highUrgency } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
