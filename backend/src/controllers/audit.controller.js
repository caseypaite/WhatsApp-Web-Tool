const db = require('../config/db');

class AuditController {
  async getMessageHistory(req, res) {
    let { userId, phoneNumber, status, limit, offset } = req.query;
    limit = limit ? parseInt(limit) : 50;
    offset = offset ? parseInt(offset) : 0;

    try {
      let query = 'SELECT m.*, u.name as user_name FROM message_history m LEFT JOIN users u ON m.user_id = u.id WHERE 1=1';
      const params = [];
      let paramIndex = 1;

      if (userId) {
        query += ` AND m.user_id = $${paramIndex++}`;
        params.push(userId);
      }
      if (phoneNumber) {
        query += ` AND m.phone_number LIKE $${paramIndex++}`;
        params.push(`%${phoneNumber}%`);
      }
      if (status) {
        query += ` AND m.status = $${paramIndex++}`;
        params.push(status);
      }

      query += ' ORDER BY m.sent_at DESC';
      
      query += ` LIMIT $${paramIndex++}`;
      params.push(limit);
      
      query += ` OFFSET $${paramIndex++}`;
      params.push(offset);

      const result = await db.query(query, params);
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async clearHistory(req, res) {
    const { otp } = req.body;
    if (!otp) return res.status(400).json({ error: 'OTP is required for this action' });

    try {
      const whatsappService = require('../services/whatsapp.service');
      const otpService = require('../services/otp.service');

      if (!whatsappService.me) return res.status(400).json({ error: 'WhatsApp account not connected' });
      const phone = whatsappService.me.wid.user;

      const isValid = await otpService.verifyOtp(phone, otp);
      if (!isValid) return res.status(400).json({ error: 'Invalid or expired OTP' });

      await db.query('DELETE FROM message_history');
      res.json({ success: true, message: 'Message history cleared' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new AuditController();
