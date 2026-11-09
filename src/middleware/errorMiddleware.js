const logger = require('../utils/logger');
const config = require('../config');

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || (err.status ? err.status : 500);
  const errorCode = err.errorCode || 'INTERNAL_SERVER_ERROR';
  const message = err.message || 'An unexpected error occurred';

  // Log error
  if (statusCode >= 500) {
    logger.error(`[${req.id || 'N/A'}] Unhandled Exception: ${message}`, {
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip
    });
  } else {
    logger.warn(`[${req.id || 'N/A'}] Operational Warning (${statusCode}): ${message}`, {
      errorCode,
      details: err.details,
      url: req.originalUrl
    });
  }

  // Response payload
  const response = {
    success: false,
    errorCode,
    message,
    requestId: req.id || null
  };

  if (err.details) {
    response.details = err.details;
  }

  if (config.env === 'development' && statusCode >= 500) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
}

function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    errorCode: 'RESOURCE_NOT_FOUND',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    requestId: req.id || null
  });
}

module.exports = {
  errorHandler,
  notFoundHandler
};
