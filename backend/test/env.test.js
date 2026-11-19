const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const ENV_MODULE = path.join(__dirname, '..', 'src', 'config', 'env.js');
const strong = (c) => c.repeat(40);

// Load config/env.js in a clean process with exactly these variables
function loadEnv(vars) {
  const env = { PATH: process.env.PATH, SystemRoot: process.env.SystemRoot, DOTENV_CONFIG_PATH: 'nonexistent.env', ...vars };
  return spawnSync(process.execPath, ['-e', `const c = require(${JSON.stringify(ENV_MODULE)}); console.log(c.jwt.secret.length)`], {
    env,
    encoding: 'utf8',
    cwd: __dirname,
  });
}

test('production refuses to start without JWT secrets', () => {
  const result = loadEnv({ NODE_ENV: 'production' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /JWT_SECRET must be set/);
});

test('the old predictable fallbacks and placeholders are rejected', () => {
  for (const secret of ['dev_secret', 'your_jwt_secret_here', 'short']) {
    const result = loadEnv({ NODE_ENV: 'production', JWT_SECRET: secret, JWT_REFRESH_SECRET: strong('r') });
    assert.notEqual(result.status, 0, secret);
  }
});

test('access and refresh secrets must differ', () => {
  const result = loadEnv({ NODE_ENV: 'production', JWT_SECRET: strong('a'), JWT_REFRESH_SECRET: strong('a') });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /must be different/);
});

test('production starts with strong secrets', () => {
  const result = loadEnv({ NODE_ENV: 'production', JWT_SECRET: strong('a'), JWT_REFRESH_SECRET: strong('b') });
  assert.equal(result.status, 0, result.stderr);
});

test('development without secrets uses a random value, never a fixed one', () => {
  const first = loadEnv({ NODE_ENV: 'development' });
  assert.equal(first.status, 0, first.stderr);
  assert.equal(first.stdout.trim(), '96');
});
