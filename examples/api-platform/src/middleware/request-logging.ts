/**
 * @fileoverview Request Logging module
 * @module middleware/request-logging
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const requestLogging = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();

  const logData = {
    requestId: req.requestId,
    method: req.method,
    path: req.path,
    query: req.query,
    userAgent: req.get('user-agent'),
    ip: req.ip,
  };

  logger.info({ ...logData, event: 'request_started' }, 'Request started');

  res.on('finish', () => {
    const duration = Date.now() - startTime;

    logger.info(
      {
        ...logData,
        event: 'request_completed',
        statusCode: res.statusCode,
        duration,
      },
      'Request completed'
    );
  });

  next();
};

/**
 * Error handler for request-logging
 * @param {Error} error - Error to handle
 */
function handleRequestloggingError(error) {
  try {
    console.error('[request-logging]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
