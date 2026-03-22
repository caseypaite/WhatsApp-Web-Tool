const db = require('../config/db');

class SettingsService {
  constructor() {
    this.cache = {};
  }

  /**
   * Retrieves a setting value. Priority: Database > Process Env.
   */
  async get(key) {
    try {
      const res = await db.query('SELECT value FROM system_settings WHERE key = $1', [key]);
      
      if (res.rows.length > 0) {
        return res.rows[0].value;
      }
      
      // Fallback to .env
      return process.env[key.toUpperCase()];
    } catch (err) {
      console.error(`Error fetching setting ${key}:`, err.message);
      return process.env[key.toUpperCase()];
    }
  }

  /**
   * Retrieves all relevant settings for management.
   */
  async getAll() {
    const relevantKeys = [
      'site_name',
      'website_domain',
      'otp_enabled',
      'otp_expiration_minutes',
      'otp_max_retries',
      'jwt_secret',
      'vite_api_base_url',
      'ai_enabled',
      'ai_provider',
      'gemini_api_key',
      'mistral_api_key',
      'ai_custom_prompt',
      'ai_model'
    ];

    try {
      const res = await db.query('SELECT key, value FROM system_settings');
      const dbSettings = {};
      res.rows.forEach(row => {
        dbSettings[row.key] = row.value;
      });

      return relevantKeys.map(key => ({
        key,
        value: dbSettings[key] !== undefined ? dbSettings[key] : (process.env[key.toUpperCase()] || ''),
        is_fallback: dbSettings[key] === undefined
      }));
    } catch (err) {
      console.error('Error fetching all settings:', err.message);
      throw err;
    }
  }

  /**
   * Updates or creates a setting in the database.
   */
  async set(key, value) {
    try {
      await db.query(
        'INSERT INTO system_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP',
        [key, value]
      );
    } catch (err) {
      console.error(`Error setting ${key}:`, err.message);
      throw err;
    }
  }
}

module.exports = new SettingsService();
