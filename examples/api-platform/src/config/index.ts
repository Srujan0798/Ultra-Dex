/**
 * @fileoverview Index module
 * @module config/index
 */

import dotenv from 'dotenv';

dotenv.config();

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),

  database: {
    url: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/api_platform',
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  security: {
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
    webhookSecret: process.env.WEBHOOK_SECRET || 'webhook-secret',
    apiKeyPrefix: process.env.API_KEY_PREFIX || 'pk_live_',
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },

  rateLimit: {
    enabled: process.env.RATE_LIMIT_ENABLED === 'true',
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '3600000', 10),
    tiers: {
      free: parseInt(process.env.RATE_LIMIT_FREE_REQUESTS || '100', 10),
      pro: parseInt(process.env.RATE_LIMIT_PRO_REQUESTS || '1000', 10),
      enterprise: parseInt(process.env.RATE_LIMIT_ENTERPRISE_REQUESTS || '10000', 10),
    },
  },

  webhook: {
    maxRetries: parseInt(process.env.WEBHOOK_MAX_RETRIES || '5', 10),
    retryDelayMs: parseInt(process.env.WEBHOOK_RETRY_DELAY_MS || '1000', 10),
    timeoutMs: parseInt(process.env.WEBHOOK_TIMEOUT_MS || '30000', 10),
  },

  swagger: {
    enabled: process.env.ENABLE_SWAGGER !== 'false',
  },

  metrics: {
    enabled: process.env.ENABLE_METRICS === 'true',
  },

  cors: {
    origins: (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:3001').split(','),
  },

  developerPortal: {
    url: process.env.DEVELOPER_PORTAL_URL || 'http://localhost:3001',
  },
};

/**
 * Error handler for index
 * @param {Error} error - Error to handle
 */
function handleIndexError(error) {
  try {
    console.error('[index]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
