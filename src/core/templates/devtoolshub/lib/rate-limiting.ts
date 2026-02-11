/**
 * @fileoverview Rate Limiting module
 * @module lib/rate-limiting
 */

import { prisma } from './prisma';

const buckets = new Map<string, { tokens: number; lastRefill: number }>();

function floorToMinute(date: Date) {
  const copy = new Date(date);
  copy.setSeconds(0, 0);
  return copy;
}

function refillBucket(
  key: string,
  capacity: number,
  refillPerSecond: number,
  now: number
) {
  const bucket = buckets.get(key) || { tokens: capacity, lastRefill: now };
  const elapsed = Math.max(0, now - bucket.lastRefill) / 1000;
  const refill = elapsed * refillPerSecond;
  const tokens = Math.min(capacity, bucket.tokens + refill);

  const next = { tokens, lastRefill: now };
  buckets.set(key, next);
  return next;
}

export function tokenBucketAllow(
  keyId: string,
  options: {
    capacity?: number;
    refillPerSecond?: number;
    cost?: number;
  } = {}
) {
  const capacity = options.capacity ?? 100;
  const refillPerSecond = options.refillPerSecond ?? capacity / 60;
  const cost = options.cost ?? 1;
  const now = Date.now();

  const bucket = refillBucket(keyId, capacity, refillPerSecond, now);
  if (bucket.tokens < cost) {
    return {
      allowed: false,
      remaining: Math.max(bucket.tokens, 0),
      resetAt: now + ((cost - bucket.tokens) / refillPerSecond) * 1000,
    };
  }

  bucket.tokens -= cost;
  buckets.set(keyId, bucket);

  return {
    allowed: true,
    remaining: bucket.tokens,
    resetAt: now + ((capacity - bucket.tokens) / refillPerSecond) * 1000,
  };
}

// Window-based persistence for multi-instance environments.
export async function checkLimit(keyId: string, limit: number) {
  const windowStart = floorToMinute(new Date());
  const record = await prisma.rateLimit.findUnique({
    where: { keyId_windowStart: { keyId, windowStart } },
  });

  const count = record?.count || 0;
  return { allowed: count < limit, count, windowStart };
}

export async function incrementUsage(keyId: string) {
  const windowStart = floorToMinute(new Date());
  return prisma.rateLimit.upsert({
    where: { keyId_windowStart: { keyId, windowStart } },
    update: { count: { increment: 1 } },
    create: { keyId, windowStart, count: 1 },
  });
}

/**
 * Error handler for rate-limiting
 * @param {Error} error - Error to handle
 */
function handleRatelimitingError(error) {
  try {
    console.error('[rate-limiting]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
