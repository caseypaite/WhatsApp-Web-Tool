require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cmsRoutes = require('./routes/cms.routes');
const userRoutes = require('./routes/user.routes');
const settingsRoutes = require('./routes/settings.routes');
const whatsappRoutes = require('./routes/whatsapp.routes');
const templateRoutes = require('./routes/template.routes');
const whatsappService = require('./services/whatsapp.service');
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Multer Setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, '/home/ubuntu/AppStack/backend/uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Initialize WhatsApp
whatsappService.initialize();

// Middleware
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['https://app.kcdev.qzz.io', 'http://localhost:3081', 'http://localhost:3001', 'http://localhost:3085'];

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-simple-auth']
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Request Logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/cms', cmsRoutes);
app.use('/api/user', userRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/templates', templateRoutes);

// Upload Endpoint
const { authenticate, checkRole } = require('./middleware/auth.middleware');
app.post('/api/upload', authenticate, checkRole(['Admin']), (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      console.error('[UPLOAD] Multer error:', err);
      return res.status(500).json({ error: 'Multer error', details: err.message });
    }
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    
    console.log('[UPLOAD] File received:', req.file.filename);
    
    // Construct full URL
    const domain = process.env.WEBSITE_DOMAIN || `localhost:${PORT}`;
    const protocol = domain.includes('localhost') ? 'http' : 'https';
    const baseUrl = domain.startsWith('http') ? domain : `${protocol}://${domain}`;
    const cleanBaseUrl = baseUrl.replace(/\/api$/, '');
    const fileUrl = `${cleanBaseUrl}/uploads/${req.file.filename}`;
    
    res.json({ url: fileUrl, filename: req.file.filename, type: req.file.mimetype });
  });
});

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'up' });
});

// Mock Registration route to trigger OTP (Demonstration)
app.post('/api/register', async (req, res) => {
  const { userId, phoneNumber } = req.body;
  const otpService = require('./services/otp.service');
  
  try {
    await otpService.generateAndSendOtp(userId, phoneNumber);
    res.json({ message: 'User registered and OTP sent.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 404 Handler
app.use((req, res, next) => {
  console.log(`[404] Unhandled request: ${req.method} ${req.url}`);
  res.status(404).json({ error: 'Not Found', url: req.url });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message,
    error: process.env.NODE_ENV === 'development' ? err : {},
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
