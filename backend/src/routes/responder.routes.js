const express = require('express');
const router = express.Router();
const responderController = require('../controllers/responder.controller');
const { authenticate, checkRole } = require('../middleware/auth.middleware');

router.get('/', authenticate, checkRole(['Admin']), responderController.getAll);
router.post('/', authenticate, checkRole(['Admin']), responderController.create);
router.put('/:id', authenticate, checkRole(['Admin']), responderController.update);
router.delete('/:id', authenticate, checkRole(['Admin']), responderController.delete);
router.post('/:id/toggle', authenticate, checkRole(['Admin']), responderController.toggleActive);

module.exports = router;
