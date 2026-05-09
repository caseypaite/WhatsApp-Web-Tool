const crypto = require('crypto');
const db = require('../config/db');

class SettingsService {
  constructor() {
    this.cache = {};
    this.messagingApiKeysCache = null;
  }

  normalizeMessagingApiKeyRecord(record) {
    return {
      id: Number(record.id),
      name: record.name,
      api_key: record.api_key,
      is_active: record.is_active !== false,
      created_at: record.created_at || new Date().toISOString(),
      updated_at: record.updated_at || record.created_at || new Date().toISOString()
    };
  }

  async getMessagingApiKeysFromSetting() {
    const raw = await this.get('messaging_api_keys', true);
    if (!raw) return [];

    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter(item => item && item.name && item.api_key)
        .map(item => this.normalizeMessagingApiKeyRecord(item));
    } catch (err) {
      console.error('Error parsing messaging_api_keys setting:', err.message);
      return [];
    }
  }

  async saveMessagingApiKeysToSetting(keys) {
    const normalized = keys.map(key => this.normalizeMessagingApiKeyRecord(key));
    await this.set('messaging_api_keys', JSON.stringify(normalized));
    this.clearMessagingApiKeysCache();
    return normalized;
  }

  /**
   * Retrieves a setting value. Priority: Database > Process Env.
   */
  async get(key, bypassCache = false) {
    if (!bypassCache && this.cache[key]) return this.cache[key];
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
      'messaging_api_key',
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

  async getMessagingApiKeys(bypassCache = false) {
    if (!bypassCache && this.messagingApiKeysCache) return this.messagingApiKeysCache;

    const settingKeys = await this.getMessagingApiKeysFromSetting();

    try {
      const res = await db.query(
        `SELECT id, name, api_key, is_active, created_at, updated_at
         FROM messaging_api_keys
         ORDER BY created_at DESC, id DESC`
      );
      const merged = [...res.rows.map(row => this.normalizeMessagingApiKeyRecord(row))];
      for (const settingKey of settingKeys) {
        if (!merged.find(row => row.api_key === settingKey.api_key)) {
          merged.push(settingKey);
        }
      }
      merged.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      this.messagingApiKeysCache = merged;
      return merged;
    } catch (err) {
      if (err.code === '42P01') {
        this.messagingApiKeysCache = settingKeys;
        return settingKeys;
      }
      console.error('Error fetching messaging API keys:', err.message);
      throw err;
    }
  }

  async findMessagingApiKey(apiKey) {
    try {
      const res = await db.query(
        `SELECT id, name, api_key, is_active
         FROM messaging_api_keys
         WHERE api_key = $1 AND is_active = true
         LIMIT 1`,
        [apiKey]
      );
      if (res.rows[0]) return this.normalizeMessagingApiKeyRecord(res.rows[0]);
      const settingKeys = await this.getMessagingApiKeysFromSetting();
      return settingKeys.find(key => key.api_key === apiKey && key.is_active) || null;
    } catch (err) {
      if (err.code === '42P01') {
        const settingKeys = await this.getMessagingApiKeysFromSetting();
        return settingKeys.find(key => key.api_key === apiKey && key.is_active) || null;
      }
      console.error('Error looking up messaging API key:', err.message);
      throw err;
    }
  }

  generateMessagingApiKey() {
    if (typeof crypto.randomUUID === 'function') {
      return `mapi_${crypto.randomUUID()}`;
    }
    return `mapi_${crypto.randomBytes(24).toString('hex')}`;
  }

  clearMessagingApiKeysCache() {
    this.messagingApiKeysCache = null;
  }

  async createMessagingApiKey(name) {
    const apiKey = this.generateMessagingApiKey();
    try {
      const res = await db.query(
        `INSERT INTO messaging_api_keys (name, api_key)
         VALUES ($1, $2)
         RETURNING id, name, api_key, is_active, created_at, updated_at`,
        [name, apiKey]
      );
      this.clearMessagingApiKeysCache();
      return this.normalizeMessagingApiKeyRecord(res.rows[0]);
    } catch (err) {
      if (err.code !== '42P01') throw err;

      const keys = await this.getMessagingApiKeysFromSetting();
      if (keys.some(key => key.name.toLowerCase() === name.toLowerCase())) {
        const conflict = new Error('Application name already exists.');
        conflict.code = '23505';
        throw conflict;
      }

      const nextId = keys.reduce((max, key) => Math.max(max, Number(key.id) || 0), 0) + 1;
      const newKey = this.normalizeMessagingApiKeyRecord({
        id: nextId,
        name,
        api_key: apiKey,
        is_active: true
      });
      await this.saveMessagingApiKeysToSetting([newKey, ...keys]);
      return newKey;
    }
  }

  async updateMessagingApiKey(id, { name, isActive }) {
    try {
      const res = await db.query(
        `UPDATE messaging_api_keys
         SET name = $1, is_active = $2, updated_at = CURRENT_TIMESTAMP
         WHERE id = $3
         RETURNING id, name, api_key, is_active, created_at, updated_at`,
        [name, isActive, id]
      );
      if (res.rows[0]) {
        this.clearMessagingApiKeysCache();
        return this.normalizeMessagingApiKeyRecord(res.rows[0]);
      }
    } catch (err) {
      if (err.code !== '42P01') throw err;
    }

    const keys = await this.getMessagingApiKeysFromSetting();
    if (keys.some(key => key.id !== Number(id) && key.name.toLowerCase() === name.toLowerCase())) {
      const conflict = new Error('Application name already exists.');
      conflict.code = '23505';
      throw conflict;
    }
    const nextKeys = keys.map(key => key.id === Number(id)
      ? this.normalizeMessagingApiKeyRecord({ ...key, name, is_active: isActive, updated_at: new Date().toISOString() })
      : key
    );
    const updatedKey = nextKeys.find(key => key.id === Number(id)) || null;
    if (!updatedKey) return null;
    await this.saveMessagingApiKeysToSetting(nextKeys);
    return updatedKey;
  }

  async rotateMessagingApiKey(id) {
    const apiKey = this.generateMessagingApiKey();
    try {
      const res = await db.query(
        `UPDATE messaging_api_keys
         SET api_key = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING id, name, api_key, is_active, created_at, updated_at`,
        [apiKey, id]
      );
      if (res.rows[0]) {
        this.clearMessagingApiKeysCache();
        return this.normalizeMessagingApiKeyRecord(res.rows[0]);
      }
    } catch (err) {
      if (err.code !== '42P01') throw err;
    }

    const keys = await this.getMessagingApiKeysFromSetting();
    const nextKeys = keys.map(key => key.id === Number(id)
      ? this.normalizeMessagingApiKeyRecord({ ...key, api_key: apiKey, updated_at: new Date().toISOString() })
      : key
    );
    const updatedKey = nextKeys.find(key => key.id === Number(id)) || null;
    if (!updatedKey) return null;
    await this.saveMessagingApiKeysToSetting(nextKeys);
    return updatedKey;
  }

  async deleteMessagingApiKey(id) {
    try {
      const res = await db.query(
        'DELETE FROM messaging_api_keys WHERE id = $1 RETURNING id, name',
        [id]
      );
      if (res.rows[0]) {
        this.clearMessagingApiKeysCache();
        return res.rows[0] || null;
      }
    } catch (err) {
      if (err.code !== '42P01') throw err;
    }

    const keys = await this.getMessagingApiKeysFromSetting();
    const removedKey = keys.find(key => key.id === Number(id)) || null;
    if (!removedKey) return null;
    await this.saveMessagingApiKeysToSetting(keys.filter(key => key.id !== Number(id)));
    return removedKey;
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
      if (key === 'messaging_api_keys') {
        this.clearMessagingApiKeysCache();
      }
    } catch (err) {
      console.error(`Error setting ${key}:`, err.message);
      throw err;
    }
  }
}

module.exports = new SettingsService();
