const express = require('express');
const router = express.Router();
const systemController = require('../controllers/system.controller');
const { authenticate, checkRole } = require('../middleware/auth.middleware');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

// Setup specialized multer for system updates (allows .tar.gz)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'update-' + uniqueSuffix + '.tar.gz');
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.originalname.endsWith('.tar.gz') || file.mimetype === 'application/x-gzip' || file.mimetype === 'application/gzip') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only .tar.gz release packages are accepted.'));
    }
  },
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit for updates
});

/**
 * Public/User Routes
 */
router.get('/status', (req, res) => systemController.getSystemStatus(req, res));
router.get('/version-history', (req, res) => systemController.getVersionHistory(req, res));

/**
 * Admin Protected Routes
 */
router.post('/update', authenticate, checkRole(['Admin']), upload.single('package'), (req, res) => systemController.performUpdate(req, res));

module.exports = router;
