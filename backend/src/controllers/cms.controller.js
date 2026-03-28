const db = require('../config/db');
const sanitizeHtml = require('sanitize-html');

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
      const result = await db.query('SELECT hero_text, cta_text, image_url, html_content FROM landing_page_config ORDER BY updated_at DESC LIMIT 1');
      
      if (result.rows.length === 0) {
        // Return default content if DB is empty to prevent blank page
        return res.json({
          hero_text: 'Building the Future of Identity',
          cta_text: 'Get Started',
          image_url: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&q=80&w=2832',
          html_content: ''
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
    const { hero_text, cta_text, image_url, html_content } = req.body;
    
    // Sanitize HTML Content
    const sanitizedHtml = html_content ? sanitizeHtml(html_content, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat([ 'img', 'section', 'div', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6' ]),
      allowedAttributes: {
        '*': ['class', 'style', 'id'],
        'a': ['href', 'name', 'target'],
        'img': ['src', 'alt', 'width', 'height', 'loading']
      },
      allowedStyles: {
        '*': {
          'color': [/^#(0x)?[0-9a-f]+$/i, /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/],
          'text-align': [/^left$/, /^right$/, /^center$/],
          'font-size': [/^\d+(?:px|em|rem)$/]
        }
      }
    }) : '';

    console.log('[CMS] Updating landing page with sanitized content');

    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      
      // Update existing or insert if empty
      const result = await client.query(
        `UPDATE landing_page_config 
         SET hero_text = $1, cta_text = $2, image_url = $3, html_content = $4, updated_at = CURRENT_TIMESTAMP
         WHERE id = 1
         RETURNING *`,
        [hero_text, cta_text, image_url, sanitizedHtml]
      );

      if (result.rowCount === 0) {
        await client.query(
          'INSERT INTO landing_page_config (id, hero_text, cta_text, image_url, html_content) VALUES (1, $1, $2, $3, $4)',
          [hero_text, cta_text, image_url, sanitizedHtml]
        );
      }

      await client.query('COMMIT');
      console.log('[CMS] Landing page updated successfully.');
      res.json({ message: 'Landing page updated successfully.' });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('[CMS] Error updating landing page:', error.message);
      res.status(500).json({ error: 'Internal Server Error', details: error.message });
    } finally {
      client.release();
    }
  }
}

module.exports = new CmsController();
