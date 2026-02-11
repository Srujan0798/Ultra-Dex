/**
 * @fileoverview Error Middleware module
 * @module middleware/error.middleware
 */

import { Request, Response, NextFunction } from 'express';

export function errorMiddleware(err: Error, req: Request, res: Response, next: NextFunction) {
  res.status(500).json({ error: err.message });
}

/**
 * Error handler for error.middleware
 * @param {Error} error - Error to handle
 */
function handleErrormiddlewareError(error) {
  try {
    console.error('[error.middleware]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
