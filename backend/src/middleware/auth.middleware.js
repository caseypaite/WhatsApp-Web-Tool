const { auth } = require('express-oauth2-jwt-bearer');

/**
 * Validates the Auth0 JWT.
 */
let checkJwt;

if (process.env.AUTH0_AUDIENCE && process.env.AUTH0_ISSUER_BASE_URL) {
  checkJwt = auth({
    audience: process.env.AUTH0_AUDIENCE,
    issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
  });
} else {
  // If Auth0 is not configured, we provide a placeholder middleware.
  // This allows the server to start even without configuration.
  checkJwt = (req, res, next) => {
    console.warn('Auth0 is not configured. Skipping JWT check.');
    next();
  };
}

/**
 * Middleware to check for required permissions/roles.
 * @param {string[]} requiredRoles - Array of roles allowed to access the route.
 */
const checkRole = (requiredRoles) => {
  return (req, res, next) => {
    // Check both standard roles field and Auth0 custom claim
    const userRoles = req.auth?.payload?.['https://appstack.com/roles'] || req.auth?.payload?.roles || [];

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
 * Simple Authentication Fallback.
 * Checks for a specific header if Auth0 is not yet configured.
 */
const simpleAuth = (req, res, next) => {
  const adminSecret = process.env.SIMPLE_AUTH_PASSWORD;
  const providedSecret = req.headers['x-simple-auth'];

  if (providedSecret && providedSecret === adminSecret) {
    req.auth = { payload: { 'https://appstack.com/roles': ['Admin'] } };
    return next();
  }
  
  // If not simple auth, proceed to checkJwt if it's defined and correctly called
  next();
};

const jwt = require('jsonwebtoken');
const settingsService = require('../services/settings.service');

/**
 * Unified Authentication Middleware
 */
const authenticate = async (req, res, next) => {
  const adminSecret = process.env.SIMPLE_AUTH_PASSWORD;
  const providedSecret = req.headers['x-simple-auth'];

  if (providedSecret && providedSecret === adminSecret) {
    req.user = { id: 0, email: 'admin@simpleauth.local', roles: ['Admin'] };
    req.auth = { payload: { sub: 0, email: 'admin@simpleauth.local', roles: ['Admin'], 'https://appstack.com/roles': ['Admin'] } };
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return checkJwt(req, res, next);
  }

  const token = authHeader.split(' ')[1];
  try {
    const jwtSecret = await settingsService.get('jwt_secret') || process.env.JWT_SECRET || 'your_fallback_jwt_secret';
    const decoded = jwt.verify(token, jwtSecret);
    req.user = { id: decoded.sub, email: decoded.email, roles: decoded.roles };
    req.auth = { payload: decoded };
    return next();
  } catch (err) {
    // If local verification fails, try checkJwt (Auth0)
    return checkJwt(req, res, next);
  }
};

module.exports = {
  checkJwt,
  checkRole,
  simpleAuth,
  authenticate
};
