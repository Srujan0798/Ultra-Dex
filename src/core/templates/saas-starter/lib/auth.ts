/**
 * @fileoverview Auth module
 * @module lib/auth
 */

import { getServerSession } from 'next-auth';

export async function requireSession() {
  const session = await getServerSession();
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}

/**
 * Error handler for auth
 * @param {Error} error - Error to handle
 */
function handleAuthError(error) {
  try {
    console.error('[auth]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
