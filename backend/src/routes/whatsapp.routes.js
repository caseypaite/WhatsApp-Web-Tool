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
router.post('/request-pairing-code', authenticate, checkRole(['Admin']), whatsappController.requestPairingCode);
router.post('/send-test', authenticate, checkRole(['Admin']), whatsappController.sendTestMessage);
router.post('/broadcast', authenticate, checkRole(['Admin']), whatsappController.broadcast);

// New Management Routes
router.post('/groups', authenticate, checkRole(['Admin']), whatsappController.createGroup);
router.post('/channels', authenticate, checkRole(['Admin']), whatsappController.createChannel);
router.post('/request-delete-otp', authenticate, checkRole(['Admin']), whatsappController.requestDeletionOtp);
router.post('/confirm-delete', authenticate, checkRole(['Admin']), whatsappController.confirmDelete);

// Advanced Group Management Routes
router.get('/groups/:id/metadata', authenticate, checkRole(['Admin']), whatsappController.getGroupMetadata);
router.post('/groups/:id/promote', authenticate, checkRole(['Admin']), whatsappController.promoteAdmin);
router.post('/groups/:id/demote', authenticate, checkRole(['Admin']), whatsappController.demoteAdmin);
router.post('/groups/:id/remove', authenticate, checkRole(['Admin']), whatsappController.removeParticipant);
router.post('/groups/:id/add', authenticate, checkRole(['Admin']), whatsappController.addParticipant);
router.get('/groups/:id/join-requests', authenticate, checkRole(['Admin']), whatsappController.getJoinRequests);
router.post('/groups/:id/approve', authenticate, checkRole(['Admin']), whatsappController.approveJoinRequest);
router.post('/groups/:id/reject', authenticate, checkRole(['Admin']), whatsappController.rejectJoinRequest);

// Interaction Routes
router.post('/poll', authenticate, checkRole(['Admin']), whatsappController.sendPoll);
router.post('/group/message', authenticate, checkRole(['Admin']), whatsappController.groupMessage);
router.post('/channel/post', authenticate, checkRole(['Admin']), whatsappController.channelPost);

module.exports = router;
