const { Client } = require('pg');

/**
 * Controller for Landing Page CMS operations.
 */
class CmsController {
  /**
   * Fetches the landing page configuration.
   * Publicly accessible.
   */
  async getLandingPage(req, res) {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    try {
      await client.connect();
      const result = await client.query('SELECT hero_text, cta_text, image_url FROM landing_page_config ORDER BY updated_at DESC LIMIT 1');
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Landing page content not found.' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error fetching landing page:', error.message);
      res.status(500).json({ error: 'Internal Server Error' });
    } finally {
      await client.end();
    }
  }

  /**
   * Updates the landing page configuration.
   * Restricted to Admins.
   */
  async updateLandingPage(req, res) {
    const { hero_text, cta_text, image_url } = req.body;
    const client = new Client({ connectionString: process.env.DATABASE_URL });

    try {
      await client.connect();
      
      // Update existing or insert if empty (simplified for boilerplate)
      const result = await client.query(
        `UPDATE landing_page_config 
         SET hero_text = $1, cta_text = $2, image_url = $3, updated_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [hero_text, cta_text, image_url]
      );

      if (result.rowCount === 0) {
        // Fallback to insert if update failed (no rows exist yet)
        await client.query(
          'INSERT INTO landing_page_config (hero_text, cta_text, image_url) VALUES ($1, $2, $3)',
          [hero_text, cta_text, image_url]
        );
      }

      res.json({ message: 'Landing page updated successfully.' });
    } catch (error) {
      console.error('Error updating landing page:', error.message);
      res.status(500).json({ error: 'Internal Server Error' });
    } finally {
      await client.end();
    }
  }
}

module.exports = new CmsController();
