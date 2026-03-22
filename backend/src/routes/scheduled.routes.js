const express = require('express');
const router = express.Router();
const scheduledController = require('../controllers/scheduled.controller');
const { authenticate, checkRole } = require('../middleware/auth.middleware');

router.get('/', authenticate, checkRole(['Admin']), scheduledController.getAll);
router.post('/', authenticate, checkRole(['Admin']), scheduledController.create);
router.post('/:id/cancel', authenticate, checkRole(['Admin']), scheduledController.cancel);
router.delete('/:id', authenticate, checkRole(['Admin']), scheduledController.delete);

module.exports = router;
