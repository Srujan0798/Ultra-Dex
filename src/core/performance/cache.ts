import { performanceMonitor } from './monitor.js';
class CacheStore {
  constructor() {
    this.store = /* @__PURE__ */ new Map();
    this.ttlMap = /* @__PURE__ */ new Map();
  }
  async get(key) {
    const item = this.store.get(key);
    if (!item)
      return null;
    const ttl = this.ttlMap.get(key);
    if (ttl && Date.now() > ttl) {
      this.store.delete(key);
      this.ttlMap.delete(key);
      return null;
    }
    performanceMonitor?.trackRequest({ endpoint: "cache", method: "GET" }, 1);
    return item;
  }
  async set(key, value, ttlSeconds = 300) {
    this.store.set(key, value);
    if (ttlSeconds) {
      this.ttlMap.set(key, Date.now() + ttlSeconds * 1e3);
    }
    performanceMonitor?.trackRequest({ endpoint: "cache", method: "SET" }, 1);
  }
  async del(key) {
    this.store.delete(key);
    this.ttlMap.delete(key);
  }
  async clear() {
    this.store.clear();
    this.ttlMap.clear();
  }
}
const performanceOptimizer = new CacheStore();
var cache_default = performanceOptimizer;
export {
  cache_default as default,
  performanceOptimizer
};
