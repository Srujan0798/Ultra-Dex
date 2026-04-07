var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result)
    __defProp(target, key, result);
  return result;
};
import { singleton } from "tsyringe";
function cloneValue(value) {
  if (Array.isArray(value)) {
    return value.map((item) => cloneValue(item));
  }
  if (value && typeof value === "object") {
    return { ...value };
  }
  return value;
}
let ContextCache = class {
  constructor(options = {}) {
    this.maxSize = options.maxSize || 100;
    this.defaultTtl = options.defaultTtl || 3e5;
    this.memoryMode = options.memoryMode !== false;
    this.store = /* @__PURE__ */ new Map();
    this.overflowStore = /* @__PURE__ */ new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      writes: 0,
      overflowWrites: 0,
      overflowReads: 0
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
      const evicted = this.store.get(oldestKey);
      this.store.delete(oldestKey);
      this.stats.evictions++;
      if (!this.memoryMode && evicted) {
        this.overflowStore.set(oldestKey, evicted);
        this.stats.overflowWrites++;
      }
    }
    this.store.set(taskId, {
      context: cloneValue(context),
      fetchedAt: Date.now(),
      expiresAt: Date.now() + ttl
    });
    this.stats.writes++;
    return context;
  }
  invalidate(taskId) {
    return this.store.delete(taskId);
  }
  clear() {
    this.store.clear();
    this.overflowStore.clear();
  }
  async getWithOverflow(taskId) {
    const cached = this.get(taskId);
    if (cached) {
      return cached;
    }
    if (this.memoryMode) {
      return null;
    }
    const overflow = this.overflowStore.get(taskId);
    if (!overflow) {
      return null;
    }
    this.stats.overflowReads++;
    return cloneValue(overflow.context);
  }
  async close() {
    this.clear();
  }
  getStats() {
    const totalLookups = this.stats.hits + this.stats.misses;
    return {
      size: this.store.size,
      maxSize: this.maxSize,
      hitRate: totalLookups === 0 ? 0 : this.stats.hits / totalLookups,
      missRate: totalLookups === 0 ? 0 : this.stats.misses / totalLookups,
      ...this.stats
    };
  }
};
ContextCache = __decorateClass([
  singleton()
], ContextCache);
const contextCache = new ContextCache();
var context_cache_default = ContextCache;
export {
  ContextCache,
  contextCache,
  context_cache_default as default
};
