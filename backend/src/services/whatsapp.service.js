const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const settingsService = require('./settings.service');
const { Client: PgClient } = require('pg');
const fs = require('fs');
const path = require('path');

class WhatsappService {
  constructor() {
    this.client = null;
    this.qrCode = null;
    this.status = 'DISCONNECTED';
    this.isReady = false;
    this.me = null;
  }

  getBrowserPath() {
    const paths = [
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium'
    ];
    for (const p of paths) {
      if (fs.existsSync(p)) return p;
    }
    return null;
  }

  async initialize() {
    if (this.client) {
      try { await this.client.destroy(); } catch (e) {}
    }

    console.log('[WHATSAPP] Initializing client...');
    const executablePath = this.getBrowserPath();
    console.log('[WHATSAPP] Using browser:', executablePath || 'Default (Puppeteer bundled)');

    // Globally unique session ID based on current directory hash or fixed string
    const clientId = 'appstack-wa-session-' + Buffer.from(__dirname).toString('hex').slice(0, 8);

    this.client = new Client({
      authStrategy: new LocalAuth({
        clientId: clientId,
        dataPath: './.wwebjs_auth'
      }),
      puppeteer: {
        executablePath: executablePath,
        headless: true,
        args: [
          '--no-sandbox', 
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
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
      this.me = this.client.info;
      console.log('[WHATSAPP] Client is ready! Connected as:', this.me.pushname, '(', this.me.wid._serialized, ')');
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
      this.me = null;
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
      qr: this.qrCode,
      me: this.me
    };
  }

  async getChats() {
    if (!this.isReady) return [];
    return await this.client.getChats();
  }

  async getContacts() {
    if (!this.isReady) return [];
    return await this.client.getContacts();
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
    const cleanNumber = number.toString().replace(/\D/g, '');
    const jid = this.formatJid(cleanNumber);
    
    console.log(`[WHATSAPP] Attempting to send message to: ${cleanNumber}`);
    
    try {
      // Try to get the registered WhatsApp ID
      const numberId = await this.client.getNumberId(cleanNumber);
      const finalJid = numberId ? numberId._serialized : jid;
      
      console.log(`[WHATSAPP] Sending to JID: ${finalJid}`);
      const result = await this.client.sendMessage(finalJid, message);
      
      // Log success to DB
      await this.logMessage({
        phoneNumber: cleanNumber,
        message: message,
        status: 'SUCCESS'
      });
      
      return result;
    } catch (err) {
      console.error(`[WHATSAPP] Send error to ${cleanNumber}:`, err.message);
      
      // Log failure to DB
      await this.logMessage({
        phoneNumber: cleanNumber,
        message: message,
        status: 'FAILED',
        errorMessage: err.message
      });
      
      throw err;
    }
  }

  async sendMedia(number, url, caption = '') {
    if (!this.isReady) throw new Error('WhatsApp client not ready');
    const media = await MessageMedia.fromUrl(url);
    const jid = this.formatJid(number);
    return await this.client.sendMessage(jid, media, { caption });
  }

  async logout() {
    if (this.client) {
      await this.client.logout();
      this.status = 'DISCONNECTED';
      this.isReady = false;
      this.me = null;
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
