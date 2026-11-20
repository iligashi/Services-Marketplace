const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const config = require('./config/env');
const { errorHandler } = require('./middleware/error.middleware');
const logger = require('./utils/logger');
const { createRateLimitStore } = require('./config/rate-limit-store');

const app = express();

if (config.trustProxy) app.set('trust proxy', config.trustProxy);

// Security
app.use(helmet());
app.use(cors({
  origin: [config.clientUrl, config.adminUrl, 'http://localhost:8082', 'http://localhost:8081', 'http://localhost:5174'],
  credentials: true,
}));

// Rate limiting — global baseline, with stricter limits on sensitive routes below
// Counters live in Redis when REDIS_URL/REDIS_HOST is set, so limits hold
// across restarts and multiple API instances.
// Limits are configurable via RATE_LIMIT_* (see .env.example).
const limits = config.rateLimit;
// Stripe's webhook deliveries are authenticated by signature and retried by
// Stripe; rate limiting them would only drop payment events.
const isStripeWebhook = (req) => req.originalUrl.startsWith('/api/payments/webhook');

const limiter = (prefix, max, error, skip) =>
  rateLimit({
    store: createRateLimitStore(prefix),
    windowMs: limits.windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error },
    skip,
  });

const globalLimiter = limiter('global', limits.globalMax, 'Too many requests, try again later', isStripeWebhook);
// Brute-force protection for credential endpoints only; profile, push-token
// and logout are ordinary authenticated calls covered by the global limit.
const authLimiter = limiter('auth', limits.authMax, 'Too many auth attempts, please try again later');
const paymentLimiter = limiter('payments', limits.paymentsMax, 'Too many payment requests, please try again later', isStripeWebhook);

app.use(['/api/auth/login', '/api/auth/register', '/api/auth/refresh-token'], authLimiter);
app.use('/api/payments', paymentLimiter);
app.use(globalLimiter);

// Stripe webhook needs raw body
app.post('/api/payments/webhook',
  express.raw({ type: 'application/json' }),
  require('./controllers/payment.controller').stripeWebhook
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static files
app.use('/uploads', express.static(path.resolve(config.upload.dir)));

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/jobs', require('./routes/job.routes'));
app.use('/api/bids', require('./routes/bid.routes'));
app.use('/api/payments', require('./routes/payment.routes'));
app.use('/api/reviews', require('./routes/review.routes'));
app.use('/api/messages', require('./routes/message.routes'));
app.use('/api/disputes', require('./routes/dispute.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));
app.use('/api/provider', require('./routes/provider.routes'));
app.use('/api/admin', require('./routes/admin.routes'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use(errorHandler);

module.exports = app;
