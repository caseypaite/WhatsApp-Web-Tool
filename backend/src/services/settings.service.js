const db = require('../config/db');

class SettingsService {
  constructor() {
    this.cache = {};
  }

  /**
   * Retrieves a setting value. Priority: Database > Process Env.
   */
  async get(key) {
    if (this.cache[key]) return this.cache[key];
    try {
      const res = await db.query('SELECT value FROM system_settings WHERE key = $1', [key]);
      if (res.rows.length > 0 && res.rows[0].value) {
        this.cache[key] = res.rows[0].value;
        return res.rows[0].value;
      }
      
      // Critical Key Fallbacks
      if (key === 'jwt_secret') return process.env.JWT_SECRET;
      if (key === 'simple_auth_password') return process.env.SIMPLE_AUTH_PASSWORD;

      // Generic Fallback to process.env
      const val = process.env[key.toUpperCase()] || null;
      if (val) this.cache[key] = val;
      return val;
    } catch (err) {
      console.error(`Error fetching setting ${key}:`, err.message);
      if (key === 'jwt_secret') return process.env.JWT_SECRET;
      return process.env[key.toUpperCase()] || null;
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
      'api_key',
      'vite_api_base_url',
      'ai_enabled',
      'ai_provider',
      'gemini_api_key',
      'mistral_api_key',
      'ai_custom_prompt',
      'ai_model',
      'group_greeting_enabled'
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
      console.error('Error in SettingsService.getAll:', err.message);
      throw err;
    }
  }

  /**
   * Updates or inserts a system setting.
   */
  async set(key, value) {
    try {
      await db.query(
        'INSERT INTO system_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP',
        [key, value]
      );
      this.cache[key] = value;
    } catch (err) {
      console.error(`Error setting ${key}:`, err.message);
      throw err;
    }
  }
}

module.exports = new SettingsService();
