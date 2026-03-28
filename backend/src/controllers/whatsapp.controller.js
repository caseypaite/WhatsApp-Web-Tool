const whatsappService = require('../services/whatsapp.service');
const otpService = require('../services/otp.service');
const db = require('../config/db');

const whatsappController = {
  // ... existing methods
  
  createGroup: async (req, res) => {
    try {
      const { name, participants } = req.body;
      if (!name) return res.status(400).json({ error: 'Group name is required' });
      const result = await whatsappService.createGroup(name, participants || []);
      const gid = result.gid?._serialized || result.gid;
      
      // Sync WA JID back to system groups if name matches
      if (gid) {
        await db.query('UPDATE groups SET wa_jid = $1 WHERE name = $2', [gid, name]);
      }

      res.json({ success: true, gid });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  createChannel: async (req, res) => {
    try {
      const { name, description } = req.body;
      if (!name) return res.status(400).json({ error: 'Channel name is required' });
      const result = await whatsappService.createChannel(name, description || '');
      const channelId = result.nid?._serialized || result.nid || result.id?._serialized || result.id;
      res.json({ success: true, id: channelId });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  requestDeletionOtp: async (req, res) => {
    try {
      // Send OTP to the admin account itself (the one connected to WhatsApp)
      if (!whatsappService.me) return res.status(400).json({ error: 'WhatsApp account not connected' });
      const phone = whatsappService.me.wid.user;
      const result = await otpService.generateAndSendOtp(null, phone, 'deletion');
      res.json({ success: true, message: 'OTP sent to admin WhatsApp' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  confirmDelete: async (req, res) => {
    try {
      const { id, type, otp } = req.body; // type: 'group' or 'channel'
      if (!id || !type || !otp) return res.status(400).json({ error: 'Missing parameters' });
      
      const phone = whatsappService.me.wid.user;
      const isValid = await otpService.verifyOtp(phone, otp);
      if (!isValid) return res.status(400).json({ error: 'Invalid OTP' });

      if (type === 'group') {
        await whatsappService.deleteGroup(id);
      } else {
        await whatsappService.deleteChannel(id);
      }

      res.json({ success: true, message: `${type} deleted successfully` });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // Get connection status and QR if available
  getStatus: async (req, res) => {
    try {
      const status = await whatsappService.getStatus();
      const settingsService = require('../services/settings.service');
      
      // If service is DISCONNECTED but DB says CONNECTED, it means service is still booting up
      // or session is being restored. We should trust the service's runtime isReady flag
      // for the "ready" state, but can use DB status for the "label" if appropriate.
      
      if (!status.qr && status.status === 'DISCONNECTED') {
        const storedQr = await settingsService.get('whatsapp_qr');
        if (storedQr) status.qr = storedQr;
      }

      // If runtime says NOT READY, but status is CONNECTED, it's inconsistent
      if (!status.ready && status.status === 'CONNECTED') {
        status.status = 'AUTHENTICATING';
      }

      res.json(status);
    } catch (err) {
      console.error('[WHATSAPP CONTROLLER] Error getting status:', err.message);
      res.status(500).json({ error: 'Failed to get status' });
    }
  },

  // Manual Logout
  logout: async (req, res) => {
    try {
      await whatsappService.logout();
      res.json({ message: 'Logged out successfully' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to logout' });
    }
  },

  // Manual Initialization
  reinitialize: async (req, res) => {
    try {
      await whatsappService.initialize();
      res.json({ message: 'Re-initialization started' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to reinitialize' });
    }
  },

  requestPairingCode: async (req, res) => {
    try {
      const { phoneNumber } = req.body;
      if (!phoneNumber) return res.status(400).json({ error: 'Phone number is required' });
      const code = await whatsappService.requestPairingCode(phoneNumber);
      res.json({ success: true, code });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // Get Chats
  getChats: async (req, res) => {
    try {
      const chats = await whatsappService.getChats();
      res.json(chats);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch chats' });
    }
  },

  // Get Contacts
  getContacts: async (req, res) => {
    try {
      const contacts = await whatsappService.getContacts();
      res.json(contacts);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch contacts' });
    }
  },

  // Test message
  sendTestMessage: async (req, res) => {
    const { number, message } = req.body;
    try {
      const result = await whatsappService.sendMessage(number, message);
      res.json({ success: true, messageId: result.id });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  broadcast: async (req, res) => {
    try {
      const { targets, message, templateId, mediaUrl, mediaType } = req.body; // targets: [{id, type}]
      if (!targets || !targets.length) return res.status(400).json({ error: 'No targets specified' });
      
      let finalMessage = message;
      let mediaOptions = null;

      // If custom media is provided directly
      if (mediaUrl) {
        mediaOptions = { url: mediaUrl, type: mediaType || 'image' };
      }

      // If template is used, it overrides custom media/message if template has them
      if (templateId) {
        const tplRes = await db.query('SELECT * FROM message_templates WHERE id = $1', [templateId]);
        
        if (tplRes.rows.length > 0) {
          const tpl = tplRes.rows[0];
          finalMessage = tpl.content;
          if (tpl.media_url) {
            mediaOptions = { url: tpl.media_url, type: tpl.media_type };
          }
        }
      }

      if (!finalMessage) return res.status(400).json({ error: 'Message content is empty' });

      const results = { success: [], failed: [] };

      for (const target of targets) {
        try {
          await whatsappService.sendMessage(target.id, finalMessage, mediaOptions);
          results.success.push(target.id);
        } catch (err) {
          results.failed.push({ id: target.id, error: err.message });
        }
      }

      res.json({ success: true, results });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // Advanced Group Management
  getGroupMetadata: async (req, res) => {
    try {
      const { id } = req.params;
      const metadata = await whatsappService.getGroupMetadata(id);
      res.json(metadata);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  promoteAdmin: async (req, res) => {
    try {
      const { id } = req.params;
      const { participantId } = req.body;
      await whatsappService.promoteAdmin(id, participantId);
      res.json({ success: true, message: 'Participant promoted to admin' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  demoteAdmin: async (req, res) => {
    try {
      const { id } = req.params;
      const { participantId } = req.body;
      await whatsappService.demoteAdmin(id, participantId);
      res.json({ success: true, message: 'Participant demoted' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  removeParticipant: async (req, res) => {
    try {
      const { id } = req.params;
      const { participantId } = req.body;
      await whatsappService.removeParticipant(id, participantId);
      res.json({ success: true, message: 'Participant removed' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  addParticipant: async (req, res) => {
    try {
      const { id } = req.params;
      const { participantId } = req.body;
      await whatsappService.addParticipant(id, participantId);
      res.json({ success: true, message: 'Participant added' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  getJoinRequests: async (req, res) => {
    try {
      const { id } = req.params;
      const requests = await whatsappService.getJoinRequests(id);
      res.json(requests);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  approveJoinRequest: async (req, res) => {
    try {
      const { id } = req.params;
      const { participantId } = req.body;
      await whatsappService.approveJoinRequest(id, participantId);
      res.json({ success: true, message: 'Join request approved' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  rejectJoinRequest: async (req, res) => {
    try {
      const { id } = req.params;
      const { participantId } = req.body;
      await whatsappService.rejectJoinRequest(id, participantId);
      res.json({ success: true, message: 'Join request rejected' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  toggleGreetings: async (req, res) => {
    try {
      const { id } = req.params; // wa_jid
      const { enabled } = req.body; // optional: explicit state
      
      // 1. Check if group exists in portal
      const groupRes = await db.query('SELECT id, name, greetings_enabled FROM groups WHERE wa_jid = $1', [id]);
      
      let finalEnabled = enabled;

      if (groupRes.rows.length === 0) {
        // Create it
        const metadata = await whatsappService.getGroupMetadata(id);
        const name = metadata.subject || 'WhatsApp Group';
        
        if (finalEnabled === undefined) {
          const settingsService = require('../services/settings.service');
          const globalEnabled = await settingsService.get('group_greeting_enabled') === 'true';
          finalEnabled = !globalEnabled;
        }

        await db.query(
          'INSERT INTO groups (name, wa_jid, greetings_enabled) VALUES ($1, $2, $3)',
          [name, id, finalEnabled]
        );
      } else {
        const group = groupRes.rows[0];
        if (finalEnabled === undefined) {
          if (group.greetings_enabled === null) {
            const settingsService = require('../services/settings.service');
            const globalEnabled = await settingsService.get('group_greeting_enabled') === 'true';
            finalEnabled = !globalEnabled;
          } else {
            finalEnabled = !group.greetings_enabled;
          }
        }
        await db.query('UPDATE groups SET greetings_enabled = $1 WHERE wa_jid = $2', [finalEnabled, id]);
      }

      res.json({ success: true, greetingsEnabled: finalEnabled });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  sendPoll: async (req, res) => {
    try {
      const { chatId, question, options, allowMultiple } = req.body;
      if (!chatId || !question || !options) return res.status(400).json({ error: 'Missing parameters' });
      const result = await whatsappService.sendPoll(chatId, question, options, allowMultiple);
      res.json({ success: true, messageId: result.id });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  groupMessage: async (req, res) => {
    try {
      const { groupId, message, mediaUrl, mediaType } = req.body;
      if (!groupId || !message) return res.status(400).json({ error: 'groupId and message are required' });
      
      let mediaOptions = null;
      if (mediaUrl) {
        mediaOptions = { url: mediaUrl, type: mediaType || 'image' };
      }

      const result = await whatsappService.sendMessage(groupId, message, mediaOptions);
      res.json({ success: true, messageId: result.id?._serialized || result.id });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  channelPost: async (req, res) => {
    try {
      const { channelId, message, mediaUrl, mediaType } = req.body;
      if (!channelId || !message) return res.status(400).json({ error: 'channelId and message are required' });
      
      let mediaOptions = null;
      if (mediaUrl) {
        mediaOptions = { url: mediaUrl, type: mediaType || 'image' };
      }

      const result = await whatsappService.sendMessage(channelId, message, mediaOptions);
      res.json({ success: true, messageId: result.id?._serialized || result.id });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};

module.exports = whatsappController;
