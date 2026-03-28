// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview API Authentication and Rate Limiting Module
 * @module api/auth
 * @description Provides API key authentication middleware and rate limiting
 * for the Ultra-Dex API Gateway.
 */

import fs from 'fs/promises';
import path from 'path';

const API_KEYS_PATH = path.resolve(process.cwd(), '.ultra-dex', 'api-keys.json');
const DEFAULT_RATE_LIMIT = { windowMs: 60_000, max: 120 };

let cachedKeys = null;
let cachedAt = 0;
const CACHE_TTL = 30_000;

/**
 * Parse API keys from environment variables
 * @api private
 * @returns {string[]} Array of valid API keys
 */
function parseEnvKeys() {
  const single = process.env.ULTRA_DEX_API_KEY;
  const multiple = process.env.ULTRA_DEX_API_KEYS;
  const keys = [];
  if (single) keys.push(single.trim());
  if (multiple) {
    multiple.split(',').forEach((k) => {
      const trimmed = k.trim();
      if (trimmed) keys.push(trimmed);
    });
  }
  return keys.filter(Boolean);
}

/**
 * Load API keys from environment or config file
 * @api public
 * @async
 * @returns {Promise<string[]>} Array of valid API keys
 * @throws {Error} If unable to read config file (non-ENOENT errors)
 * @example
 * const keys = await loadApiKeys();
 * logger.log(`Loaded ${keys.length} API keys`);
 */
export async function loadApiKeys() {
  const now = Date.now();
  if (cachedKeys && now - cachedAt < CACHE_TTL) {
    return cachedKeys;
  }

  const envKeys = parseEnvKeys();
  if (envKeys.length) {
    cachedKeys = envKeys;
    cachedAt = now;
    return cachedKeys;
  }

  try {
    const data = await fs.readFile(API_KEYS_PATH, 'utf8');
    const parsed = JSON.parse(data);
    const keys = Array.isArray(parsed.keys)
      ? parsed.keys.map((k) => k.key || k).filter(Boolean)
      : [];
    cachedKeys = keys;
    cachedAt = now;
    return cachedKeys;
  } catch (error) {
    if (error.code !== 'ENOENT') {
      logger.error('[Auth] Error loading API keys:', error.message);
    }
    cachedKeys = [];
    cachedAt = now;
    return cachedKeys;
  }
}

/**
 * Extract API key from request headers
 * @api private
 * @param {import('express').Request} req - Express request object
 * @returns {string|undefined} API key if found
 */
function extractApiKey(req) {
  const header = req.headers['authorization'];
  if (header && header.toLowerCase().startsWith('bearer ')) {
    return header.slice(7).trim();
  }
  return req.headers['x-api-key'];
}

/**
 * Create API key authentication middleware
 * @api public
 * @param {Object} options - Configuration options
 * @param {boolean} [options.allowAnonymous=false] - Allow requests without API key
 * @returns {import('express').RequestHandler} Express middleware function
 * @example
 * app.use('/api', apiKeyAuth({ allowAnonymous: false }));
 */
export function apiKeyAuth({ allowAnonymous = false } = {}) {
  return async (req, res, next) => {
    try {
      const keys = await loadApiKeys();
      if (!keys.length) {
        if (allowAnonymous) return next();
        return res.status(401).json({ error: 'API keys not configured' });
      }

      const key = extractApiKey(req);
      if (!key) {
        return res.status(401).json({ error: 'Missing API key' });
      }

      if (!keys.includes(key)) {
        return res.status(403).json({ error: 'Invalid API key' });
      }

      req.apiKey = key;
      return next();
    } catch (error) {
      logger.error('[Auth] Authentication error:', error.message);
      return res.status(500).json({ error: 'Authentication failed' });
    }
  };
}

/**
 * Create a rate limiter middleware
 * @api public
 * @param {Object} options - Rate limit configuration
 * @param {number} [options.windowMs=60000] - Time window in milliseconds
 * @param {number} [options.max=120] - Maximum requests per window
 * @returns {import('express').RequestHandler} Express middleware function
 * @example
 * const rateLimiter = createRateLimiter({ windowMs: 60000, max: 100 });
 * app.use(rateLimiter);
 */
export function createRateLimiter(options = {}) {
  const { windowMs, max } = { ...DEFAULT_RATE_LIMIT, ...options };
  const hits = new Map();

  return (req, res, next) => {
    try {
      const key = req.apiKey || req.headers['x-api-key'] || req.ip || 'anonymous';
      const now = Date.now();
      const entry = hits.get(key) || { count: 0, resetAt: now + windowMs };

      if (now > entry.resetAt) {
        entry.count = 0;
        entry.resetAt = now + windowMs;
      }

      entry.count += 1;
      hits.set(key, entry);

      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, max - entry.count));
      res.setHeader('X-RateLimit-Reset', entry.resetAt);

      if (entry.count > max) {
        return res.status(429).json({ error: 'Rate limit exceeded' });
      }

      return next();
    } catch (error) {
      logger.error('[RateLimit] Error:', error.message);
      return next();
    }
  };
}

/**
 * API key configuration paths
 * @api public
 * @type {Object}
 * @property {string} config - Path to API keys configuration file
 */
export const apiKeyPaths = {
  config: API_KEYS_PATH,
};
