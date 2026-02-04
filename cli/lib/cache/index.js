/**
 * Ultra-Dex Response Cache Layer
 * Implements LRU caching with semantic similarity matching for API responses
 * Provides cost savings through intelligent caching
 */

import fs from 'fs/promises';
import path from 'path';
import { createHash } from 'crypto';
import { LRUCache } from 'lru-cache';

class UltraDexCache {
  constructor(options = {}) {
    this.cacheDir = options.cacheDir || path.join(process.cwd(), '.ultra-dex', 'cache');
    this.maxEntries = options.maxEntries || 1000;
    this.ttl = options.ttl || 24 * 60 * 60 * 1000; // 24 hours default
    this.similarityThreshold = options.similarityThreshold || 0.85; // 85% similarity threshold
    
    // In-memory LRU cache for fast access
    this.lruCache = new LRUCache({
      max: this.maxEntries,
      ttl: this.ttl,
      allowStale: false,
      updateAgeOnGet: true,
      dispose: (value, key) => {
        // Clean up file when evicted from LRU
        this.cleanupFile(key);
      }
    });
    
    // Track cost savings
    this.costMetrics = {
      hits: 0,
      misses: 0,
      estimatedSavings: 0 // in USD
    };
    
    this.ensureCacheDir();
  }
  
  async ensureCacheDir() {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create cache directory:', error.message);
    }
  }
  
  /**
   * Generate a cache key based on input parameters
   */
  generateKey(provider, model, systemPrompt, userPrompt) {
    const input = JSON.stringify({
      provider,
      model,
      systemPrompt: systemPrompt || '',
      userPrompt
    });
    
    return createHash('sha256').update(input).digest('hex');
  }
  
  /**
   * Calculate semantic similarity between two texts using simple approach
   */
  calculateSimilarity(text1, text2) {
    if (!text1 || !text2) return 0;

    const clean1 = text1.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/).filter(Boolean);
    const clean2 = text2.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/).filter(Boolean);

    const set1 = new Set(clean1);
    const set2 = new Set(clean2);

    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }
  
  /**
   * Find semantically similar cached response
   */
  async findSimilar(provider, model, systemPrompt, userPrompt) {
    const cacheFiles = await this.getCacheFiles();

    for (const file of cacheFiles) {
      try {
        const cachedData = JSON.parse(await fs.readFile(file, 'utf8'));

        if (cachedData.provider === provider && cachedData.model === model) {
          const similarity = this.calculateSimilarity(userPrompt, cachedData.userPrompt);

          if (similarity >= this.similarityThreshold) {
            // Update access time in LRU cache
            this.lruCache.set(path.basename(file, '.json'), cachedData);
            return {
              ...cachedData,
              similarity,
              hitType: 'semantic'
            };
          }
        }
      } catch (error) {
        // Skip corrupted cache files
        continue;
      }
    }

    return null;
  }
  
  /**
   * Get list of cache files
   */
  async getCacheFiles() {
    try {
      const files = await fs.readdir(this.cacheDir);
      return files
        .filter(file => file.endsWith('.json'))
        .map(file => path.join(this.cacheDir, file));
    } catch {
      return [];
    }
  }
  
  /**
   * Get cached response
   */
  async get(provider, model, systemPrompt, userPrompt) {
    const key = this.generateKey(provider, model, systemPrompt, userPrompt);
    
    // Check in-memory LRU cache first
    let cached = this.lruCache.get(key);
    
    if (!cached) {
      // Check file system
      const cachePath = path.join(this.cacheDir, `${key}.json`);
      
      try {
        const content = await fs.readFile(cachePath, 'utf8');
        cached = JSON.parse(content);
        this.lruCache.set(key, cached); // Populate LRU cache
      } catch {
        // Not in cache, try semantic search
        cached = await this.findSimilar(provider, model, systemPrompt, userPrompt);
      }
    }
    
    if (cached) {
      this.costMetrics.hits++;
      // Estimate cost savings (assuming $0.01 per API call)
      this.costMetrics.estimatedSavings += 0.01;
      return cached;
    }
    
    this.costMetrics.misses++;
    return null;
  }
  
  /**
   * Set cached response
   */
  async set(provider, model, systemPrompt, userPrompt, response) {
    const key = this.generateKey(provider, model, systemPrompt, userPrompt);
    const cachePath = path.join(this.cacheDir, `${key}.json`);
    
    const cacheData = {
      provider,
      model,
      systemPrompt: systemPrompt || '',
      userPrompt,
      response,
      timestamp: new Date().toISOString(),
      ttl: this.ttl
    };
    
    try {
      await fs.writeFile(cachePath, JSON.stringify(cacheData, null, 2));
      this.lruCache.set(key, cacheData);
    } catch (error) {
      console.error('Failed to write cache:', error.message);
    }
  }
  
  /**
   * Invalidate specific cache entry
   */
  async invalidate(provider, model, systemPrompt, userPrompt) {
    const key = this.generateKey(provider, model, systemPrompt, userPrompt);
    const cachePath = path.join(this.cacheDir, `${key}.json`);
    
    try {
      await fs.unlink(cachePath);
      this.lruCache.delete(key);
    } catch {
      // File might not exist
    }
  }
  
  /**
   * Clear expired entries
   */
  async clearExpired() {
    const cacheFiles = await this.getCacheFiles();
    const now = Date.now();
    
    for (const file of cacheFiles) {
      try {
        const stat = await fs.stat(file);
        if (now - stat.mtimeMs > this.ttl) {
          await fs.unlink(file);
        }
      } catch {
        // Skip if file doesn't exist anymore
      }
    }
  }
  
  /**
   * Clean up specific file
   */
  async cleanupFile(key) {
    const cachePath = path.join(this.cacheDir, `${key}.json`);
    try {
      await fs.unlink(cachePath);
    } catch {
      // File might not exist
    }
  }
  
  /**
   * Get cache statistics
   */
  getStats() {
    return {
      hits: this.costMetrics.hits,
      misses: this.costMetrics.misses,
      hitRate: this.costMetrics.hits / (this.costMetrics.hits + this.costMetrics.misses || 1),
      estimatedSavings: this.costMetrics.estimatedSavings,
      cacheSize: this.lruCache.size,
      maxEntries: this.maxEntries
    };
  }
  
  /**
   * Clear entire cache
   */
  async clear() {
    try {
      const cacheFiles = await this.getCacheFiles();
      for (const file of cacheFiles) {
        try {
          await fs.unlink(file);
        } catch {
          // Skip if file doesn't exist
        }
      }
      this.lruCache.clear();
      this.costMetrics = { hits: 0, misses: 0, estimatedSavings: 0 };
    } catch (error) {
      console.error('Failed to clear cache:', error.message);
    }
  }
}

// Singleton instance
let cacheInstance = null;

export function getCache(options = {}) {
  if (!cacheInstance) {
    cacheInstance = new UltraDexCache(options);
  }
  return cacheInstance;
}

export default {
  getCache,
  UltraDexCache
};