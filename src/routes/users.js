const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// Middleware to check if user is admin or superadmin
const isAdminOrSuperAdmin = async (req, res, next) => {
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
        return res.status(403).json({ message: 'Access denied. Admin rights required.' });
    }
    next();
};

// Get all users (admin/superadmin only)
router.get('/', auth, isAdminOrSuperAdmin, async (req, res) => {
    try {
        const users = await User.find({ organization: req.user.organization }).select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create new user (admin/superadmin only)
router.post('/', auth, isAdminOrSuperAdmin, async (req, res) => {
    try {
        const { email, password, role } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create new user
        const user = new User({
            email,
            password,
            role,
            organization: req.user.organization
        });

        await user.save();
        const userWithoutPassword = user.toObject();
        delete userWithoutPassword.password;

        res.status(201).json(userWithoutPassword);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update user (admin/superadmin only)
router.put('/:id', auth, isAdminOrSuperAdmin, async (req, res) => {
    try {
        const { email, role, isActive } = req.body;
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.organization.toString() !== req.user.organization.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }

        user.email = email || user.email;
        user.role = role || user.role;
        user.isActive = isActive !== undefined ? isActive : user.isActive;

        await user.save();
        const userWithoutPassword = user.toObject();
        delete userWithoutPassword.password;

        res.json(userWithoutPassword);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete user (admin/superadmin only)
router.delete('/:id', auth, isAdminOrSuperAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.organization.toString() !== req.user.organization.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }

        await user.remove();
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get current user profile
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;