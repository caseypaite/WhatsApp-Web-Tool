const whatsappService = require('../services/whatsapp.service');

const whatsappController = {
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
  }
};

module.exports = whatsappController;
