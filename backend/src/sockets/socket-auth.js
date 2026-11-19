const jwt = require('jsonwebtoken');

// Room every socket of a user joins, so an admin action (e.g. suspension) can
// disconnect all of that user's devices at once.
const userRoom = (userId) => `user_${userId}`;

/**
 * Socket.IO handshake auth. A valid JWT is not enough: the account is looked
 * up so a suspended user cannot connect with a token issued earlier, and the
 * role comes from the database rather than from the token.
 */
function createSocketAuth({ db, secret, logger }) {
  return async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (err) {
      return next(new Error('Invalid token'));
    }
    try {
      const [rows] = await db.query('SELECT id, role, status FROM users WHERE id = ?', [decoded.id]);
      if (rows.length === 0 || rows[0].status !== 'active') {
        return next(new Error('Account unavailable'));
      }
      socket.userId = rows[0].id;
      socket.userRole = rows[0].role;
      return next();
    } catch (err) {
      logger.error(`Socket auth lookup failed: ${err.message}`);
      return next(new Error('Authentication failed'));
    }
  };
}

module.exports = { createSocketAuth, userRoom };
