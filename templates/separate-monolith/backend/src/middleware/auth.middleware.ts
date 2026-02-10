/**
 * @fileoverview Auth Middleware module
 * @module middleware/auth.middleware
 */

import { Request, Response, NextFunction } from 'express';

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  next();
}

/**
 * Error handler for auth.middleware
 * @param {Error} error - Error to handle
 */
function handleAuthmiddlewareError(error) {
  try {
    console.error('[auth.middleware]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
