const test = require('node:test');
const assert = require('node:assert/strict');
const { validatePassword, normalizePhoneNumber } = require('../src/utils/validators');

test('validatePassword rejects short passwords', () => {
  const result = validatePassword('Ab1@xy');
  assert.equal(result.isValid, false);
  assert.equal(result.message, 'Password must be at least 8 characters long.');
});

test('validatePassword validates each required character category', () => {
  assert.equal(validatePassword('lower123@').message, 'Password must contain at least one uppercase letter.');
  assert.equal(validatePassword('UPPER123@').message, 'Password must contain at least one lowercase letter.');
  assert.equal(validatePassword('NoNumber@').message, 'Password must contain at least one number.');
  assert.equal(validatePassword('NoSpecial123').message, 'Password must contain at least one special character (@$!%*?&#).');
});

test('validatePassword accepts strong password', () => {
  const result = validatePassword('ValidPass@123');
  assert.equal(result.isValid, true);
  assert.equal(result.message, 'Password is valid.');
});

test('normalizePhoneNumber returns null for empty values', () => {
  assert.equal(normalizePhoneNumber(null), null);
  assert.equal(normalizePhoneNumber(undefined), null);
});

test('normalizePhoneNumber cleans number and adds country code for 10-digit values', () => {
  assert.equal(normalizePhoneNumber('98765 43210'), '919876543210');
  assert.equal(normalizePhoneNumber('+91-98765-43210'), '919876543210');
});

test('normalizePhoneNumber keeps already-expanded digit sequences', () => {
  assert.equal(normalizePhoneNumber('009876543210'), '009876543210');
});
