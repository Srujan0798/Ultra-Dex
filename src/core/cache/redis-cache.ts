import { singleton } from 'tsyringe';
import { logger } from '../monitoring/better-stack-logger.js';

@singleton()
export class RedisCache {
  private client: any = null;
  private connected: boolean = false;

  constructor() {}

  async connect(): Promise<void> {
    if (this.connected) return;

    try {
      const { default: Redis } = await import('ioredis');
      const connection = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
      
      this.client = new Redis(connection, {
        maxRetriesPerRequest: 3,
        retryStrategy(times) {
          const delay = Math.min(times * 50, 2000);
          return delay;
        }
      });

      this.client.on('connect', () => {
        this.connected = true;
        logger.log('Redis cache connected');
      });

      this.client.on('error', (err: Error) => {
        logger.error('Redis cache error', { error: err.message });
      });

      // Wait for connection
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Redis connection timeout')), 5000);
        this.client.once('ready', () => {
          clearTimeout(timeout);
          resolve();
        });
      });
    } catch (error) {
      logger.error('Failed to initialize Redis cache', { error: String(error) });
      // Fallback to no-op if redis is unavailable
      this.connected = false;
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.connected) return null;
    try {
      return await this.client.get(key);
    } catch (error) {
      logger.error('Redis get failed', { key, error: String(error) });
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.connected) return;
    try {
      if (ttlSeconds) {
        await this.client.set(key, value, 'EX', ttlSeconds);
      } else {
        await this.client.set(key, value);
      }
    } catch (error) {
      logger.error('Redis set failed', { key, error: String(error) });
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.connected) return;
    try {
      await this.client.del(key);
    } catch (error) {
      logger.error('Redis delete failed', { key, error: String(error) });
    }
  }

  async clear(): Promise<void> {
    if (!this.connected) return;
    try {
      await this.client.flushdb();
    } catch (error) {
      logger.error('Redis flush failed', { error: String(error) });
    }
  }
}

export const redisCache = new RedisCache();
