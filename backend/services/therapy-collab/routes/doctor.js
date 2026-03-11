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

const normalizeSuggestionList = (value) => {
    if (Array.isArray(value)) {
        return value.map(item => String(item).trim()).filter(Boolean);
    }

    if (typeof value === 'string') {
        return value
            .split(/\r?\n|;/)
            .map(item => item.trim())
            .filter(Boolean);
    }

    return [];
};

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
        const patient = await Child.findOne({ _id: req.params.id, assignedDoctors: req.user._id }).select('_id');
        if (!patient) return res.status(404).json({ success: false, message: 'Patient not assigned or not found' });

        const analyses = await populateAnalysisAccess(Analysis.find({ child: req.params.id }).sort('-createdAt'));
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
        const child = await Child.findOne({ _id: req.params.id, assignedDoctors: req.user._id }).select('name parent');

        if (!child) {
            return res.status(404).json({ success: false, message: 'Patient not assigned or not found' });
        }

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

        // Notify parent
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

        res.status(201).json({ success: true, analysis: populatedAnalysis });
    } catch (error) {
        console.error('Analysis error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   PUT /api/doctor/analyses/:analysisId/review
router.put('/analyses/:analysisId/review', async (req, res) => {
    try {
        const analysis = await populateAnalysisAccess(Analysis.findById(req.params.analysisId));

        if (!analysis || !analysis.child) {
            return res.status(404).json({ success: false, message: 'Analysis not found' });
        }

        const isAssignedDoctor = analysis.child.assignedDoctors?.some(doctorId => doctorId.toString() === req.user._id.toString());
        if (!isAssignedDoctor) {
            return res.status(403).json({ success: false, message: 'You are not assigned to this patient' });
        }

        const {
            finalSummary,
            finalTreatmentSuggestions,
            treatmentStatus,
            careStage,
            followUpPlan,
            nextReviewDate
        } = req.body;

        const normalizedSuggestions = normalizeSuggestionList(finalTreatmentSuggestions);
        if (!String(finalSummary || '').trim()) {
            return res.status(400).json({ success: false, message: 'Doctor final summary is required' });
        }
        if (normalizedSuggestions.length === 0) {
            return res.status(400).json({ success: false, message: 'At least one treatment item is required' });
        }

        analysis.isReviewed = true;
        analysis.doctorReview = {
            doctor: req.user._id,
            doctorName: req.user.name,
            reviewedAt: new Date(),
            finalSummary: String(finalSummary).trim(),
            finalTreatmentSuggestions: normalizedSuggestions,
            treatmentStatus: treatmentStatus || 'recommended',
            careStage: careStage || 'reviewed',
            followUpPlan: String(followUpPlan || '').trim(),
            nextReviewDate: nextReviewDate ? new Date(nextReviewDate) : undefined,
            reportIssuedAt: new Date()
        };

        analysis.doctorNotes.push({
            doctor: req.user._id,
            note: String(finalSummary).trim(),
            recommendations: normalizedSuggestions.join('\n'),
            createdAt: new Date()
        });

        await analysis.save();
        await analysis.populate('doctorReview.doctor', 'name');
        await analysis.populate('performedBy', 'name');

        await Notification.create({
            user: analysis.child.parent?._id || analysis.child.parent,
            type: 'new_analysis',
            severity: analysis.urgencyLabel,
            title: 'Treatment Plan Updated',
            message: `Dr. ${req.user.name} reviewed ${analysis.child.name}'s analysis and updated the treatment plan.`,
            child: analysis.child._id,
            analysis: analysis._id,
            action_url: `/parent/children/${analysis.child._id}?tab=care-plan`
        });

        res.json({ success: true, analysis });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   GET /api/doctor/analyses/:analysisId/report
router.get('/analyses/:analysisId/report', async (req, res) => {
    try {
        const analysis = await populateAnalysisAccess(Analysis.findById(req.params.analysisId));

        if (!analysis || !analysis.child) {
            return res.status(404).json({ success: false, message: 'Analysis not found' });
        }

        const isAssignedDoctor = analysis.child.assignedDoctors?.some(doctorId => doctorId.toString() === req.user._id.toString());
        if (!isAssignedDoctor) {
            return res.status(403).json({ success: false, message: 'You are not assigned to this patient' });
        }

        if (!analysis.doctorReview?.reviewedAt) {
            return res.status(400).json({ success: false, message: 'Review the treatment plan before downloading the report' });
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
