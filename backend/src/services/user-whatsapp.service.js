require('./whatsapp.service');

const { Client, LocalAuth, MessageMedia, Poll } = require('whatsapp-web.js');
const path = require('path');
const fs = require('fs');
const dns = require('dns').promises;
const { Address4, Address6 } = require('ip-address');

const db = require('../config/db');
const settingsService = require('./settings.service');
const whatsappLaunchCoordinator = require('./whatsapp-launch-coordinator');
const whatsappSessionLogService = require('./whatsapp-session-log.service');
const { normalizePhoneNumber } = require('../utils/validators');

const MANAGED_NEWSLETTER_ROLES = new Set(['admin', 'owner', 'creator']);

const isManagedNewsletterRole = (role) => {
  return typeof role === 'string' && MANAGED_NEWSLETTER_ROLES.has(role);
};

class UserWhatsappService {
  constructor() {
    this.sessions = new Map();
    this.startupLoadScheduled = false;
  }

  getBrowserPath() {
    const paths = [
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
      '/usr/bin/google-chrome',
      '/snap/bin/chromium'
    ];
    for (const candidate of paths) {
      if (fs.existsSync(candidate)) return candidate;
    }
    return null;
  }

  getAuthConfig(userId) {
    const clientId = `user-wa-${userId}`;
    const dataPath = path.resolve(__dirname, '../../.wwebjs_auth');
    const sessionPrefix = `session-${clientId}`;
    const sessionPath = path.join(dataPath, sessionPrefix);
    return { clientId, dataPath, sessionPrefix, sessionPath };
  }

  getSession(userId) {
    const numericUserId = Number(userId);
    if (!this.sessions.has(numericUserId)) {
      this.sessions.set(numericUserId, {
        userId: numericUserId,
        client: null,
        qrCode: null,
        pairingCode: null,
        status: 'DISCONNECTED',
        isReady: false,
        me: null,
        initializingPromise: null
      });
    }
    return this.sessions.get(numericUserId);
  }

  resetSessionState(session) {
    session.qrCode = null;
    session.pairingCode = null;
    session.status = 'DISCONNECTED';
    session.isReady = false;
    session.me = null;
  }

  async destroyClient(session) {
    if (!session.client) return;
    try {
      await session.client.destroy();
    } catch (err) {
      console.warn(`[USER-WHATSAPP] Failed to destroy session ${session.userId}: ${err.message}`);
    } finally {
      session.client = null;
    }
  }

  clearChromiumLockFiles(dataPath, sessionPrefix) {
    const lockFiles = ['SingletonLock', 'SingletonCookie', 'SingletonSocket', 'DevToolsActivePort'];
    let sessionDirs = [];

    try {
      sessionDirs = fs
        .readdirSync(dataPath, { withFileTypes: true })
        .filter((entry) => entry.isDirectory() && entry.name.startsWith(sessionPrefix))
        .map((entry) => path.join(dataPath, entry.name));
    } catch (err) {
      console.warn(`[USER-WHATSAPP] Failed to enumerate auth sessions: ${err.message}`);
    }

    const primarySessionDir = path.join(dataPath, sessionPrefix);
    if (!sessionDirs.includes(primarySessionDir)) {
      sessionDirs.push(primarySessionDir);
    }

    for (const sessionPath of sessionDirs) {
      for (const fileName of lockFiles) {
        const filePath = path.join(sessionPath, fileName);
        try {
          fs.lstatSync(filePath);
          fs.rmSync(filePath, { force: true });
          console.log(`[USER-WHATSAPP] Removed stale Chromium artifact: ${filePath}`);
        } catch (err) {
          if (err.code !== 'ENOENT') {
            console.warn(`[USER-WHATSAPP] Failed to remove ${filePath}: ${err.message}`);
          }
        }
      }
    }
  }

  isChromiumProfileLockError(error) {
    const message = error?.message || '';
    return message.includes('profile appears to be in use') || message.includes('ProcessSingleton');
  }

  async updateSessionRow(userId, fields = {}) {
    const existing = await this.getPersistedSession(userId);
    const hasField = (key) => Object.prototype.hasOwnProperty.call(fields, key);
    const next = {
      status: hasField('status') ? fields.status : (existing?.status || 'DISCONNECTED'),
      qr_code: hasField('qr_code') ? fields.qr_code : (existing?.qr_code || null),
      pairing_code: hasField('pairing_code') ? fields.pairing_code : (existing?.pairing_code || null),
      phone_number: hasField('phone_number') ? fields.phone_number : (existing?.phone_number || null),
      wid: hasField('wid') ? fields.wid : (existing?.wid || null),
      push_name: hasField('push_name') ? fields.push_name : (existing?.push_name || null),
      is_enabled: hasField('is_enabled') ? fields.is_enabled : (existing?.is_enabled || false),
      last_error: hasField('last_error') ? fields.last_error : (existing?.last_error || null),
      last_loaded_at: hasField('last_loaded_at') ? fields.last_loaded_at : (existing?.last_loaded_at || null)
    };

    await db.query(
      `INSERT INTO user_whatsapp_sessions (
         user_id, status, qr_code, pairing_code, phone_number, wid, push_name, is_enabled, last_error, last_loaded_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (user_id) DO UPDATE SET
         status = EXCLUDED.status,
         qr_code = EXCLUDED.qr_code,
         pairing_code = EXCLUDED.pairing_code,
         phone_number = EXCLUDED.phone_number,
         wid = EXCLUDED.wid,
         push_name = EXCLUDED.push_name,
         is_enabled = EXCLUDED.is_enabled,
         last_error = EXCLUDED.last_error,
         last_loaded_at = COALESCE(EXCLUDED.last_loaded_at, user_whatsapp_sessions.last_loaded_at),
         updated_at = CURRENT_TIMESTAMP`,
      [
        userId,
        next.status,
        next.qr_code,
        next.pairing_code,
        next.phone_number,
        next.wid,
        next.push_name,
        next.is_enabled,
        next.last_error,
        next.last_loaded_at
      ]
    );
  }

  hydrateMeFromRow(row) {
    if (!row?.wid && !row?.phone_number) return null;
    const wid = row.wid || `${row.phone_number}@c.us`;
    const user = wid.split('@')[0];
    return {
      wid: {
        _serialized: wid,
        user
      },
      pushname: row.push_name || null
    };
  }

  async getPersistedSession(userId) {
    const result = await db.query(
      `SELECT user_id, status, qr_code, pairing_code, phone_number, wid, push_name, is_enabled, last_error, last_loaded_at
       FROM user_whatsapp_sessions
       WHERE user_id = $1
       LIMIT 1`,
      [userId]
    );
    return result.rows[0] || null;
  }

  async schedulePersistedSessionInitialization({ initialDelayMs = 5000, stepDelayMs = 2500 } = {}) {
    if (this.startupLoadScheduled) return;
    this.startupLoadScheduled = true;

    try {
      const result = await db.query(
        `SELECT user_id
         FROM user_whatsapp_sessions
         WHERE is_enabled = true
         ORDER BY updated_at ASC, user_id ASC`
      );

      result.rows.forEach((row, index) => {
        const delay = initialDelayMs + (index * stepDelayMs);
        this.updateSessionRow(row.user_id, {
          status: 'QUEUED',
          is_enabled: true
        }).catch((err) => {
          console.error(`[USER-WHATSAPP] Failed to queue session ${row.user_id}: ${err.message}`);
        });
        this.logSessionEvent(row.user_id, 'QUEUED_FOR_RELOAD', 'QUEUED', `Reload scheduled in ${delay}ms`).catch(() => {});

        setTimeout(() => {
          this.initializeUserSession(row.user_id).catch((err) => {
            console.error(`[USER-WHATSAPP] Delayed startup failed for user ${row.user_id}: ${err.message}`);
          });
        }, delay);
      });
    } catch (err) {
      console.error('[USER-WHATSAPP] Failed to schedule persisted sessions:', err.message);
    }
  }

  async initializeUserSession(userId, recoveryAttempted = false) {
    const session = this.getSession(userId);
    if (session.initializingPromise) {
      return session.initializingPromise;
    }
    if (session.client) {
      return session;
    }

    session.initializingPromise = this._initializeSession(userId, session, recoveryAttempted)
      .finally(() => {
        session.initializingPromise = null;
      });

    return session.initializingPromise;
  }

  async _initializeSession(userId, session, recoveryAttempted = false) {
    const executablePath = this.getBrowserPath();
    const { clientId, dataPath, sessionPrefix } = this.getAuthConfig(userId);

    session.status = 'INITIALIZING';
    await this.updateSessionRow(userId, {
      status: 'INITIALIZING',
      is_enabled: true,
      last_error: null,
      qr_code: null,
      pairing_code: null,
      last_loaded_at: new Date()
    });
    this.clearChromiumLockFiles(dataPath, sessionPrefix);
    await this.logSessionEvent(
      userId,
      'INITIALIZE_STARTED',
      'INITIALIZING',
      recoveryAttempted ? 'Retry after stale lock recovery' : 'Starting user WhatsApp session'
    );

    session.client = new Client({
      authStrategy: new LocalAuth({
        clientId,
        dataPath
      }),
      puppeteer: {
        executablePath,
        headless: true,
        protocolTimeout: 0,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--disable-gpu',
          '--disable-software-rasterizer',
          '--disable-extensions'
        ]
      }
    });

    session.client.on('qr', async (qr) => {
      session.qrCode = qr;
      session.pairingCode = null;
      session.status = 'AWAITING_SCAN';
      session.isReady = false;
      await this.updateSessionRow(userId, {
        status: 'AWAITING_SCAN',
        qr_code: qr,
        pairing_code: null,
        is_enabled: true,
        phone_number: session.me?.wid?.user || null,
        wid: session.me?.wid?._serialized || null,
        push_name: session.me?.pushname || null
      });
      await this.logSessionEvent(userId, 'QR_RECEIVED', 'AWAITING_SCAN');
    });

    session.client.on('pairing_code', async (code) => {
      session.pairingCode = code;
      session.qrCode = null;
      await this.updateSessionRow(userId, {
        status: session.status === 'CONNECTED' ? 'CONNECTED' : 'AWAITING_SCAN',
        qr_code: null,
        pairing_code: code,
        is_enabled: true,
        phone_number: session.me?.wid?.user || null,
        wid: session.me?.wid?._serialized || null,
        push_name: session.me?.pushname || null
      });
      await this.logSessionEvent(userId, 'PAIRING_CODE_GENERATED', 'AWAITING_SCAN');
    });

    session.client.on('authenticated', async () => {
      session.status = 'AUTHENTICATED';
      session.qrCode = null;
      session.pairingCode = null;
      await this.updateSessionRow(userId, {
        status: 'AUTHENTICATED',
        qr_code: null,
        pairing_code: null,
        is_enabled: true,
        phone_number: session.me?.wid?.user || null,
        wid: session.me?.wid?._serialized || null,
        push_name: session.me?.pushname || null
      });
      await this.logSessionEvent(userId, 'AUTHENTICATED', 'AUTHENTICATED');
    });

    session.client.on('ready', async () => {
      session.qrCode = null;
      session.pairingCode = null;
      session.status = 'CONNECTED';
      session.isReady = true;
      session.me = session.client.info;
      await this.updateSessionRow(userId, {
        status: 'CONNECTED',
        qr_code: null,
        pairing_code: null,
        phone_number: session.me?.wid?.user || null,
        wid: session.me?.wid?._serialized || null,
        push_name: session.me?.pushname || null,
        is_enabled: true
      });
      await this.logSessionEvent(userId, 'READY', 'CONNECTED', session.me?.wid?._serialized || null);
    });

    session.client.on('auth_failure', async (message) => {
      session.status = 'DISCONNECTED';
      session.isReady = false;
      session.me = null;
      session.qrCode = null;
      session.pairingCode = null;
      await this.updateSessionRow(userId, {
        status: 'DISCONNECTED',
        qr_code: null,
        pairing_code: null,
        phone_number: null,
        wid: null,
        push_name: null,
        is_enabled: false,
        last_error: message || 'Authentication failed'
      });
      await this.logSessionEvent(userId, 'AUTH_FAILURE', 'FAILED', message || 'Authentication failed');
    });

    session.client.on('disconnected', async (reason) => {
      session.status = 'DISCONNECTED';
      session.isReady = false;
      session.me = null;
      session.qrCode = null;
      session.pairingCode = null;
      await this.updateSessionRow(userId, {
        status: 'DISCONNECTED',
        qr_code: null,
        pairing_code: null,
        phone_number: null,
        wid: null,
        push_name: null,
        is_enabled: true,
        last_error: reason || null
      });
      await this.logSessionEvent(userId, 'DISCONNECTED', 'DISCONNECTED', reason || null);
    });

    try {
      await whatsappLaunchCoordinator.run(() => session.client.initialize());
      return session;
    } catch (err) {
      await this.destroyClient(session);
      this.resetSessionState(session);
      await this.logSessionEvent(userId, 'INITIALIZE_FAILED', 'FAILED', err.message);

      if (!recoveryAttempted && this.isChromiumProfileLockError(err)) {
        console.warn(`[USER-WHATSAPP] Detected stale Chromium profile lock for user ${userId}. Clearing lock files and retrying initialization once.`);
        this.clearChromiumLockFiles(dataPath, sessionPrefix);
        session.initializingPromise = null;
        return this._initializeSession(userId, session, true);
      }

      await this.updateSessionRow(userId, {
        status: 'DISCONNECTED',
        qr_code: null,
        pairing_code: null,
        phone_number: null,
        wid: null,
        push_name: null,
        is_enabled: true,
        last_error: err.message
      });
      throw err;
    }
  }

  async startSession(userId) {
    await this.initializeUserSession(userId);
    return this.getStatus(userId);
  }

  async getStatus(userId) {
    const session = this.sessions.get(Number(userId));
    if (session) {
      return {
        status: session.status,
        ready: session.isReady,
        qr: session.qrCode,
        pairingCode: session.pairingCode,
        me: session.me
      };
    }

    const persisted = await this.getPersistedSession(userId);
    return {
      status: persisted?.status || 'DISCONNECTED',
      ready: persisted?.status === 'CONNECTED',
      qr: persisted?.qr_code || null,
      pairingCode: persisted?.pairing_code || null,
      me: this.hydrateMeFromRow(persisted)
    };
  }

  async ensureReadySession(userId) {
    const session = await this.initializeUserSession(userId);
    if (!session.isReady) {
      throw new Error('WhatsApp session not ready for this user');
    }
    return session;
  }

  async ensureExistingReadySession(userId) {
    const currentSession = this.sessions.get(Number(userId));
    const persisted = await this.getPersistedSession(userId);

    if (!currentSession?.client && !persisted?.is_enabled) {
      throw new Error('WhatsApp session not ready for this user');
    }

    if (currentSession?.client) {
      if (!currentSession.isReady) {
        throw new Error('WhatsApp session not ready for this user');
      }
      return currentSession;
    }

    const session = await this.initializeUserSession(userId);
    if (!session.isReady) {
      throw new Error('WhatsApp session not ready for this user');
    }
    return session;
  }

  async requestPairingCode(userId, phoneNumber) {
    const session = await this.initializeUserSession(userId);
    if (!session.client) {
      throw new Error('WhatsApp session not initialized');
    }

    const code = await session.client.requestPairingCode(normalizePhoneNumber(phoneNumber));
    session.pairingCode = code;
    session.qrCode = null;
    await this.updateSessionRow(userId, {
      status: session.status === 'CONNECTED' ? 'CONNECTED' : 'AWAITING_SCAN',
      qr_code: null,
      pairing_code: code,
      phone_number: session.me?.wid?.user || null,
      wid: session.me?.wid?._serialized || null,
      push_name: session.me?.pushname || null,
      is_enabled: true
    });
    await this.logSessionEvent(userId, 'PAIRING_CODE_REQUESTED', 'AWAITING_SCAN', normalizePhoneNumber(phoneNumber));
    return code;
  }

  async logout(userId) {
    const session = this.getSession(userId);
    if (session.client) {
      await session.client.logout();
      await this.destroyClient(session);
    }

    this.resetSessionState(session);
    await this.updateSessionRow(userId, {
      status: 'DISCONNECTED',
      qr_code: null,
      pairing_code: null,
      phone_number: null,
      wid: null,
      push_name: null,
      is_enabled: false,
      last_error: null
    });
    await this.logSessionEvent(userId, 'LOGOUT', 'DISCONNECTED');
  }

  async logSessionEvent(userId, eventType, status, details = null) {
    await whatsappSessionLogService.logUser(userId, eventType, status, details);
  }

  async getSessionLogs(userId, limit = 50) {
    return whatsappSessionLogService.listUser(userId, limit);
  }

  async validateUrl(urlStr) {
    try {
      const url = new URL(urlStr);
      if (!['http:', 'https:'].includes(url.protocol)) return false;

      const lookup = await dns.lookup(url.hostname);
      const ip = lookup.address;

      const isPrivate = (addr) => {
        try {
          if (addr.includes(':')) {
            const v6 = new Address6(addr);
            return v6.getScope() !== 'Global';
          }
          const v4 = new Address4(addr);
          const octets = v4.toArray();
          if (octets[0] === 10) return true;
          if (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) return true;
          if (octets[0] === 192 && octets[1] === 168) return true;
          if (octets[0] === 127) return true;
          if (octets[0] === 169 && octets[1] === 254) return true;
          return false;
        } catch (err) {
          return true;
        }
      };

      return !isPrivate(ip);
    } catch (err) {
      return false;
    }
  }

  async getChats(userId) {
    const session = await this.ensureExistingReadySession(userId);
    const chats = await session.client.getChats();

    let channels = [];
    try {
      if (typeof session.client.getChannels === 'function') {
        channels = await session.client.getChannels();
      } else if (typeof session.client.getNewsletters === 'function') {
        channels = await session.client.getNewsletters();
      }
    } catch (err) {
      channels = [];
    }

    const combined = [...chats];
    if (Array.isArray(channels)) {
      for (const channel of channels) {
        const channelId = channel?.id?._serialized || channel?.id;
        if (channelId && !combined.find((entry) => (entry.id?._serialized || entry.id) === channelId)) {
          combined.push(channel);
        }
      }
    }

    const mapped = await Promise.all(combined.map(async (chat) => {
      if (!chat?.id) return null;

      const idStr = chat.id?._serialized || (typeof chat.id === 'string' ? chat.id : '');
      const isGroup = !!chat.isGroup;
      const isNewsletter = !!(idStr.endsWith('@newsletter') || chat.id?.server === 'newsletter' || chat.isNewsletter);

      let activeChat = chat;
      let isAdmin = false;

      if (isGroup) {
        try {
          if (!activeChat.groupMetadata && typeof activeChat.id?._serialized === 'string') {
            activeChat = await session.client.getChatById(activeChat.id._serialized);
          }

          const meId = session.me?.wid?._serialized || session.client.info?.wid?._serialized;
          const participants = activeChat.groupMetadata?.participants || [];
          const meParticipant = participants.find((participant) => (participant.id?._serialized || participant.id) === meId);
          isAdmin = !!meParticipant?.isAdmin;
        } catch (err) {
          isAdmin = false;
        }
      } else if (isNewsletter) {
        const membershipType = activeChat.channelMetadata?.membershipType
          || activeChat.channelMetadata?.viewer_metadata?.membershipType
          || activeChat.role;
        isAdmin = activeChat.isAdmin !== undefined ? activeChat.isAdmin : isManagedNewsletterRole(membershipType);
      }

      if (!isAdmin) return null;

      let iconUrl = null;
      try {
        if (typeof activeChat.getContact === 'function') {
          const contact = await activeChat.getContact();
          iconUrl = await contact.getProfilePicUrl();
        }
      } catch (err) {}

      return {
        id: activeChat.id,
        name: activeChat.name || 'Unknown',
        isGroup,
        isNewsletter,
        unreadCount: activeChat.unreadCount || 0,
        timestamp: activeChat.timestamp || 0,
        iconUrl,
        isAdmin
      };
    }));

    return mapped.filter(Boolean);
  }

  async getContacts(userId) {
    const session = await this.ensureExistingReadySession(userId);
    const contacts = await session.client.getContacts();
    return contacts
      .filter((contact) => contact.isMyContact && !contact.isGroup)
      .map((contact) => ({
        id: contact.id._serialized,
        name: contact.name || contact.pushname || contact.number,
        number: contact.number
      }));
  }

  async sendMessage(userId, number, message, mediaOptions = null, options = {}) {
    const session = await this.ensureReadySession(userId);

    let formattedMessage = message;
    if (!options.raw) {
      const siteName = await settingsService.get('site_name') || 'Identity Portal';
      formattedMessage = `🏛️ *${siteName.toUpperCase()}*\n\n${message}\n\n_System generated notification_`;
    }

    let finalJid = typeof number === 'object' ? (number._serialized || number.id?._serialized) : number.toString();

    if (!finalJid.includes('@')) {
      if (options.type === 'group') {
        finalJid = `${finalJid}@g.us`;
      } else if (options.type === 'channel' || options.type === 'newsletter') {
        finalJid = `${finalJid}@newsletter`;
      } else {
        finalJid = `${normalizePhoneNumber(finalJid)}@c.us`;
      }
    }

    const isNewsletter = finalJid.endsWith('@newsletter');
    const sendOptions = { ...options };
    const apiKeyName = options.apiKeyName || null;
    delete sendOptions.type;
    delete sendOptions.raw;
    delete sendOptions.userId;
    delete sendOptions.apiKeyName;

    if (isNewsletter) {
      sendOptions.sendSeen = false;
    }

    try {
      let result;
      if (mediaOptions?.url) {
        const isUrlSafe = await this.validateUrl(mediaOptions.url);
        if (!isUrlSafe) {
          throw new Error('Security Error: Potential SSRF attempt blocked.');
        }

        const media = await MessageMedia.fromUrl(mediaOptions.url, { unsafeMime: true });
        result = await session.client.sendMessage(finalJid, media, {
          caption: formattedMessage,
          sendMediaAsDocument: mediaOptions.type === 'document',
          ...sendOptions
        });
      } else {
        result = await session.client.sendMessage(finalJid, formattedMessage, sendOptions);
      }

      await this.logMessage(userId, apiKeyName, finalJid, formattedMessage, 'SUCCESS');
      return result;
    } catch (err) {
      if (isNewsletter && err.message.includes("reading 'description'")) {
        const mockResult = { id: { _serialized: `newsletter-ack-${Date.now()}` } };
        await this.logMessage(userId, apiKeyName, finalJid, formattedMessage, 'SUCCESS');
        return mockResult;
      }

      await this.logMessage(userId, apiKeyName, finalJid, formattedMessage, 'FAILED', err.message);
      throw err;
    }
  }

  async sendPoll(userId, chatId, question, options, allowMultiple = false, extraOptions = {}) {
    const session = await this.ensureReadySession(userId);
    const apiKeyName = extraOptions.apiKeyName || null;

    try {
      const result = await session.client.sendMessage(chatId, new Poll(question, options, { allowMultiple }));
      const pollId = result.id?._serialized || result.id;
      const currentOptions = {};
      options.forEach((option) => {
        currentOptions[option] = 0;
      });

      await db.query(
        `INSERT INTO whatsapp_polls (poll_id, question, options, target_jid)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (poll_id) DO UPDATE SET options = EXCLUDED.options`,
        [pollId, question, JSON.stringify(currentOptions), chatId]
      );

      await this.logMessage(userId, apiKeyName, chatId, `POLL: ${question}`, 'SUCCESS');
      return result;
    } catch (err) {
      await this.logMessage(userId, apiKeyName, chatId, `POLL: ${question}`, 'FAILED', err.message);
      throw err;
    }
  }

  async logMessage(userId, apiKeyName, phoneNumber, message, status, errorMessage = null) {
    try {
      await db.query(
        `INSERT INTO message_history (user_id, phone_number, api_key_name, message, status, error_message)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [userId || null, phoneNumber, apiKeyName || null, message, status, errorMessage]
      );
    } catch (err) {}
  }
}

module.exports = new UserWhatsappService();
