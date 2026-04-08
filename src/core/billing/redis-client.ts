/**
 * Redis client helper (dynamic import)
 * Returns a connected redis client when REDIS_URL is set and the redis package is available.
 * Placed in src/core/billing so other billing modules can import with './redis-client.js'
 */

import { logError, logEvent } from '../monitoring/better-stack-logger.js';

let cachedClient: any = null;
let initializing = false;

export async function getRedisClient(): Promise<any | null> {
  if (!process.env.REDIS_URL) return null;
  if (cachedClient) return cachedClient;
  if (initializing) {
    for (let i = 0; i < 10; i++) {
      if (cachedClient) return cachedClient;
      await new Promise((r) => setTimeout(r, 100));
    }
    return null;
  }

  initializing = true;
  try {
    const redisModule = await import('redis');
    const client = redisModule.createClient({ url: process.env.REDIS_URL });
    client.on('error', (err: Error) => {
      logError('Redis client error', err);
    });

    await client.connect();
    cachedClient = client;

    logEvent('redis_client_connected', { url: process.env.REDIS_URL });
    return cachedClient;
  } catch (err) {
    logError('Failed to initialize redis client', err as Error);
    initializing = false;
    return null;
  }
}
