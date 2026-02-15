/**
 * Ultra-Dex Performance Optimization Module
 * Advanced caching and performance optimization layer
 */

import crypto from 'crypto';
import { EventEmitter } from 'events';

// Redis client for distributed caching (will be initialized if Redis is available)
let redisClient = null;

class PerformanceOptimizer extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      enableRedis: options.enableRedis !== false,
      redisUrl: options.redisUrl || process.env.REDIS_URL || 'redis://localhost:6379',
      cacheTtl: options.cacheTtl || 3600, // 1 hour default
      enableQueryCache: options.enableQueryCache !== false,
      enableResponseCache: options.enableResponseCache !== false,
      enableMemoryCache: options.enableMemoryCache !== false,
      maxMemoryCacheSize: options.maxMemoryCacheSize || 500, // Max entries in memory cache
      enableLRUCache: options.enableLRUCache !== false, // Enable LRU eviction strategy
      ...options
    };

    this.memoryCache = new Map(); // In-memory cache
    this.accessOrder = []; // Track access order for LRU if enabled
    this.cacheStats = {
      hits: 0,
      misses: 0,
      evictions: 0
    };

    // Initialize with error handling
    this.initialize().catch(err => {
      console.error('Failed to initialize PerformanceOptimizer:', err);
    });
  }

  async initialize() {
    // Initialize Redis client if available
    if (this.options.enableRedis) {
      try {
        const { createClient } = await import('redis');
        this.redisClient = createClient({ url: this.options.redisUrl });
        
        // Add error handlers for Redis client
        this.redisClient.on('error', (err) => {
          console.warn('Redis Client Error:', err.message);
          this.options.enableRedis = false;
        });
        
        await this.redisClient.connect();
        console.log('✅ Redis cache connected');
      } catch (error) {
        console.warn('⚠️ Redis cache unavailable, using memory cache only:', error.message);
        this.options.enableRedis = false;
      }
    }
  }

  /**
   * Get a value from cache
   * @param {string} key - Cache key
   * @returns {Promise<any>} Cached value or null if not found
   */
  async get(key) {
    // Try Redis first if available
    if (this.options.enableRedis && this.redisClient && this.redisClient.isOpen) {
      try {
        const value = await this.redisClient.get(key);
        if (value !== null) {
          this.cacheStats.hits++;
          // Update access order for LRU if enabled
          if (this.options.enableLRUCache) {
            this.updateAccessOrder(key);
          }
          return JSON.parse(value);
        }
      } catch (error) {
        console.warn('Redis get failed, falling back to memory cache:', error.message);
      }
    }

    // Fall back to memory cache
    if (this.options.enableMemoryCache) {
      const entry = this.memoryCache.get(key);
      if (entry && (Date.now() - entry.timestamp) < (this.options.cacheTtl * 1000)) {
        // Check if entry has expired
        if ((Date.now() - entry.timestamp) >= (this.options.cacheTtl * 1000)) {
          this.memoryCache.delete(key);
          if (this.options.enableLRUCache) {
            this.accessOrder.splice(this.accessOrder.indexOf(key), 1);
          }
          this.cacheStats.misses++;
          return null;
        }
        
        this.cacheStats.hits++;
        // Update access order for LRU if enabled
        if (this.options.enableLRUCache) {
          this.updateAccessOrder(key);
        }
        return entry.value;
      }
    }

    this.cacheStats.misses++;
    return null;
  }

  /**
   * Update access order for LRU strategy
   * @param {string} key - Key that was accessed
   */
  updateAccessOrder(key) {
    // Remove key from current position
    const index = this.accessOrder.indexOf(key);
    if (index !== -1) {
      this.accessOrder.splice(index, 1);
    }
    // Add key to end (most recently used)
    this.accessOrder.push(key);
  }

  /**
   * Get the least recently used key for eviction
   * @returns {string|null} Least recently used key or null if none
   */
  getLeastRecentlyUsedKey() {
    if (this.accessOrder.length === 0) return null;
    return this.accessOrder[0]; // First item is least recently used
  }

  /**
   * Set a value in cache
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in seconds (optional)
   */
  async set(key, value, ttl = null) {
    const actualTtl = ttl || this.options.cacheTtl;
    const cacheValue = JSON.stringify(value);

    // Set in Redis if available
    if (this.options.enableRedis && this.redisClient && this.redisClient.isOpen) {
      try {
        await this.redisClient.setEx(key, actualTtl, cacheValue);
      } catch (error) {
        console.warn('Redis set failed:', error.message);
      }
    }

    // Set in memory cache
    if (this.options.enableMemoryCache) {
      // Handle cache size limits with LRU eviction if enabled
      if (this.memoryCache.size >= this.options.maxMemoryCacheSize) {
        let keyToRemove;
        if (this.options.enableLRUCache) {
          keyToRemove = this.getLeastRecentlyUsedKey();
        } else {
          // Use FIFO eviction if LRU is disabled
          keyToRemove = this.memoryCache.keys().next().value;
        }
        
        if (keyToRemove) {
          this.memoryCache.delete(keyToRemove);
          if (this.options.enableLRUCache) {
            const index = this.accessOrder.indexOf(keyToRemove);
            if (index !== -1) {
              this.accessOrder.splice(index, 1);
            }
          }
          this.cacheStats.evictions++;
        }
      }

      this.memoryCache.set(key, {
        value,
        timestamp: Date.now()
      });

      // Update access order for LRU if enabled
      if (this.options.enableLRUCache) {
        this.updateAccessOrder(key);
      }
    }
  }

  /**
   * Delete a value from cache
   * @param {string} key - Cache key
   */
  async del(key) {
    // Delete from Redis if available
    if (this.options.enableRedis && this.redisClient && this.redisClient.isOpen) {
      try {
        await this.redisClient.del(key);
      } catch (error) {
        console.warn('Redis del failed:', error.message);
      }
    }

    // Delete from memory cache
    this.memoryCache.delete(key);
    
    // Remove from access order if using LRU
    if (this.options.enableLRUCache) {
      const index = this.accessOrder.indexOf(key);
      if (index !== -1) {
        this.accessOrder.splice(index, 1);
      }
    }
  }

  /**
   * Clear all caches
   */
  async clear() {
    if (this.options.enableRedis && this.redisClient && this.redisClient.isOpen) {
      try {
        await this.redisClient.flushAll();
      } catch (error) {
        console.warn('Redis flush failed:', error.message);
      }
    }

    this.memoryCache.clear();
    this.accessOrder = []; // Clear access order as well
    this.cacheStats = { hits: 0, misses: 0, evictions: 0 };
  }

  /**
   * Cache a database query result
   * @param {string} query - Query string
   * @param {Array} params - Query parameters
   * @param {Function} queryFn - Function to execute if not cached
   * @returns {Promise<any>} Query result
   */
  async cacheQuery(query, params, queryFn) {
    if (!this.options.enableQueryCache) {
      return await queryFn();
    }

    // Create cache key from query and parameters
    const cacheKey = `query:${crypto.createHash('sha256').update(query + JSON.stringify(params)).digest('hex')}`;

    // Try to get from cache
    let result = await this.get(cacheKey);
    if (result !== null) {
      return result;
    }

    // Execute query and cache result
    result = await queryFn();
    await this.set(cacheKey, result);

    return result;
  }

  /**
   * Cache an API response
   * @param {string} endpoint - API endpoint
   * @param {object} params - Request parameters
   * @param {Function} apiCallFn - Function to execute if not cached
   * @param {number} ttl - Cache TTL in seconds
   * @returns {Promise<any>} API response
   */
  async cacheApiResponse(endpoint, params, apiCallFn, ttl = null) {
    if (!this.options.enableResponseCache) {
      return await apiCallFn();
    }

    // Create cache key from endpoint and parameters
    const cacheKey = `api:${endpoint}:${crypto.createHash('sha256').update(JSON.stringify(params)).digest('hex')}`;

    // Try to get from cache
    let result = await this.get(cacheKey);
    if (result !== null) {
      return result;
    }

    // Execute API call and cache result
    result = await apiCallFn();
    await this.set(cacheKey, result, ttl);

    return result;
  }

  /**
   * Cache a memory operation
   * @param {string} operation - Operation type
   * @param {object} params - Operation parameters
   * @param {Function} operationFn - Function to execute if not cached
   * @returns {Promise<any>} Operation result
   */
  async cacheMemoryOperation(operation, params, operationFn) {
    if (!this.options.enableMemoryCache) {
      return await operationFn();
    }

    // Create cache key from operation and parameters
    const cacheKey = `memory:${operation}:${crypto.createHash('sha256').update(JSON.stringify(params)).digest('hex')}`;

    // Try to get from cache
    let result = await this.get(cacheKey);
    if (result !== null) {
      return result;
    }

    // Execute operation and cache result
    result = await operationFn();
    // Use shorter TTL for memory operations since they might change frequently
    await this.set(cacheKey, result, Math.min(this.options.cacheTtl, 300)); // 5 minutes max

    return result;
  }

  /**
   * Get cache statistics
   * @returns {object} Cache statistics
   */
  getStats() {
    return {
      ...this.cacheStats,
      hitRate: this.cacheStats.hits + this.cacheStats.misses > 0 
        ? (this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses)) * 100 
        : 0,
      memoryCacheSize: this.memoryCache.size,
      redisEnabled: this.options.enableRedis,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Warm up cache with common queries
   * @param {Array} warmupQueries - Queries to pre-cache
   */
  async warmupCache(warmupQueries) {
    const promises = warmupQueries.map(async (queryData) => {
      try {
        const result = await queryData.fn();
        await this.set(queryData.key, result, queryData.ttl || this.options.cacheTtl);
        return { key: queryData.key, success: true };
      } catch (error) {
        return { key: queryData.key, success: false, error: error.message };
      }
    });

    const results = await Promise.all(promises);
    const successful = results.filter(r => r.success).length;
    
    console.log(`Cache warmup: ${successful}/${results.length} queries cached`);
    return results;
  }

  /**
   * Get system health information
   * @returns {object} Health information
   */
  getHealth() {
    return {
      status: 'healthy',
      cacheEnabled: true,
      redisConnected: this.options.enableRedis && this.redisClient?.isOpen,
      memoryCacheSize: this.memoryCache.size,
      cacheHitRate: this.getStats().hitRate,
      timestamp: new Date().toISOString(),
    };
  }
}

// Export singleton instance
export const performanceOptimizer = new PerformanceOptimizer();

// Export class for instantiation with custom options
export default PerformanceOptimizer;