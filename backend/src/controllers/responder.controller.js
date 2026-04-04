const db = require('../config/db');
const { normalizePhoneNumber } = require('../utils/validators');

class ResponderController {
  async getAll(req, res) {
    try {
      const result = await db.query('SELECT * FROM auto_responders ORDER BY created_at DESC');
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async create(req, res) {
    const { keyword, response, match_type, is_active } = req.body;
    if (!keyword || !response) return res.status(400).json({ error: 'Keyword and response are required' });

    try {
      const result = await db.query(
        'INSERT INTO auto_responders (keyword, response, match_type, is_active) VALUES ($1, $2, $3, $4) RETURNING *',
        [keyword, response, match_type || 'EXACT', is_active !== false]
      );
      res.status(201).json(result.rows[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async update(req, res) {
    const { id } = req.params;
    const { keyword, response, match_type, is_active } = req.body;
    
    try {
      const result = await db.query(
        'UPDATE auto_responders SET keyword = $1, response = $2, match_type = $3, is_active = $4 WHERE id = $5 RETURNING *',
        [keyword, response, match_type, is_active, id]
      );
      if (result.rows.length === 0) return res.status(404).json({ error: 'Responder not found' });
      res.json(result.rows[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async delete(req, res) {
    const { id } = req.params;
    const { otp } = req.body;
    if (!otp) return res.status(400).json({ error: 'OTP is required for this action' });

    try {
      const whatsappService = require('../services/whatsapp.service');
      const otpService = require('../services/otp.service');

      if (!whatsappService.me) return res.status(400).json({ error: 'WhatsApp account not connected' });
      const phone = whatsappService.me.wid.user;

      const isValid = await otpService.verifyOtp(phone, otp);
      if (!isValid) return res.status(400).json({ error: 'Invalid or expired OTP' });

      await db.query('DELETE FROM auto_responders WHERE id = $1', [id]);
      res.json({ success: true, message: 'Responder deleted' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async toggleActive(req, res) {
    const { id } = req.params;
    try {
      const result = await db.query(
        'UPDATE auto_responders SET is_active = NOT is_active WHERE id = $1 RETURNING is_active',
        [id]
      );
      if (result.rows.length === 0) return res.status(404).json({ error: 'Responder not found' });
      res.json({ success: true, is_active: result.rows[0].is_active });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Blacklist Management
  async getBlacklist(req, res) {
    try {
      const result = await db.query('SELECT * FROM chat_blacklist ORDER BY created_at DESC');
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async addToBlacklist(req, res) {
    const { phone_number, reason } = req.body;
    if (!phone_number) return res.status(400).json({ error: 'Phone number is required' });
    try {
      const normalizedPhone = normalizePhoneNumber(phone_number);
      const result = await db.query(
        'INSERT INTO chat_blacklist (phone_number, reason) VALUES ($1, $2) ON CONFLICT (phone_number) DO UPDATE SET reason = EXCLUDED.reason RETURNING *',
        [normalizedPhone, reason]
      );
      res.status(201).json(result.rows[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async removeFromBlacklist(req, res) {
    const { phone_number } = req.params;
    try {
      await db.query('DELETE FROM chat_blacklist WHERE phone_number = $1', [phone_number]);
      res.json({ success: true, message: 'Number removed from blacklist' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getInteractions(req, res) {
    try {
      const result = await db.query(`
        SELECT phone_number, COUNT(*) as interaction_count, MAX(created_at) as last_interaction 
        FROM ai_interaction_logs 
        GROUP BY phone_number 
        ORDER BY last_interaction DESC
      `);
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new ResponderController();
