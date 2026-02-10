/**
 * @fileoverview Prisma module
 * @module lib/prisma
 */

import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: ['error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

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
