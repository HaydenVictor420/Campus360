const jwt = require('jsonwebtoken');
const config = require('../config');
const { AuthenticationError, ForbiddenError } = require('../utils/AppError');
const logger = require('../utils/logger');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next(new AuthenticationError('Authentication token is required'));
  }

  jwt.verify(token, config.jwt.accessSecret, (err, decoded) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return next(new AuthenticationError('Token has expired. Please refresh your session.'));
      }
      return next(new AuthenticationError('Invalid or corrupted authentication token'));
    }

    req.user = {
      uuid: decoded.sub,
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      username: decoded.username
    };

    next();
  });
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AuthenticationError('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.log('security', `Access denied: User ${req.user.email} with role [${req.user.role}] attempted to access resource requiring [${allowedRoles.join(',')}]`);
      return next(new ForbiddenError(`Access restricted to roles: [${allowedRoles.join(', ')}]`));
    }

    next();
  };
}

function validateApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;

  if (!apiKey || apiKey !== config.external.apiKey) {
    logger.log('security', `Invalid API key attempted from IP: ${req.ip}`);
    return next(new ForbiddenError('Invalid or missing external API key'));
  }

  next();
}

module.exports = {
  authenticateToken,
  requireRole,
  validateApiKey
};
