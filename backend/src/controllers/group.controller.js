const { Client } = require('pg');
const whatsappService = require('../services/whatsapp.service');

const groupController = {
  createGroup: async (req, res) => {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Group name is required.' });
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    try {
      await client.connect();
      const result = await client.query(
        'INSERT INTO groups (name, description) VALUES ($1, $2) RETURNING *',
        [name, description || '']
      );
      res.status(201).json(result.rows[0]);
    } catch (error) {
      if (error.code === '23505') return res.status(400).json({ error: 'Group name already exists.' });
      res.status(500).json({ error: 'Database error' });
    } finally {
      await client.end();
    }
  },

  deleteGroup: async (req, res) => {
    const { groupId } = req.params;
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    try {
      await client.connect();
      const result = await client.query('DELETE FROM groups WHERE id = $1 RETURNING *', [groupId]);
      if (result.rowCount === 0) return res.status(404).json({ error: 'Group not found.' });
      res.json({ message: 'Group deleted successfully.' });
    } catch (error) {
      res.status(500).json({ error: 'Database error' });
    } finally {
      await client.end();
    }
  },

  getAllGroups: async (req, res) => {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    try {
      await client.connect();
      const result = await client.query('SELECT * FROM groups ORDER BY created_at DESC');
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: 'Database error' });
    } finally {
      await client.end();
    }
  },

  getGroupMembers: async (req, res) => {
    const { groupId } = req.params;
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    try {
      await client.connect();
      const result = await client.query(
        `SELECT u.id, u.email, u.name, gm.role, gm.joined_at 
         FROM group_members gm 
         JOIN users u ON gm.user_id = u.id 
         WHERE gm.group_id = $1`,
        [groupId]
      );
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: 'Database error' });
    } finally {
      await client.end();
    }
  },

  addMember: async (req, res) => {
    const { groupId, userId, role } = req.body;
    if (!groupId || !userId) return res.status(400).json({ error: 'Missing groupId or userId.' });
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    try {
      await client.connect();
      await client.query(
        'INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
        [groupId, userId, role || 'MEMBER']
      );
      res.json({ message: 'Member added.' });
    } catch (error) {
      res.status(500).json({ error: 'Database error' });
    } finally {
      await client.end();
    }
  },

  removeMember: async (req, res) => {
    const { groupId, userId } = req.body;
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    try {
      await client.connect();
      await client.query('DELETE FROM group_members WHERE group_id = $1 AND user_id = $2', [groupId, userId]);
      res.json({ message: 'Member removed.' });
    } catch (error) {
      res.status(500).json({ error: 'Database error' });
    } finally {
      await client.end();
    }
  },

  promoteMember: async (req, res) => {
    const { groupId, userId, role } = req.body;
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    try {
      await client.connect();
      await client.query(
        "UPDATE group_members SET role = $1 WHERE group_id = $2 AND user_id = $3",
        [role || 'ADMIN', groupId, userId]
      );
      res.json({ message: `Member updated to ${role || 'ADMIN'}.` });
    } catch (error) {
      res.status(500).json({ error: 'Database error' });
    } finally {
      await client.end();
    }
  },

  sendMessage: async (req, res) => {
    const { userId, phoneNumber, message } = req.body;
    if (!phoneNumber || !message) return res.status(400).json({ error: 'Missing phoneNumber or message.' });
    
    try {
      const result = await whatsappService.sendMessage(phoneNumber, message);
      const success = !!result.id;
      
      await whatsappService.logMessage({
        userId: userId || null,
        phoneNumber,
        message,
        status: success ? 'SUCCESS' : 'FAILED',
        errorMessage: success ? null : 'Failed to get message ID'
      });

      res.json({ message: 'Process complete.', success, result });
    } catch (error) {
      console.error('Error sending custom message:', error.message);
      
      await whatsappService.logMessage({
        userId: userId || null,
        phoneNumber,
        message,
        status: 'FAILED',
        errorMessage: error.message
      });

      res.status(500).json({ error: error.message || 'Failed to send message.' });
    }
  },

  getMessageHistory: async (req, res) => {
    const { userId } = req.params;
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    try {
      await client.connect();
      const result = await client.query(
        'SELECT * FROM message_history WHERE user_id = $1 ORDER BY sent_at DESC',
        [userId]
      );
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: 'Database error' });
    } finally {
      await client.end();
    }
  },

  getMyGroups: async (req, res) => {
    const userId = req.user.id;
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    try {
      await client.connect();
      const result = await client.query(
        `SELECT g.*, gm.role as my_role, gm.joined_at 
         FROM group_members gm 
         JOIN groups g ON gm.group_id = g.id 
         WHERE gm.user_id = $1`,
        [userId]
      );
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: 'Database error' });
    } finally {
      await client.end();
    }
  },

  getMyMessageHistory: async (req, res) => {
    const userId = req.user.id;
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    try {
      await client.connect();
      const result = await client.query(
        'SELECT * FROM message_history WHERE user_id = $1 ORDER BY sent_at DESC',
        [userId]
      );
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: 'Database error' });
    } finally {
      await client.end();
    }
  }
};

module.exports = groupController;
