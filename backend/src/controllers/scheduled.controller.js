const db = require('../config/db');

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
      const result = await db.query(
        'INSERT INTO scheduled_messages (targets, message, media_url, media_type, scheduled_for) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [JSON.stringify(targets), message, media_url || null, media_type || null, scheduled_for]
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
    try {
      await db.query('DELETE FROM scheduled_messages WHERE id = $1', [id]);
      res.json({ success: true, message: 'Scheduled message deleted' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new ScheduledController();
