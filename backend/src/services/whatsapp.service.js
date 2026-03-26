const { Client, LocalAuth, MessageMedia, Poll } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const settingsService = require('./settings.service');
const db = require('../config/db');
const aiService = require('../utils/ai.service');
const reportService = require('../utils/report.service');
const fs = require('fs');
const path = require('path');

class WhatsappService {
  constructor() {
    this.client = null;
    this.qrCode = null;
    this.status = 'DISCONNECTED';
    this.isReady = false;
    this.me = null;
    this.pairingCode = null;
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
    try {
      if (this.client) {
        try { await this.client.destroy(); } catch (e) {}
      }

    console.log('[WHATSAPP] Initializing client...');
    const executablePath = this.getBrowserPath();
    console.log('[WHATSAPP] Using browser:', executablePath || 'Default (Puppeteer bundled)');

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
      this.pairingCode = null;
      this.status = 'DISCONNECTED';
      this.isReady = false;
      console.log('[WHATSAPP] QR RECEIVED');
      qrcode.generate(qr, { small: true });
      await settingsService.set('whatsapp_qr', qr);
      await settingsService.set('whatsapp_status', 'DISCONNECTED');
    });

    this.client.on('ready', async () => {
      this.qrCode = null;
      this.pairingCode = null;
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

    this.client.on('message', async (msg) => {
      // 1. Handle Commands (Admins Only)
      if (msg.body.startsWith('/')) {
        try {
          const [cmd, ...args] = msg.body.slice(1).split(' ');
          const sender = msg.from;
          const userRes = await db.query(
            'SELECT u.id, array_agg(r.name) as roles FROM users u JOIN user_roles ur ON u.id = ur.user_id JOIN roles r ON ur.role_id = r.id WHERE u.phone_number = $1 GROUP BY u.id', 
            [sender.replace('@c.us', '')]
          );
          const isAdmin = userRes.rows[0]?.roles?.includes('Admin');

          if (isAdmin) {
            if (cmd === 'status') {
              const stats = await reportService.getSystemHeartbeat();
              return msg.reply(`✅ *System Status*\n\n🖥️ CPU: ${stats.cpu_usage}%\n🧠 MEM: ${stats.memory_usage}%\n📨 Msg (24h): ${stats.messages_sent_24h}\n⏳ Pending: ${stats.pending_approvals}`);
            }
            if (cmd === 'report' && args[0] === 'polls') {
              msg.reply('🔄 Generating latest poll report...');
              const polls = await db.query('SELECT id FROM polls WHERE status = \'OPEN\' ORDER BY created_at DESC LIMIT 1');
              if (polls.rows[0]) {
                const report = await reportService.generatePollReport(polls.rows[0].id);
                const media = await MessageMedia.fromUrl(report.url);
                return this.client.sendMessage(msg.from, media, { caption: '📊 Open Poll Detailed Report' });
              } else {
                return msg.reply('❌ No active polls found.');
              }
            }

            if (cmd === 'ai') {
              const sub = args[0];
              const val = args.slice(1).join(' ');

              if (sub === 'enable') {
                await settingsService.set('ai_enabled', 'true');
                return msg.reply('🤖 AI Assistant enabled.');
              }
              if (sub === 'disable') {
                await settingsService.set('ai_enabled', 'false');
                return msg.reply('🤖 AI Assistant disabled.');
              }
              if (sub === 'provider' && (val === 'gemini' || val === 'mistral')) {
                await settingsService.set('ai_provider', val);
                const model = val === 'mistral' ? 'mistral-tiny' : 'gemini-2.0-flash';
                await settingsService.set('ai_model', model);
                return msg.reply(`🤖 AI Provider set to ${val}. Default model ${model} selected.`);
              }
              if (sub === 'model' && val) {
                await settingsService.set('ai_model', val);
                return msg.reply(`🤖 AI Model updated to ${val}.`);
              }
              if (sub === 'prompt' && val) {
                await settingsService.set('ai_custom_prompt', val);
                return msg.reply('🤖 System prompt updated successfully.');
              }
              
              return msg.reply('❓ *AI Command Usage*\n/ai enable\n/ai disable\n/ai provider [gemini|mistral]\n/ai model [name]\n/ai prompt [text]');
            }
          }
        } catch (err) {
          console.error('[WHATSAPP] Command error:', err.message);
        }
      }

      // 2. Gatekeeper Logic (Handle Identity Packets)
      if (/^\d{6}$/.test(msg.body)) {
        try {
          const sender = msg.from;
          const pending = await db.query(
            "SELECT * FROM group_gatekeeper_logs WHERE participant_id = $1 AND status = 'PENDING' AND expires_at > NOW()",
            [sender]
          );
          
          if (pending.rows.length > 0) {
            const otpService = require('./otp.service');
            const isValid = await otpService.verifyOtp(sender.replace('@c.us', ''), msg.body);
            if (isValid) {
              await db.query("UPDATE group_gatekeeper_logs SET status = 'VERIFIED' WHERE participant_id = $1", [sender]);
              return msg.reply('✅ *Identity Verified!*\n\nYour access has been secured and confirmed by our systems.');
            }
          }
        } catch (err) {
          console.error('[WHATSAPP] Gatekeeper verify error:', err.message);
        }
      }

      // 3. Auto-Responder & AI Logic
      try {
        const cleanMsg = msg.body.trim().toUpperCase();
        const res = await db.query(
          "SELECT response FROM auto_responders WHERE is_active = true AND ((match_type = 'EXACT' AND UPPER(keyword) = $1) OR (match_type = 'CONTAINS' AND $1 LIKE '%' || UPPER(keyword) || '%')) LIMIT 1",
          [cleanMsg]
        );

        if (res.rows.length > 0) {
          await msg.reply(res.rows[0].response);
        } else if (!msg.from.includes('@g.us')) {
          const aiRes = await aiService.generateResponse(msg.body);
          if (aiRes) await msg.reply(`🤖 *AI Assistant*\n\n${aiRes}`);
        }
      } catch (err) {
        console.error('[WHATSAPP] Responder/AI error:', err.message);
      }
    });

    this.client.on('group_join', async (notification) => {
      // 4. Gatekeeper Activation (Entrance Lobby)
      console.log('[WHATSAPP] New group participant:', notification.recipientIds);
      try {
        const groupId = notification.chatId;
        const siteName = await settingsService.get('site_name') || 'Portal';
        for (const participantId of notification.recipientIds) {
          const welcomeMsg = `👋 *Welcome to the group!*\n\nThis is a secure community managed by *${siteName}*.\n\nTo remain in this group, please verify your identity within 10 minutes:\n1. Visit: ${process.env.WEBSITE_DOMAIN || 'app.kcdev.qzz.io'}\n2. Sign in or Register\n3. Reply to this message with your *OTP Verification Code*.`;
          
          await this.client.sendMessage(participantId, welcomeMsg);
          
          const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
          await db.query(
            'INSERT INTO group_gatekeeper_logs (group_id, participant_id, expires_at) VALUES ($1, $2, $3)',
            [groupId, participantId, expiresAt]
          );
        }
      } catch (err) {
        console.error('[WHATSAPP] Gatekeeper join error:', err.message);
      }
    });

    this.client.on('vote', async (vote) => {
      // Poll Tracking Logic
      try {
        const pollId = vote.parentMessage.id._serialized;
        const pollMessage = vote.parentMessage;
        const question = pollMessage.pollName || 'Unknown Question';
        const res = await db.query('SELECT options FROM poll_results WHERE poll_id = $1', [pollId]);
        let currentOptions = res.rows.length > 0 ? res.rows[0].options : {};
        for (const opt of vote.selectedOptions) {
          const optName = opt.name || opt;
          currentOptions[optName] = (currentOptions[optName] || 0) + 1;
        }
        await db.query(
          'INSERT INTO poll_results (poll_id, question, options, chat_id) VALUES ($1, $2, $3, $4) ON CONFLICT (poll_id) DO UPDATE SET options = EXCLUDED.options',
          [pollId, question, JSON.stringify(currentOptions), vote.parentMessage.to]
        );
      } catch (err) {
        console.error('[WHATSAPP] Poll tracking error:', err.message);
      }
    });

    this.client.initialize();
    } catch (err) {
      console.error('[WHATSAPP] Initialization error:', err.message);
    }
  }

  async getStatus() {
    return {
      status: this.status,
      ready: this.isReady,
      qr: this.qrCode,
      pairingCode: this.pairingCode,
      me: this.me
    };
  }

  async requestPairingCode(phoneNumber) {
    if (!this.client) throw new Error('WhatsApp client not initialized');
    try {
      // Clean number: must be in international format without + or spaces
      const cleanNumber = phoneNumber.replace(/\D/g, '');
      const code = await this.client.requestPairingCode(cleanNumber);
      this.pairingCode = code;
      this.qrCode = null; // Clear QR as we are using pairing code
      return code;
    } catch (err) {
      console.error('[WHATSAPP] Pairing code error:', err.message);
      throw err;
    }
  }

  async getChats() {

    if (!this.client) return;
    try {
      await this.client.logout();
      this.status = 'DISCONNECTED';
      this.isReady = false;
      this.me = null;
      await settingsService.set('whatsapp_status', 'DISCONNECTED');
    } catch (err) {
      console.error('[WHATSAPP] Logout error:', err.message);
      throw err;
    }
  }

  async deleteGroup(groupId) {
    if (!this.isReady) throw new Error('WhatsApp client not ready');
    const chat = await this.client.getChatById(groupId);
    if (!chat.isGroup) throw new Error('Not a group');
    // For groups, we might want to leave and archive or just leave
    return await chat.leave();
  }

  async deleteChannel(channelId) {
    if (!this.isReady) throw new Error('WhatsApp client not ready');
    // Newsletter/Channel deletion might not be directly supported by current wwebjs version
    // but we can try to find and unfollow or delete if owner
    const chat = await this.client.getChatById(channelId);
    if (chat.delete) return await chat.delete();
    throw new Error('Deletion not supported for this chat type');
  }

  async getChats() {
    if (!this.isReady) return [];
    let chats = [];
    try { chats = await this.client.getChats(); } catch (err) {}
    
    let channels = [];
    try {
      const internalChannels = await this.client.pupPage.evaluate(async () => {
        const collections = [
          window.Store?.NewsletterMetadataCollection,
          window.Store?.WAWebNewsletterMetadataCollection,
          window.Store?.NewsletterCollection
        ];
        
        const allMetadata = [];
        const seenIds = new Set();

        for (const coll of collections) {
          if (!coll) continue;
          try {
            const models = coll.getModelsArray ? coll.getModelsArray() : (coll.models || []);
            models.forEach(m => {
              const source = m.attributes || m;
              const id = m.id?._serialized || m.id || source.id;
              if (id && id.endsWith('@newsletter') && !seenIds.has(id)) {
                allMetadata.push({
                  id: id,
                  name: m.name || m.newsletterName || source.name || source.newsletterName || 'Unnamed Channel',
                  isCreator: m.isCreator === true || source.isCreator === true,
                  viewerRole: m.viewerRole || source.viewerRole || m.role || source.role,
                  membershipType: m.membershipType || source.membershipType,
                  isLid: !!m.lid || !!source.lid,
                  icon: source.icon || source.picture || m.icon || m.picture
                });
                seenIds.add(id);
              }
            });
          } catch (e) {}
        }
        return allMetadata;
      });

      if (internalChannels) {
        channels = internalChannels.map(c => {
          const role = (c.viewerRole || c.membershipType || '').toUpperCase();
          const isAdmin = role === 'ADMIN' || role === 'OWNER' || c.isCreator === true;
          return {
            id: { _serialized: c.id, server: 'newsletter' },
            name: c.name,
            isGroup: false,
            isAdmin: isAdmin,
            unreadCount: 0,
            storedIcon: c.icon
          };
        });
      }
    } catch (err) {}

    const allChats = [...chats, ...channels];
    const myId = this.me.wid._serialized;

    return await Promise.all(allChats.map(async (chat) => {
      let iconUrl = chat.storedIcon || null;
      if (!iconUrl) {
        try { 
          iconUrl = await Promise.race([
            this.client.getProfilePicUrl(chat.id._serialized || chat.id),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000))
          ]);
        } catch (e) {}
      }

      let isAdmin = chat.isAdmin || false;
      if (chat.isGroup) {
        const participants = chat.groupMetadata?.participants || [];
        const me = participants.find(p => p.id._serialized === myId);
        isAdmin = me ? (me.isAdmin || me.isSuperAdmin) : false;
      }

      return {
        id: chat.id,
        name: chat.name,
        isGroup: chat.isGroup,
        unreadCount: chat.unreadCount,
        timestamp: chat.timestamp,
        isAdmin: isAdmin,
        iconUrl: iconUrl
      };
    }));
  }

  async getContacts() {
    if (!this.isReady) return [];
    const contacts = await this.client.getContacts();
    return contacts.filter(c => c.isMyContact && !c.isGroup && !c.isNewsletter);
  }

  async getGroupMetadata(groupId) {
    if (!this.isReady) throw new Error('WhatsApp client not ready');
    try {
      const chat = await this.client.getChatById(groupId);
      if (!chat.isGroup) throw new Error('Chat is not a group');
      
      const participants = await Promise.all(chat.groupMetadata.participants.map(async (p) => {
        const contact = await this.client.getContactById(p.id._serialized);
        return {
          id: p.id,
          isAdmin: p.isAdmin,
          isSuperAdmin: p.isSuperAdmin,
          name: contact.name || contact.pushname || p.id.user,
          number: p.id.user,
          profilePic: await this.client.getProfilePicUrl(p.id._serialized).catch(() => null)
        };
      }));

      return {
        id: chat.id,
        name: chat.name,
        description: chat.description,
        participants: participants,
        owner: chat.groupMetadata.owner,
        creation: chat.groupMetadata.creation
      };
    } catch (err) {
      console.error('[WHATSAPP] Error fetching group metadata:', err.message);
      throw err;
    }
  }

  async createGroup(name, participants) {
    if (!this.isReady) throw new Error('WhatsApp client not ready');
    return await this.client.createGroup(name, participants);
  }

  async sendMessage(number, message, mediaOptions = null) {
    if (!this.isReady) throw new Error('WhatsApp client not ready');
    
    // Fetch dynamic Site Name from settings
    const siteName = await settingsService.get('site_name') || 'Identity Portal';
    
    // Generate professional message template
    const formattedMessage = `🏛️ *${siteName.toUpperCase()}*\n\n${message}\n\n_System generated notification_`;

    let finalJid = number.toString();
    if (!finalJid.includes('@')) {
      const cleanNumber = finalJid.replace(/\D/g, '');
      const numberId = await this.client.getNumberId(cleanNumber);
      finalJid = numberId ? numberId._serialized : `${cleanNumber}@c.us`;
    }
    try {
      let result;
      if (mediaOptions && mediaOptions.url) {
        const media = await MessageMedia.fromUrl(mediaOptions.url, { unsafeMime: true });
        result = await this.client.sendMessage(finalJid, media, { caption: formattedMessage, sendMediaAsDocument: mediaOptions.type === 'document' });
      } else {
        result = await this.client.sendMessage(finalJid, formattedMessage);
      }
      await this.logMessage({ phoneNumber: finalJid, message: formattedMessage, status: 'SUCCESS' });
      return result;
    } catch (err) {
      await this.logMessage({ phoneNumber: finalJid, message: formattedMessage, status: 'FAILED', errorMessage: err.message });
      throw err;
    }
  }

  async logMessage({ userId, phoneNumber, message, status, errorMessage }) {
    try {
      await db.query(
        'INSERT INTO message_history (user_id, phone_number, message, status, error_message) VALUES ($1, $2, $3, $4, $5)',
        [userId || null, phoneNumber, message, status, errorMessage || null]
      );
    } catch (err) {}
  }

  async removeParticipant(groupId, participantId) {
    if (!this.isReady) throw new Error('WhatsApp client not ready');
    const chat = await this.client.getChatById(groupId);
    return await chat.removeParticipants([participantId]);
  }

  async promoteAdmin(groupId, participantId) {
    if (!this.isReady) throw new Error('WhatsApp client not ready');
    const chat = await this.client.getChatById(groupId);
    return await chat.promoteParticipants([participantId]);
  }

  async demoteAdmin(groupId, participantId) {
    if (!this.isReady) throw new Error('WhatsApp client not ready');
    const chat = await this.client.getChatById(groupId);
    return await chat.demoteParticipants([participantId]);
  }

  async addParticipant(groupId, participantId) {
    if (!this.isReady) throw new Error('WhatsApp client not ready');
    const chat = await this.client.getChatById(groupId);
    return await chat.addParticipants([participantId]);
  }

  async getPendingJoinRequests(groupId) {
    if (!this.isReady) throw new Error('WhatsApp client not ready');
    const chat = await this.client.getChatById(groupId);
    if (!chat.isGroup) throw new Error('Not a group');
    return await chat.getGroupJoinRequests();
  }

  async approveJoinRequest(groupId, participantId) {
    if (!this.isReady) throw new Error('WhatsApp client not ready');
    const chat = await this.client.getChatById(groupId);
    return await chat.approveGroupJoinRequest(participantId);
  }

  async rejectJoinRequest(groupId, participantId) {
    if (!this.isReady) throw new Error('WhatsApp client not ready');
    const chat = await this.client.getChatById(groupId);
    return await chat.rejectGroupJoinRequest(participantId);
  }

  async sendPoll(chatId, question, options, allowMultiple = false) {
    if (!this.isReady) throw new Error('WhatsApp client not ready');
    const poll = new Poll(question, options, { allowNullOptions: false, multiAnswers: allowMultiple });
    return await this.client.sendMessage(chatId, poll);
  }

  async isParticipantInGroup(groupId, phoneNumber) {
    if (!this.isReady) throw new Error('WhatsApp client not ready');
    try {
      const chat = await this.client.getChatById(groupId);
      if (!chat.isGroup) {
        console.log(`[WHATSAPP] Chat ${groupId} is not a group`);
        return false;
      }

      // Ensure participants are loaded
      if (!chat.groupMetadata || !chat.groupMetadata.participants || chat.groupMetadata.participants.length === 0) {
        console.log(`[WHATSAPP] Fetching fresh metadata for ${chat.name}`);
        await chat.fetchMetadata();
      }

      const cleanNumber = phoneNumber.replace(/\D/g, '');
      console.log(`[WHATSAPP] Checking membership for ${cleanNumber} in group ${chat.name} (${groupId})`);

      const found = chat.groupMetadata.participants.find(p => {
        const pId = p.id.user; // Just the number part
        // Match if cleanNumber is a suffix of pId or vice versa (usually cleanNumber is 10 digits, pId is 12)
        return pId.endsWith(cleanNumber) || cleanNumber.endsWith(pId);
      });

      if (found) {
        console.log(`[WHATSAPP] Match found: ${found.id._serialized}`);
        return true;
      }

      console.log(`[WHATSAPP] No match found for ${cleanNumber}. Total participants: ${chat.groupMetadata?.participants?.length || 0}`);
      return false;
    } catch (err) {
      console.error('[WHATSAPP] Membership check error:', err.message);
      return false;
    }
  }
}

module.exports = new WhatsappService();
