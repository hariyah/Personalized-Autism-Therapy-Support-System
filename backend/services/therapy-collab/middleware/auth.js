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
            const primarySecret = process.env.JWT_SECRET || process.env.SECRET_KEY || 'secret123';
            const fallbackSecret = 'dev-secret-change-in-production'; // autism-profile-builder default when .env not loaded
            let decoded;
            try {
                decoded = jwt.verify(token, primarySecret);
            } catch (primaryErr) {
                if (primaryErr.name === 'JsonWebTokenError' && primarySecret !== fallbackSecret) {
                    try {
                        decoded = jwt.verify(token, fallbackSecret);
                    } catch (fallbackErr) {
                        return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
                    }
                } else {
                    return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
                }
            }

            let user;
            if (decoded.email) {
                user = await User.findOne({ email: decoded.email }).select('-password');
                if (!user) {
                    user = await User.create({
                        name: decoded.email.split('@')[0],
                        email: decoded.email,
                        password: crypto.randomUUID(),
                        role: 'parent',
                    });
                    user.password = undefined;
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
