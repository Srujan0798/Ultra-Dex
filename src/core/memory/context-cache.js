function cloneValue(value) {
  if (Array.isArray(value)) {
    return value.map((item) => cloneValue(item));
  }

  if (value && typeof value === 'object') {
    return { ...value };
  }

  return value;
}

export class ContextCache {
  constructor(options = {}) {
    this.maxSize = options.maxSize || 100;
    this.defaultTtl = options.defaultTtl || 300000;
    this.store = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      writes: 0,
    };
  }

  get(taskId) {
    const record = this.store.get(taskId);
    if (!record) {
      this.stats.misses++;
      return null;
    }

    if (record.expiresAt <= Date.now()) {
      this.store.delete(taskId);
      this.stats.misses++;
      return null;
    }

    this.store.delete(taskId);
    this.store.set(taskId, record);
    this.stats.hits++;
    return cloneValue(record.context);
  }

  set(taskId, context, ttl = this.defaultTtl) {
    if (this.store.has(taskId)) {
      this.store.delete(taskId);
    }

    while (this.store.size >= this.maxSize) {
      const oldestKey = this.store.keys().next().value;
      this.store.delete(oldestKey);
      this.stats.evictions++;
    }

    this.store.set(taskId, {
      context: cloneValue(context),
      fetchedAt: Date.now(),
      expiresAt: Date.now() + ttl,
    });
    this.stats.writes++;
    return context;
  }

  invalidate(taskId) {
    return this.store.delete(taskId);
  }

  clear() {
    this.store.clear();
  }

  getStats() {
    const totalLookups = this.stats.hits + this.stats.misses;
    return {
      size: this.store.size,
      maxSize: this.maxSize,
      hitRate: totalLookups === 0 ? 0 : this.stats.hits / totalLookups,
      missRate: totalLookups === 0 ? 0 : this.stats.misses / totalLookups,
      ...this.stats,
    };
  }
}

export const contextCache = new ContextCache();
export default ContextCache;
