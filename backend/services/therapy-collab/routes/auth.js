const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const isDbConnected = () => mongoose.connection.readyState === 1;

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
router.post('/login', async (req, res) => {
    try {
        if (!isDbConnected()) {
            return res.status(503).json({
                success: false,
                message: 'Database is not connected. Check MongoDB and MONGO_URI/MONGODB_URI.',
            });
        }

        const { email, password } = req.body;
        const user = await User.findOne({ email }).select('+password');

        if (user && (await user.comparePassword(password))) {
            res.json({
                success: true,
                token: generateToken(user._id),
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            });
        } else {
            res.status(401).json({ success: false, message: 'Invalid email or password' });
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

module.exports = router;
