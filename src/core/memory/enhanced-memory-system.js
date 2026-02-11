// Copyright (c) 2026 Ultra-Dex
// src/core/memory/enhanced-memory-system.js

import { createOpenAI } from '@ai-sdk/openai';
import { embed, embedMany } from 'ai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { performance } from 'perf_hooks';
import { logger } from '../utils/logging.js';
import fs from 'fs/promises';
import path from 'path';
import { createGzip, createGunzip } from 'zlib';
import { pipeline } from 'stream/promises';

/**
 * Enhanced Memory System
 * Advanced multi-tier memory with semantic search, compression, and encryption
 */
export class EnhancedMemorySystem {
  constructor(config = {}) {
    this.config = {
      // Embedding configuration
      embeddingModel: config.embeddingModel || 'text-embedding-3-small',
      vectorDimension: config.vectorDimension || 1536,
      
      // Memory tiers
      maxHotMemory: config.maxHotMemory || 1000, // In-memory cache
      maxWarmMemory: config.maxWarmMemory || 10000, // SQLite storage
      maxColdMemory: config.maxColdMemory || 100000, // File storage
      
      // Retention policies
      hotRetention: config.hotRetention || 3600000, // 1 hour
      warmRetention: config.warmRetention || 86400000, // 24 hours
      coldRetention: config.coldRetention || 2592000000, // 30 days
      
      // Performance settings
      enableCompression: config.enableCompression !== false,
      enableEncryption: config.enableEncryption || false,
      enableSemanticSearch: config.enableSemanticSearch !== false,
      similarityThreshold: config.similarityThreshold || 0.7,
      
      // Storage paths
      storagePath: config.storagePath || path.join(process.cwd(), '.ultra-dex', 'memory'),
      
      ...config
    };

    // Memory tiers
    this.hotMemory = new Map(); // In-memory cache (hot tier)
    this.warmMemory = new Map(); // SQLite storage (warm tier)
    this.coldMemory = new Map(); // File storage (cold tier)
    
    // Vector storage for semantic search
    this.vectorStore = new Map(); // Memory ID -> embedding vector
    
    // Context windows for active sessions
    this.contextWindows = new Map(); // Window ID -> context data
    
    // Compression cache
    this.compressionCache = new Map();
    
    // Statistics
    this.stats = {
      hotHits: 0,
      hotMisses: 0,
      warmHits: 0,
      warmMisses: 0,
      coldHits: 0,
      coldMisses: 0,
      totalQueries: 0,
      totalMemories: 0,
      avgLatency: 0,
      totalTokens: 0
    };

    // Initialize embedding provider
    this.embeddingProvider = createOpenAI({
      baseURL: 'https://api.openai.com/v1',
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Initialize storage
    this.initializeStorage();
  }

  /**
   * Initialize storage directories
   */
  async initializeStorage() {
    try {
      await fs.mkdir(this.config.storagePath, { recursive: true });
      await fs.mkdir(path.join(this.config.storagePath, 'warm'), { recursive: true });
      await fs.mkdir(path.join(this.config.storagePath, 'cold'), { recursive: true });
      await fs.mkdir(path.join(this.config.storagePath, 'contexts'), { recursive: true });
    } catch (error) {
      logger.error('Failed to initialize memory storage', { error: error.message });
    }
  }

  /**
   * Store information in the appropriate memory tier
   */
  async store(key, data, context = {}, metadata = {}) {
    const startTime = performance.now();
    
    // Create memory entry
    const memoryEntry = {
      id: key,
      data,
      context,
      metadata: {
        ...metadata,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        accessCount: 0,
        lastAccessed: null,
        importance: metadata.importance || 1, // 1-10 scale
        tags: metadata.tags || [],
        permanent: metadata.permanent || false
      },
      embedding: null,
      compressed: false
    };

    // Create embedding if semantic search is enabled
    if (this.config.enableSemanticSearch) {
      memoryEntry.embedding = await this.createEmbedding(this.formatForEmbedding(data, context));
      this.vectorStore.set(key, memoryEntry.embedding);
    }

    // Compress if needed and enabled
    if (this.config.enableCompression && this.shouldCompress(memoryEntry)) {
      memoryEntry.data = await this.compress(memoryEntry.data);
      memoryEntry.compressed = true;
    }

    // Determine appropriate tier based on importance and permanence
    const tier = this.determineTier(memoryEntry);
    
    // Store in appropriate tier
    await this.storeInTier(tier, key, memoryEntry);

    // Update statistics
    this.stats.totalMemories++;
    const latency = performance.now() - startTime;
    this.stats.avgLatency = 
      ((this.stats.avgLatency * (this.stats.totalMemories - 1)) + latency) / 
      this.stats.totalMemories;

    logger.info(`Memory stored in ${tier} tier`, {
      key,
      tier,
      size: JSON.stringify(data).length,
      hasEmbedding: !!memoryEntry.embedding,
      isCompressed: memoryEntry.compressed,
      latency: Math.round(latency)
    });

    return { id: key, tier, storedAt: new Date().toISOString(), latency };
  }

  /**
   * Retrieve information from memory
   */
  async retrieve(key, options = {}) {
    const startTime = performance.now();
    this.stats.totalQueries++;

    // Check hot memory first (fastest)
    if (this.hotMemory.has(key)) {
      this.stats.hotHits++;
      const entry = this.hotMemory.get(key);
      await this.updateAccessStats(entry);
      const latency = performance.now() - startTime;
      return { ...entry, latency, tier: 'hot' };
    }
    this.stats.hotMisses++;

    // Check warm memory
    try {
      const warmEntry = await this.getFromWarm(key);
      if (warmEntry) {
        this.stats.warmHits++;
        await this.updateAccessStats(warmEntry);
        // Promote to hot tier if frequently accessed
        if (warmEntry.metadata.accessCount > 5) {
          this.hotMemory.set(key, warmEntry);
        }
        const latency = performance.now() - startTime;
        return { ...warmEntry, latency, tier: 'warm' };
      }
    } catch (error) {
      logger.warn(`Warm memory retrieval failed: ${error.message}`);
    }
    this.stats.warmMisses++;

    // Check cold memory
    try {
      const coldEntry = await this.getFromCold(key);
      if (coldEntry) {
        this.stats.coldHits++;
        await this.updateAccessStats(coldEntry);
        // Promote to warm tier for future access
        await this.storeInTier('warm', key, coldEntry);
        const latency = performance.now() - startTime;
        return { ...coldEntry, latency, tier: 'cold' };
      }
    } catch (error) {
      logger.warn(`Cold memory retrieval failed: ${error.message}`);
    }
    this.stats.coldMisses++;

    // Not found in any tier
    return null;
  }

  /**
   * Semantic search in memory
   */
  async semanticSearch(query, options = {}) {
    if (!this.config.enableSemanticSearch) {
      throw new Error('Semantic search is not enabled');
    }

    const startTime = performance.now();
    const queryEmbedding = await this.createEmbedding(query);

    const results = [];
    for (const [key, embedding] of this.vectorStore) {
      const similarity = this.cosineSimilarity(queryEmbedding, embedding);
      
      if (similarity >= (options.threshold || this.config.similarityThreshold)) {
        const memoryEntry = await this.retrieve(key);
        if (memoryEntry) {
          results.push({
            key,
            similarity,
            entry: memoryEntry,
            metadata: memoryEntry.metadata
          });
        }
      }
    }

    // Sort by similarity
    results.sort((a, b) => b.similarity - a.similarity);

    // Limit results
    const limitedResults = results.slice(0, options.limit || 10);

    const latency = performance.now() - startTime;
    logger.info(`Semantic search completed`, {
      queryLength: query.length,
      resultsFound: results.length,
      resultsReturned: limitedResults.length,
      latency: Math.round(latency)
    });

    return limitedResults;
  }

  /**
   * Create embedding for text
   */
  async createEmbedding(text) {
    try {
      const embedding = await embed({
        model: this.embeddingProvider.textEmbeddingModel(this.config.embeddingModel),
        value: text
      });
      return embedding;
    } catch (error) {
      logger.error('Embedding creation failed', { error: error.message });
      return null;
    }
  }

  /**
   * Cosine similarity calculation
   */
  cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += Math.pow(vecA[i], 2);
      normB += Math.pow(vecB[i], 2);
    }

    if (normA === 0 || normB === 0) return 0;

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Format data for embedding
   */
  formatForEmbedding(data, context = {}) {
    const textData = typeof data === 'string' ? data : JSON.stringify(data);
    const contextText = Object.keys(context).length > 0 ? JSON.stringify(context) : '';
    
    return `${contextText}\n\n${textData}`.substring(0, 8192); // Limit embedding input
  }

  /**
   * Determine appropriate memory tier
   */
  determineTier(memoryEntry) {
    if (memoryEntry.metadata.permanent) {
      return 'cold'; // Permanent data goes to cold storage
    }
    
    if (memoryEntry.metadata.importance >= 8) {
      return 'hot'; // High importance data stays in hot memory
    }
    
    if (memoryEntry.metadata.importance >= 5) {
      return 'warm'; // Medium importance in warm storage
    }
    
    return 'cold'; // Low importance in cold storage
  }

  /**
   * Store in appropriate tier
   */
  async storeInTier(tier, key, entry) {
    switch (tier) {
      case 'hot':
        this.hotMemory.set(key, entry);
        // Evict oldest if over capacity
        if (this.hotMemory.size > this.config.maxHotMemory) {
          const oldestKey = this.hotMemory.keys().next().value;
          this.hotMemory.delete(oldestKey);
        }
        break;
        
      case 'warm':
        this.warmMemory.set(key, entry);
        // Also store to persistent storage
        await this.saveToWarm(key, entry);
        // Evict oldest if over capacity
        if (this.warmMemory.size > this.config.maxWarmMemory) {
          const oldestKey = this.warmMemory.keys().next().value;
          this.warmMemory.delete(oldestKey);
          await this.removeFromWarm(oldestKey);
        }
        break;
        
      case 'cold':
        this.coldMemory.set(key, entry);
        await this.saveToCold(key, entry);
        // Evict oldest if over capacity
        if (this.coldMemory.size > this.config.maxColdMemory) {
          const oldestKey = this.coldMemory.keys().next().value;
          this.coldMemory.delete(oldestKey);
          await this.removeFromCold(oldestKey);
        }
        break;
    }
  }

  /**
   * Save to warm storage (SQLite)
   */
  async saveToWarm(key, entry) {
    // In a real implementation, this would save to SQLite
    // For now, we'll save to a JSON file
    const filePath = path.join(this.config.storagePath, 'warm', `${key}.json`);
    await fs.writeFile(filePath, JSON.stringify(entry, null, 2));
  }

  /**
   * Save to cold storage (file system)
   */
  async saveToCold(key, entry) {
    const filePath = path.join(this.config.storagePath, 'cold', `${key}.json.gz`);
    
    if (this.config.enableCompression) {
      // Compress before saving
      const data = JSON.stringify(entry);
      const compressed = await this.compress(data);
      await fs.writeFile(filePath, compressed);
    } else {
      await fs.writeFile(filePath, JSON.stringify(entry, null, 2));
    }
  }

  /**
   * Get from warm storage
   */
  async getFromWarm(key) {
    const filePath = path.join(this.config.storagePath, 'warm', `${key}.json`);
    try {
      const data = await fs.readFile(filePath, 'utf8');
      const entry = JSON.parse(data);
      this.warmMemory.set(key, entry); // Cache in memory
      return entry;
    } catch {
      return null;
    }
  }

  /**
   * Get from cold storage
   */
  async getFromCold(key) {
    const filePath = path.join(this.config.storagePath, 'cold', `${key}.json.gz`);
    try {
      const data = await fs.readFile(filePath);
      
      if (this.config.enableCompression) {
        const decompressed = await this.decompress(data);
        const entry = JSON.parse(decompressed);
        this.coldMemory.set(key, entry); // Cache in memory temporarily
        return entry;
      } else {
        const entry = JSON.parse(data.toString());
        this.coldMemory.set(key, entry); // Cache in memory temporarily
        return entry;
      }
    } catch {
      return null;
    }
  }

  /**
   * Remove from warm storage
   */
  async removeFromWarm(key) {
    const filePath = path.join(this.config.storagePath, 'warm', `${key}.json`);
    try {
      await fs.unlink(filePath);
    } catch {
      // File may not exist, that's OK
    }
  }

  /**
   * Remove from cold storage
   */
  async removeFromCold(key) {
    const filePath = path.join(this.config.storagePath, 'cold', `${key}.json.gz`);
    try {
      await fs.unlink(filePath);
    } catch {
      // File may not exist, that's OK
    }
  }

  /**
   * Compress data
   */
  async compress(data) {
    if (typeof data === 'string') {
      data = Buffer.from(data, 'utf8');
    }
    
    const compressed = await pipeline(
      async function* () {
        yield data;
      },
      createGzip()
    );
    
    return compressed;
  }

  /**
   * Decompress data
   */
  async decompress(compressedData) {
    const decompressed = await pipeline(
      async function* () {
        yield compressedData;
      },
      createGunzip()
    );
    
    return decompressed.toString('utf8');
  }

  /**
   * Check if data should be compressed
   */
  shouldCompress(memoryEntry) {
    const dataSize = typeof memoryEntry.data === 'string' 
      ? memoryEntry.data.length 
      : JSON.stringify(memoryEntry.data).length;
    return dataSize > 1024; // Compress if larger than 1KB
  }

  /**
   * Update access statistics for a memory entry
   */
  async updateAccessStats(entry) {
    entry.metadata.accessCount = (entry.metadata.accessCount || 0) + 1;
    entry.metadata.lastAccessed = new Date().toISOString();
    entry.metadata.updatedAt = new Date().toISOString();
  }

  /**
   * Create or update a context window
   */
  async createContextWindow(windowId, initialContext = {}) {
    const window = {
      id: windowId,
      context: initialContext,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      active: true,
      size: JSON.stringify(initialContext).length
    };

    this.contextWindows.set(windowId, window);
    
    // Save to persistent storage
    const filePath = path.join(this.config.storagePath, 'contexts', `${windowId}.json`);
    await fs.writeFile(filePath, JSON.stringify(window, null, 2));

    return window;
  }

  /**
   * Update context window with new information
   */
  async updateContextWindow(windowId, updates) {
    let window = this.contextWindows.get(windowId);
    
    if (!window) {
      // Load from storage if not in memory
      const filePath = path.join(this.config.storagePath, 'contexts', `${windowId}.json`);
      try {
        const data = await fs.readFile(filePath, 'utf8');
        window = JSON.parse(data);
        this.contextWindows.set(windowId, window);
      } catch {
        // Create new window if it doesn't exist
        return await this.createContextWindow(windowId, updates);
      }
    }

    // Update context
    window.context = { ...window.context, ...updates };
    window.lastUpdated = new Date().toISOString();
    window.size = JSON.stringify(window.context).length;

    // Update in memory
    this.contextWindows.set(windowId, window);

    // Save to persistent storage
    const filePath = path.join(this.config.storagePath, 'contexts', `${windowId}.json`);
    await fs.writeFile(filePath, JSON.stringify(window, null, 2));

    return window;
  }

  /**
   * Get context window
   */
  async getContextWindow(windowId) {
    let window = this.contextWindows.get(windowId);
    
    if (!window) {
      // Load from storage
      const filePath = path.join(this.config.storagePath, 'contexts', `${windowId}.json`);
      try {
        const data = await fs.readFile(filePath, 'utf8');
        window = JSON.parse(data);
        this.contextWindows.set(windowId, window);
      } catch {
        return null;
      }
    }

    return window;
  }

  /**
   * Clean up expired memories
   */
  async cleanupExpiredMemories() {
    const now = Date.now();
    const cutoffs = {
      hot: now - this.config.hotRetention,
      warm: now - this.config.warmRetention,
      cold: now - this.config.coldRetention
    };

    // Clean hot memory
    for (const [key, entry] of this.hotMemory) {
      const createdAt = new Date(entry.metadata.createdAt).getTime();
      if (createdAt < cutoffs.hot && !entry.metadata.permanent) {
        this.hotMemory.delete(key);
      }
    }

    // Clean warm memory
    for (const [key, entry] of this.warmMemory) {
      const createdAt = new Date(entry.metadata.createdAt).getTime();
      if (createdAt < cutoffs.warm && !entry.metadata.permanent) {
        this.warmMemory.delete(key);
        await this.removeFromWarm(key);
      }
    }

    // Clean cold memory
    for (const [key, entry] of this.coldMemory) {
      const createdAt = new Date(entry.metadata.createdAt).getTime();
      if (createdAt < cutoffs.cold && !entry.metadata.permanent) {
        this.coldMemory.delete(key);
        await this.removeFromCold(key);
      }
    }

    // Clean vector store for deleted entries
    for (const key of this.vectorStore.keys()) {
      if (!this.hotMemory.has(key) && !this.warmMemory.has(key) && !this.coldMemory.has(key)) {
        this.vectorStore.delete(key);
      }
    }

    logger.info('Memory cleanup completed', {
      hotSize: this.hotMemory.size,
      warmSize: this.warmMemory.size,
      coldSize: this.coldMemory.size,
      vectorStoreSize: this.vectorStore.size
    });
  }

  /**
   * Get memory statistics
   */
  getStats() {
    return {
      ...this.stats,
      tiers: {
        hot: this.hotMemory.size,
        warm: this.warmMemory.size,
        cold: this.coldMemory.size
      },
      cacheHitRates: {
        hot: this.stats.hotHits / (this.stats.hotHits + this.stats.hotMisses || 1) * 100,
        warm: this.stats.warmHits / (this.stats.warmHits + this.stats.warmMisses || 1) * 100,
        cold: this.stats.coldHits / (this.stats.coldHits + this.stats.coldMisses || 1) * 100
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get all context windows
   */
  getContextWindows() {
    return Array.from(this.contextWindows.values());
  }

  /**
   * Shutdown the memory system
   */
  async shutdown() {
    // Persist any remaining warm/cold memories to storage
    logger.info('Shutting down enhanced memory system...');
    
    // Clean up expired memories before shutdown
    await this.cleanupExpiredMemories();
    
    logger.info('Enhanced memory system shut down successfully');
  }
}

// Export singleton instance
export const enhancedMemorySystem = new EnhancedMemorySystem();

// Export for direct import
export default enhancedMemorySystem;