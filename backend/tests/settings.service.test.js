const test = require('node:test');
const assert = require('node:assert/strict');

const dbPath = require.resolve('../src/config/db');
const servicePath = require.resolve('../src/services/settings.service');

const loadServiceWithDbMock = (dbMock) => {
  delete require.cache[servicePath];
  delete require.cache[dbPath];
  require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: dbMock };
  return require(servicePath);
};

const withEnv = (overrides, fn) => {
  const previous = {};
  for (const key of Object.keys(overrides)) {
    previous[key] = process.env[key];
    if (overrides[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = overrides[key];
    }
  }

  return Promise.resolve()
    .then(fn)
    .finally(() => {
      for (const key of Object.keys(previous)) {
        if (previous[key] === undefined) delete process.env[key];
        else process.env[key] = previous[key];
      }
    });
};

test('get returns cached value without querying db', async () => {
  let calls = 0;
  const service = loadServiceWithDbMock({
    query: async () => {
      calls += 1;
      return { rows: [] };
    }
  });

  service.cache.site_name = 'Cached Site';
  const result = await service.get('site_name');

  assert.equal(result, 'Cached Site');
  assert.equal(calls, 0);
});

test('get returns db value and caches it', async () => {
  const service = loadServiceWithDbMock({
    query: async () => ({ rows: [{ value: 'from-db' }] })
  });

  const result = await service.get('website_domain');

  assert.equal(result, 'from-db');
  assert.equal(service.cache.website_domain, 'from-db');
});

test('get falls back to critical env keys when db has no value', async () => {
  await withEnv({ JWT_SECRET: 'jwt-fallback', SIMPLE_AUTH_PASSWORD: 'simple-fallback' }, async () => {
    const service = loadServiceWithDbMock({ query: async () => ({ rows: [] }) });

    assert.equal(await service.get('jwt_secret'), 'jwt-fallback');
    assert.equal(await service.get('simple_auth_password'), 'simple-fallback');
  });
});

test('get falls back to uppercased env key and caches non-critical settings', async () => {
  await withEnv({ WEBSITE_DOMAIN: 'env.example.com' }, async () => {
    const service = loadServiceWithDbMock({ query: async () => ({ rows: [] }) });

    const value = await service.get('website_domain');
    assert.equal(value, 'env.example.com');
    assert.equal(service.cache.website_domain, 'env.example.com');
  });
});

test('get gracefully handles db errors with env fallback', async () => {
  await withEnv({ JWT_SECRET: 'jwt-err', WEBSITE_DOMAIN: 'env-on-error' }, async () => {
    const service = loadServiceWithDbMock({
      query: async () => {
        throw new Error('db unavailable');
      }
    });

    assert.equal(await service.get('jwt_secret'), 'jwt-err');
    assert.equal(await service.get('website_domain'), 'env-on-error');
  });
});

test('getAll combines db values and env fallbacks with is_fallback flags', async () => {
  await withEnv({ WEBSITE_DOMAIN: 'env.example.com', OTP_ENABLED: 'true' }, async () => {
    const service = loadServiceWithDbMock({
      query: async () => ({
        rows: [
          { key: 'site_name', value: 'DB Site' },
          { key: 'api_key', value: 'db-api-key' }
        ]
      })
    });

    const all = await service.getAll();
    const siteName = all.find((item) => item.key === 'site_name');
    const websiteDomain = all.find((item) => item.key === 'website_domain');
    const apiKey = all.find((item) => item.key === 'api_key');

    assert.deepEqual(siteName, { key: 'site_name', value: 'DB Site', is_fallback: false });
    assert.deepEqual(apiKey, { key: 'api_key', value: 'db-api-key', is_fallback: false });
    assert.deepEqual(websiteDomain, { key: 'website_domain', value: 'env.example.com', is_fallback: true });
  });
});

test('set writes to db and updates cache', async () => {
  let queryText;
  let queryParams;

  const service = loadServiceWithDbMock({
    query: async (text, params) => {
      queryText = text;
      queryParams = params;
      return { rows: [] };
    }
  });

  await service.set('site_name', 'New Site');

  assert.ok(queryText.includes('INSERT INTO system_settings'));
  assert.deepEqual(queryParams, ['site_name', 'New Site']);
  assert.equal(service.cache.site_name, 'New Site');
});
