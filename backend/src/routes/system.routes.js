const express = require('express');
const router = express.Router();
const systemController = require('../controllers/system.controller');

/**
 * Public/User Routes
 */
router.get('/status', (req, res) => systemController.getSystemStatus(req, res));
router.get('/version-history', (req, res) => systemController.getVersionHistory(req, res));
router.get('/git-history', (req, res) => systemController.getGitHistory(req, res));

module.exports = router;
