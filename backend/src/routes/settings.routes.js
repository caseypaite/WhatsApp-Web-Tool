const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settings.controller');
const { checkJwt, checkRole } = require('../middleware/auth.middleware');
const settingsService = require('../services/settings.service');
const jwt = require('jsonwebtoken');

/**
 * Middleware to support both Auth0 and local JWT.
 * Duplicated here to avoid circular dependencies if any, 
 * but usually better to have in a separate file.
 */
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return checkJwt(req, res, next);

  const token = authHeader.split(' ')[1];
  try {
    const jwtSecret = await settingsService.get('jwt_secret') || process.env.JWT_SECRET || 'your_fallback_jwt_secret';
    const decoded = jwt.verify(token, jwtSecret);
    req.user = { id: decoded.sub, email: decoded.email, roles: decoded.roles };
    req.auth = { payload: decoded };
    next();
  } catch (err) {
    checkJwt(req, res, next);
  }
};

/**
 * Public Routes
 */
router.get('/public', settingsController.getPublicConfig);

/**
 * Protected Admin Routes
 */
router.get('/all', authenticate, checkRole(['Admin']), settingsController.getAll);
router.put('/update', authenticate, checkRole(['Admin']), settingsController.update);
router.post('/test-otp', authenticate, checkRole(['Admin']), settingsController.testOtp);

module.exports = router;
