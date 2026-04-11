/**
 * @fileoverview Db module
 * @module lib/db
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

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
