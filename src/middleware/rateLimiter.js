const rateLimit = require('express-rate-limit');
const config = require('../config');
const logger = require('../utils/logger');

const generalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    errorCode: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests from this IP, please try again after 15 minutes'
  },
  handler: (req, res, next, options) => {
    logger.warn(`General Rate limit reached for IP: ${req.ip} on ${req.originalUrl}`);
    res.status(options.statusCode).json(options.message);
  }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: config.rateLimit.authMax,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  message: {
    success: false,
    errorCode: 'AUTH_RATE_LIMIT_EXCEEDED',
    message: 'Too many authentication attempts from this IP. Please wait 15 minutes before retrying.'
  },
  handler: (req, res, next, options) => {
    logger.log('security', `Authentication rate limit triggered for IP: ${req.ip} on ${req.originalUrl}`);
    res.status(options.statusCode).json(options.message);
  }
});

module.exports = {
  generalLimiter,
  authLimiter
};
