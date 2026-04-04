const db = require('../config/db');
const whatsappService = require('../services/whatsapp.service');
const { normalizePhoneNumber } = require('../utils/validators');

const groupController = {
  createGroup: async (req, res) => {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Group name is required.' });
    try {
      const result = await db.query(
        'INSERT INTO groups (name, description) VALUES ($1, $2) RETURNING *',
        [name, description || '']
      );
      res.status(201).json(result.rows[0]);
    } catch (error) {
      if (error.code === '23505') return res.status(400).json({ error: 'Group name already exists.' });
      res.status(500).json({ error: 'Database error' });
    }
  },

  deleteGroup: async (req, res) => {
    const { groupId } = req.params;
    const { otp } = req.body;
    if (!otp) return res.status(400).json({ error: 'OTP is required for this action' });

    try {
      const otpService = require('../services/otp.service');
      if (!whatsappService.me) return res.status(400).json({ error: 'WhatsApp account not connected' });
      const phone = whatsappService.me.wid.user;

      const isValid = await otpService.verifyOtp(phone, otp);
      if (!isValid) return res.status(400).json({ error: 'Invalid or expired OTP' });

      const result = await db.query('DELETE FROM groups WHERE id = $1 RETURNING *', [groupId]);
      if (result.rowCount === 0) return res.status(404).json({ error: 'Group not found.' });
      res.json({ message: 'Group deleted successfully.' });
    } catch (error) {
      res.status(500).json({ error: 'Database error: ' + error.message });
    }
  },

  getAllGroups: async (req, res) => {
    try {
      const result = await db.query('SELECT * FROM groups ORDER BY created_at DESC');
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: 'Database error' });
    }
  },

  getGroupMembers: async (req, res) => {
    const { groupId } = req.params;
    try {
      const result = await db.query(
        `SELECT u.id, u.email, u.name, u.phone_number, gm.role, gm.joined_at 
         FROM group_members gm 
         JOIN users u ON gm.user_id = u.id 
         WHERE gm.group_id = $1`,
        [groupId]
      );
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: 'Database error' });
    }
  },

  addMember: async (req, res) => {
    const { groupId, userId, role } = req.body;
    if (!groupId || !userId) return res.status(400).json({ error: 'Missing groupId or userId.' });
    try {
      await db.query(
        'INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
        [groupId, userId, role || 'MEMBER']
      );
      res.json({ message: 'Member added.' });
    } catch (error) {
      res.status(500).json({ error: 'Database error' });
    }
  },

  removeMember: async (req, res) => {
    const { groupId, userId } = req.body;
    try {
      await db.query('DELETE FROM group_members WHERE group_id = $1 AND user_id = $2', [groupId, userId]);
      res.json({ message: 'Member removed.' });
    } catch (error) {
      res.status(500).json({ error: 'Database error' });
    }
  },

  promoteMember: async (req, res) => {
    const { groupId, userId, role } = req.body;
    try {
      await db.query(
        "UPDATE group_members SET role = $1 WHERE group_id = $2 AND user_id = $3",
        [role || 'ADMIN', groupId, userId]
      );
      res.json({ message: `Member updated to ${role || 'ADMIN'}.` });
    } catch (error) {
      res.status(500).json({ error: 'Database error' });
    }
  },

  sendMessage: async (req, res) => {
    const { userId, phoneNumber, message, mediaOptions } = req.body;
    if (!phoneNumber || !message) return res.status(400).json({ error: 'Missing phoneNumber or message.' });
    
    try {
      const normalizedPhone = normalizePhoneNumber(phoneNumber);
      const result = await whatsappService.sendMessage(normalizedPhone, message, mediaOptions);
      const success = !!result.id;
      
      await whatsappService.logMessage({
        userId: userId || null,
        phoneNumber: normalizedPhone,
        message,
        status: success ? 'SUCCESS' : 'FAILED',
        errorMessage: success ? null : 'Failed to get message ID'
      });

      res.json({ message: 'Process complete.', success, result, normalizedPhone });
    } catch (error) {
      console.error('Error sending custom message:', error.message);
      
      const normalizedPhone = normalizePhoneNumber(phoneNumber);
      await whatsappService.logMessage({
        userId: userId || null,
        phoneNumber: normalizedPhone,
        message,
        status: 'FAILED',
        errorMessage: error.message
      });

      res.status(500).json({ error: error.message || 'Failed to send message.' });
    }
  },

  getMessageHistory: async (req, res) => {
    const { userId } = req.params;
    try {
      const result = await db.query(
        'SELECT * FROM message_history WHERE user_id = $1 ORDER BY sent_at DESC',
        [userId]
      );
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: 'Database error' });
    }
  },

  getMyGroups: async (req, res) => {
    const userId = req.user.id;
    try {
      const result = await db.query(
        `SELECT g.*, gm.role as my_role, gm.joined_at 
         FROM group_members gm 
         JOIN groups g ON gm.group_id = g.id 
         WHERE gm.user_id = $1`,
        [userId]
      );
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: 'Database error' });
    }
  },

  getMyMessageHistory: async (req, res) => {
    const userId = req.user.id;
    try {
      const result = await db.query(
        'SELECT * FROM message_history WHERE user_id = $1 ORDER BY sent_at DESC',
        [userId]
      );
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: 'Database error' });
    }
  }
};

module.exports = groupController;
