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

    this.client.on('authenticated', async () => {
      console.log('[WHATSAPP] Authenticated');
      this.status = 'AUTHENTICATED';
      await settingsService.set('whatsapp_status', 'AUTHENTICATED');
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
    
    // Fetch regular chats
    let chats = [];
    try {
      chats = await this.client.getChats();
    } catch (err) {
      console.error('[WHATSAPP] Error fetching chats:', err.message);
    }

    // Fetch channels/newsletters via internal store (more reliable for admin/creator roles)
    let channels = [];
    try {
      const internalChannels = await this.client.pupPage.evaluate(async () => {
        const coll = window.Store?.NewsletterMetadataCollection || window.Store?.WAWebNewsletterMetadataCollection;
        if (!coll) return [];
        return coll.getModelsArray().map(m => {
          const data = {};
          const source = m.attributes || m;
          for (const key in source) {
            if (typeof source[key] !== 'function' && typeof source[key] !== 'object') {
              data[key] = source[key];
            }
          }
          data.id = m.id?._serialized || m.id || source.id;
          data.name = m.name || m.newsletterName || source.name || source.newsletterName;
          data.isCreator = m.isCreator === true || source.isCreator === true;
          data.viewerRole = m.viewerRole || source.viewerRole;
          return data;
        });
      });
      
      if (internalChannels && internalChannels.length > 0) {
        channels = internalChannels.map(c => {
          // Broadest possible admin/creator check - case insensitive
          const role = (c.viewerRole || c.role || c.membershipType || c.membership || '').toUpperCase();
          const isAdmin = role === 'ADMIN' || 
                          role === 'OWNER' || 
                          c.isCreator === true;
          
          return {
            id: { _serialized: c.id, server: 'newsletter' },
            name: c.name || 'Unnamed Channel',
            isGroup: false,
            isAdmin: isAdmin,
            unreadCount: 0
          };
        });
      }
    } catch (err) {
      console.error('[WHATSAPP] Newsletter internal fetch error:', err.message);
    }

    // Combine them
    const allChats = [...chats, ...channels];
    const myId = this.me.wid._serialized;

    const enrichedChats = await Promise.all(allChats.map(async (chat) => {
      // If it's already an enriched object from internal store (newsletter), we still need to try getting icon
      let iconUrl = null;
      try {
        // Try to get icon from the chat instance or by ID
        if (chat.getContact) {
          const contact = await chat.getContact();
          iconUrl = await contact.getProfilePicUrl();
        } else {
          iconUrl = await this.client.getProfilePicUrl(chat.id._serialized || chat.id);
        }
      } catch (err) {
        // Ignore icon fetch errors
      }

      if (chat.isAdmin !== undefined && chat.id.server === 'newsletter') {
        return { ...chat, iconUrl };
      }

      let isAdmin = false;
      
      if (chat.isGroup) {
        const participants = chat.groupMetadata?.participants || [];
        const me = participants.find(p => p.id._serialized === myId);
        isAdmin = me ? (me.isAdmin || me.isSuperAdmin) : false;
      } else if (chat.id.server === 'newsletter') {
        // Fallback for newsletter admin check
        const role = (chat.viewerRole || chat.role || chat.membershipType || '').toUpperCase();
        isAdmin = role === 'ADMIN' || role === 'OWNER' || chat.isCreator === true;
      }

      return {
        id: chat.id,
        name: chat.name,
        isGroup: chat.isGroup,
        unreadCount: chat.unreadCount,
        timestamp: chat.timestamp,
        isAdmin: isAdmin,
        viewerRole: chat.viewerRole || null,
        iconUrl: iconUrl
      };
    }));

    return enrichedChats;
  }

  async getContacts() {
    if (!this.isReady) return [];
    return await this.client.getContacts();
  }

  async createGroup(name, participants) {
    if (!this.isReady) throw new Error('WhatsApp client not ready');
    return await this.client.createGroup(name, participants);
  }

  async deleteGroup(groupId) {
    if (!this.isReady) throw new Error('WhatsApp client not ready');
    const chat = await this.client.getChatById(groupId);
    if (!chat.isGroup) throw new Error('Chat is not a group');
    return await chat.delete();
  }

  async createChannel(name, description) {
    if (!this.isReady) throw new Error('WhatsApp client not ready');
    return await this.client.pupPage.evaluate(async (name, description) => {
      if (!window.Store || !window.Store.ChannelUtils) throw new Error('Channel utilities not found');
      const response = await window.Store.ChannelUtils.createNewsletterQuery({
        name,
        description
      });
      return response;
    }, name, description);
  }

  async deleteChannel(channelId) {
    if (!this.isReady) throw new Error('WhatsApp client not ready');
    return await this.client.pupPage.evaluate(async (id) => {
      const coll = window.Store?.NewsletterMetadataCollection || window.Store?.WAWebNewsletterMetadataCollection;
      if (!coll) throw new Error('Newsletter collection not found');
      const newsletter = coll.get(id);
      if (!newsletter) throw new Error('Newsletter not found in store');
      await window.Store.ChannelUtils.deleteNewsletterAction(newsletter);
      return { success: true };
    }, channelId);
  }

  formatJid(number) {
    if (!number) return number;
    const str = number.toString();
    if (str.includes('@')) return str;
    const cleaned = str.replace(/\D/g, '');
    return `${cleaned}@c.us`;
  }

  async sendMessage(number, message, mediaOptions = null) {
    if (!this.isReady) throw new Error('WhatsApp client not ready');
    const cleanNumber = number.toString().replace(/\D/g, '');
    const jid = this.formatJid(cleanNumber);
    
    console.log(`[WHATSAPP] Attempting to send message to: ${cleanNumber}`);
    
    try {
      // Try to get the registered WhatsApp ID
      const numberId = await this.client.getNumberId(cleanNumber);
      const finalJid = numberId ? numberId._serialized : jid;
      
      console.log(`[WHATSAPP] Sending to JID: ${finalJid}`);
      let result;

      if (mediaOptions && mediaOptions.url) {
        // Try to determine filename if possible for documents
        const media = await MessageMedia.fromUrl(mediaOptions.url, { unsafeMime: true });
        result = await this.client.sendMessage(finalJid, media, { 
          caption: message,
          sendMediaAsDocument: mediaOptions.type === 'document' 
        });
      } else {
        result = await this.client.sendMessage(finalJid, message);
      }
      
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
