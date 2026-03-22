const db = require('../config/db');

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
    try {
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
}

module.exports = new ResponderController();
