const express = require('express');
const router = express.Router();
const multer = require('multer');
const Message = require('../models/Message');
const Child = require('../models/Child');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

const upload = multer({ storage: multer.memoryStorage() });
router.use(protect);

// @route   GET /api/messages/:childId
router.get('/:childId', async (req, res) => {
    try {
        const messages = await Message.find({ child: req.params.childId })
            .populate('sender', 'name role')
            .sort('createdAt');
        res.json({ success: true, messages });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   POST /api/messages
router.post('/', async (req, res) => {
    try {
        const { childId, receiverId, content } = req.body;
        const msg = await Message.create({
            sender: req.user._id,
            receiver: receiverId,
            child: childId,
            content,
            messageType: 'text'
        });

        const populatedMsg = await Message.findById(msg._id).populate('sender', 'name role');

        // Create notification
        await Notification.create({
            user: receiverId,
            type: 'alert',
            severity: 'low',
            title: `New Message from ${req.user.name}`,
            message: content.length > 50 ? content.substring(0, 50) + '...' : content,
            child: childId,
            messageRef: msg._id,
            action_url: req.user.role === 'parent' ? `/doctor/patients/${childId}?tab=chat` : `/parent/children/${childId}?tab=consultation`
        });

        res.status(201).json({ success: true, message: populatedMsg });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   POST /api/messages/voice
router.post('/voice', upload.single('audio'), async (req, res) => {
    try {
        const { childId, receiverId } = req.body;
        const base64 = req.file.buffer.toString('base64');
        const dataUrl = `data:${req.file.mimetype};base64,${base64}`;

        const msg = await Message.create({
            sender: req.user._id,
            receiver: receiverId,
            child: childId,
            content: dataUrl,
            messageType: 'voice'
        });

        const populatedMsg = await Message.findById(msg._id).populate('sender', 'name role');

        await Notification.create({
            user: receiverId,
            type: 'alert',
            severity: 'medium',
            title: `Voice Note from ${req.user.name}`,
            message: 'Sent a voice note.',
            child: childId,
            messageRef: msg._id,
            action_url: req.user.role === 'parent' ? `/doctor/patients/${childId}?tab=chat` : `/parent/children/${childId}?tab=consultation`
        });

        res.status(201).json({ success: true, message: populatedMsg });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
