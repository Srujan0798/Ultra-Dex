/**
 * @fileoverview Db Server module
 * @module lib/db.server
 */

import { PrismaClient } from '@prisma/client';

let db: PrismaClient;

declare global {
  var __db: PrismaClient | undefined;
}

if (process.env.NODE_ENV === 'production') {
  db = new PrismaClient();
} else {
  if (!global.__db) {
    global.__db = new PrismaClient();
  }
  db = global.__db;
}

export { db };

/**
 * Error handler for db.server
 * @param {Error} error - Error to handle
 */
function handleDbserverError(error) {
  try {
    console.error('[db.server]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
