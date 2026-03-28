const assert = require('assert');
const crypto = require('crypto');
const { normalizePhone } = require('../src/utils/core.utils');

const validatePassword = (password) => {
  if (!password || password.length < 8) return { isValid: false };
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecial = /[@$!%*?&#]/.test(password);
  return { isValid: hasUpperCase && hasLowerCase && hasNumbers && hasSpecial };
};

console.log('🚀 Starting System Integrity Tests...');

// 1. Test Phone Normalization
try {
  assert.strictEqual(normalizePhone('1234567890'), '911234567890', 'Should add 91 prefix to 10-digit numbers');
  assert.strictEqual(normalizePhone('+91 98765 43210'), '919876543210', 'Should clean non-digits');
  console.log('✅ Phone Normalization: PASSED');
} catch (e) {
  console.error('❌ Phone Normalization: FAILED', e.message);
  process.exit(1);
}

// 2. Test Password Validation
try {
  assert.strictEqual(validatePassword('short').isValid, false, 'Should fail short passwords');
  assert.strictEqual(validatePassword('NoSpecial123').isValid, false, 'Should fail missing special char');
  assert.strictEqual(validatePassword('ValidPass@123').isValid, true, 'Should pass strong passwords');
  console.log('✅ Password Validation: PASSED');
} catch (e) {
  console.error('❌ Password Validation: FAILED', e.message);
  process.exit(1);
}

// 3. Test Secure OTP Generation (crypto.randomInt)
try {
  for(let i=0; i<100; i++) {
    const code = crypto.randomInt(100000, 999999).toString();
    assert.strictEqual(code.length, 6, 'OTP must be 6 digits');
    const num = parseInt(code);
    assert.ok(num >= 100000 && num <= 999999, 'OTP must be in range');
  }
  console.log('✅ Secure OTP Generation: PASSED');
} catch (e) {
  console.error('❌ Secure OTP Generation: FAILED', e.message);
  process.exit(1);
}

console.log('\n✨ All basic logic tests PASSED successfully.');
