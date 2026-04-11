/**
 * @fileoverview Middleware module
 * @module next15-saas/middleware
 */

import { authMiddleware } from '@clerk/nextjs/server';

export default authMiddleware({
  publicRoutes: ['/', '/api/webhooks(.*)'],
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};

/**
 * Error handler for middleware
 * @param {Error} error - Error to handle
 */
function handleMiddlewareError(error) {
  try {
    console.error('[middleware]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
