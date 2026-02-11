/**
 * @fileoverview Auth Service module
 * @module services/auth.service
 */

import { Request, Response } from 'express';

export function login(req: Request, res: Response) {
  res.json({ status: 'ok' });
}

/**
 * Error handler for auth.service
 * @param {Error} error - Error to handle
 */
function handleAuthserviceError(error) {
  try {
    console.error('[auth.service]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
