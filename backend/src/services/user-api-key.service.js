const crypto = require('crypto');
const db = require('../config/db');

class UserApiKeyService {
  normalizeRecord(record) {
    return {
      id: Number(record.id),
      user_id: Number(record.user_id),
      name: record.name,
      api_key: record.api_key,
      is_active: record.is_active !== false,
      created_at: record.created_at,
      updated_at: record.updated_at
    };
  }

  generateApiKey() {
    if (typeof crypto.randomUUID === 'function') {
      return `umapi_${crypto.randomUUID()}`;
    }
    return `umapi_${crypto.randomBytes(24).toString('hex')}`;
  }

  async assertNameAvailable(userId, name, excludeId = null) {
    const params = [userId, name.trim().toLowerCase()];
    let query = `
      SELECT id
      FROM user_messaging_api_keys
      WHERE user_id = $1
        AND LOWER(name) = $2
    `;

    if (excludeId) {
      params.push(excludeId);
      query += ' AND id <> $3';
    }

    const result = await db.query(query, params);
    if (result.rows.length > 0) {
      const conflict = new Error('Application name already exists.');
      conflict.code = '23505';
      throw conflict;
    }
  }

  async listByUser(userId) {
    const result = await db.query(
      `SELECT id, user_id, name, api_key, is_active, created_at, updated_at
       FROM user_messaging_api_keys
       WHERE user_id = $1
       ORDER BY created_at DESC, id DESC`,
      [userId]
    );
    return result.rows.map((row) => this.normalizeRecord(row));
  }

  async create(userId, name) {
    await this.assertNameAvailable(userId, name);

    const apiKey = this.generateApiKey();
    const result = await db.query(
      `INSERT INTO user_messaging_api_keys (user_id, name, api_key)
       VALUES ($1, $2, $3)
       RETURNING id, user_id, name, api_key, is_active, created_at, updated_at`,
      [userId, name.trim(), apiKey]
    );
    return this.normalizeRecord(result.rows[0]);
  }

  async update(userId, id, { name, isActive }) {
    await this.assertNameAvailable(userId, name, id);

    const result = await db.query(
      `UPDATE user_messaging_api_keys
       SET name = $1,
           is_active = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 AND user_id = $4
       RETURNING id, user_id, name, api_key, is_active, created_at, updated_at`,
      [name.trim(), isActive, id, userId]
    );

    return result.rows[0] ? this.normalizeRecord(result.rows[0]) : null;
  }

  async rotate(userId, id) {
    const apiKey = this.generateApiKey();
    const result = await db.query(
      `UPDATE user_messaging_api_keys
       SET api_key = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND user_id = $3
       RETURNING id, user_id, name, api_key, is_active, created_at, updated_at`,
      [apiKey, id, userId]
    );

    return result.rows[0] ? this.normalizeRecord(result.rows[0]) : null;
  }

  async delete(userId, id) {
    const result = await db.query(
      `DELETE FROM user_messaging_api_keys
       WHERE id = $1 AND user_id = $2
       RETURNING id, user_id, name, api_key, is_active, created_at, updated_at`,
      [id, userId]
    );

    return result.rows[0] ? this.normalizeRecord(result.rows[0]) : null;
  }

  async findByApiKey(apiKey) {
    const result = await db.query(
      `SELECT k.id,
              k.user_id,
              k.name,
              k.api_key,
              k.is_active,
              k.created_at,
              k.updated_at,
              u.email,
              u.status
       FROM user_messaging_api_keys k
       JOIN users u ON u.id = k.user_id
       WHERE k.api_key = $1
         AND k.is_active = true
       LIMIT 1`,
      [apiKey]
    );

    const record = result.rows[0];
    if (!record || record.status !== 'ACTIVE') {
      return null;
    }

    return {
      ...this.normalizeRecord(record),
      email: record.email
    };
  }
}

module.exports = new UserApiKeyService();
