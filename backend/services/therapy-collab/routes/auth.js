const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const axios = require('axios');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const isDbConnected = () => mongoose.connection.readyState === 1;

const PROFILE_BUILDER_URL = process.env.PROFILE_BUILDER_URL || 'http://localhost:7001';

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'secret123', { expiresIn: '30d' });
};

// @route   POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        if (!isDbConnected()) {
            return res.status(503).json({
                success: false,
                message: 'Database is not connected. Check MongoDB and MONGO_URI/MONGODB_URI.',
            });
        }

        const { name, email, password, role } = req.body;
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        const user = await User.create({ name, email, password, role });

        res.status(201).json({
            success: true,
            token: generateToken(user._id),
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   POST /api/auth/login
// Tries local User first; if not found or wrong password, tries profile-builder (main app) login
// so doctors/parents who registered on main app can log in at therapy-collab with same credentials.
router.post('/login', async (req, res) => {
    try {
        if (!isDbConnected()) {
            return res.status(503).json({
                success: false,
                message: 'Database is not connected. Check MongoDB and MONGO_URI/MONGODB_URI.',
            });
        }

        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password required' });
        }

        let user = await User.findOne({ email }).select('+password');
        if (user && (await user.comparePassword(password))) {
            return res.json({
                success: true,
                token: generateToken(user._id),
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            });
        }

        // Fallback: try profile-builder (main app) login for users who registered there
        try {
            const pbRes = await axios.post(
                `${PROFILE_BUILDER_URL}/api/auth/login`,
                { email, password },
                { timeout: 5000, validateStatus: () => true }
            );
            if (pbRes.status !== 200 || !pbRes.data || !pbRes.data.token) {
                return res.status(401).json({ success: false, message: 'Invalid email or password' });
            }
            const guardian = pbRes.data.user || {};
            const role = (guardian.role === 'doctor' ? 'doctor' : 'parent');
            const name = guardian.fullName || guardian.name || email.split('@')[0];

            user = await User.findOne({ email }).select('+password');
            if (user) {
                user.password = password;
                user.role = role;
                if (name) user.name = name;
                await user.save();
                user.password = undefined;
            } else {
                user = await User.create({ name, email, password, role });
                user.password = undefined;
            }

            return res.json({
                success: true,
                token: generateToken(user._id),
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            });
        } catch (pbErr) {
            if (pbErr.response && pbErr.response.status === 401) {
                return res.status(401).json({ success: false, message: 'Invalid email or password' });
            }
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   GET /api/auth/me
router.get('/me', protect, async (req, res) => {
    res.json({
        success: true,
        user: {
            id: req.user._id,
            _id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role
        }
    });
});

// @route   POST /api/auth/bridge
// Syncs a main-app guardian into therapy-collab, updating display name if provided
router.post('/bridge', protect, async (req, res) => {
    try {
        const { name } = req.body;
        if (name && req.user.name !== name) {
            await User.findByIdAndUpdate(req.user._id, { name });
            req.user.name = name;
        }
        res.json({
            success: true,
            user: {
                id: req.user._id,
                _id: req.user._id,
                name: req.user.name,
                email: req.user.email,
                role: req.user.role
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
