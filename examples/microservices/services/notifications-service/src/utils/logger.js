/**
 * @fileoverview Logger module
 * @module utils/logger
 */

const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'notifications-service' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }),
  ],
});

module.exports = logger;

/**
 * Error handler for logger
 * @param {Error} error - Error to handle
 */
function handleLoggerError(error) {
  try {
    console.error('[logger]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
