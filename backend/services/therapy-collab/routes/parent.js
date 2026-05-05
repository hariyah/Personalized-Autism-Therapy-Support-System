const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const Child = require('../models/Child');
const Analysis = require('../models/Analysis');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const DoctorPatient = require('../models/DoctorPatient');
const { protect, authorize } = require('../middleware/auth');
const { buildResultSummary, buildTreatmentSuggestions, normalizeUrgencyLabel } = require('../utils/analysisRecommendations');
const { buildFilename, buildAnalysisReportHtml } = require('../utils/analysisReport');
const { normalizeLoopbackUrl } = require('../utils/serviceUrl');

const AI_URL = normalizeLoopbackUrl(process.env.AI_URL || 'http://127.0.0.1:7006/analyze-voice');
const AI_TEXT_URL = normalizeLoopbackUrl(process.env.AI_TEXT_URL || 'http://127.0.0.1:7006/analyze-text');
const upload = multer({ storage: multer.memoryStorage() });

const populateAnalysisAccess = (query) => query
    .populate('performedBy', 'name')
    .populate('doctorReview.doctor', 'name')
    .populate({
        path: 'child',
        populate: { path: 'parent', select: 'name email phone' }
    });

const getSafeTranscript = (aiResult, textInput) => {
    const transcript = String(aiResult?.transcript || textInput || '').trim();
    return transcript || 'No transcript available';
};

const getSafeSummary = (aiResult, fallbackTranscript) => {
    const summary = String(aiResult?.summary || '').trim();
    return summary || fallbackTranscript || 'No transcript available';
};

const getAnalysisServiceErrorMessage = (error) => {
    if (error?.code === 'ECONNREFUSED') {
        return 'The therapy AI analysis service is not running on port 7006. Start the therapy-collab AI service and try again.';
    }

    if (error?.response?.status === 404) {
        return 'The requested analysis endpoint was not found on the therapy AI service. Verify that the latest therapy-collab AI service is running.';
    }

    return error?.response?.data?.message || error?.message || 'Analysis failed.';
};

const parseDateInput = (value) => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
};

const calculateAgeFromDateOfBirth = (value) => {
    const birthDate = parseDateInput(value);
    if (!birthDate) return null;

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
};

const validateChildPayload = (payload = {}) => {
    const errors = [];
    const name = String(payload.name || '').trim();

    if (!name) {
        errors.push('Full name is required.');
    }

    if (!payload.gender) {
        errors.push('Gender is required.');
    }

    const computedAge = calculateAgeFromDateOfBirth(payload.dateOfBirth);
    if (computedAge === null) {
        errors.push('Date of birth must be a valid date in the past or today.');
    }

    if (payload.age !== undefined && payload.age !== null && payload.age !== '') {
        const providedAge = Number(payload.age);
        if (!Number.isInteger(providedAge) || providedAge < 0) {
            errors.push('Age must be a non-negative whole number.');
        } else if (computedAge !== null && providedAge !== computedAge) {
            errors.push(`Age must match the selected date of birth. Expected ${computedAge}.`);
        }
    }

    return { errors, computedAge };
};

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
        const { errors } = validateChildPayload(req.body);
        if (errors.length > 0) {
            return res.status(400).json({ success: false, message: errors[0], errors });
        }

        const childPayload = {
            ...req.body,
            name: String(req.body.name || '').trim(),
            dateOfBirth: parseDateInput(req.body.dateOfBirth),
            parent: req.user._id
        };

        delete childPayload.age;

        if (childPayload.diagnosisDetails) {
            childPayload.diagnosisDetails = {
                ...childPayload.diagnosisDetails,
                diagnosisDate: parseDateInput(childPayload.diagnosisDetails.diagnosisDate) || undefined
            };
        }

        const child = await Child.create(childPayload);
        res.status(201).json({ success: true, child });
    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors || {}).map(item => item.message);
            return res.status(400).json({ success: false, message: messages[0] || error.message, errors: messages });
        }
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   DELETE /api/parent/children/:id
router.delete('/children/:id', async (req, res) => {
    try {
        const child = await Child.findOne({ _id: req.params.id, parent: req.user._id }).select('_id name');
        if (!child) {
            return res.status(404).json({ success: false, message: 'Child not found' });
        }

        const analysisIds = await Analysis.find({ child: child._id }).distinct('_id');
        const messageIds = await Message.find({ child: child._id }).distinct('_id');
        const notificationClauses = [{ child: child._id }];

        if (analysisIds.length > 0) {
            notificationClauses.push({ analysis: { $in: analysisIds } });
        }
        if (messageIds.length > 0) {
            notificationClauses.push({ messageRef: { $in: messageIds } });
        }

        await Notification.deleteMany({ $or: notificationClauses });
        await Analysis.deleteMany({ child: child._id });
        await Message.deleteMany({ child: child._id });
        await DoctorPatient.deleteMany({ child: child._id });
        await Child.deleteOne({ _id: child._id, parent: req.user._id });

        res.json({ success: true, message: `${child.name} was deleted successfully.` });
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

        const transcript = getSafeTranscript(aiResult, textInput);
        const summary = getSafeSummary(aiResult, transcript);
        const resultSummary = aiResult.result_summary || buildResultSummary({
            issueLabel: aiResult.issue_label,
            urgencyLabel: aiResult.urgency_label,
            summary
        });
        const treatmentSuggestions = Array.isArray(aiResult.treatment_suggestions) && aiResult.treatment_suggestions.length > 0
            ? aiResult.treatment_suggestions.map(item => String(item).trim()).filter(Boolean)
            : buildTreatmentSuggestions(aiResult.issue_label, aiResult.urgency_label);
        const urgencyLabel = normalizeUrgencyLabel(aiResult.urgency_label);

        // Create analysis with AI results
        const analysis = await Analysis.create({
            child: req.params.id,
            performedBy: req.user._id,
            inputType: inputType,
            transcript,
            issueLabel: aiResult.issue_label,
            issueTop3: aiResult.issue_top3?.map(i => ({ label: i.label, confidence: i.score })) || [],
            urgencyLabel,
            urgencyTop3: aiResult.urgency_top3?.map(u => ({ label: u.label, confidence: u.score })) || [],
            summary,
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
        console.error('Analysis error:', {
            message: error.message,
            code: error.code,
            status: error.response?.status,
            data: error.response?.data
        });
        res.status(error.code === 'ECONNREFUSED' ? 503 : 500).json({ success: false, message: getAnalysisServiceErrorMessage(error) });
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
