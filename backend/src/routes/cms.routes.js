const express = require('express');
const router = express.Router();
const cmsController = require('../controllers/cms.controller');
const { authenticate, checkRole } = require('../middleware/auth.middleware');

/**
 * Route: GET /api/cms/landing
 * Publicly fetches the landing page configuration.
 */
router.get('/landing', cmsController.getLandingPage);

/**
 * Route: PUT /api/cms/landing
 * Updates landing page configuration. Restricted to Admins.
 */
router.put('/landing', authenticate, checkRole(['Admin']), cmsController.updateLandingPage);

module.exports = router;
