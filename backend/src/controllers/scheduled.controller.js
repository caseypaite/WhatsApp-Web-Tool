const db = require('../config/db');
const { normalizePhoneNumber } = require('../utils/validators');

class ScheduledController {
  async getAll(req, res) {
    try {
      const result = await db.query('SELECT * FROM scheduled_messages ORDER BY scheduled_for ASC');
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async create(req, res) {
    const { targets, message, media_url, media_type, scheduled_for } = req.body;
    if (!targets || !message || !scheduled_for) {
      return res.status(400).json({ error: 'Targets, message and scheduled_for are required' });
    }

    try {
      // Normalize individual targets
      const normalizedTargets = targets.map(target => {
        if (target.type === 'individual') {
          return { ...target, id: normalizePhoneNumber(target.id) };
        }
        return target;
      });

      const result = await db.query(
        'INSERT INTO scheduled_messages (targets, message, media_url, media_type, scheduled_for) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [JSON.stringify(normalizedTargets), message, media_url || null, media_type || null, scheduled_for]
      );
      res.status(201).json(result.rows[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async cancel(req, res) {
    const { id } = req.params;
    try {
      const result = await db.query(
        "UPDATE scheduled_messages SET status = 'CANCELLED' WHERE id = $1 AND status = 'PENDING' RETURNING *",
        [id]
      );
      if (result.rows.length === 0) return res.status(404).json({ error: 'Pending message not found' });
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
      const phone = whatsappService.me?.wid?.user;
      if (!phone) return res.status(400).json({ error: 'Could not determine admin identity' });

      const isValid = await otpService.verifyOtp(phone, otp);
      if (!isValid) return res.status(400).json({ error: 'Invalid or expired OTP' });

      await db.query('DELETE FROM scheduled_messages WHERE id = $1', [id]);
      res.json({ success: true, message: 'Scheduled message deleted' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new ScheduledController();
