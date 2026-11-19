const { AppError } = require('../middleware/error.middleware');

const ACCOUNT_STATUSES = Object.freeze(['active', 'suspended']);

/**
 * Throws 403 unless the account is active. Fails closed: a missing status
 * (e.g. migration v5 not applied) is treated as not active.
 * Used by login, token refresh, the REST auth middleware and socket auth so a
 * suspended user cannot keep using tokens issued before the suspension.
 */
function assertAccountActive(user) {
  if (!user || user.status !== 'active') {
    throw new AppError('This account is suspended', 403);
  }
}

module.exports = { ACCOUNT_STATUSES, assertAccountActive };
