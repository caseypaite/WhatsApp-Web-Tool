const db = require('../config/db');

/**
 * Controller for Landing Page CMS operations.
 */
class CmsController {
  /**
   * Fetches the landing page configuration.
   * Publicly accessible.
   */
  async getLandingPage(req, res) {
    try {
      const result = await db.query('SELECT hero_text, cta_text, image_url FROM landing_page_config ORDER BY updated_at DESC LIMIT 1');
      
      if (result.rows.length === 0) {
        // Return default content if DB is empty to prevent blank page
        return res.json({
          hero_text: 'Building the Future of Identity',
          cta_text: 'Get Started',
          image_url: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&q=80&w=2832'
        });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error fetching landing page:', error.message);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  /**
   * Updates the landing page configuration.
   * Restricted to Admins.
   */
  async updateLandingPage(req, res) {
    const { hero_text, cta_text, image_url } = req.body;
    console.log('[CMS] Updating landing page with:', { hero_text, cta_text, image_url });

    try {
      // Update existing or insert if empty
      // We target id=1 to maintain a single record
      const result = await db.query(
        `UPDATE landing_page_config 
         SET hero_text = $1, cta_text = $2, image_url = $3, updated_at = CURRENT_TIMESTAMP
         WHERE id = 1
         RETURNING *`,
        [hero_text, cta_text, image_url]
      );

      if (result.rowCount === 0) {
        console.log('[CMS] No row with id=1, performing INSERT');
        await db.query(
          'INSERT INTO landing_page_config (id, hero_text, cta_text, image_url) VALUES (1, $1, $2, $3)',
          [hero_text, cta_text, image_url]
        );
      }

      console.log('[CMS] Landing page updated successfully.');
      res.json({ message: 'Landing page updated successfully.' });
    } catch (error) {
      console.error('[CMS] Error updating landing page:', error.message);
      res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
  }
}

module.exports = new CmsController();
