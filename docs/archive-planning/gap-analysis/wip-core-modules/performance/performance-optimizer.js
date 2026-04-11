// Copyright (c) 2026 Ultra-Dex
// src/core/performance/performance-optimizer.js

import { performance } from 'perf_hooks';
import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import { cpus } from 'os';
import fs from 'fs/promises';
import path from 'path';
import { logger } from '../utils/logging.js';

/**
 * Ultra-Dex Performance Optimizer
 * Advanced performance tuning and optimization system
 */
export class PerformanceOptimizer {
  constructor(options = {}) {
    this.config = {
      // Performance optimization settings
      enableCaching: options.enableCaching !== false,
      enableCompression: options.enableCompression !== false,
      enableParallelization: options.enableParallelization !== false,
      maxWorkerThreads: Math.min(cpus().length, options.maxWorkerThreads || 8),
      cacheTTL: options.cacheTTL || 300000, // 5 minutes
      maxCacheSize: options.maxCacheSize || 1000, // Max cache entries

      // Performance thresholds
      slowOperationThreshold: options.slowOperationThreshold || 1000, // 1 second
      highMemoryThreshold: options.highMemoryThreshold || 0.8, // 80% of available memory
      highCpuThreshold: options.highCpuThreshold || 0.8, // 80% CPU usage

      // Resource management
      enableResourcePooling: options.enableResourcePooling !== false,
      enableLazyLoading: options.enableLazyLoading !== false,
      enablePreloading: options.enablePreloading || false,

      ...options,
    };

    // Performance caches
    this.operationCache = new Map();
    this.resultCache = new Map();
    this.functionCache = new Map();

    // Performance metrics
    this.metrics = {
      totalOperations: 0,
      cachedOperations: 0,
      avgExecutionTime: 0,
      totalExecutionTime: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      cacheHitRate: 0,
      slowOperations: 0,
      operationsPerSecond: 0,
      startTime: Date.now(),
    };

    // Resource pools
    this.workerPool = [];
    this.connectionPool = new Map();

    // Initialize performance systems
    this.initialize();
  }

  /**
   * Initialize performance optimization systems
   */
  async initialize() {
    logger.info('🚀 Initializing Ultra-Dex Performance Optimizer...', {
      version: '6.0.0',
      config: this.config,
    });

    // Initialize worker pool if parallelization is enabled
    if (this.config.enableParallelization) {
      await this.initializeWorkerPool();
    }

    // Set up performance monitoring
    this.setupPerformanceMonitoring();

    logger.success('✅ Performance optimization systems initialized');
  }

  /**
   * Initialize worker thread pool
   */
  async initializeWorkerPool() {
    for (let i = 0; i < this.config.maxWorkerThreads; i++) {
      const worker = new Worker(__filename, {
        workerData: { id: i, mode: 'worker' },
      });

      this.workerPool.push({
        worker,
        id: i,
        busy: false,
        queue: [],
      });
    }
  }

  /**
   * Set up performance monitoring
   */
  setupPerformanceMonitoring() {
    // Periodic performance metrics collection
    this.metricsInterval = setInterval(() => {
      this.collectMetrics();
    }, 5000); // Collect metrics every 5 seconds

    // Slow operation monitoring
    this.slowOpInterval = setInterval(() => {
      this.checkForSlowOperations();
    }, 10000); // Check every 10 seconds
  }

  /**
   * Optimize a function with caching and performance tracking
   */
  optimize(fn, options = {}) {
    const cacheKey = options.cacheKey || fn.name || `fn_${Date.now()}_${Math.random()}`;
    const ttl = options.ttl || this.config.cacheTTL;
    const maxSize = options.maxSize || this.config.maxCacheSize;

    return async (...args) => {
      const startTime = performance.now();
      this.metrics.totalOperations++;

      // Create cache key from function and arguments
      const argKey = JSON.stringify(args);
      const fullKey = `${cacheKey}:${argKey}`;

      // Check cache if enabled
      if (this.config.enableCaching && this.resultCache.has(fullKey)) {
        const cached = this.resultCache.get(fullKey);
        if (Date.now() - cached.timestamp < ttl) {
          this.metrics.cachedOperations++;
          this.metrics.cacheHitRate =
            (this.metrics.cachedOperations / this.metrics.totalOperations) * 100;

          const executionTime = performance.now() - startTime;
          this.updateAvgExecutionTime(executionTime);

          return cached.result;
        } else {
          // Remove expired cache entry
          this.resultCache.delete(fullKey);
        }
      }

      try {
        // Execute the function
        const result = await fn.apply(this, args);
        const executionTime = performance.now() - startTime;

        // Update metrics
        this.updateAvgExecutionTime(executionTime);
        this.metrics.totalExecutionTime += executionTime;

        // Cache result if caching is enabled
        if (this.config.enableCaching) {
          // Check cache size limit
          if (this.resultCache.size >= maxSize) {
            // Remove oldest entries (LRU)
            const oldestKey = this.resultCache.keys().next().value;
            this.resultCache.delete(oldestKey);
          }

          this.resultCache.set(fullKey, {
            result,
            timestamp: Date.now(),
            executionTime,
          });
        }

        // Log slow operations
        if (executionTime > this.config.slowOperationThreshold) {
          this.metrics.slowOperations++;
          logger.warning(
            `🐌 Slow operation detected: ${cacheKey} took ${Math.round(executionTime)}ms`,
            {
              executionTime: Math.round(executionTime),
              args: args.length > 0 ? args[0] : 'no args',
            }
          );
        }

        return result;
      } catch (error) {
        const executionTime = performance.now() - startTime;
        logger.error(`💥 Operation failed: ${cacheKey} took ${Math.round(executionTime)}ms`, {
          error: error.message,
          executionTime: Math.round(executionTime),
          args: args.length > 0 ? args[0] : 'no args',
        });

        throw error;
      }
    };
  }

  /**
   * Execute operations in parallel with resource management
   */
  async parallelize(tasks, options = {}) {
    if (!this.config.enableParallelization || tasks.length <= 1) {
      // Fall back to sequential execution
      const results = [];
      for (const task of tasks) {
        results.push(await task());
      }
      return results;
    }

    const concurrency = Math.min(tasks.length, options.concurrency || 4);
    const results = new Array(tasks.length);
    const errors = new Array(tasks.length);

    // Process tasks in batches
    for (let i = 0; i < tasks.length; i += concurrency) {
      const batch = tasks.slice(i, i + concurrency);
      const batchPromises = batch.map((task, idx) =>
        task().catch((err) => {
          errors[i + idx] = err;
        })
      );

      const batchResults = await Promise.allSettled(batchPromises);

      for (let j = 0; j < batchResults.length; j++) {
        const result = batchResults[j];
        if (result.status === 'fulfilled') {
          results[i + j] = result.value;
        } else {
          errors[i + j] = result.reason;
        }
      }
    }

    // Throw error if any failed
    const hasErrors = errors.some((err) => err);
    if (hasErrors) {
      throw new Error(
        `Parallel execution failed: ${errors
          .filter((err) => err)
          .map((err) => err.message)
          .join('; ')}`
      );
    }

    return results;
  }

  /**
   * Batch process items with performance optimization
   */
  async batchProcess(items, processor, options = {}) {
    const batchSize = options.batchSize || 10;
    const results = [];

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await this.parallelize(
        batch.map((item) => () => processor(item)),
        { concurrency: options.concurrency || 3 }
      );
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Memoize a function with advanced caching
   */
  memoize(fn, resolver) {
    const cache = new Map();

    return function (...args) {
      const key = resolver ? resolver.apply(this, args) : JSON.stringify(args);

      if (cache.has(key)) {
        return cache.get(key);
      }

      const result = fn.apply(this, args);
      cache.set(key, result);

      // Trim cache if too large
      if (cache.size > this.config.maxCacheSize) {
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
      }

      return result;
    };
  }

  /**
   * Debounce a function to limit execution frequency
   */
  debounce(func, wait, immediate = false) {
    let timeout;

    return function executedFunction(...args) {
      const later = () => {
        timeout = null;
        if (!immediate) func.apply(this, args);
      };

      const callNow = immediate && !timeout;

      clearTimeout(timeout);
      timeout = setTimeout(later, wait);

      if (callNow) func.apply(this, args);
    };
  }

  /**
   * Throttle a function to limit execution rate
   */
  throttle(func, limit) {
    let inThrottle;

    return function (...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }

  /**
   * Collect performance metrics
   */
  collectMetrics() {
    const currentMemory = process.memoryUsage();
    const uptime = (Date.now() - this.metrics.startTime) / 1000; // in seconds
    const opsPerSecond = this.metrics.totalOperations / uptime;

    this.metrics.memoryUsage = currentMemory.heapUsed / currentMemory.heapTotal;
    this.metrics.operationsPerSecond = opsPerSecond;

    // Log performance metrics periodically
    if (this.metrics.totalOperations > 0) {
      logger.info('📊 Performance Metrics', {
        operations: this.metrics.totalOperations,
        opsPerSecond: Math.round(this.metrics.operationsPerSecond * 100) / 100,
        avgExecutionTime: Math.round(this.metrics.avgExecutionTime),
        cacheHitRate: Math.round(this.metrics.cacheHitRate * 100) / 100,
        slowOperations: this.metrics.slowOperations,
        memoryUsage: `${Math.round(this.metrics.memoryUsage * 100)}%`,
        uptime: `${Math.round(uptime)}s`,
      });
    }
  }

  /**
   * Check for slow operations and log them
   */
  checkForSlowOperations() {
    // This is handled in the optimize function, but we can add additional checks here
    if (this.metrics.slowOperations > 0) {
      logger.warning(
        `⚠️  Performance Alert: ${this.metrics.slowOperations} slow operations detected`,
        {
          threshold: `${this.config.slowOperationThreshold}ms`,
          totalOperations: this.metrics.totalOperations,
        }
      );
    }
  }

  /**
   * Update average execution time
   */
  updateAvgExecutionTime(executionTime) {
    this.metrics.avgExecutionTime =
      (this.metrics.avgExecutionTime * (this.metrics.totalOperations - 1) + executionTime) /
      this.metrics.totalOperations;
  }

  /**
   * Get current performance metrics
   */
  getMetrics() {
    return { ...this.metrics };
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.resultCache.size,
      maxSize: this.config.maxCacheSize,
      hitRate: this.metrics.cacheHitRate,
      totalOperations: this.metrics.totalOperations,
      cachedOperations: this.metrics.cachedOperations,
    };
  }

  /**
   * Clear performance caches
   */
  clearCaches() {
    this.operationCache.clear();
    this.resultCache.clear();
    this.functionCache.clear();

    logger.info('🗑️  Performance caches cleared');
  }

  /**
   * Optimize for specific workload type
   */
  optimizeForWorkload(workloadType) {
    switch (workloadType) {
      case 'cpu-intensive':
        // Optimize for CPU-bound tasks
        this.config.maxWorkerThreads = Math.max(2, cpus().length - 2);
        this.config.enableParallelization = true;
        this.config.cacheTTL = this.config.cacheTTL * 2; // Longer cache for CPU-intensive ops
        break;

      case 'io-intensive':
        // Optimize for I/O-bound tasks
        this.config.enableCaching = true;
        this.config.enableCompression = true;
        this.config.maxWorkerThreads = Math.max(1, cpus().length / 2);
        break;

      case 'memory-sensitive':
        // Optimize for memory-sensitive tasks
        this.config.maxCacheSize = Math.floor(this.config.maxCacheSize / 2);
        this.config.cacheTTL = Math.floor(this.config.cacheTTL / 2);
        this.config.enableCompression = true;
        break;

      case 'latency-critical':
        // Optimize for low-latency tasks
        this.config.cacheTTL = Math.floor(this.config.cacheTTL / 2);
        this.config.enablePreloading = true;
        this.config.slowOperationThreshold = Math.floor(this.config.slowOperationThreshold / 2);
        break;

      default:
        // Use default configuration
        break;
    }

    logger.info(`⚙️  Optimized for ${workloadType} workload`, {
      config: {
        maxWorkerThreads: this.config.maxWorkerThreads,
        enableCaching: this.config.enableCaching,
        maxCacheSize: this.config.maxCacheSize,
      },
    });
  }

  /**
   * Run performance benchmark
   */
  async runBenchmark(tasks = [], options = {}) {
    const benchmarkStart = performance.now();
    const taskCount = tasks.length;

    logger.info(`🏃 Running performance benchmark with ${taskCount} tasks...`);

    const results = {
      taskCount,
      startTime: new Date().toISOString(),
      results: [],
      totalTime: 0,
      avgTime: 0,
      minTime: Infinity,
      maxTime: 0,
      opsPerSecond: 0,
    };

    for (let i = 0; i < tasks.length; i++) {
      const taskStart = performance.now();
      try {
        const result = await tasks[i]();
        const taskTime = performance.now() - taskStart;

        results.results.push({
          index: i,
          success: true,
          result,
          executionTime: Math.round(taskTime),
          timestamp: new Date().toISOString(),
        });

        results.minTime = Math.min(results.minTime, taskTime);
        results.maxTime = Math.max(results.maxTime, taskTime);
      } catch (error) {
        const taskTime = performance.now() - taskStart;

        results.results.push({
          index: i,
          success: false,
          error: error.message,
          executionTime: Math.round(taskTime),
          timestamp: new Date().toISOString(),
        });
      }
    }

    results.totalTime = performance.now() - benchmarkStart;
    results.avgTime = results.totalTime / tasks.length;
    results.opsPerSecond = tasks.length / (results.totalTime / 1000);

    logger.success(`✅ Benchmark completed in ${Math.round(results.totalTime)}ms`, {
      avgTime: Math.round(results.avgTime),
      opsPerSecond: Math.round(results.opsPerSecond),
      successRate: `${Math.round((results.results.filter((r) => r.success).length / tasks.length) * 100)}%`,
    });

    return results;
  }

  /**
   * Shutdown performance optimizer
   */
  async shutdown() {
    logger.info('🛑 Shutting down performance optimizer...');

    // Clear intervals
    if (this.metricsInterval) clearInterval(this.metricsInterval);
    if (this.slowOpInterval) clearInterval(this.slowOpInterval);

    // Terminate worker threads
    for (const workerInfo of this.workerPool) {
      workerInfo.worker.terminate();
    }

    // Clear caches
    this.clearCaches();

    logger.success('✅ Performance optimizer shut down successfully');
  }
}

// Create and export singleton instance
export const perfOptimizer = new PerformanceOptimizer();

// Export for direct import
export default perfOptimizer;

// If running as worker thread, handle worker-specific logic
if (!isMainThread) {
  parentPort.on('message', (data) => {
    // Handle worker tasks
    parentPort.postMessage({ result: 'Worker task completed', id: data.id });
  });
}
