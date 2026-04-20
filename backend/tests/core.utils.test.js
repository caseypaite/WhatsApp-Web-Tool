const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizePhone, redactSensitive } = require('../src/utils/core.utils');

test('normalizePhone returns input when nullish', () => {
  assert.equal(normalizePhone(null), null);
  assert.equal(normalizePhone(undefined), undefined);
});

test('normalizePhone strips non-digits and prefixes 10-digit numbers with 91', () => {
  assert.equal(normalizePhone('(987) 654-3210'), '919876543210');
});

test('normalizePhone keeps non-10-digit cleaned values unchanged', () => {
  assert.equal(normalizePhone('+91 98765 43210'), '919876543210');
  assert.equal(normalizePhone('00123'), '00123');
});

test('redactSensitive returns non-object inputs unchanged', () => {
  assert.equal(redactSensitive('text'), 'text');
  assert.equal(redactSensitive(123), 123);
  assert.equal(redactSensitive(null), null);
});

test('redactSensitive redacts sensitive keys recursively and does not mutate source', () => {
  const source = {
    username: 'alice',
    password: 'secret',
    nested: {
      api_key: 'abc123',
      TOKEN: 'jwt-value',
      safe: 'ok'
    }
  };

  const redacted = redactSensitive(source);

  assert.equal(redacted.password, '[REDACTED]');
  assert.equal(redacted.nested.api_key, '[REDACTED]');
  assert.equal(redacted.nested.TOKEN, '[REDACTED]');
  assert.equal(redacted.nested.safe, 'ok');

  assert.equal(source.password, 'secret');
  assert.equal(source.nested.api_key, 'abc123');
  assert.equal(source.nested.TOKEN, 'jwt-value');
});
