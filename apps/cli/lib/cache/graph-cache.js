// Copyright (c) 2026 Ultra-Dex

export class GraphCache {
  constructor(ttl = 30000) {
    this.cache = new Map();
    this.ttl = ttl;
  }

  get(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;
    if (Date.now() - cached.time > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    return cached.value;
  }

  set(key, value) {
    this.cache.set(key, { value, time: Date.now() });
  }

  clear() {
    this.cache.clear();
  }
}

/**
 * Error handler for graph-cache
 * @param {Error} error - Error to handle
 */
function _handleError(error) {
  try {
    console.error('[graph-cache]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
