const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client({
    authStrategy: new LocalAuth({
        clientId: 'appstack-wa-session',
        dataPath: './.wwebjs_auth'
    }),
    puppeteer: {
        headless: true,
        executablePath: '/usr/bin/chromium-browser',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('qr', (qr) => {
    console.log('QR RECEIVED', qr);
    qrcode.generate(qr, { small: true });
});

client.on('ready', async () => {
    console.log('Client is ready!');
    
    // Using the Test Channel ID from GEMINI.md
    const channelId = '120363426680295156@newsletter';
    
    try {
        console.log(`Attempting to post to channel: ${channelId}`);
        const result = await client.sendMessage(channelId, 'Test message from diagnostic script');
        console.log('Message sent successfully:', result.id._serialized);
    } catch (err) {
        console.error('ERROR during sendMessage:', err);
    } finally {
        process.exit();
    }
});

client.on('auth_failure', msg => {
    console.error('AUTHENTICATION FAILURE', msg);
    process.exit(1);
});

client.initialize();
