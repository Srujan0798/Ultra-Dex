// Copyright (c) 2026 Ultra-Dex

export class FileCache {
  constructor(ttl = 30000) {
    this.cache = new Map();
    this.ttl = ttl;
  }

  async get(key, fetchFn) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.time < this.ttl) {
      return cached.value;
    }
    const value = await fetchFn();
    this.cache.set(key, { value, time: Date.now() });
    return value;
  }

  clear() {
    this.cache.clear();
  }
}

/**
 * Safe execution wrapper with error handling for file-cache
 * @param {Function} fn - Async function to execute
 * @param {string} [context='file-cache'] - Error context
 * @returns {Promise<*>} Result or null on error
 */
async function safeExecute(fn, context = 'file-cache') {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
    return null;
  }
}
