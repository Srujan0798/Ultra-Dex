/**
 * @fileoverview Prisma module
 * @module lib/prisma
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

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
