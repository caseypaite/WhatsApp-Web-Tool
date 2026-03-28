/**
 * Core Utility Matrix for AppStack Backend
 */

/**
 * Normalizes phone numbers to international standard (91 prefix for 10 digits)
 */
const normalizePhone = (phone) => {
  if (!phone) return phone;
  const cleaned = phone.toString().replace(/\D/g, '');
  if (cleaned.length === 10) return '91' + cleaned;
  return cleaned;
};

/**
 * Redacts sensitive keys from objects for logging
 */
const redactSensitive = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  const sensitiveKeys = ['password', 'token', 'jwt_secret', 'api_key', 'gemini_api_key', 'mistral_api_key'];
  const newObj = { ...obj };
  
  Object.keys(newObj).forEach(key => {
    if (sensitiveKeys.includes(key.toLowerCase())) {
      newObj[key] = '[REDACTED]';
    } else if (typeof newObj[key] === 'object') {
      newObj[key] = redactSensitive(newObj[key]);
    }
  });
  
  return newObj;
};

module.exports = {
  normalizePhone,
  redactSensitive
};
