// Copyright (c) 2026 Ultra-Dex
// src/core/memory/context-meta-manager.js

import { createOpenAI } from '@ai-sdk/openai';
import { embed, embedMany } from 'ai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { Document } from 'langchain/document';
import { performance } from 'perf_hooks';
import { logger } from '../../utils/logging.js';

/**
 * Context Meta-Manager
 * Advanced memory and context management system with vector storage
 */
export class ContextMetaManager {
  constructor(config = {}) {
    this.config = {
      embeddingModel: config.embeddingModel || 'text-embedding-3-small',
      vectorDimension: config.vectorDimension || 1536,
      maxContextLength: config.maxContextLength || 128000, // ~100K tokens
      retentionPeriod: config.retentionPeriod || 7 * 24 * 60 * 60 * 1000, // 7 days
      enableCompression: config.enableCompression !== false,
      enableEncryption: config.enableEncryption || false,
      enableSemanticSearch: config.enableSemanticSearch !== false,
      similarityThreshold: config.similarityThreshold || 0.7,
      ...config
    };

    this.memoryStore = new Map(); // Short-term memory
    this.longTermMemory = new Map(); // Long-term memory
    this.vectorStore = new Map(); // Vector embeddings
    this.contextWindows = new Map(); // Active context windows
    this.compressionCache = new Map(); // Compression cache
    
    this.embeddingProvider = createOpenAI({
      baseURL: 'https://api.openai.com/v1',
      apiKey: process.env.OPENAI_API_KEY,
    });

    this.stats = {
      totalMemories: 0,
      totalContextWindows: 0,
      totalEmbeddings: 0,
      cacheHits: 0,
      cacheMisses: 0,
      avgRetrievalTime: 0
    };
  }

  /**
   * Store information in memory with context
   */
  async store(key, data, context = {}, metadata = {}) {
    const startTime = performance.now();
    
    const memoryEntry = {
      id: key,
      data,
      context,
      metadata: {
        ...metadata,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        accessCount: 0,
        lastAccessed: null
      },
      embedding: null,
      compressed: false
    };

    // Create embedding if semantic search is enabled
    if (this.config.enableSemanticSearch) {
      memoryEntry.embedding = await this.createEmbedding(this.formatForEmbedding(data, context));
      this.vectorStore.set(key, memoryEntry.embedding);
      this.stats.totalEmbeddings++;
    }

    // Compress if needed
    if (this.config.enableCompression && this.shouldCompress(memoryEntry)) {
      memoryEntry.data = await this.compress(memoryEntry.data);
      memoryEntry.compressed = true;
    }

    // Store in appropriate memory tier
    if (this.isLongTermMemory(metadata)) {
      this.longTermMemory.set(key, memoryEntry);
    } else {
      this.memoryStore.set(key, memoryEntry);
    }

    this.stats.totalMemories++;
    
    const retrievalTime = performance.now() - startTime;
    this.updateRetrievalStats(retrievalTime);

    logger.info(`Memory stored: ${key}`, {
      size: JSON.stringify(data).length,
      hasEmbedding: !!memoryEntry.embedding,
      isCompressed: memoryEntry.compressed,
      retrievalTime: Math.round(retrievalTime)
    });

    return memoryEntry;
  }

  /**
   * Retrieve information from memory
   */
  async retrieve(key, options = {}) {
    const startTime = performance.now();
    
    let memoryEntry = this.memoryStore.get(key) || this.longTermMemory.get(key);
    
    if (!memoryEntry) {
      // Try to decompress from cache
      const compressed = this.compressionCache.get(key);
      if (compressed) {
        memoryEntry = await this.decompress(compressed);
        this.stats.cacheHits++;
      } else {
        this.stats.cacheMisses++;
        return null;
      }
    }

    // Update access stats
    memoryEntry.metadata.accessCount = (memoryEntry.metadata.accessCount || 0) + 1;
    memoryEntry.metadata.lastAccessed = new Date().toISOString();
    memoryEntry.metadata.updatedAt = new Date().toISOString();

    // Decompress if needed
    if (memoryEntry.compressed) {
      memoryEntry.data = await this.decompress(memoryEntry.data);
      memoryEntry.compressed = false;
    }

    // Update context window if specified
    if (options.contextWindow) {
      await this.updateContextWindow(options.contextWindow, key, memoryEntry);
    }

    const retrievalTime = performance.now() - startTime;
    this.updateRetrievalStats(retrievalTime);

    logger.info(`Memory retrieved: ${key}`, {
      accessCount: memoryEntry.metadata.accessCount,
      retrievalTime: Math.round(retrievalTime)
    });

    return memoryEntry;
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
        results.push({
          key,
          similarity,
          data: memoryEntry?.data,
          context: memoryEntry?.context,
          metadata: memoryEntry?.metadata
        });
      }
    }

    // Sort by similarity
    results.sort((a, b) => b.similarity - a.similarity);

    // Limit results
    const limitedResults = results.slice(0, options.limit || 10);

    const retrievalTime = performance.now() - startTime;
    this.updateRetrievalStats(retrievalTime);

    logger.info(`Semantic search completed`, {
      queryLength: query.length,
      resultsFound: results.length,
      resultsReturned: limitedResults.length,
      retrievalTime: Math.round(retrievalTime)
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
   * Create embeddings for multiple texts
   */
  async createEmbeddings(texts) {
    try {
      const embeddings = await embedMany({
        model: this.embeddingProvider.textEmbeddingModel(this.config.embeddingModel),
        values: texts
      });
      return embeddings;
    } catch (error) {
      logger.error('Bulk embedding creation failed', { error: error.message });
      return Array(texts.length).fill(null);
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
   * Update a context window with relevant memories
   */
  async updateContextWindow(windowId, memoryKey, memoryEntry) {
    if (!this.contextWindows.has(windowId)) {
      this.contextWindows.set(windowId, {
        id: windowId,
        memories: new Set(),
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        size: 0
      });
      this.stats.totalContextWindows++;
    }

    const window = this.contextWindows.get(windowId);
    window.memories.add(memoryKey);
    window.lastUpdated = new Date().toISOString();
    
    // Update window size
    window.size = this.calculateContextWindowSize(window);
    
    // Trim window if too large
    if (window.size > this.config.maxContextLength) {
      await this.trimContextWindow(window);
    }
  }

  /**
   * Calculate context window size
   */
  calculateContextWindowSize(window) {
    let size = 0;
    for (const key of window.memories) {
      const memory = this.memoryStore.get(key) || this.longTermMemory.get(key);
      if (memory) {
        size += JSON.stringify(memory.data).length;
      }
    }
    return size;
  }

  /**
   * Trim context window to fit size constraints
   */
  async trimContextWindow(window) {
    // Sort memories by access frequency and recency
    const sortedMemories = Array.from(window.memories).sort((a, b) => {
      const memA = this.memoryStore.get(a) || this.longTermMemory.get(a);
      const memB = this.memoryStore.get(b) || this.longTermMemory.get(b);
      
      if (!memA || !memB) return 0;
      
      // Prioritize by access count and recency
      const accessDiff = (memB.metadata.accessCount || 0) - (memA.metadata.accessCount || 0);
      if (accessDiff !== 0) return accessDiff;
      
      return new Date(memB.metadata.lastAccessed || 0) - new Date(memA.metadata.lastAccessed || 0);
    });

    // Keep most important memories, remove least important
    const keepCount = Math.floor(sortedMemories.length * 0.7); // Keep 70%
    const toRemove = sortedMemories.slice(keepCount);
    
    for (const key of toRemove) {
      window.memories.delete(key);
    }
  }

  /**
   * Check if data should be compressed
   */
  shouldCompress(memoryEntry) {
    const dataSize = JSON.stringify(memoryEntry.data).length;
    return dataSize > 1024; // Compress if larger than 1KB
  }

  /**
   * Compress data
   */
  async compress(data) {
    // In a real implementation, use compression library like pako
    // For now, just return as-is
    this.compressionCache.set(memoryEntry.id, data);
    return data;
  }

  /**
   * Decompress data
   */
  async decompress(compressedData) {
    // In a real implementation, use decompression library like pako
    // For now, just return as-is
    return compressedData;
  }

  /**
   * Check if memory should be in long-term storage
   */
  isLongTermMemory(metadata) {
    return metadata.permanent || metadata.retentionPeriod > this.config.retentionPeriod;
  }

  /**
   * Clean up expired memories
   */
  async cleanupExpiredMemories() {
    const now = Date.now();
    const expiredKeys = [];

    // Check short-term memory
    for (const [key, memory] of this.memoryStore) {
      const createdAt = new Date(memory.metadata.createdAt).getTime();
      if (now - createdAt > this.config.retentionPeriod) {
        expiredKeys.push({ key, store: 'short' });
      }
    }

    // Check long-term memory
    for (const [key, memory] of this.longTermMemory) {
      const createdAt = new Date(memory.metadata.createdAt).getTime();
      const retentionPeriod = memory.metadata.retentionPeriod || this.config.retentionPeriod;
      if (now - createdAt > retentionPeriod && !memory.metadata.permanent) {
        expiredKeys.push({ key, store: 'long' });
      }
    }

    // Remove expired memories
    for (const { key, store } of expiredKeys) {
      if (store === 'short') {
        this.memoryStore.delete(key);
        this.vectorStore.delete(key);
      } else {
        this.longTermMemory.delete(key);
        this.vectorStore.delete(key);
      }
      this.stats.totalMemories--;
    }

    logger.info(`Memory cleanup completed`, {
      expiredCount: expiredKeys.length,
      remainingShortTerm: this.memoryStore.size,
      remainingLongTerm: this.longTermMemory.size
    });

    return expiredKeys.length;
  }

  /**
   * Update retrieval statistics
   */
  updateRetrievalStats(time) {
    this.stats.avgRetrievalTime = 
      ((this.stats.avgRetrievalTime * (this.stats.cacheHits + this.stats.cacheMisses - 1)) + time) / 
      (this.stats.cacheHits + this.stats.cacheMisses);
  }

  /**
   * Get memory statistics
   */
  getStats() {
    return {
      ...this.stats,
      memoryStoreSize: this.memoryStore.size,
      longTermMemorySize: this.longTermMemory.size,
      vectorStoreSize: this.vectorStore.size,
      contextWindowsCount: this.contextWindows.size,
      compressionCacheSize: this.compressionCache.size
    };
  }

  /**
   * Get all context windows
   */
  getContextWindows() {
    return Object.fromEntries(this.contextWindows);
  }

  /**
   * Clear all memories (dangerous!)
   */
  async clearAll() {
    this.memoryStore.clear();
    this.longTermMemory.clear();
    this.vectorStore.clear();
    this.contextWindows.clear();
    this.compressionCache.clear();
    
    this.stats = {
      totalMemories: 0,
      totalContextWindows: 0,
      totalEmbeddings: 0,
      cacheHits: 0,
      cacheMisses: 0,
      avgRetrievalTime: 0
    };

    logger.info('All memories cleared');
  }
}

// Export singleton instance
export const contextMetaManager = new ContextMetaManager();

// Export for direct import
export default contextMetaManager;