const jwt = require('jsonwebtoken');
const settingsService = require('../services/settings.service');

/**
 * Middleware to check for required permissions/roles.
 * @param {string[]} requiredRoles - Array of roles allowed to access the route.
 */
const checkRole = (requiredRoles) => {
  return (req, res, next) => {
    // Check roles field in the payload
    const userRoles = req.auth?.payload?.roles || req.user?.roles || [];

    const hasRole = requiredRoles.some((role) => userRoles.includes(role));

    if (!hasRole) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have the required permissions to access this resource.',
      });
    }

    next();
  };
};

/**
 * Unified Authentication Middleware
 * Handles local JWT verification and simple auth fallback.
 */
const authenticate = async (req, res, next) => {
  const adminSecret = process.env.SIMPLE_AUTH_PASSWORD;
  const providedSecret = req.headers['x-simple-auth'];

  // Simple Auth (e.g. for development or special scripts)
  if (providedSecret && providedSecret === adminSecret) {
    req.user = { id: 0, email: 'admin@simpleauth.local', roles: ['Admin'] };
    req.auth = { payload: { sub: 0, email: 'admin@simpleauth.local', roles: ['Admin'] } };
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Authorization header missing' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const jwtSecret = await settingsService.get('jwt_secret') || process.env.JWT_SECRET || 'your_fallback_jwt_secret';
    const decoded = jwt.verify(token, jwtSecret);
    
    console.log('[AUTH] Token verified for:', decoded.email);
    
    req.user = { id: decoded.sub, email: decoded.email, roles: decoded.roles };
    req.auth = { payload: decoded };
    return next();
  } catch (err) {
    console.error('[AUTH] Token verification failed:', err.message);
    return res.status(401).json({ error: 'Unauthorized', message: 'Invalid or expired token' });
  }
};

module.exports = {
  checkRole,
  authenticate
};
