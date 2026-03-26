const { Client, LocalAuth, MessageMedia, Poll } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const settingsService = require('./settings.service');
const db = require('../config/db');
const aiService = require('../utils/ai.service');
const reportService = require('../utils/report.service');
const path = require('path');
const fs = require('fs');

class WhatsappService {
  constructor() {
    this.client = null;
    this.qrCode = null;
    this.pairingCode = null;
    this.status = 'DISCONNECTED';
    this.isReady = false;
    this.me = null;
  }

  getBrowserPath() {
    const paths = [
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
      '/usr/bin/google-chrome',
      '/snap/bin/chromium'
    ];
    for (const p of paths) {
      if (fs.existsSync(p)) return p;
    }
    return null;
  }

  async initialize() {
    if (this.client) return;

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

    this.client.on('pairing_code', (code) => {
      console.log('[WHATSAPP] PAIRING CODE RECEIVED:', code);
      this.pairingCode = code;
      this.qrCode = null;
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
          const sender = msg.author || msg.from;
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
                return msg.reply(`🤖 AI Provider set to ${val}. Model set to ${model}.`);
              }
            }
          }
        } catch (err) {
          console.error('[WHATSAPP] Command handling error:', err.message);
        }
      }

      // 2. Gatekeeper Logic (Handle Identity Packets)
      if (this.status === 'CONNECTED' || this.status === 'AUTHENTICATED') {
        try {
          const sender = msg.from;
          const pending = await db.query(
            "SELECT * FROM group_gatekeeper_logs WHERE participant_id = $1 AND status = 'PENDING' AND expires_at > CURRENT_TIMESTAMP", 
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

      // 3. AI Assistant (Auto-Reply if enabled and not a command)
      if (!msg.from.includes('@g.us') && !msg.body.startsWith('/')) {
        const aiEnabled = await settingsService.get('ai_enabled');
        if (aiEnabled === 'true') {
          try {
            const reply = await aiService.generateResponse(msg.body);
            if (reply) return msg.reply(reply);
          } catch (err) {
            console.error('[WHATSAPP] AI Response error:', err.message);
          }
        }
      }
    });

    this.client.on('group_join', async (notification) => {
      // 4. Gatekeeper Activation (New Members)
      try {
        const siteName = await settingsService.get('site_name') || 'Portal';
        for (const participantId of notification.recipientIds) {
          const welcomeMsg = `👋 *Welcome to the group!*\n\nThis is a secure community managed by *${siteName}*.\n\nTo remain in this group, please verify your identity within 10 minutes:\n1. Visit: ${process.env.WEBSITE_DOMAIN || 'app.kcdev.qzz.io'}\n2. Sign in or Register\n3. Reply to this message with your *OTP Verification Code*.`;
          
          await this.client.sendMessage(participantId, welcomeMsg);
          
          const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
          await db.query(
            'INSERT INTO group_gatekeeper_logs (group_jid, participant_id, status, expires_at) VALUES ($1, $2, $3, $4)',
            [notification.chatId, participantId, 'PENDING', expiresAt]
          );
        }
      } catch (err) {
        console.error('[WHATSAPP] Gatekeeper initialization error:', err.message);
      }
    });

    this.client.on('vote', async (vote) => {
      try {
        // Log votes for WhatsApp Polls if needed
        console.log(`[WHATSAPP] Poll vote received: ${vote.parentMessage.to} -> ${vote.selectedOptions[0]?.name}`);
        
        // Track votes in system if the poll matches an ID
        const pollIdMatch = vote.parentMessage.body.match(/ID: (\d+)/);
        if (pollIdMatch) {
          const pollId = pollIdMatch[1];
          const phoneNumber = vote.voter.replace('@c.us', '');
          const option = vote.selectedOptions[0]?.name;
          
          // Simple poll tracking for WhatsApp-native polls
          await db.query(
            'INSERT INTO poll_votes (poll_id, phone_number, option_selected) VALUES ($1, $2, $3) ON CONFLICT (poll_id, phone_number) DO UPDATE SET option_selected = EXCLUDED.option_selected',
            [pollId, phoneNumber, option]
          );
        }
      } catch (err) {
        console.error('[WHATSAPP] Poll vote tracking error:', err.message);
      }
    });

    try {
      await this.client.initialize();
      this.status = 'INITIALIZING';
    } catch (err) {
      console.error('[WHATSAPP] Initialization error:', err.message);
      this.status = 'DISCONNECTED';
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
    if (!this.isReady) throw new Error('WhatsApp client not ready');
    try {
      const chats = await this.client.getChats();
      // Enhanced chat data
      const results = await Promise.all(chats.map(async chat => {
        let iconUrl = null;
        try {
          iconUrl = await chat.getContact().then(c => c.getProfilePicUrl()).catch(() => null);
        } catch (e) {}
        
        return {
          id: chat.id,
          name: chat.name,
          isGroup: chat.isGroup,
          unreadCount: chat.unreadCount,
          timestamp: chat.timestamp,
          iconUrl: iconUrl,
          isAdmin: chat.isGroup ? chat.groupMetadata?.participants.find(p => p.id._serialized === this.me.wid._serialized)?.isAdmin : true
        };
      }));
      return results;
    } catch (err) {
      console.error('[WHATSAPP] Get chats error:', err.message);
      throw err;
    }
  }

  async getContacts() {
    if (!this.isReady) throw new Error('WhatsApp client not ready');
    try {
      const contacts = await this.client.getContacts();
      return contacts.filter(c => c.isMyContact && !c.isGroup).map(c => ({
        id: c.id._serialized,
        name: c.name || c.pushname || c.number,
        number: c.number
      }));
    } catch (err) {
      console.error('[WHATSAPP] Get contacts error:', err.message);
      throw err;
    }
  }

  async createWaGroup(name, participants) {
    if (!this.isReady) throw new Error('WhatsApp client not ready');
    try {
      const pJids = participants.map(p => p.includes('@c.us') ? p : `${p.replace(/\D/g, '')}@c.us`);
      const result = await this.client.createGroup(name, pJids);
      return result;
    } catch (err) {
      console.error('[WHATSAPP] Create group error:', err.message);
      throw err;
    }
  }

  async createWaChannel(name, description) {
    if (!this.isReady) throw new Error('WhatsApp client not ready');
    try {
      // whatsapp-web.js uses createNewsletter for Channels
      const result = await this.client.createNewsletter(name, { description });
      return result;
    } catch (err) {
      console.error('[WHATSAPP] Create channel error:', err.message);
      throw err;
    }
  }

  async deleteGroup(groupId) {
    if (!this.isReady) throw new Error('WhatsApp client not ready');
    try {
      const chat = await this.client.getChatById(groupId);
      if (chat.isGroup) {
        await chat.leave();
        await chat.delete();
      }
    } catch (err) {
      console.error('[WHATSAPP] Delete group error:', err.message);
      throw err;
    }
  }

  async deleteChannel(channelId) {
    if (!this.isReady) throw new Error('WhatsApp client not ready');
    try {
      const chat = await this.client.getChatById(channelId);
      await chat.delete();
    } catch (err) {
      console.error('[WHATSAPP] Delete channel error:', err.message);
      throw err;
    }
  }

  async getGroupMetadata(groupId) {
    if (!this.isReady) throw new Error('WhatsApp client not ready');
    try {
      const chat = await this.client.getChatById(groupId);
      return chat.groupMetadata;
    } catch (err) {
      console.error('[WHATSAPP] Get metadata error:', err.message);
      throw err;
    }
  }

  async getJoinRequests(groupId) {
    if (!this.isReady) throw new Error('WhatsApp client not ready');
    try {
      const chat = await this.client.getChatById(groupId);
      if (chat.getGroupJoinRequests) {
        return await chat.getGroupJoinRequests();
      }
      return [];
    } catch (err) {
      console.error('[WHATSAPP] Get join requests error:', err.message);
      throw err;
    }
  }

  async promoteAdmin(chatId, participantId) {
    const chat = await this.client.getChatById(chatId);
    return await chat.promoteParticipants([participantId]);
  }

  async demoteAdmin(chatId, participantId) {
    const chat = await this.client.getChatById(chatId);
    return await chat.demoteParticipants([participantId]);
  }

  async removeParticipant(chatId, participantId) {
    const chat = await this.client.getChatById(chatId);
    return await chat.removeParticipants([participantId]);
  }

  async addParticipant(chatId, participantId) {
    const chat = await this.client.getChatById(chatId);
    return await chat.addParticipants([participantId]);
  }

  async approveJoinRequest(chatId, participantId) {
    const chat = await this.client.getChatById(chatId);
    return await chat.approveGroupJoinRequest(participantId);
  }

  async rejectJoinRequest(chatId, participantId) {
    const chat = await this.client.getChatById(chatId);
    return await chat.rejectGroupJoinRequest(participantId);
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
      // Prefer @c.us for standard numbers
      if (cleanNumber.length >= 10 && cleanNumber.length <= 15) {
        finalJid = `${cleanNumber}@c.us`;
      } else {
        const numberId = await this.client.getNumberId(cleanNumber);
        finalJid = numberId ? numberId._serialized : `${cleanNumber}@c.us`;
      }
    }
    console.log(`[WHATSAPP] Sending message to: ${finalJid}`);
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
      console.error(`[WHATSAPP] Failed to send to ${finalJid}:`, err.message);
      await this.logMessage({ phoneNumber: finalJid, message: formattedMessage, status: 'FAILED', errorMessage: err.message });
      throw err;
    }
  }

  async sendPoll(chatId, question, options, allowMultiple = false) {
    if (!this.isReady) throw new Error('WhatsApp client not ready');
    try {
      const result = await this.client.sendMessage(chatId, new Poll(question, options, { allowMultiple }));
      
      // Save poll tracking
      const pollId = result.id?._serialized || result.id;
      const currentOptions = {};
      options.forEach(o => currentOptions[o] = 0);
      
      await db.query(
        'INSERT INTO whatsapp_polls (poll_id, question, options, target_jid) VALUES ($1, $2, $3, $4) ON CONFLICT (poll_id) DO UPDATE SET options = EXCLUDED.options',
        [pollId, question, JSON.stringify(currentOptions), chatId]
      );
      
      return result;
    } catch (err) {
      console.error('[WHATSAPP] Send poll error:', err.message);
      throw err;
    }
  }

  async logout() {
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

  async logMessage({ userId, phoneNumber, message, status, errorMessage }) {
    try {
      await db.query(
        'INSERT INTO message_history (user_id, phone_number, message, status, error_message) VALUES ($1, $2, $3, $4, $5)',
        [userId || null, phoneNumber, message, status, errorMessage || null]
      );
    } catch (err) {}
  }

  async isParticipantInGroup(groupJid, phoneNumber) {
    if (!this.isReady) return false;
    try {
      const chat = await this.client.getChatById(groupJid);
      if (!chat.isGroup) return false;
      
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      // Check for both international formats
      const variants = [cleanPhone, `91${cleanPhone}`, cleanPhone.startsWith('91') ? cleanPhone.slice(2) : `91${cleanPhone}`];
      
      console.log(`[WHATSAPP] Checking membership for ${phoneNumber} in group ${chat.name} (${groupJid})`);
      
      for (const participant of chat.groupMetadata.participants) {
        const pNum = participant.id.user;
        if (variants.includes(pNum)) {
          console.log(`[WHATSAPP] Match found: ${participant.id._serialized}`);
          return true;
        }
      }
      
      console.log(`[WHATSAPP] No match found. Participants checked: ${chat.groupMetadata?.participants?.length || 0}`);
      return false;
    } catch (err) {
      console.error('[WHATSAPP] Membership check error:', err.message);
      return false;
    }
  }
}

module.exports = new WhatsappService();
