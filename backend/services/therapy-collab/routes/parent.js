const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const Child = require('../models/Child');
const Analysis = require('../models/Analysis');
const Notification = require('../models/Notification');
const { protect, authorize } = require('../middleware/auth');
const { buildResultSummary, buildTreatmentSuggestions, normalizeUrgencyLabel } = require('../utils/analysisRecommendations');
const { buildFilename, buildAnalysisReportHtml } = require('../utils/analysisReport');

const AI_URL = process.env.AI_URL || "http://localhost:8000/analyze-voice";
const AI_TEXT_URL = process.env.AI_TEXT_URL || "http://localhost:8000/analyze-text";
const upload = multer({ storage: multer.memoryStorage() });

const populateAnalysisAccess = (query) => query
    .populate('performedBy', 'name')
    .populate('doctorReview.doctor', 'name')
    .populate({
        path: 'child',
        populate: { path: 'parent', select: 'name email phone' }
    });

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
        const child = await Child.findOne({ _id: req.params.id, parent: req.user._id }).select('_id');
        if (!child) return res.status(404).json({ success: false, message: 'Child not found' });

        const analyses = await populateAnalysisAccess(Analysis.find({ child: req.params.id }).sort('-createdAt'));
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

        const resultSummary = aiResult.result_summary || buildResultSummary({
            issueLabel: aiResult.issue_label,
            urgencyLabel: aiResult.urgency_label,
            summary: aiResult.summary
        });
        const treatmentSuggestions = Array.isArray(aiResult.treatment_suggestions) && aiResult.treatment_suggestions.length > 0
            ? aiResult.treatment_suggestions
            : buildTreatmentSuggestions(aiResult.issue_label, aiResult.urgency_label);
        const urgencyLabel = normalizeUrgencyLabel(aiResult.urgency_label);

        // Create analysis with AI results
        const analysis = await Analysis.create({
            child: req.params.id,
            performedBy: req.user._id,
            inputType: inputType,
            transcript: aiResult.transcript || textInput,
            issueLabel: aiResult.issue_label,
            issueTop3: aiResult.issue_top3?.map(i => ({ label: i.label, confidence: i.score })) || [],
            urgencyLabel,
            urgencyTop3: aiResult.urgency_top3?.map(u => ({ label: u.label, confidence: u.score })) || [],
            summary: aiResult.summary,
            resultSummary,
            treatmentSuggestions,
            audioFilename: aiResult.audio_filename
        });

        const populatedAnalysis = await populateAnalysisAccess(Analysis.findById(analysis._id));

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

        res.status(201).json({ success: true, analysis: populatedAnalysis });
    } catch (error) {
        console.error('Analysis error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   GET /api/parent/analyses/:analysisId/report
router.get('/analyses/:analysisId/report', async (req, res) => {
    try {
        const analysis = await populateAnalysisAccess(Analysis.findById(req.params.analysisId));

        if (!analysis || !analysis.child) {
            return res.status(404).json({ success: false, message: 'Analysis not found' });
        }

        const isParentChild = analysis.child.parent?._id?.toString?.() === req.user._id.toString()
            || analysis.child.parent?.toString?.() === req.user._id.toString();
        if (!isParentChild) {
            return res.status(403).json({ success: false, message: 'This report does not belong to your child profile' });
        }

        if (!analysis.doctorReview?.reviewedAt) {
            return res.status(400).json({ success: false, message: 'The doctor has not published the treatment report yet' });
        }

        const html = buildAnalysisReportHtml(analysis);
        const filename = buildFilename(analysis);

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename=\"${filename}\"`);
        res.send(html);
    } catch (error) {
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
