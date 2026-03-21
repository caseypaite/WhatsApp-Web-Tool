const whatsappService = require('../services/whatsapp.service');

const whatsappController = {
  // Get connection status and QR if available
  getStatus: async (req, res) => {
    try {
      const status = await whatsappService.getStatus();
      res.json(status);
    } catch (err) {
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
