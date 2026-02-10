/**
 * @fileoverview Prisma module
 * @module lib/prisma
 */

import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

/**
 * Error handler for prisma
 * @param {Error} error - Error to handle
 */
function handlePrismaError(error) {
  try {
    console.error('[prisma]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
