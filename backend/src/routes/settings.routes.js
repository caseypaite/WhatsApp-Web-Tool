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
router.get('/messaging-api-keys', authenticate, checkRole(['Admin']), settingsController.getMessagingApiKeys);
router.post('/messaging-api-keys', authenticate, checkRole(['Admin']), settingsController.createMessagingApiKey);
router.put('/messaging-api-keys/:id', authenticate, checkRole(['Admin']), settingsController.updateMessagingApiKey);
router.post('/messaging-api-keys/:id/rotate', authenticate, checkRole(['Admin']), settingsController.rotateMessagingApiKey);
router.delete('/messaging-api-keys/:id', authenticate, checkRole(['Admin']), settingsController.deleteMessagingApiKey);
router.post('/test-otp', authenticate, checkRole(['Admin']), settingsController.testOtp);

module.exports = router;
