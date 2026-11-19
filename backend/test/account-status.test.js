process.env.NODE_ENV = 'test';
const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const { createAuthenticate } = require('../src/middleware/auth.middleware');
const { createSocketAuth } = require('../src/sockets/socket-auth');
const { assertAccountActive } = require('../src/services/account-status');

const SECRET = 'test-secret';
const quiet = { error() {} };

const usersDb = (users) => ({
  async query(_sql, [id]) {
    return [users.filter((u) => u.id === id)];
  },
});

const users = [
  { id: 1, name: 'Active', email: 'a@test', role: 'customer', status: 'active', is_verified: 1 },
  { id: 2, name: 'Suspended', email: 's@test', role: 'provider', status: 'suspended', is_verified: 1 },
];

// Runs the middleware and reports what it did
async function callMiddleware(token, db = usersDb(users)) {
  const authenticate = createAuthenticate({ db: () => db, secret: () => SECRET });
  const req = { headers: token ? { authorization: `Bearer ${token}` } : {} };
  const outcome = {};
  const res = {
    status(code) {
      outcome.status = code;
      return this;
    },
    json(body) {
      outcome.body = body;
      return this;
    },
  };
  await authenticate(req, res, (err) => {
    outcome.nextCalled = true;
    outcome.error = err;
  });
  return { ...outcome, user: req.user };
}

test('an active user is authenticated', async () => {
  const result = await callMiddleware(jwt.sign({ id: 1 }, SECRET));
  assert.equal(result.nextCalled, true);
  assert.equal(result.error, undefined);
  assert.equal(result.user.id, 1);
});

test('a suspended user is refused even with a token issued before the suspension', async () => {
  const result = await callMiddleware(jwt.sign({ id: 2 }, SECRET));
  assert.equal(result.error?.statusCode, 403);
  assert.equal(result.user, undefined);
});

test('missing, invalid and expired tokens are rejected with 401', async () => {
  assert.equal((await callMiddleware(null)).status, 401);
  assert.equal((await callMiddleware(jwt.sign({ id: 1 }, 'wrong-secret'))).status, 401);
  const expired = await callMiddleware(jwt.sign({ id: 1, exp: Math.floor(Date.now() / 1000) - 60 }, SECRET));
  assert.deepEqual([expired.status, expired.body.error], [401, 'Token expired']);
});

test('a token for a deleted user is rejected', async () => {
  assert.equal((await callMiddleware(jwt.sign({ id: 99 }, SECRET))).status, 401);
});

test('a database error is passed on instead of being reported as a bad token', async () => {
  const failing = { query: async () => Promise.reject(new Error('db down')) };
  const result = await callMiddleware(jwt.sign({ id: 1 }, SECRET), failing);
  assert.equal(result.error?.message, 'db down');
});

test('account status checks fail closed', () => {
  assert.doesNotThrow(() => assertAccountActive({ status: 'active' }));
  for (const user of [{ status: 'suspended' }, {}, null]) {
    assert.throws(() => assertAccountActive(user), (err) => err.statusCode === 403);
  }
});

// --- socket handshake ------------------------------------------------------

async function handshake(token, db = usersDb(users)) {
  const socket = { handshake: { auth: token ? { token } : {} } };
  const error = await new Promise((resolve) => createSocketAuth({ db, secret: SECRET, logger: quiet })(socket, resolve));
  return { socket, error };
}

test('sockets connect for active users with the role from the database', async () => {
  const { socket, error } = await handshake(jwt.sign({ id: 1, role: 'admin' }, SECRET));
  assert.equal(error, undefined);
  assert.equal(socket.userId, 1);
  assert.equal(socket.userRole, 'customer', 'a role claim in the token is not trusted');
});

test('sockets are refused for suspended users and bad tokens', async () => {
  assert.match((await handshake(jwt.sign({ id: 2 }, SECRET))).error.message, /unavailable/);
  assert.match((await handshake(jwt.sign({ id: 99 }, SECRET))).error.message, /unavailable/);
  assert.match((await handshake(jwt.sign({ id: 1 }, 'wrong-secret'))).error.message, /Invalid token/);
  assert.match((await handshake(null)).error.message, /required/);
});
