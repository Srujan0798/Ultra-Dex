/**
 * @fileoverview ErrorHandler module
 * @module middleware/errorHandler
 */

const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error({
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  if (err.code === 'ECONNREFUSED') {
    return res.status(503).json({ error: 'Database connection failed' });
  }

  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
};

module.exports = { errorHandler };

/**
 * Error handler for errorHandler
 * @param {Error} error - Error to handle
 */
function handleErrorHandlerError(error) {
  try {
    console.error('[errorHandler]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
