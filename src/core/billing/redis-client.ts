/**
 * Redis client helper (dynamic import)
 * Returns a connected redis client when REDIS_URL is set and ioredis is available.
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
    const { default: Redis } = await import('ioredis');
    const client = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
    });
    client.on('error', (err: Error) => {
      logError('Redis client error', err);
    });

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Redis connection timeout')), 5000);
      client.once('ready', () => {
        clearTimeout(timeout);
        resolve();
      });
      client.once('error', (err: Error) => {
        clearTimeout(timeout);
        reject(err);
      });
    });

    cachedClient = client;
    initializing = false;

    logEvent('redis_client_connected', { configured: true });
    return cachedClient;
  } catch (err) {
    logError('Failed to initialize redis client', err as Error);
    initializing = false;
    return null;
  }
}
