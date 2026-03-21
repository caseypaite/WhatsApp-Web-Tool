const { Client } = require('pg');

class TemplateController {
  async getAll(req, res) {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    try {
      await client.connect();
      const result = await client.query('SELECT * FROM message_templates ORDER BY created_at DESC');
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    } finally {
      await client.end();
    }
  }

  async create(req, res) {
    const { name, content, media_url, media_type } = req.body;
    if (!name || !content) return res.status(400).json({ error: 'Name and content are required' });

    const client = new Client({ connectionString: process.env.DATABASE_URL });
    try {
      await client.connect();
      const result = await client.query(
        'INSERT INTO message_templates (name, content, media_url, media_type) VALUES ($1, $2, $3, $4) RETURNING *',
        [name, content, media_url || null, media_type || null]
      );
      res.status(201).json(result.rows[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    } finally {
      await client.end();
    }
  }

  async delete(req, res) {
    const { id } = req.params;
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    try {
      await client.connect();
      await client.query('DELETE FROM message_templates WHERE id = $1', [id]);
      res.json({ success: true, message: 'Template deleted' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    } finally {
      await client.end();
    }
  }
}

module.exports = new TemplateController();
