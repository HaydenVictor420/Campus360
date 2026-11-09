const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

function assignRequestId(req, res, next) {
  const reqId = req.headers['x-request-id'] || uuidv4();
  req.id = reqId;
  res.setHeader('X-Request-Id', reqId);
  next();
}

const morganStream = {
  write: (message) => {
    logger.http(message.trim());
  }
};

const httpLogger = morgan(
  ':remote-addr - :remote-user [:date[iso]] ":method :url HTTP/:http-version" :status :res[content-length] - :response-time ms',
  { stream: morganStream }
);

module.exports = {
  assignRequestId,
  httpLogger
};
