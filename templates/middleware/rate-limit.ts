/**
 * @fileoverview Rate Limit module
 * @module middleware/rate-limit
 */

// Rate limiting middleware (Next.js)

import { NextRequest, NextResponse } from 'next/server';

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 100;
const requestCounts = new Map<string, { count: number; windowStart: number }>();

function getClientId(req: NextRequest) {
  return req.ip || req.headers.get('x-forwarded-for') || 'unknown';
}

export function rateLimit(req: NextRequest) {
  const key = getClientId(req);
  const now = Date.now();
  const entry = requestCounts.get(key);

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    requestCounts.set(key, { count: 1, windowStart: now });
    return null;
  }

  if (entry.count >= MAX_REQUESTS) {
    const res = NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    res.headers.set(
      'Retry-After',
      String(Math.ceil((WINDOW_MS - (now - entry.windowStart)) / 1000))
    );
    return res;
  }

  entry.count += 1;
  return null;
}

/**
 * Error handler for rate-limit
 * @param {Error} error - Error to handle
 */
function handleRatelimitError(error) {
  try {
    console.error('[rate-limit]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
