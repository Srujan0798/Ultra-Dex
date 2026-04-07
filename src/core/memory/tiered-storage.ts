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
let TieredStorage = class {
  constructor(options = {}) {
    this.hotStorage = /* @__PURE__ */ new Map();
    this.warmStorage = /* @__PURE__ */ new Map();
    this.coldStorage = /* @__PURE__ */ new Map();
    this.hotLimit = options.hotLimit || 1e3;
    this.warmLimit = options.warmLimit || 1e4;
    this.accessThreshold = options.accessThreshold || 10;
    this.ageThreshold = options.ageThreshold || 24 * 60 * 60 * 1e3;
  }
  async store(key, data, metadata = {}) {
    const entry = {
      key,
      data,
      metadata: {
        ...metadata,
        created: /* @__PURE__ */ new Date(),
        lastAccessed: /* @__PURE__ */ new Date(),
        accessCount: 1
      }
    };
    this.hotStorage.set(key, entry);
    await this.rebalance();
    return entry;
  }
  async get(key) {
    if (this.hotStorage.has(key)) {
      const entry = this.hotStorage.get(key);
      entry.metadata.lastAccessed = /* @__PURE__ */ new Date();
      entry.metadata.accessCount++;
      return entry.data;
    }
    if (this.warmStorage.has(key)) {
      const entry = this.warmStorage.get(key);
      entry.metadata.lastAccessed = /* @__PURE__ */ new Date();
      entry.metadata.accessCount++;
      if (entry.metadata.accessCount >= this.accessThreshold) {
        this.warmStorage.delete(key);
        this.hotStorage.set(key, entry);
        await this.rebalance();
      }
      return entry.data;
    }
    if (this.coldStorage.has(key)) {
      const entry = this.coldStorage.get(key);
      entry.metadata.lastAccessed = /* @__PURE__ */ new Date();
      entry.metadata.accessCount++;
      this.coldStorage.delete(key);
      this.warmStorage.set(key, entry);
      await this.rebalance();
      return entry.data;
    }
    return null;
  }
  async rebalance() {
    while (this.hotStorage.size > this.hotLimit) {
      const [key, entry] = this.getLeastRecentlyUsed(this.hotStorage);
      this.hotStorage.delete(key);
      this.warmStorage.set(key, entry);
    }
    while (this.warmStorage.size > this.warmLimit) {
      const [key, entry] = this.getLeastRecentlyUsed(this.warmStorage);
      this.warmStorage.delete(key);
      this.coldStorage.set(key, entry);
    }
    await this.archiveOldItems();
  }
  getLeastRecentlyUsed(storage) {
    let lruEntry = null;
    let lruTime = Date.now();
    for (const [key, entry] of storage) {
      if (entry.metadata.lastAccessed.getTime() < lruTime) {
        lruTime = entry.metadata.lastAccessed.getTime();
        lruEntry = [key, entry];
      }
    }
    return lruEntry;
  }
  async archiveOldItems() {
    const cutoff = Date.now() - this.ageThreshold;
    const toArchive = [];
    for (const [key, entry] of this.coldStorage) {
      if (entry.metadata.lastAccessed.getTime() < cutoff) {
        toArchive.push(key);
      }
    }
    for (const key of toArchive) {
      this.coldStorage.delete(key);
    }
  }
  getStats() {
    return {
      hot: this.hotStorage.size,
      warm: this.warmStorage.size,
      cold: this.coldStorage.size,
      total: this.hotStorage.size + this.warmStorage.size + this.coldStorage.size,
      limits: {
        hot: this.hotLimit,
        warm: this.warmLimit
      }
    };
  }
};
TieredStorage = __decorateClass([
  singleton()
], TieredStorage);
var tiered_storage_default = TieredStorage;
export {
  TieredStorage,
  tiered_storage_default as default
};
