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
import fs from "fs/promises";
import * as path from "path";
import { existsSync } from "fs";
import crypto from "crypto";
import { singleton } from "tsyringe";
import { AppError, ValidationError } from '../utils/errors.js';
import { logger } from '../utils/logging.js';
import { performance } from "perf_hooks";
const MEMORY_DIR = ".ultra";
const MEMORY_FILE = "memory.json";
const MEMORY_PATH = path.resolve(process.cwd(), MEMORY_DIR, MEMORY_FILE);
let UltraMemory = class {
  memory;
  initialized;
  initializing;
  isSaving;
  cache;
  cacheExpiry;
  semanticIndex;
  stats;
  constructor() {
    this.memory = [];
    this.initialized = false;
    this.initializing = null;
    this.isSaving = false;
    this.cache = /* @__PURE__ */ new Map();
    this.cacheExpiry = 3e5;
    this.semanticIndex = null;
    this.stats = {
      totalEntries: 0,
      searches: 0,
      hits: 0,
      avgSearchTime: 0,
      lastUpdated: null
    };
  }
  async init() {
    if (this.initialized)
      return;
    if (this.initializing)
      return this.initializing;
    this.initializing = (async () => {
      try {
        if (!existsSync(path.dirname(MEMORY_PATH))) {
          await fs.mkdir(path.dirname(MEMORY_PATH), { recursive: true });
        }
        if (existsSync(MEMORY_PATH)) {
          const data = await fs.readFile(MEMORY_PATH, "utf-8");
          const payload = JSON.parse(data);
          if (payload && payload._version === 1) {
            this.memory = payload.entries || [];
          } else if (Array.isArray(payload)) {
            this.memory = payload;
          } else {
            this.memory = [];
          }
          this.stats.totalEntries = this.memory.length;
        } else {
          this.memory = [];
          await this.saveToFile();
        }
        this.initialized = true;
        this.stats.lastUpdated = /* @__PURE__ */ new Date();
      } catch (error) {
        logger.error("Failed to initialize memory", error);
        this.memory = [];
        this.initializing = null;
      }
    })();
    return this.initializing;
  }
  async saveToFile() {
    if (this.isSaving) {
      return;
    }
    this.isSaving = true;
    try {
      const startTime = performance.now();
      const payload = {
        _version: 1,
        _migratedAt: (/* @__PURE__ */ new Date()).toISOString(),
        entries: this.memory
      };
      await fs.writeFile(MEMORY_PATH, JSON.stringify(payload, null, 2));
      const saveTime = performance.now() - startTime;
      this.stats.lastUpdated = /* @__PURE__ */ new Date();
      logger.debug(`Memory saved in ${saveTime.toFixed(2)}ms`);
    } catch (error) {
      logger.error("Failed to save memory to file", error);
      throw new AppError(`Failed to save memory: ${error.message}`, { cause: error });
    } finally {
      this.isSaving = false;
    }
  }
  async remember(text, tags = [], source = "manual", metadata = {}) {
    if (!text || typeof text !== "string") {
      throw new ValidationError("Memory text must be a non-empty string");
    }
    await this.init();
    const entry = {
      id: crypto.randomUUID(),
      text,
      tags: Array.isArray(tags) ? tags : [tags],
      source,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      metadata: {
        ...metadata,
        wordCount: text.split(/\s+/).length,
        charCount: text.length,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      }
    };
    const existingIndex = this.memory.findIndex(
      (mem) => this.calculateSimilarity(mem.text, text) > 0.9
    );
    if (existingIndex !== -1) {
      this.memory[existingIndex] = entry;
      logger.info(`Updated existing memory entry with ID: ${entry.id}`);
    } else {
      this.memory.push(entry);
      this.stats.totalEntries = this.memory.length;
    }
    this.invalidateCache();
    await this.saveToFile();
    return entry;
  }
  // Calculate similarity between two texts using a simple algorithm
  calculateSimilarity(text1, text2) {
    const s1 = text1.toLowerCase().replace(/\s+/g, "");
    const s2 = text2.toLowerCase().replace(/\s+/g, "");
    if (s1 === s2)
      return 1;
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    if (longer.length === 0)
      return 1;
    const editDistance = this.levenshteinDistance(shorter, longer);
    return (longer.length - editDistance) / longer.length;
  }
  // Levenshtein distance calculation for similarity
  levenshteinDistance(str1, str2) {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(0));
    for (let i = 0; i <= str1.length; i++) {
      matrix[0][i] = i;
    }
    for (let j = 0; j <= str2.length; j++) {
      matrix[j][0] = j;
    }
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          // insertion
          matrix[j - 1][i] + 1,
          // deletion
          matrix[j - 1][i - 1] + indicator
          // substitution
        );
      }
    }
    return matrix[str2.length][str1.length];
  }
  async search(query, limit = 5, options = {}) {
    if (!query || typeof query !== "string") {
      throw new ValidationError("Search query must be a non-empty string");
    }
    await this.init();
    const cacheKey = `search:${query}:${limit}:${JSON.stringify(options)}`;
    const cachedResult = this.getCachedResult(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }
    const startTime = performance.now();
    this.stats.searches++;
    const normalizedQuery = query.toLowerCase().trim();
    let results = [];
    const exactMatches = this.memory.filter(
      (entry) => entry.text.toLowerCase().includes(normalizedQuery) || entry.tags && entry.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery))
    );
    const fuzzyMatches = this.memory.filter((entry) => {
      if (exactMatches.includes(entry))
        return false;
      return this.calculateSimilarity(entry.text, query) > 0.7;
    });
    const tagMatches = this.memory.filter((entry) => {
      if (exactMatches.includes(entry) || fuzzyMatches.includes(entry))
        return false;
      return entry.tags && entry.tags.some((tag) => this.calculateSimilarity(tag, query) > 0.8);
    });
    results = [
      ...exactMatches.map((e) => ({ ...e, score: 1 })),
      ...fuzzyMatches.map((e) => ({
        ...e,
        score: this.calculateSimilarity(e.text, query)
      })),
      ...tagMatches.map((e) => ({
        ...e,
        score: this.calculateSimilarity(e.tags.join(" "), query)
      }))
    ];
    results.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
    results = results.slice(0, limit);
    const searchTime = performance.now() - startTime;
    this.stats.hits += results.length;
    this.stats.avgSearchTime = (this.stats.avgSearchTime * (this.stats.searches - 1) + searchTime) / this.stats.searches;
    this.setCachedResult(cacheKey, results);
    return results;
  }
  // Get cached result if still valid
  getCachedResult(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.value;
    }
    this.cache.delete(key);
    return null;
  }
  // Set cached result
  setCachedResult(key, value) {
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }
  // Invalidate cache
  invalidateCache() {
    this.cache.clear();
  }
  // Get memory statistics
  getStats() {
    return { ...this.stats };
  }
  // Enhanced search with context awareness
  async contextualSearch(query, contextTags = [], limit = 5) {
    if (!query || typeof query !== "string") {
      throw new ValidationError("Search query must be a non-empty string");
    }
    await this.init();
    const baseResults = await this.search(query, limit * 2);
    const contextualResults = baseResults.map((result) => {
      const contextScore = contextTags.filter(
        (tag) => result.tags && result.tags.some((resultTag) => this.calculateSimilarity(tag, resultTag) > 0.8)
      ).length;
      return {
        ...result,
        contextScore,
        combinedScore: result.score + contextScore * 0.2
        // Boost by context relevance
      };
    });
    contextualResults.sort((a, b) => (b.combinedScore || 0) - (a.combinedScore || 0));
    return contextualResults.slice(0, limit);
  }
  async clear(beforeDate = null) {
    await this.init();
    if (beforeDate) {
      const date = new Date(beforeDate);
      this.memory = this.memory.filter(
        (entry) => new Date(entry.timestamp).getTime() >= date.getTime()
      );
    } else {
      this.memory = [];
    }
    this.stats.totalEntries = this.memory.length;
    this.invalidateCache();
    await this.saveToFile();
  }
  async pruneAfter(timestamp) {
    await this.init();
    if (!timestamp)
      return;
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime()))
      return;
    this.memory = this.memory.filter(
      (entry) => new Date(entry.timestamp).getTime() < date.getTime()
    );
    this.stats.totalEntries = this.memory.length;
    this.invalidateCache();
    await this.saveToFile();
  }
  async getAll() {
    await this.init();
    return this.memory;
  }
  // Get memory entries by tag
  async getByTag(tag, limit = 10) {
    await this.init();
    return this.memory.filter((entry) => entry.tags && entry.tags.includes(tag)).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ).slice(0, limit);
  }
  // Get recent memories
  async getRecent(count = 10) {
    await this.init();
    return this.memory.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ).slice(0, count);
  }
  // Remove specific memory by ID
  async forget(id) {
    await this.init();
    const initialLength = this.memory.length;
    this.memory = this.memory.filter((entry) => entry.id !== id);
    if (initialLength !== this.memory.length) {
      this.stats.totalEntries = this.memory.length;
      this.invalidateCache();
      await this.saveToFile();
      return true;
    }
    return false;
  }
  // Update an existing memory entry
  async update(id, newText, newTags = null) {
    await this.init();
    const index = this.memory.findIndex((entry) => entry.id === id);
    if (index !== -1) {
      this.memory[index].text = newText;
      if (newTags !== null) {
        this.memory[index].tags = Array.isArray(newTags) ? newTags : [newTags];
      }
      this.memory[index].timestamp = (/* @__PURE__ */ new Date()).toISOString();
      this.invalidateCache();
      await this.saveToFile();
      return this.memory[index];
    }
    return null;
  }
};
UltraMemory = __decorateClass([
  singleton()
], UltraMemory);
const ultraMemory = new UltraMemory();
var ultra_memory_default = ultraMemory;
export {
  UltraMemory,
  ultra_memory_default as default,
  ultraMemory
};
