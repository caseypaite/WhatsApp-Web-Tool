const express = require('express');
const router = express.Router();
const auditController = require('../controllers/audit.controller');
const { authenticate, checkRole } = require('../middleware/auth.middleware');

router.get('/messages', authenticate, checkRole(['Admin']), auditController.getMessageHistory);
router.delete('/messages', authenticate, checkRole(['Admin']), auditController.clearHistory);

module.exports = router;
