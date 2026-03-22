const { Client } = require('pg');
const whatsappService = require('./whatsapp.service');

class SchedulerService {
  constructor() {
    this.interval = null;
    this.isProcessing = false;
  }

  start() {
    console.log('[SCHEDULER] Service started');
    // Check every minute
    this.interval = setInterval(() => this.processPendingMessages(), 60000);
  }

  async processPendingMessages() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    const client = new Client({ connectionString: process.env.DATABASE_URL });
    try {
      await client.connect();
      
      // Get pending messages whose scheduled_for is in the past
      const res = await client.query(
        "SELECT * FROM scheduled_messages WHERE status = 'PENDING' AND scheduled_for <= NOW() FOR UPDATE SKIP LOCKED"
      );

      for (const msg of res.rows) {
        console.log(`[SCHEDULER] Processing message ${msg.id}`);
        try {
          if (!whatsappService.isReady) {
            console.warn('[SCHEDULER] WhatsApp not ready, skipping message');
            continue;
          }

          const targets = JSON.parse(JSON.stringify(msg.targets));
          
          for (const target of targets) {
            await whatsappService.sendMessage(
              target.id, 
              msg.message, 
              msg.media_url ? { url: msg.media_url, type: msg.media_type } : null
            );
          }

          await client.query("UPDATE scheduled_messages SET status = 'SENT' WHERE id = $1", [msg.id]);
          console.log(`[SCHEDULER] Message ${msg.id} sent successfully`);
        } catch (err) {
          console.error(`[SCHEDULER] Error sending message ${msg.id}:`, err.message);
          await client.query("UPDATE scheduled_messages SET status = 'FAILED' WHERE id = $1", [msg.id]);
        }
      }
    } catch (err) {
      console.error('[SCHEDULER] Polling error:', err.message);
    } finally {
      this.isProcessing = false;
      await client.end();
    }
  }

  stop() {
    if (this.interval) clearInterval(this.interval);
    console.log('[SCHEDULER] Service stopped');
  }
}

module.exports = new SchedulerService();
