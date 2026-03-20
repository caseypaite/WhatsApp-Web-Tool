const { Client } = require('pg');

class SettingsService {
  constructor() {
    this.cache = {};
  }

  /**
   * Retrieves a setting value. Priority: Database > Process Env.
   */
  async get(key) {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    try {
      await client.connect();
      const res = await client.query('SELECT value FROM system_settings WHERE key = $1', [key]);
      
      if (res.rows.length > 0) {
        return res.rows[0].value;
      }
      
      // Fallback to .env
      return process.env[key.toUpperCase()];
    } catch (err) {
      console.error(`Error fetching setting ${key}:`, err.message);
      return process.env[key.toUpperCase()];
    } finally {
      await client.end();
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
      'otp_gateway_url',
      'otp_api_key',
      'jwt_secret',
      'vite_api_base_url'
    ];

    const client = new Client({ connectionString: process.env.DATABASE_URL });
    try {
      await client.connect();
      const res = await client.query('SELECT key, value FROM system_settings');
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
    } finally {
      await client.end();
    }
  }

  /**
   * Updates or creates a setting in the database.
   */
  async set(key, value) {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    try {
      await client.connect();
      await client.query(
        'INSERT INTO system_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP',
        [key, value]
      );
    } catch (err) {
      console.error(`Error setting ${key}:`, err.message);
      throw err;
    } finally {
      await client.end();
    }
  }
}

module.exports = new SettingsService();
