/**
 * Validates password strength based on system policy.
 * Rules:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character (@$!%*?&#)
 * @param {string} password 
 * @returns {Object} { isValid: boolean, message: string }
 */
const validatePassword = (password) => {
  if (!password || password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long.' };
  }
  
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecial = /[@$!%*?&#]/.test(password);

  if (!hasUpperCase) return { isValid: false, message: 'Password must contain at least one uppercase letter.' };
  if (!hasLowerCase) return { isValid: false, message: 'Password must contain at least one lowercase letter.' };
  if (!hasNumbers) return { isValid: false, message: 'Password must contain at least one number.' };
  if (!hasSpecial) return { isValid: false, message: 'Password must contain at least one special character (@$!%*?&#).' };

  return { isValid: true, message: 'Password is valid.' };
};

/**
 * Normalizes a phone number for WhatsApp.
 * - Removes non-digit characters.
 * - Appends '91' if it's a 10-digit number.
 * @param {string} phone 
 * @returns {string} Normalized phone number digits (e.g., 919560436836)
 */
const normalizePhoneNumber = (phone) => {
  if (!phone) return null;
  
  // Remove all non-digit characters
  let cleaned = phone.toString().replace(/\D/g, '');
  
  // If it's 10 digits, assume India (91)
  if (cleaned.length === 10) {
    cleaned = '91' + cleaned;
  }
  
  return cleaned;
};

module.exports = {
  validatePassword,
  normalizePhoneNumber
};
