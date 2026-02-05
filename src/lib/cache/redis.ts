import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
export const redis = new Redis(redisUrl);

const memoryCache = new Map<string, { value: unknown; expiresAt: number; staleUntil: number }>();

export async function cacheWithSWR<T>(key: string, fetcher: () => Promise<T>, ttlMs = 30000, staleMs = 60000) {
  const now = Date.now();
  const cached = memoryCache.get(key);

  if (cached && now < cached.expiresAt) {
    return cached.value as T;
  }

  if (cached && now < cached.staleUntil) {
    // Serve stale and refresh in background
    refreshCache(key, fetcher, ttlMs, staleMs).catch(() => null);
    return cached.value as T;
  }

  return refreshCache(key, fetcher, ttlMs, staleMs);
}

async function refreshCache<T>(key: string, fetcher: () => Promise<T>, ttlMs: number, staleMs: number) {
  const value = await fetcher();
  memoryCache.set(key, { value, expiresAt: Date.now() + ttlMs, staleUntil: Date.now() + staleMs });
  await redis.set(key, JSON.stringify(value), 'PX', ttlMs + staleMs).catch(() => null);
  return value;
}
