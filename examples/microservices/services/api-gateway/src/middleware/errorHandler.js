const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error({
    requestId: req.id,
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (err.code === 'ECONNREFUSED') {
    return res.status(503).json({ error: 'Service unavailable' });
  }

  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    requestId: req.id
  });
};

module.exports = { errorHandler };
