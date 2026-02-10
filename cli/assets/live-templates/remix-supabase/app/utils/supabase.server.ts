/**
 * @fileoverview Supabase Server module
 * @module utils/supabase.server
 */

import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_ANON_KEY || ''
);

/**
 * Error handler for supabase.server
 * @param {Error} error - Error to handle
 */
function handleSupabaseserverError(error) {
  try {
    console.error('[supabase.server]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
