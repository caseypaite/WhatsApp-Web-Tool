const express = require('express');
const router = express.Router();
const whatsappController = require('../controllers/whatsapp.controller');
const { authenticate, checkRole } = require('../middleware/auth.middleware');

/**
 * External Gateway API (v1) - Clean Endpoints
 * These endpoints are optimized for external integration using API Keys.
 */

// Universal Broadcast (Multiple targets: individual, group, or channel)
router.post('/broadcast', authenticate, checkRole(['MessagingOnly']), whatsappController.broadcast);

// Native WhatsApp Polls
router.post('/poll', authenticate, checkRole(['MessagingOnly']), whatsappController.sendPoll);

// Targeted Messaging
router.post('/message/single', authenticate, checkRole(['MessagingOnly']), whatsappController.sendSingleMessage);
router.post('/message/group', authenticate, checkRole(['MessagingOnly']), whatsappController.groupMessage);
router.post('/message/channel', authenticate, checkRole(['MessagingOnly']), whatsappController.channelPost);

module.exports = router;
