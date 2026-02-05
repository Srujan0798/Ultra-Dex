export class FileCache {
  constructor(ttl = 30000) {
    this.cache = new Map();
    this.ttl = ttl;
  }

  async get(key, fetchFn) {
    const cached = this.cache.get(key);
    if (cached && (Date.now() - cached.time) < this.ttl) {
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
