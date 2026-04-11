/**
 * @fileoverview Route module
 * @module [...nextauth]/route
 */

import { authOptions } from '@/lib/auth';
import NextAuth from 'next-auth';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

/**
 * Error handler for route
 * @param {Error} error - Error to handle
 */
function handleRouteError(error) {
  try {
    console.error('[route]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
