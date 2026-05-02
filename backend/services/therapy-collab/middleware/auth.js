const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const mongoose = require('mongoose');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            if (mongoose.connection.readyState !== 1) {
                return res.status(503).json({
                    success: false,
                    message: 'Database is not connected. Check MongoDB and MONGO_URI/MONGODB_URI.'
                });
            }

            token = req.headers.authorization.split(' ')[1];
            // Try therapy-collab JWT first, then profile-builder (guardian) JWT for common auth
            const therapySecret = process.env.JWT_SECRET || process.env.SECRET_KEY || 'secret123';
            const profileBuilderSecret = process.env.PROFILE_BUILDER_SECRET || process.env.SECRET_KEY || 'dev-secret-change-in-production';
            let decoded;
            try {
                decoded = jwt.verify(token, therapySecret);
            } catch (therapyErr) {
                try {
                    decoded = jwt.verify(token, profileBuilderSecret);
                } catch (profileErr) {
                    return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
                }
            }

            let user;
            // Profile-builder (guardian) token: { id, email, role? } -> find/create therapy user with role
            if (decoded.email) {
                user = await User.findOne({ email: decoded.email }).select('-password');
                const role = (decoded.role === 'doctor' ? 'doctor' : 'parent');
                if (!user) {
                    user = await User.create({
                        name: decoded.name || decoded.fullName || decoded.email.split('@')[0],
                        email: decoded.email,
                        password: crypto.randomBytes(24).toString('hex'),
                        role,
                    });
                    user.password = undefined;
                } else if (user.role !== role) {
                    await User.findByIdAndUpdate(user._id, { role });
                    user.role = role;
                }
            } else {
                user = await User.findById(decoded.id).select('-password');
            }

            if (!user) {
                return res.status(401).json({ success: false, message: 'User not found' });
            }

            req.user = user;
            return next();
        } catch (error) {
            return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `User role ${req.user.role} is not authorized to access this route`
            });
        }
        next();
    };
};

module.exports = { protect, authorize };
