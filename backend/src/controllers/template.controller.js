const db = require('../config/db');

class TemplateController {
  async getAll(req, res) {
    try {
      const result = await db.query('SELECT * FROM message_templates ORDER BY created_at DESC');
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async create(req, res) {
    const { name, content, media_url, media_type } = req.body;
    if (!name || !content) return res.status(400).json({ error: 'Name and content are required' });

    try {
      const result = await db.query(
        'INSERT INTO message_templates (name, content, media_url, media_type) VALUES ($1, $2, $3, $4) RETURNING *',
        [name, content, media_url || null, media_type || 'image']
      );
      res.status(201).json(result.rows[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async update(req, res) {
    const { id } = req.params;
    const { name, content, media_url, media_type } = req.body;
    try {
      const result = await db.query(
        'UPDATE message_templates SET name = $1, content = $2, media_url = $3, media_type = $4 WHERE id = $5 RETURNING *',
        [name, content, media_url, media_type, id]
      );
      if (result.rows.length === 0) return res.status(404).json({ error: 'Template not found' });
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

      await db.query('DELETE FROM message_templates WHERE id = $1', [id]);
      res.json({ success: true, message: 'Template deleted' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new TemplateController();

