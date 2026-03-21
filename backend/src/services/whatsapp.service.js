const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const settingsService = require('./settings.service');
const { Client: PgClient } = require('pg');

class WhatsappService {
  constructor() {
    this.client = null;
    this.qrCode = null;
    this.status = 'DISCONNECTED';
    this.isReady = false;
  }

  async initialize() {
    console.log('[WHATSAPP] Initializing client...');
    
    this.client = new Client({
      authStrategy: new LocalAuth({
        dataPath: './.wwebjs_auth'
      }),
      puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      }
    });

    this.client.on('qr', async (qr) => {
      this.qrCode = qr;
      this.status = 'DISCONNECTED';
      this.isReady = false;
      console.log('[WHATSAPP] QR RECEIVED');
      qrcode.generate(qr, { small: true });
      await settingsService.set('whatsapp_qr', qr);
      await settingsService.set('whatsapp_status', 'DISCONNECTED');
    });

    this.client.on('ready', async () => {
      this.qrCode = null;
      this.status = 'CONNECTED';
      this.isReady = true;
      console.log('[WHATSAPP] Client is ready!');
      await settingsService.set('whatsapp_status', 'CONNECTED');
      await settingsService.set('whatsapp_qr', '');
    });

    this.client.on('authenticated', () => {
      console.log('[WHATSAPP] Authenticated');
    });

    this.client.on('auth_failure', async (msg) => {
      console.error('[WHATSAPP] Auth failure', msg);
      this.status = 'DISCONNECTED';
      await settingsService.set('whatsapp_status', 'DISCONNECTED');
    });

    this.client.on('disconnected', async (reason) => {
      console.log('[WHATSAPP] Disconnected', reason);
      this.status = 'DISCONNECTED';
      this.isReady = false;
      await settingsService.set('whatsapp_status', 'DISCONNECTED');
    });

    try {
      await this.client.initialize();
    } catch (err) {
      console.error('[WHATSAPP] Initialization error:', err.message);
    }
  }

  async getStatus() {
    return {
      status: this.status,
      ready: this.isReady,
      qr: this.qrCode
    };
  }

  formatJid(number) {
    if (!number) return number;
    const str = number.toString();
    if (str.includes('@')) return str;
    const cleaned = str.replace(/\D/g, '');
    return `${cleaned}@c.us`;
  }

  async sendMessage(number, message) {
    if (!this.isReady) throw new Error('WhatsApp client not ready');
    const jid = this.formatJid(number);
    return await this.client.sendMessage(jid, message);
  }

  async logout() {
    if (this.client) {
      await this.client.logout();
      this.status = 'DISCONNECTED';
      this.isReady = false;
      await settingsService.set('whatsapp_status', 'DISCONNECTED');
    }
  }

  // DB Logging helper
  async logMessage({ userId, phoneNumber, message, status, errorMessage }) {
    const pg = new PgClient({ connectionString: process.env.DATABASE_URL });
    try {
      await pg.connect();
      await pg.query(
        'INSERT INTO message_history (user_id, phone_number, message, status, error_message) VALUES ($1, $2, $3, $4, $5)',
        [userId || null, phoneNumber, message, status, errorMessage || null]
      );
    } catch (err) {
      console.error('[WHATSAPP] Log error:', err.message);
    } finally {
      await pg.end();
    }
  }
}

module.exports = new WhatsappService();
