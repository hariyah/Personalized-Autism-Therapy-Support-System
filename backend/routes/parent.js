const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const Child = require('../models/Child');
const Analysis = require('../models/Analysis');
const Notification = require('../models/Notification');
const { protect, authorize } = require('../middleware/auth');

const AI_URL = process.env.AI_URL || "http://localhost:8000/analyze-voice";
const AI_TEXT_URL = process.env.AI_TEXT_URL || "http://localhost:8000/analyze-text";
const upload = multer({ storage: multer.memoryStorage() });

router.use(protect);
router.use(authorize('parent'));

// @route   GET /api/parent/children
router.get('/children', async (req, res) => {
    try {
        const children = await Child.find({ parent: req.user._id }).populate('assignedDoctors', 'name email specialization');
        res.json({ success: true, children });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   POST /api/parent/children
router.post('/children', async (req, res) => {
    try {
        const child = await Child.create({ ...req.body, parent: req.user._id });
        res.status(201).json({ success: true, child });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   GET /api/parent/children/:id
router.get('/children/:id', async (req, res) => {
    try {
        const child = await Child.findOne({ _id: req.params.id, parent: req.user._id }).populate('assignedDoctors', 'name email specialization');
        if (!child) return res.status(404).json({ success: false, message: 'Child not found' });
        res.json({ success: true, child });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   GET /api/parent/children/:id/analyses
router.get('/children/:id/analyses', async (req, res) => {
    try {
        const analyses = await Analysis.find({ child: req.params.id }).sort('-createdAt');
        res.json({ success: true, analyses });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   POST /api/parent/children/:id/analyses
router.post('/children/:id/analyses', upload.single('audio'), async (req, res) => {
    try {
        const { inputType, transcript: textInput } = req.body;
        
        // Verify child belongs to parent
        const child = await Child.findOne({ _id: req.params.id, parent: req.user._id }).populate('assignedDoctors', 'name');
        if (!child) {
            return res.status(404).json({ success: false, message: 'Child not found' });
        }

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

        // Notify assigned doctors
        if (child.assignedDoctors?.length > 0) {
            for (const doctor of child.assignedDoctors) {
                await Notification.create({
                    user: doctor._id,
                    type: 'new_analysis',
                    severity: analysis.urgencyLabel,
                    title: 'New Parent Analysis',
                    message: `${req.user.name} submitted a new analysis for ${child.name}.`,
                    child: child._id,
                    analysis: analysis._id,
                    action_url: `/doctor/patients/${child._id}?tab=analyses`
                });
            }
        }

        res.status(201).json({ success: true, analysis });
    } catch (error) {
        console.error('Analysis error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   GET /api/parent/dashboard/stats
router.get('/dashboard/stats', async (req, res) => {
    try {
        const childrenIds = await Child.find({ parent: req.user._id }).distinct('_id');
        const totalAnalyses = await Analysis.countDocuments({ child: { $in: childrenIds } });
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const recentAnalyses = await Analysis.countDocuments({ child: { $in: childrenIds }, createdAt: { $gt: sevenDaysAgo } });

        const urgencyCounts = await Analysis.aggregate([
            { $match: { child: { $in: childrenIds } } },
            { $group: { _id: '$urgencyLabel', count: { $sum: 1 } } }
        ]);

        res.json({ success: true, stats: { totalChildren: childrenIds.length, totalAnalyses, recentAnalyses, urgencyCounts } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
