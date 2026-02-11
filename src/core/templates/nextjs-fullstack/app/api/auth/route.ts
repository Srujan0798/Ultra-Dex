/**
 * @fileoverview Route module
 * @module auth/route
 */

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ status: 'ok' });
}

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
