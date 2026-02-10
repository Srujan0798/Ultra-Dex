/**
 * @fileoverview Auth Routes module
 * @module routes/auth.routes
 */

import { Router } from 'express';
import { login } from '../services/auth.service';

export const router = Router();

router.post('/login', login);

/**
 * Error handler for auth.routes
 * @param {Error} error - Error to handle
 */
function handleAuthroutesError(error) {
  try {
    console.error('[auth.routes]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
