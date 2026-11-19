const jwt = require('jsonwebtoken');
const { assertAccountActive } = require('../services/account-status');

/**
 * The user row is re-read on every request, so suspending an account takes
 * effect immediately even for access tokens issued before the suspension.
 */
function createAuthenticate({ db, secret }) {
  return async function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, secret());
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired' });
      }
      return res.status(401).json({ error: 'Invalid token' });
    }

    try {
      const [rows] = await db().query('SELECT id, name, email, role, status, is_verified FROM users WHERE id = ?', [decoded.id]);
      if (rows.length === 0) {
        return res.status(401).json({ error: 'User not found' });
      }
      assertAccountActive(rows[0]);
      req.user = rows[0];
      return next();
    } catch (err) {
      return next(err);
    }
  };
}

// Dependencies are resolved on first use so tests can build their own
// instance without opening a database pool.
const authenticate = createAuthenticate({
  db: () => require('../config/db'),
  secret: () => require('../config/env').jwt.secret,
});

module.exports = authenticate;
module.exports.createAuthenticate = createAuthenticate;
