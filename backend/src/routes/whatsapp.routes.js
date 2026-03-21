const express = require('express');
const router = express.Router();
const whatsappController = require('../controllers/whatsapp.controller');
const { authenticate, checkRole } = require('../middleware/auth.middleware');

/**
 * All WhatsApp routes are restricted to Admin
 */
router.get('/status', authenticate, checkRole(['Admin']), whatsappController.getStatus);
router.get('/chats', authenticate, checkRole(['Admin']), whatsappController.getChats);
router.get('/contacts', authenticate, checkRole(['Admin']), whatsappController.getContacts);
router.post('/logout', authenticate, checkRole(['Admin']), whatsappController.logout);
router.post('/reinitialize', authenticate, checkRole(['Admin']), whatsappController.reinitialize);
router.post('/send-test', authenticate, checkRole(['Admin']), whatsappController.sendTestMessage);

module.exports = router;
