require('dotenv').config();
const crypto = require('crypto');

const nodeEnv = process.env.NODE_ENV || 'development';
const MIN_SECRET_LENGTH = 32;
const PLACEHOLDERS = new Set(['dev_secret', 'dev_refresh_secret', 'your_jwt_secret_here', 'your_jwt_refresh_secret_here']);

/**
 * Signing secrets must never fall back to a value that is public in this
 * repository. Outside development a missing or weak secret stops startup.
 * In development an unset secret is replaced with a random per-process value
 * (sessions then end when the server restarts), never a predictable one.
 */
function resolveSecret(name) {
  const value = process.env[name];
  const usable = value && value.length >= MIN_SECRET_LENGTH && !PLACEHOLDERS.has(value);
  if (usable) return value;
  if (nodeEnv === 'development' || nodeEnv === 'test') {
    if (value) {
      throw new Error(`${name} is set but is a placeholder or shorter than ${MIN_SECRET_LENGTH} characters`);
    }
    // eslint-disable-next-line no-console
    console.warn(`${name} is not set; using a random secret for this process only.`);
    return crypto.randomBytes(48).toString('hex');
  }
  throw new Error(
    `${name} must be set to a random value of at least ${MIN_SECRET_LENGTH} characters ` +
      "(generate one with: node -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\")"
  );
}

const positiveInt = (value, fallback) => {
  const n = parseInt(value, 10);
  return Number.isInteger(n) && n > 0 ? n : fallback;
};

// Express "trust proxy": the number of proxies in front of the API (e.g. 1
// behind Render/Railway/nginx), or a named range like "loopback". Without it,
// behind a proxy every client shares the proxy's IP and one rate-limit bucket.
const trustProxy = (value) => {
  if (!value) return false;
  return /^\d+$/.test(value) ? Number(value) : value;
};

// Hosts injected by a platform come without a scheme, and Render's `host`
// property is the bare service name (e.g. "marketplace-admin-ie1u"), whose
// public address is <name>.onrender.com. CORS origins need the full URL.
const origin = (value, fallback) => {
  let v = (value || fallback).trim().replace(/\/+$/, '');
  if (/^https?:\/\//.test(v)) return v;
  if (!v.includes('.') && !v.startsWith('localhost')) v = `${v}.onrender.com`;
  return `https://${v}`;
};

// Database connection. DATABASE_URL (mysql://user:pass@host:port/db, as given
// by managed providers such as Aiven) overrides the individual DB_* values.
// TLS: DB_SSL=true (or ?ssl-mode=REQUIRED in the URL) turns it on, always with
// certificate verification; DB_SSL_CA holds the provider's CA certificate (PEM,
// literal newlines or \n) when it is not signed by a public CA.
function databaseConfig() {
  const db = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'services_marketplace',
  };
  let sslRequired = /^(1|true|required)$/i.test(process.env.DB_SSL || '');
  if (process.env.DATABASE_URL) {
    const url = new URL(process.env.DATABASE_URL);
    if (!/^mysql2?:$/.test(url.protocol)) throw new Error('DATABASE_URL must be a mysql:// URL');
    db.host = url.hostname;
    db.port = parseInt(url.port, 10) || 3306;
    db.user = decodeURIComponent(url.username);
    db.password = decodeURIComponent(url.password);
    const name = decodeURIComponent(url.pathname.replace(/^\//, ''));
    if (name && !process.env.DB_NAME) db.database = name;
    const mode = url.searchParams.get('ssl-mode') || url.searchParams.get('sslmode') || '';
    if (/^(required|verify_ca|verify_identity)$/i.test(mode) || url.searchParams.has('ssl')) sslRequired = true;
  }
  const ca = process.env.DB_SSL_CA ? process.env.DB_SSL_CA.replace(/\n/g, '\n') : undefined;
  if (sslRequired || ca) db.ssl = { ca, rejectUnauthorized: true };
  return db;
}

const jwtSecret = resolveSecret('JWT_SECRET');
const jwtRefreshSecret = resolveSecret('JWT_REFRESH_SECRET');
if (jwtSecret === jwtRefreshSecret) {
  throw new Error('JWT_SECRET and JWT_REFRESH_SECRET must be different');
}

module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv,

  db: databaseConfig(),

  jwt: {
    secret: jwtSecret,
    refreshSecret: jwtRefreshSecret,
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    platformFeePercent: parseFloat(process.env.PLATFORM_FEE_PERCENT) || 12,
  },

  upload: {
    dir: process.env.UPLOAD_DIR || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 5242880,
  },

  redisUrl: process.env.REDIS_URL || (process.env.REDIS_HOST ? `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT || 6379}` : null),

  // Per-IP request limits per window. The app polls notifications, so the
  // global limit must leave room for normal use; auth covers credential
  // endpoints only (login, register, token refresh).
  rateLimit: {
    windowMs: positiveInt(process.env.RATE_LIMIT_WINDOW_MINUTES, 15) * 60 * 1000,
    globalMax: positiveInt(process.env.RATE_LIMIT_GLOBAL_MAX, 1000),
    authMax: positiveInt(process.env.RATE_LIMIT_AUTH_MAX, 20),
    paymentsMax: positiveInt(process.env.RATE_LIMIT_PAYMENTS_MAX, 60),
  },
  trustProxy: trustProxy(process.env.TRUST_PROXY),

  clientUrl: origin(process.env.CLIENT_URL, 'http://localhost:8081'),
  adminUrl: origin(process.env.ADMIN_URL, 'http://localhost:3001'),
};
