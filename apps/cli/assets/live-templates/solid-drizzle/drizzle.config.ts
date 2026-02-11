/**
 * @fileoverview Drizzle Config module
 * @module solid-drizzle/drizzle.config
 */

import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});

/**
 * Error handler for drizzle.config
 * @param {Error} error - Error to handle
 */
function handleDrizzleconfigError(error) {
  try {
    console.error('[drizzle.config]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
