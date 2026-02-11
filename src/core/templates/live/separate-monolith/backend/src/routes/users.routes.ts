/**
 * @fileoverview Users Routes module
 * @module routes/users.routes
 */

import { Router } from 'express';
import { listUsers } from '../services/user.service';

export const router = Router();

router.get('/', listUsers);

/**
 * Error handler for users.routes
 * @param {Error} error - Error to handle
 */
function handleUsersroutesError(error) {
  try {
    console.error('[users.routes]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
