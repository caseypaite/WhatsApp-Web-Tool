const express = require('express');
const router = express.Router();
const responderController = require('../controllers/responder.controller');
const { authenticate, checkRole } = require('../middleware/auth.middleware');

router.get('/', authenticate, checkRole(['Admin']), responderController.getAll);
router.post('/', authenticate, checkRole(['Admin']), responderController.create);
router.put('/:id', authenticate, checkRole(['Admin']), responderController.update);
router.delete('/:id', authenticate, checkRole(['Admin']), responderController.delete);
router.post('/:id/toggle', authenticate, checkRole(['Admin']), responderController.toggleActive);

// Blacklist & Interactions
router.get('/blacklist', authenticate, checkRole(['Admin']), responderController.getBlacklist);
router.post('/blacklist', authenticate, checkRole(['Admin']), responderController.addToBlacklist);
router.delete('/blacklist/:phone_number', authenticate, checkRole(['Admin']), responderController.removeFromBlacklist);
router.get('/interactions', authenticate, checkRole(['Admin']), responderController.getInteractions);

module.exports = router;
