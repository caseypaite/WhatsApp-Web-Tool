const db = require('../config/db');
const whatsappService = require('./whatsapp.service');
const reportService = require('../utils/report.service');
const settingsService = require('./settings.service');

class SchedulerService {
  constructor() {
    this.interval = null;
    this.heartbeatInterval = null;
    this.isProcessing = false;
  }

  start() {
    console.log('[SCHEDULER] Service started');
    // Check every minute for scheduled messages
    this.interval = setInterval(() => this.processPendingMessages(), 60000);
    
    // Check every hour for heartbeat
    this.heartbeatInterval = setInterval(() => this.checkHeartbeat(), 3600000);

    // Run cleanup once a day at 3 AM
    this.cleanupInterval = setInterval(() => this.checkCleanup(), 3600000);
  }

  async checkCleanup() {
    const now = new Date();
    if (now.getHours() === 3) {
      console.log('[SCHEDULER] Running log cleanup protocol...');
      try {
        const historyRes = await db.query("DELETE FROM message_history WHERE sent_at < NOW() - INTERVAL '30 days'");
        const aiRes = await db.query("DELETE FROM ai_interaction_logs WHERE created_at < NOW() - INTERVAL '30 days'");
        console.log(`[SCHEDULER] Cleanup finished. History purged: ${historyRes.rowCount}, AI Logs purged: ${aiRes.rowCount}`);
      } catch (err) {
        console.error('[SCHEDULER] Cleanup error:', err.message);
      }
    }
  }

  async processPendingMessages() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      // 1. Process Scheduled Messages
      const msgRes = await db.query(
        "SELECT * FROM scheduled_messages WHERE status = 'PENDING' AND scheduled_for <= NOW() FOR UPDATE SKIP LOCKED"
      );

      for (const msg of msgRes.rows) {
        console.log(`[SCHEDULER] Processing message ${msg.id}`);
        try {
          if (!whatsappService.isReady) {
            console.warn('[SCHEDULER] WhatsApp not ready, skipping message');
            continue;
          }

          const targets = typeof msg.targets === 'string' ? JSON.parse(msg.targets) : msg.targets;
          
          for (const target of targets) {
            await whatsappService.sendMessage(
              target.id, 
              msg.message, 
              msg.media_url ? { url: msg.media_url, type: msg.media_type } : null,
              { type: target.type }
            );
          }

          await db.query("UPDATE scheduled_messages SET status = 'SENT' WHERE id = $1", [msg.id]);
          console.log(`[SCHEDULER] Message ${msg.id} sent successfully`);
        } catch (err) {
          console.error(`[SCHEDULER] Error sending message ${msg.id}:`, err.message);
          await db.query("UPDATE scheduled_messages SET status = 'FAILED' WHERE id = $1", [msg.id]);
        }
      }

      // 2. Process Poll Transitions
      // Open PENDING polls that should start now
      await db.query(
        "UPDATE polls SET status = 'OPEN' WHERE status = 'PENDING' AND starts_at <= NOW()"
      );

      // Close OPEN polls that should end now
      await db.query(
        "UPDATE polls SET status = 'CLOSED' WHERE status = 'OPEN' AND ends_at <= NOW()"
      );

    } catch (err) {
      console.error('[SCHEDULER] Polling error:', err.message);
    } finally {
      this.isProcessing = false;
    }
  }

  async checkHeartbeat() {
    const now = new Date();
    // Only send at 9:00 AM hour
    if (now.getHours() === 9) {
      try {
        const todayStr = now.toISOString().split('T')[0];
        const lastSent = await settingsService.get('last_heartbeat_sent');
        
        if (lastSent === todayStr) return; // Already transmitted today

        console.log('[SCHEDULER] Generating daily heartbeat...');
        const stats = await reportService.getSystemHeartbeat();
        if (!stats) return;

        // Log to DB
        await db.query(
          'INSERT INTO system_heartbeat_logs (cpu_usage, memory_usage, messages_sent_24h, pending_approvals) VALUES ($1, $2, $3, $4)',
          [stats.cpu_usage, stats.memory_usage, stats.messages_sent_24h, stats.pending_approvals]
        );

        // Notify Admin if configured
        const adminEmail = process.env.INITIAL_ADMIN_EMAIL;
        const adminRes = await db.query('SELECT phone_number FROM users WHERE email = $1', [adminEmail]);
        const adminPhone = adminRes.rows[0]?.phone_number;

        if (adminPhone && whatsappService.isReady) {
          const message = `📊 *Daily System Heartbeat*\n\n` +
                          `🖥️ CPU: ${stats.cpu_usage}%\n` +
                          `🧠 MEM: ${stats.memory_usage}%\n` +
                          `📨 Messages (24h): ${stats.messages_sent_24h}\n` +
                          `⏳ Pending Approvals: ${stats.pending_approvals}\n\n` +
                          `Status: OPERATIONAL`;
          
          await whatsappService.sendMessage(adminPhone, message);
          await settingsService.set('last_heartbeat_sent', todayStr);
        }
      } catch (err) {
        console.error('[SCHEDULER] Heartbeat error:', err.message);
      }
    }
  }

  stop() {
    if (this.interval) clearInterval(this.interval);
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    console.log('[SCHEDULER] Service stopped');
  }
}

module.exports = new SchedulerService();
