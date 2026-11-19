const { createClient } = require('redis');
const { RedisStore } = require('rate-limit-redis');
const config = require('./env');
const logger = require('../utils/logger');

let client;

function redisClient() {
  if (!client) {
    client = createClient({ url: config.redisUrl });
    client.on('error', (err) => logger.error(`Redis error: ${err.message}`));
    client.connect().catch((err) => logger.error(`Redis connection failed: ${err.message}`));
  }
  return client;
}

/**
 * Shared store for express-rate-limit. In-memory counters reset on every
 * restart and are per-process, so with more than one API instance each one
 * would allow the full limit. Uses Redis whenever it is configured.
 * Returns undefined (express-rate-limit's in-memory default) otherwise.
 */
function createRateLimitStore(prefix) {
  if (!config.redisUrl) {
    if (config.nodeEnv === 'production') {
      logger.warn(`Rate limiter "${prefix}" is using in-memory storage; set REDIS_URL to share limits across instances.`);
    }
    return undefined;
  }
  return new RedisStore({
    prefix: `rl:${prefix}:`,
    sendCommand: (...args) => redisClient().sendCommand(args),
  });
}

module.exports = { createRateLimitStore };
