const logger = require('../utils/logger');

function errorHandler(err, req, res, _next) {
  logger.error(err.message, { stack: err.stack, url: req.originalUrl, method: req.method });

  if (err.isOperational) {
    return res.status(err.statusCode || 400).json({ error: err.message });
  }

  res.status(500).json({ error: 'Internal server error' });
}

class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = { errorHandler, AppError };
