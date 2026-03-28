require('dotenv').config();
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const cookieParser = require('cookie-parser');

const cmsRoutes = require('./routes/cms.routes');
const userRoutes = require('./routes/user.routes');
const settingsRoutes = require('./routes/settings.routes');
const whatsappRoutes = require('./routes/whatsapp.routes');
const templateRoutes = require('./routes/template.routes');
const responderRoutes = require('./routes/responder.routes');
const scheduledRoutes = require('./routes/scheduled.routes');
const auditRoutes = require('./routes/audit.routes');
const pollRoutes = require('./routes/poll.routes');

const whatsappService = require('./services/whatsapp.service');
const schedulerService = require('./services/scheduler.service');

const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// Security Middleware
app.set('trust proxy', 1);
app.use(compression());
app.use(cookieParser());

// Basic IP-based Rate Limiter (Protects against automated brute-force)
const globalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'High traffic detected node-side. Access restricted for 15 minutes.' }
});

app.use('/api', globalApiLimiter);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer Setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'audio/mpeg', 'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword', 'text/plain'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsafe file type rejected. Allowed: Images, Videos, Audio, PDF, Docs, Text.'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Initialize WhatsApp
whatsappService.initialize();
// Start Scheduler
schedulerService.start();

// CORS Middleware
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : [];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || (process.env.NODE_ENV === 'development' && allowedOrigins.length === 0)) {
      callback(null, true);
    } else {
      if (process.env.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-simple-auth', 'x-api-key'],
  credentials: true
}));

app.use(express.json());

// Hardened static serving for uploads (Disable script execution)
app.use('/uploads', (req, res, next) => {
  res.setHeader('Content-Security-Policy', "default-src 'none'; img-src 'self'; media-src 'self'; style-src 'self';");
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
}, express.static(path.join(__dirname, '../uploads')));

// Request Logging
app.use((req, res, next) => {
  if (req.url.startsWith('/api')) {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  }
  next();
});

// Routes
app.use('/api/cms', cmsRoutes);
app.use('/api/user', userRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/responders', responderRoutes);
app.use('/api/scheduled', scheduledRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/polls', pollRoutes);

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

// 404 Handler for API
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not Found', url: req.url });
});

// Serve static frontend files from the 'frontend' directory
const frontendPath = path.join(__dirname, '../../frontend');
app.use(express.static(frontendPath));

// Handle SPAs
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'), (err) => {
    if (err) {
      res.status(404).json({ error: 'Frontend not built or index.html missing', url: req.url });
    }
  });
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
