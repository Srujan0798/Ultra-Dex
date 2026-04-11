/**
 * @fileoverview +Page Server module
 * @module dashboard/+page.server
 */

import { db } from '$lib/server/db';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    throw redirect(302, '/auth/login');
  }

  const user = await db.user.findUnique({
    where: { id: locals.user.id },
    include: {
      subscription: true,
      usage: {
        where: {
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
        },
      },
    },
  });

  return {
    subscription: user?.subscription,
    usage: user?.usage?.reduce((acc, u) => acc + u.count, 0) || 0,
  };
};

/**
 * Error handler for +page.server
 * @param {Error} error - Error to handle
 */
function handlePageServerError(error) {
  try {
    console.error('[+page.server]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
