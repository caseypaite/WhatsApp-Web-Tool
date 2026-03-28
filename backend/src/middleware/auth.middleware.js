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
  const providedApiKey = req.headers['x-api-key'];

  // 1. Simple Auth (Development Only)
  if (process.env.NODE_ENV !== 'production' && providedSecret && providedSecret === adminSecret) {
    req.user = { id: 0, email: 'admin@simpleauth.local', roles: ['Admin'] };
    req.auth = { payload: { sub: 0, email: 'admin@simpleauth.local', roles: ['Admin'] } };
    return next();
  }

  // 2. API Key Auth
  if (providedApiKey) {
    const configuredApiKey = await settingsService.get('api_key');
    if (configuredApiKey && providedApiKey === configuredApiKey) {
      req.user = { id: 0, email: 'api-user@system.local', roles: ['Admin'] };
      req.auth = { payload: { sub: 0, email: 'api-user@system.local', roles: ['Admin'] } };
      return next();
    }
    return res.status(401).json({ error: 'Unauthorized', message: 'Invalid API Key' });
  }
// 3. JWT Auth
const authHeader = req.headers['authorization'];
const cookieToken = req.cookies?.token;

if (!authHeader && !cookieToken) {
  return res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
}

const token = cookieToken || authHeader.split(' ')[1];
try {
    const jwtSecret = await settingsService.get('jwt_secret');
    if (!jwtSecret) {
      console.error('[AUTH] CRITICAL: JWT_SECRET not configured.');
      return res.status(500).json({ error: 'Internal Server Error', message: 'Auth security failure' });
    }
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
