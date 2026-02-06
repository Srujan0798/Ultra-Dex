// Copyright (c) 2026 Ultra-Dex

/**
 * API Auth and Rate Limiting
 */

import fs from 'fs/promises';
import path from 'path';

const API_KEYS_PATH = path.resolve(process.cwd(), '.ultra-dex', 'api-keys.json');
const DEFAULT_RATE_LIMIT = { windowMs: 60_000, max: 120 };

let cachedKeys = null;
let cachedAt = 0;
const CACHE_TTL = 30_000;

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
    if (error.code === 'ENOENT') {
      cachedKeys = [];
      cachedAt = now;
      return cachedKeys;
    }
    cachedKeys = [];
    cachedAt = now;
    return cachedKeys;
  }
}

function extractApiKey(req) {
  const header = req.headers['authorization'];
  if (header && header.toLowerCase().startsWith('bearer ')) {
    return header.slice(7).trim();
  }
  return req.headers['x-api-key'];
}

export function apiKeyAuth({ allowAnonymous = false } = {}) {
  return async (req, res, next) => {
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
  };
}

export function createRateLimiter(options = {}) {
  const { windowMs, max } = { ...DEFAULT_RATE_LIMIT, ...options };
  const hits = new Map();

  return (req, res, next) => {
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
  };
}

export const apiKeyPaths = {
  config: API_KEYS_PATH,
};
