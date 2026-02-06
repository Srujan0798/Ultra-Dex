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
