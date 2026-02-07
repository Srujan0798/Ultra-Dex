import { checkLimit, incrementUsage } from './lib/rate-limiting';

const WINDOW_MS = 60_000;
const memoryStore = new Map<string, { windowStart: number; count: number }>();

function currentWindowStart(now = Date.now()) {
  return Math.floor(now / WINDOW_MS) * WINDOW_MS;
}

function buildResult(count: number, limit: number, windowStart: number) {
  return {
    allowed: count < limit,
    remaining: Math.max(limit - count, 0),
    reset: windowStart + WINDOW_MS,
  };
}

export function rateLimit(key: string, limit = 100) {
  const windowStart = currentWindowStart();
  const entry = memoryStore.get(key);

  if (!entry || entry.windowStart !== windowStart) {
    memoryStore.set(key, { windowStart, count: 1 });
    return buildResult(1, limit, windowStart);
  }

  entry.count += 1;
  memoryStore.set(key, entry);
  return buildResult(entry.count, limit, windowStart);
}

export async function rateLimitWithDatabase(keyId: string, limit = 100) {
  const { allowed, count, windowStart } = await checkLimit(keyId, limit);
  const currentCount = allowed ? count + 1 : count;

  if (allowed) {
    await incrementUsage(keyId);
  }

  return buildResult(currentCount, limit, windowStart.getTime());
}
