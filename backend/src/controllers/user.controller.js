const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const otpService = require('../services/otp.service');
const settingsService = require('../services/settings.service');

const JWT_SECRET = process.env.JWT_SECRET || 'your_fallback_jwt_secret';

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
      const result = await otpService.generateAndSendOtp(null, phone_number);
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
    phone_number = normalizePhone(phone_number);
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    try {
      await client.connect();
      const isValid = await otpService.verifyOtp(phone_number, otp);
      if (!isValid) return res.status(400).json({ error: 'Invalid OTP.' });
      const checkUser = await client.query('SELECT * FROM users WHERE email = $1', [email]);
      if (checkUser.rows.length > 0) return res.status(400).json({ error: 'User exists.' });
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await client.query(
        'INSERT INTO users (email, password, name, phone_number, status, address, country, state, district, pincode) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id, email, name, status',
        [email, hashedPassword, name || '', phone_number, 'PENDING_APPROVAL', address || '', country || '', state || '', district || '', pincode || '']
      );
      const user = result.rows[0];
      const roleResult = await client.query("SELECT id FROM roles WHERE name = 'User'");
      if (roleResult.rows.length > 0) await client.query('INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)', [user.id, roleResult.rows[0].id]);
      res.status(201).json({ message: 'Registration successful!', user: { id: user.id, email: user.email, status: user.status } });
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    } finally {
      await client.end();
    }
  },

  verifyRegistration: async (req, res) => {
    const { userId, otp } = req.body;
    try {
      const isValid = await otpService.verifyOtp(userId, otp);
      if (!isValid) return res.status(400).json({ error: 'Invalid OTP.' });
      const client = new Client({ connectionString: process.env.DATABASE_URL });
      await client.connect();
      await client.query("UPDATE users SET status = 'PENDING_APPROVAL' WHERE id = $1", [userId]);
      await client.end();
      res.json({ message: 'Verified.' });
    } catch (error) {
      res.status(500).json({ error: 'Error' });
    }
  },

  login: async (req, res) => {
    const { email, password } = req.body;
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    try {
      await client.connect();
      const result = await client.query(`SELECT u.*, array_agg(r.name) as roles FROM users u LEFT JOIN user_roles ur ON u.id = ur.user_id LEFT JOIN roles r ON ur.role_id = r.id WHERE u.email = $1 GROUP BY u.id`, [email]);
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
      res.status(500).json({ error: 'Login error' });
    } finally {
      await client.end();
    }
  },

  requestPhoneUpdate: async (req, res) => {
    const dbUserId = getDbUserId(req);
    let { phone_number } = req.body;
    if (!dbUserId || !phone_number) return res.status(400).json({ error: 'Missing info.' });
    phone_number = normalizePhone(phone_number);
    try {
      const result = await otpService.generateAndSendOtp(dbUserId, phone_number);
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
      const client = new Client({ connectionString: process.env.DATABASE_URL });
      await client.connect();
      await client.query('UPDATE users SET phone_number = $1 WHERE id = $2', [phone_number, dbUserId]);
      await client.end();
      res.json({ message: 'Phone updated.' });
    } catch (error) {
      res.status(500).json({ error: 'Error' });
    }
  },

  requestPasswordChange: async (req, res) => {
    const dbUserId = getDbUserId(req);
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    try {
      await client.connect();
      const resUser = await client.query('SELECT phone_number FROM users WHERE id = $1', [dbUserId]);
      const phone = resUser.rows[0]?.phone_number;
      if (!phone) return res.status(400).json({ error: 'No phone number.' });
      const result = await otpService.generateAndSendOtp(dbUserId, phone);
      const isAdmin = (req.user?.roles || []).includes('Admin');
      if (!isAdmin && result.gatewayResponse) delete result.gatewayResponse;
      res.json({ message: 'OTP sent.', result });
    } catch (error) {
      res.status(500).json({ error: 'Error' });
    } finally {
      await client.end();
    }
  },

  confirmPasswordChange: async (req, res) => {
    const dbUserId = getDbUserId(req);
    const { otp, new_password } = req.body;
    try {
      const isValid = await otpService.verifyOtp(dbUserId, otp);
      if (!isValid) return res.status(400).json({ error: 'Invalid OTP.' });
      const hashedPassword = await bcrypt.hash(new_password, 10);
      const client = new Client({ connectionString: process.env.DATABASE_URL });
      await client.connect();
      await client.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, dbUserId]);
      await client.end();
      res.json({ message: 'Password updated.' });
    } catch (error) {
      res.status(500).json({ error: 'Error' });
    }
  },

  loginWithPhoneRequest: async (req, res) => {
    let { phone_number } = req.body;
    if (!phone_number) return res.status(400).json({ error: 'Phone number is required.' });
    phone_number = normalizePhone(phone_number);
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    try {
      await client.connect();
      const result = await client.query('SELECT id FROM users WHERE phone_number = $1', [phone_number]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Phone number not registered.' });
      const user = result.rows[0];
      const otpRes = await otpService.generateAndSendOtp(user.id, phone_number);
      res.json({ message: 'OTP sent.', success: otpRes.success });
    } catch (error) {
      res.status(500).json({ error: 'Failed to send OTP.' });
    } finally {
      await client.end();
    }
  },

  loginWithPhoneVerify: async (req, res) => {
    let { phone_number, otp } = req.body;
    if (!phone_number || !otp) return res.status(400).json({ error: 'Missing fields.' });
    phone_number = normalizePhone(phone_number);
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    try {
      await client.connect();
      const userRes = await client.query(`SELECT u.*, array_agg(r.name) as roles FROM users u LEFT JOIN user_roles ur ON u.id = ur.user_id LEFT JOIN roles r ON ur.role_id = r.id WHERE u.phone_number = $1 GROUP BY u.id`, [phone_number]);
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
      res.status(500).json({ error: 'Login error' });
    } finally {
      await client.end();
    }
  },

  forgotPasswordRequest: async (req, res) => {
    let { email_or_phone } = req.body;
    if (!email_or_phone) return res.status(400).json({ error: 'Email or phone required.' });
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    try {
      await client.connect();
      const result = await client.query('SELECT id, phone_number FROM users WHERE email = $1 OR phone_number = $2', [email_or_phone, normalizePhone(email_or_phone)]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'User not found.' });
      const user = result.rows[0];
      if (!user.phone_number) return res.status(400).json({ error: 'No phone number associated with this account for OTP verification.' });
      const otpRes = await otpService.generateAndSendOtp(user.id, user.phone_number);
      res.json({ message: 'OTP sent to your registered phone number.', success: otpRes.success });
    } catch (error) {
      res.status(500).json({ error: 'Failed to send OTP.' });
    } finally {
      await client.end();
    }
  },

  forgotPasswordReset: async (req, res) => {
    let { email_or_phone, otp, new_password } = req.body;
    if (!email_or_phone || !otp || !new_password) return res.status(400).json({ error: 'Missing fields.' });
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    try {
      await client.connect();
      const result = await client.query('SELECT id FROM users WHERE email = $1 OR phone_number = $2', [email_or_phone, normalizePhone(email_or_phone)]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'User not found.' });
      const user = result.rows[0];
      const isValid = await otpService.verifyOtp(user.id, otp);
      if (!isValid) return res.status(400).json({ error: 'Invalid OTP.' });
      const hashedPassword = await bcrypt.hash(new_password, 10);
      await client.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, user.id]);
      res.json({ message: 'Password reset successfully.' });
    } catch (error) {
      res.status(500).json({ error: 'Reset error' });
    } finally {
      await client.end();
    }
  },

  getProfile: async (req, res) => {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    try {
      await client.connect();
      const result = await client.query('SELECT u.*, array_agg(r.name) as roles FROM users u LEFT JOIN user_roles ur ON u.id = ur.user_id LEFT JOIN roles r ON ur.role_id = r.id WHERE u.id = $1 GROUP BY u.id', [userId]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
      const user = result.rows[0];
      delete user.password;
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: 'Error' });
    } finally {
      await client.end();
    }
  },

  getAllUsers: async (req, res) => {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    try {
      await client.connect();
      const result = await client.query(`SELECT u.id, u.email, u.name, u.phone_number, u.status, u.created_at, u.address, u.country, u.state, u.district, u.pincode, array_agg(r.name) as roles FROM users u LEFT JOIN user_roles ur ON u.id = ur.user_id LEFT JOIN roles r ON ur.role_id = r.id GROUP BY u.id ORDER BY u.created_at DESC`);
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: 'Error' });
    } finally {
      await client.end();
    }
  },

  updateUserStatus: async (req, res) => {
    const { userId, status } = req.body;
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    try {
      await client.connect();
      await client.query('UPDATE users SET status = $1 WHERE id = $2', [status, userId]);
      res.json({ message: 'Updated.' });
    } catch (error) {
      res.status(500).json({ error: 'Error' });
    } finally {
      await client.end();
    }
  },

  updateProfile: async (req, res) => {
    const dbUserId = getDbUserId(req);
    let { name, phone_number, address, country, state, district, pincode } = req.body;
    phone_number = normalizePhone(phone_number);
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    try {
      await client.connect();
      const result = await client.query('UPDATE users SET name = $1, phone_number = $2, address = $3, country = $4, state = $5, district = $6, pincode = $7 WHERE id = $8 RETURNING *', [name, phone_number, address, country, state, district, pincode, dbUserId]);
      if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
      const user = result.rows[0];
      delete user.password;
      res.json({ message: 'Updated.', user });
    } catch (error) {
      res.status(500).json({ error: 'Error' });
    } finally {
      await client.end();
    }
  }
};

module.exports = userController;
