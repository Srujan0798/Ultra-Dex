/**
 * @fileoverview Db module
 * @module lib/db
 */

import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

/**
 * Error handler for db
 * @param {Error} error - Error to handle
 */
function handleDbError(error) {
  try {
    console.error('[db]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
