const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settings.controller');
const { authenticate, checkRole } = require('../middleware/auth.middleware');

/**
 * Public Routes
 */
router.get('/public', settingsController.getPublicConfig);

/**
 * Protected Admin Routes
 */
router.get('/all', authenticate, checkRole(['Admin']), settingsController.getAll);
router.put('/update', authenticate, checkRole(['Admin']), settingsController.update);
router.post('/test-otp', authenticate, checkRole(['Admin']), settingsController.testOtp);

module.exports = router;
