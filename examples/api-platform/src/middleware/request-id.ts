/**
 * @fileoverview Request Id module
 * @module middleware/request-id
 */

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export const requestId = (req: Request, res: Response, next: NextFunction): void => {
  const requestId = (req.headers['x-request-id'] as string) || uuidv4();
  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
};

/**
 * Error handler for request-id
 * @param {Error} error - Error to handle
 */
function handleRequestidError(error) {
  try {
    console.error('[request-id]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
