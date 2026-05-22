const db = require('../config/db');

class WhatsappSessionLogService {
  async log({ sessionScope, userId = null, eventType, status, details = null }) {
    try {
      await db.query(
        `INSERT INTO whatsapp_session_logs (session_scope, user_id, event_type, status, details)
         VALUES ($1, $2, $3, $4, $5)`,
        [sessionScope, userId, eventType, status, details]
      );
    } catch (error) {
      console.warn('[WA-SESSION-LOG] Failed to persist session log:', error.message);
    }
  }

  async logRoot(eventType, status, details = null) {
    return this.log({
      sessionScope: 'ROOT',
      eventType,
      status,
      details
    });
  }

  async logUser(userId, eventType, status, details = null) {
    return this.log({
      sessionScope: 'USER',
      userId,
      eventType,
      status,
      details
    });
  }

  async listRoot(limit = 50) {
    const result = await db.query(
      `SELECT id, session_scope, user_id, event_type, status, details, created_at
       FROM whatsapp_session_logs
       WHERE session_scope = 'ROOT'
       ORDER BY created_at DESC, id DESC
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  async listUser(userId, limit = 50) {
    const result = await db.query(
      `SELECT id, session_scope, user_id, event_type, status, details, created_at
       FROM whatsapp_session_logs
       WHERE session_scope = 'USER' AND user_id = $1
       ORDER BY created_at DESC, id DESC
       LIMIT $2`,
      [userId, limit]
    );
    return result.rows;
  }
}

module.exports = new WhatsappSessionLogService();
