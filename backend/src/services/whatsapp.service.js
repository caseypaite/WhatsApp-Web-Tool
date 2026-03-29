const { Client, LocalAuth, MessageMedia, Poll } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const settingsService = require('./settings.service');
const db = require('../config/db');
const aiService = require('../utils/ai.service');
const reportService = require('../utils/report.service');
const path = require('path');
const fs = require('fs');
const { Address4, Address6 } = require('ip-address');
const dns = require('dns').promises;

class WhatsappService {
  constructor() {
    this.client = null;
    this.qrCode = null;
    this.pairingCode = null;
    this.status = 'DISCONNECTED';
    this.isReady = false;
    this.me = null;
  }

  async validateUrl(urlStr) {
    try {
      const url = new URL(urlStr);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
      
      const lookup = await dns.lookup(url.hostname);
      const ip = lookup.address;

      const isPrivate = (addr) => {
        try {
          if (addr.includes(':')) {
            const v6 = new Address6(addr);
            return v6.getScope() !== 'Global';
          } else {
            const v4 = new Address4(addr);
            const octets = v4.toArray();
            if (octets[0] === 10) return true;
            if (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) return true;
            if (octets[0] === 192 && octets[1] === 168) return true;
            if (octets[0] === 127) return true;
            if (octets[0] === 169 && octets[1] === 254) return true;
            return false;
          }
        } catch (e) { return true; }
      };

      return !isPrivate(ip);
    } catch (e) { return false; }
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
        protocolTimeout: 60000,
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
            const senderPhone = msg.from.replace('@c.us', '');
            
            // 1. Skip Business Numbers
            const contact = await msg.getContact();
            if (contact.isBusiness) {
              console.log(`[WHATSAPP] AI Response skipped: ${senderPhone} is a Business account.`);
              return;
            }

            // 2. Check Blacklist
            const blacklisted = await db.query('SELECT * FROM chat_blacklist WHERE phone_number = $1', [senderPhone]);
            if (blacklisted.rows.length > 0) {
              console.log(`[WHATSAPP] AI Response skipped: ${senderPhone} is blacklisted.`);
              return;
            }

            const reply = await aiService.generateResponse(msg.body);
            if (reply) {
              await msg.reply(reply);
              
              // Log Interaction
              await db.query(
                'INSERT INTO ai_interaction_logs (phone_number, message, response) VALUES ($1, $2, $3)',
                [senderPhone, msg.body, reply]
              );

              // Check for Auto-Blacklist (5 messages in 30 seconds)
              const recentInteractions = await db.query(
                'SELECT COUNT(*) FROM ai_interaction_logs WHERE phone_number = $1 AND created_at > CURRENT_TIMESTAMP - INTERVAL \'30 seconds\'',
                [senderPhone]
              );

              if (parseInt(recentInteractions.rows[0].count) > 5) {
                await db.query(
                  'INSERT INTO chat_blacklist (phone_number, reason, is_auto_blacklisted) VALUES ($1, $2, $3) ON CONFLICT (phone_number) DO NOTHING',
                  [senderPhone, 'Rate limit exceeded: > 5 messages in 30s', true]
                );
                console.log(`[WHATSAPP] Auto-blacklisted ${senderPhone} due to rate limiting.`);
                await this.client.sendMessage(msg.from, '⚠️ *System Notice*\n\nYour interaction rate has exceeded our safety threshold. AI responses have been suspended for this number.');
              }
              return;
            }
          } catch (err) {
            console.error('[WHATSAPP] AI Response error:', err.message);
          }
        }
      }
    });
this.client.on('group_join', async (notification) => {
  // 4. Welcome Message (New Members)
  try {
    const globalEnabled = await settingsService.get('group_greeting_enabled') === 'true';
    const groupRes = await db.query('SELECT greetings_enabled FROM groups WHERE wa_jid = $1', [notification.chatId]);

    let sendGreeting = globalEnabled;
    if (groupRes.rows.length > 0) {
      const groupSetting = groupRes.rows[0].greetings_enabled;
      if (groupSetting !== null) {
        sendGreeting = groupSetting;
      }
    }

    if (!sendGreeting) return;

    const siteName = await settingsService.get('site_name') || 'Portal';
    let frontendUrl = await settingsService.get('website_domain') || 'localhost:3085';
    if (!frontendUrl.startsWith('http')) {
      frontendUrl = `https://${frontendUrl}`;
    }

    for (const participantId of notification.recipientIds) {
      try {
        // Skip if bot itself
        if (participantId === this.client.info.wid._serialized) continue;

        const welcomeMsg = `👋 *Welcome to the group!*\n\nThis is a secure community managed by *${siteName}*.\n\nWe are glad to have you here. If you wish to participate in our digital identity portal and polls, please visit us at:\n🔗 *${frontendUrl}*\n\nEnjoy your stay!`;

        await this.client.sendMessage(participantId, welcomeMsg);

        // We still log the join but without restrictive expiration/kick logic
        const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year fallback
        await db.query(
          'INSERT INTO group_gatekeeper_logs (group_jid, participant_id, status, expires_at) VALUES ($1, $2, $3, $4)',
          [notification.chatId, participantId, 'JOINED', expiresAt]
        );
      } catch (err) {
        console.error(`[WHATSAPP] Error greeting participant ${participantId}:`, err.message);
      }
    }
  } catch (err) {
    console.error('[WHATSAPP] Welcome message error:', err.message);
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
      
      // Try to fetch channels (newsletters) separately if the method exists
      let channels = [];
      try {
        if (typeof this.client.getChannels === 'function') {
          channels = await this.client.getChannels();
        } else if (typeof this.client.getNewsletters === 'function') {
          channels = await this.client.getNewsletters();
        }
      } catch (err) {
        // Manual fallback using page.evaluate if the library methods fail
        try {
          const manualNewsletters = await this.client.pupPage.evaluate(async () => {
            if (!window.Store) return [];
            
            const newsletterStore = window.Store.WAWebNewsletterCollection;
            const metadataStore = window.Store.WAWebNewsletterMetadataCollection;
            
            let newsletters = [];
            if (newsletterStore && typeof newsletterStore.getModelsArray === 'function') {
               newsletters = newsletterStore.getModelsArray().map(n => {
                 const idStr = n.id?._serialized || n.id;
                 let metaData = null;
                 
                 if (metadataStore && typeof metadataStore.get === 'function') {
                    const meta = metadataStore.get(idStr);
                    if (meta) {
                       metaData = {
                         membershipType: meta.membershipType || meta.__x_membershipType
                       };
                    }
                 }

                 return {
                   idStr: idStr,
                   name: n.name || n.subject || n.formattedTitle || 'Unnamed Channel',
                   metaData: metaData,
                   role: n.role
                 };
               });
            }
            return newsletters;
          });

          if (manualNewsletters && manualNewsletters.length > 0) {
            channels = manualNewsletters.map(n => {
               // Filter for managed channels where membershipType is owner, admin, or creator
               let isManaged = false;
               
               if (n.metaData && n.metaData.membershipType) {
                  const mt = n.metaData.membershipType;
                  if (mt === 'admin' || mt === 'owner' || mt === 'creator') {
                     isManaged = true;
                  }
               }
               
               // Fallback: Check n.role if metaData is missing
               if (!isManaged && n.role) {
                  if (n.role === 'admin' || n.role === 'owner' || n.role === 'creator') {
                     isManaged = true;
                  }
               }

               return {
                 id: {
                   _serialized: n.idStr,
                   server: 'newsletter',
                   user: n.idStr.split('@')[0]
                 },
                 name: n.name,
                 isGroup: false,
                 isNewsletter: true,
                 isAdmin: isManaged
               };
            });
          }
        } catch (pupErr) {
          console.error('[WHATSAPP] Puppeteer manual newsletter fetch failed:', pupErr.message);
        }
      }
      
      // Merge unique chats and channels
      const combined = [...chats];
      if (Array.isArray(channels)) {
        for (const channel of channels) {
          if (channel && channel.id && !combined.find(c => (c.id?._serialized || c.id) === (channel.id?._serialized || channel.id))) {
            combined.push(channel);
          }
        }
      }

      // Map and filter chats to only include managed Groups and Channels
      const managedGroupsRes = await db.query('SELECT wa_jid, greetings_enabled FROM groups WHERE wa_jid IS NOT NULL');
      const groupSettingsMap = {};
      managedGroupsRes.rows.forEach(row => {
        groupSettingsMap[row.wa_jid] = row.greetings_enabled;
      });

      const mappedResults = await Promise.all(combined.map(async chat => {
        if (!chat || !chat.id) return null;

        const idStr = chat.id?._serialized || (typeof chat.id === 'string' ? chat.id : '');
        const isGroup = !!chat.isGroup;
        const isNewsletter = !!(idStr.endsWith('@newsletter') || chat.id?.server === 'newsletter' || chat.isNewsletter);
        
        let isAdmin = false;
        if (isGroup) {
          try {
            const meId = this.me?.wid?._serialized || this.me?.id?._serialized || this.client.info?.wid?._serialized;
            const participants = chat.groupMetadata?.participants || [];
            const meParticipant = participants.find(p => p.id?._serialized === meId);
            isAdmin = !!meParticipant?.isAdmin;
          } catch (e) {
            isAdmin = false;
          }
        } else if (isNewsletter) {
          isAdmin = chat.isAdmin !== undefined ? chat.isAdmin : true;
        }

        // Only return groups and channels where the bot is an admin/owner
        if (!isAdmin) return null;

        let iconUrl = null;
        try {
          if (typeof chat.getContact === 'function') {
            const contact = await chat.getContact();
            iconUrl = await contact.getProfilePicUrl();
          }
        } catch (e) {}

        return {
          id: chat.id,
          name: chat.name || 'Unknown',
          isGroup: isGroup,
          isNewsletter: isNewsletter,
          unreadCount: chat.unreadCount || 0,
          timestamp: chat.timestamp || 0,
          iconUrl: iconUrl,
          isAdmin: isAdmin,
          greetingsEnabled: isGroup ? (groupSettingsMap[idStr] !== undefined ? groupSettingsMap[idStr] : null) : null
        };
      }));

      return mappedResults.filter(Boolean);
    } catch (err) {
      console.error('[WHATSAPP] Get managed chats error:', err.message);
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

  async createGroup(name, participants) {
    if (!this.isReady) throw new Error('WhatsApp client not ready');
    try {
      const pJids = participants.map(p => p.includes('@c.us') ? p : `${p.replace(/\D/g, '')}@c.us`);
      // title is the parameter name in some versions, name in others, using 'name' as title.
      const result = await this.client.createGroup(name, pJids);
      console.log('[WHATSAPP] Group created:', result.gid?._serialized || result.gid);
      return result;
    } catch (err) {
      console.error('[WHATSAPP] Create group error:', err.message);
      throw err;
    }
  }

  async createChannel(name, description) {
    if (!this.isReady) throw new Error('WhatsApp client not ready');
    try {
      // whatsapp-web.js uses createChannel for Newsletters
      if (typeof this.client.createChannel !== 'function') {
        throw new Error('Channel creation not supported in this version of the library');
      }
      const result = await this.client.createChannel(name, { description });
      console.log('[WHATSAPP] Channel created:', result.nid?._serialized || result.nid || result.id);
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
      if (!chat.isGroup) throw new Error('Not a group');
      
      const metadata = chat.groupMetadata;
      
      // Enrich participants with contact details
      const enrichedParticipants = await Promise.all(metadata.participants.map(async p => {
        try {
          const contact = await this.client.getContactById(p.id._serialized);
          return {
            ...p,
            name: contact.name || contact.pushname || contact.number,
            pushname: contact.pushname,
            phoneNumber: contact.number,
            profilePic: await contact.getProfilePicUrl().catch(() => null)
          };
        } catch (e) {
          return {
            ...p,
            name: p.id.user,
            phoneNumber: p.id.user
          };
        }
      }));

      return {
        ...metadata,
        participants: enrichedParticipants
      };
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
        // SSRF VALIDATION
        const isUrlSafe = await this.validateUrl(mediaOptions.url);
        if (!isUrlSafe) throw new Error('Security Error: Potential SSRF attempt blocked.');

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
