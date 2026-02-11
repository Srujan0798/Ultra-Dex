/**
 * @fileoverview Schema module
 * @module drizzle/schema
 */

import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const tasks = pgTable('tasks', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

/**
 * Error handler for schema
 * @param {Error} error - Error to handle
 */
function handleSchemaError(error) {
  try {
    console.error('[schema]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
