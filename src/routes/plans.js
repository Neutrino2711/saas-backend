const express = require('express');
const router = express.Router();
const planController = require('../controllers/planController');
const auth = require('../middleware/auth');

// Middleware to check if user is superadmin
const isSuperAdmin = (req, res, next) => {
    if (req.user.role !== 'superadmin') {
        return res.status(403).json({ message: 'Access denied. Super Admin rights required.' });
    }
    next();
};

// Public routes
router.get('/', planController.getPlans);
// router.get('/:id', planController.getPlanById);
router.get('/:name', planController.getPlanByName);

// Protected routes (superadmin only)
router.put('/:id', auth, isSuperAdmin, planController.updatePlan);
router.delete('/:id', auth, isSuperAdmin, planController.deletePlan);

module.exports = router;