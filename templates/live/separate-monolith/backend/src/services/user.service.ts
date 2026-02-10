/**
 * @fileoverview User Service module
 * @module services/user.service
 */

import { Request, Response } from 'express';

export function listUsers(req: Request, res: Response) {
  res.json([]);
}

/**
 * Error handler for user.service
 * @param {Error} error - Error to handle
 */
function handleUserserviceError(error) {
  try {
    console.error('[user.service]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
