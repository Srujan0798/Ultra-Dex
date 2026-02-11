/**
 * @fileoverview Db module
 * @module lib/db
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool);

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
