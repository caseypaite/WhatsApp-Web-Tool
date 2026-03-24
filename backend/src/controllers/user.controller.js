const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const otpService = require('../services/otp.service');
const settingsService = require('../services/settings.service');
const { validatePassword } = require('../utils/validators');

const normalizePhone = (phone) => {
  if (!phone) return phone;
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) return '91' + cleaned;
  return cleaned;
};

const getDbUserId = (req) => {
  return req.user?.id || null;
};

const userController = {
  sendSignupOtp: async (req, res) => {
    let { phone_number } = req.body;
    if (!phone_number) return res.status(400).json({ error: 'Phone number is required.' });
    phone_number = normalizePhone(phone_number);
    try {
      const result = await otpService.generateAndSendOtp(null, phone_number, 'signup');
      res.json({ message: 'OTP sent.', result });
    } catch (error) {
      res.status(500).json({ error: 'Failed to send OTP.' });
    }
  },

  verifySignupOtp: async (req, res) => {
    let { phone_number, otp } = req.body;
    if (!phone_number || !otp) return res.status(400).json({ error: 'Missing fields.' });
    phone_number = normalizePhone(phone_number);
    try {
      const isValid = await otpService.verifyOtp(phone_number, otp);
      if (!isValid) return res.status(400).json({ error: 'Invalid OTP.' });
      res.json({ message: 'Verified.' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  register: async (req, res) => {
    let { email, password, name, phone_number, otp, address, country, state, district, pincode } = req.body;
    if (!email || !password || !phone_number || !otp) return res.status(400).json({ error: 'All fields required.' });
    
    const pwdCheck = validatePassword(password);
    if (!pwdCheck.isValid) return res.status(400).json({ error: pwdCheck.message });

    phone_number = normalizePhone(phone_number);
    try {
      const isValid = await otpService.verifyOtp(phone_number, otp);
      if (!isValid) return res.status(400).json({ error: 'Invalid OTP.' });
      const checkUser = await db.query('SELECT * FROM users WHERE email = $1', [email]);
      if (checkUser.rows.length > 0) return res.status(400).json({ error: 'User exists.' });
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await db.query(
        'INSERT INTO users (email, password, name, phone_number, status, address, country, state, district, pincode) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id, email, name, status',
        [email, hashedPassword, name || '', phone_number, 'PENDING_APPROVAL', address || '', country || '', state || '', district || '', pincode || '']
      );
      const user = result.rows[0];
      const roleResult = await db.query("SELECT id FROM roles WHERE name = 'User'");
      if (roleResult.rows.length > 0) await db.query('INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)', [user.id, roleResult.rows[0].id]);
      res.status(201).json({ message: 'Registration successful!', user: { id: user.id, email: user.email, status: user.status } });
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  },

  verifyRegistration: async (req, res) => {
    const { userId, otp } = req.body;
    try {
      const isValid = await otpService.verifyOtp(userId, otp);
      if (!isValid) return res.status(400).json({ error: 'Invalid OTP.' });
      await db.query("UPDATE users SET status = 'PENDING_APPROVAL' WHERE id = $1", [userId]);
      res.json({ message: 'Verified.' });
    } catch (error) {
      res.status(500).json({ error: 'Error' });
    }
  },

  login: async (req, res) => {
    const { email, password } = req.body;
    try {
      const result = await db.query(`SELECT u.*, array_agg(r.name) as roles FROM users u LEFT JOIN user_roles ur ON u.id = ur.user_id LEFT JOIN roles r ON ur.role_id = r.id WHERE u.email = $1 GROUP BY u.id`, [email]);
      if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials.' });
      const user = result.rows[0];
      if (user.status !== 'ACTIVE') return res.status(403).json({ error: 'Account not active', status: user.status, userId: user.id });
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(401).json({ error: 'Invalid credentials.' });
      const jwtSecret = await settingsService.get('jwt_secret') || process.env.JWT_SECRET || 'your_fallback_jwt_secret';
      const token = jwt.sign({ sub: user.id, email: user.email, roles: user.roles }, jwtSecret, { expiresIn: '24h' });
      delete user.password;
      res.json({ token, user });
    } catch (error) {
      console.error('[LOGIN] Error:', error.message);
      res.status(500).json({ error: 'Login error' });
    }
  },

  requestPhoneUpdate: async (req, res) => {
    const dbUserId = getDbUserId(req);
    let { phone_number } = req.body;
    if (!dbUserId || !phone_number) return res.status(400).json({ error: 'Missing info.' });
    phone_number = normalizePhone(phone_number);
    try {
      const result = await otpService.generateAndSendOtp(dbUserId, phone_number, 'phone update');
      const isAdmin = (req.user?.roles || []).includes('Admin');
      if (!isAdmin && result.gatewayResponse) delete result.gatewayResponse;
      res.json({ message: 'OTP sent.', result });
    } catch (error) {
      res.status(500).json({ error: 'Error' });
    }
  },

  confirmPhoneUpdate: async (req, res) => {
    const dbUserId = getDbUserId(req);
    let { otp, phone_number } = req.body;
    phone_number = normalizePhone(phone_number);
    try {
      const isValid = await otpService.verifyOtp(dbUserId, otp);
      if (!isValid) return res.status(400).json({ error: 'Invalid OTP.' });
      await db.query('UPDATE users SET phone_number = $1 WHERE id = $2', [phone_number, dbUserId]);
      res.json({ message: 'Phone updated.' });
    } catch (error) {
      res.status(500).json({ error: 'Error' });
    }
  },

  requestPasswordChange: async (req, res) => {
    const dbUserId = getDbUserId(req);
    try {
      const resUser = await db.query('SELECT phone_number FROM users WHERE id = $1', [dbUserId]);
      const phone = resUser.rows[0]?.phone_number;
      if (!phone) return res.status(400).json({ error: 'No phone number.' });
      const result = await otpService.generateAndSendOtp(dbUserId, phone, 'password change');
      const isAdmin = (req.user?.roles || []).includes('Admin');
      if (!isAdmin && result.gatewayResponse) delete result.gatewayResponse;
      res.json({ message: 'OTP sent.', result });
    } catch (error) {
      res.status(500).json({ error: 'Error' });
    }
  },

  confirmPasswordChange: async (req, res) => {
    const dbUserId = getDbUserId(req);
    const { otp, new_password } = req.body;
    
    const pwdCheck = validatePassword(new_password);
    if (!pwdCheck.isValid) return res.status(400).json({ error: pwdCheck.message });

    try {
      const isValid = await otpService.verifyOtp(dbUserId, otp);
      if (!isValid) return res.status(400).json({ error: 'Invalid OTP.' });
      const hashedPassword = await bcrypt.hash(new_password, 10);
      await db.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, dbUserId]);
      res.json({ message: 'Password updated.' });
    } catch (error) {
      res.status(500).json({ error: 'Error' });
    }
  },

  loginWithPhoneRequest: async (req, res) => {
    let { phone_number } = req.body;
    if (!phone_number) return res.status(400).json({ error: 'Phone number is required.' });
    phone_number = normalizePhone(phone_number);
    try {
      const result = await db.query('SELECT id FROM users WHERE phone_number = $1', [phone_number]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Phone number not registered.' });
      const user = result.rows[0];
      const otpRes = await otpService.generateAndSendOtp(user.id, phone_number, 'login');
      res.json({ message: 'OTP sent.', success: otpRes.success });
    } catch (error) {
      res.status(500).json({ error: 'Failed to send OTP.' });
    }
  },

  loginWithPhoneVerify: async (req, res) => {
    let { phone_number, otp } = req.body;
    if (!phone_number || !otp) return res.status(400).json({ error: 'Missing fields.' });
    phone_number = normalizePhone(phone_number);
    try {
      const userRes = await db.query(`SELECT u.*, array_agg(r.name) as roles FROM users u LEFT JOIN user_roles ur ON u.id = ur.user_id LEFT JOIN roles r ON ur.role_id = r.id WHERE u.phone_number = $1 GROUP BY u.id`, [phone_number]);
      if (userRes.rows.length === 0) return res.status(404).json({ error: 'User not found.' });
      const user = userRes.rows[0];
      if (user.status !== 'ACTIVE') return res.status(403).json({ error: 'Account not active', status: user.status, userId: user.id });
      const isValid = await otpService.verifyOtp(user.id, otp);
      if (!isValid) return res.status(400).json({ error: 'Invalid OTP.' });
      const jwtSecret = await settingsService.get('jwt_secret') || process.env.JWT_SECRET || 'your_fallback_jwt_secret';
      const token = jwt.sign({ sub: user.id, email: user.email, roles: user.roles }, jwtSecret, { expiresIn: '24h' });
      delete user.password;
      res.json({ token, user });
    } catch (error) {
      console.error('[LOGIN] Error:', error.message);
      res.status(500).json({ error: 'Login error' });
    }
  },

  forgotPasswordRequest: async (req, res) => {
    let { email_or_phone } = req.body;
    if (!email_or_phone) return res.status(400).json({ error: 'Email or phone required.' });
    try {
      const result = await db.query('SELECT id, phone_number FROM users WHERE email = $1 OR phone_number = $2', [email_or_phone, normalizePhone(email_or_phone)]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'User not found.' });
      const user = result.rows[0];
      if (!user.phone_number) return res.status(400).json({ error: 'No phone number associated with this account for OTP verification.' });
      const otpRes = await otpService.generateAndSendOtp(user.id, user.phone_number, 'password recovery');
      res.json({ message: 'OTP sent to your registered phone number.', success: otpRes.success });
    } catch (error) {
      res.status(500).json({ error: 'Failed to send OTP.' });
    }
  },

  forgotPasswordReset: async (req, res) => {
    let { email_or_phone, otp, new_password } = req.body;
    if (!email_or_phone || !otp || !new_password) return res.status(400).json({ error: 'Missing fields.' });
    
    const pwdCheck = validatePassword(new_password);
    if (!pwdCheck.isValid) return res.status(400).json({ error: pwdCheck.message });

    try {
      const result = await db.query('SELECT id FROM users WHERE email = $1 OR phone_number = $2', [email_or_phone, normalizePhone(email_or_phone)]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'User not found.' });
      const user = result.rows[0];
      const isValid = await otpService.verifyOtp(user.id, otp);
      if (!isValid) return res.status(400).json({ error: 'Invalid OTP.' });
      const hashedPassword = await bcrypt.hash(new_password, 10);
      await db.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, user.id]);
      res.json({ message: 'Password reset successfully.' });
    } catch (error) {
      res.status(500).json({ error: 'Reset error' });
    }
  },

  getProfile: async (req, res) => {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const result = await db.query('SELECT u.*, array_agg(r.name) as roles FROM users u LEFT JOIN user_roles ur ON u.id = ur.user_id LEFT JOIN roles r ON ur.role_id = r.id WHERE u.id = $1 GROUP BY u.id', [userId]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
      const user = result.rows[0];
      delete user.password;
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: 'Error' });
    }
  },

  getAllUsers: async (req, res) => {
    let { limit, offset } = req.query;
    limit = limit ? parseInt(limit) : 50;
    offset = offset ? parseInt(offset) : 0;
    
    try {
      let query = `SELECT u.id, u.email, u.name, u.phone_number, u.status, u.created_at, u.address, u.country, u.state, u.district, u.pincode, array_agg(r.name) as roles FROM users u LEFT JOIN user_roles ur ON u.id = ur.user_id LEFT JOIN roles r ON ur.role_id = r.id GROUP BY u.id ORDER BY u.created_at DESC LIMIT $1 OFFSET $2`;
      const result = await db.query(query, [limit, offset]);
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: 'Error' });
    }
  },

  updateUserStatus: async (req, res) => {
    const { userId, status } = req.body;
    try {
      await db.query('UPDATE users SET status = $1 WHERE id = $2', [status, userId]);
      
      // Auto-Sync Governance: Remove from all WhatsApp groups if deactivated
      if (status === 'INACTIVE' || status === 'DEACTIVATED') {
        const whatsappService = require('../services/whatsapp.service');
        const groups = await db.query(
          'SELECT g.wa_jid FROM groups g JOIN group_members gm ON g.id = gm.group_id WHERE gm.user_id = $1',
          [userId]
        );
        const userRes = await db.query('SELECT phone_number FROM users WHERE id = $1', [userId]);
        const userPhone = userRes.rows[0]?.phone_number;

        if (userPhone && whatsappService.isReady) {
          const participantId = `${userPhone}@c.us`;
          for (const g of groups.rows) {
            if (g.wa_jid) {
              try {
                await whatsappService.removeParticipant(g.wa_jid, participantId);
                console.log(`[SYNC] Removed deactivated user ${userId} from group ${g.wa_jid}`);
              } catch (err) {
                console.error(`[SYNC] Failed to remove user ${userId} from ${g.wa_jid}:`, err.message);
              }
            }
          }
        }
      }

      res.json({ message: 'Updated.' });
    } catch (error) {
      res.status(500).json({ error: 'Error' });
    }
  },

  updateProfile: async (req, res) => {
    const dbUserId = getDbUserId(req);
    let { name, phone_number, address, country, state, district, pincode } = req.body;
    phone_number = normalizePhone(phone_number);
    try {
      const result = await db.query('UPDATE users SET name = $1, phone_number = $2, address = $3, country = $4, state = $5, district = $6, pincode = $7 WHERE id = $8 RETURNING *', [name, phone_number, address, country, state, district, pincode, dbUserId]);
      if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
      const user = result.rows[0];
      delete user.password;
      res.json({ message: 'Updated.', user });
    } catch (error) {
      res.status(500).json({ error: 'Error' });
    }
  }
};

module.exports = userController;
