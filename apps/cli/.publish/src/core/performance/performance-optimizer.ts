var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if ((decorator = decorators[i]))
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp(target, key, result);
  return result;
};
import { singleton } from 'tsyringe';
import { performance } from 'perf_hooks';
import { Worker, isMainThread, parentPort } from 'worker_threads';
import { cpus } from 'os';
import { logger } from '../../utils/logging.js';
let PerformanceOptimizer = class {
  constructor(options = {}) {
    this.config = {
      // Performance optimization settings
      enableCaching: options.enableCaching !== false,
      enableCompression: options.enableCompression !== false,
      enableParallelization: options.enableParallelization !== false,
      maxWorkerThreads: Math.min(cpus().length, options.maxWorkerThreads || 8),
      cacheTTL: options.cacheTTL || 3e5,
      // 5 minutes
      maxCacheSize: options.maxCacheSize || 1e3,
      // Max cache entries
      // Performance thresholds
      slowOperationThreshold: options.slowOperationThreshold || 1e3,
      // 1 second
      highMemoryThreshold: options.highMemoryThreshold || 0.8,
      // 80% of available memory
      highCpuThreshold: options.highCpuThreshold || 0.8,
      // 80% CPU usage
      // Resource management
      enableResourcePooling: options.enableResourcePooling !== false,
      enableLazyLoading: options.enableLazyLoading !== false,
      enablePreloading: options.enablePreloading || false,
      ...options,
    };
    this.operationCache = /* @__PURE__ */ new Map();
    this.resultCache = /* @__PURE__ */ new Map();
    this.functionCache = /* @__PURE__ */ new Map();
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
    this.workerPool = [];
    this.connectionPool = /* @__PURE__ */ new Map();
    this.initialize();
  }
  /**
   * Initialize performance optimization systems
   */
  async initialize() {
    logger.info('\u{1F680} Initializing Ultra-Dex Performance Optimizer...', {
      version: '6.0.0',
      config: this.config,
    });
    if (this.config.enableParallelization) {
      await this.initializeWorkerPool();
    }
    this.setupPerformanceMonitoring();
    logger.success('\u2705 Performance optimization systems initialized');
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
    this.metricsInterval = setInterval(() => {
      this.collectMetrics();
    }, 5e3);
    this.slowOpInterval = setInterval(() => {
      this.checkForSlowOperations();
    }, 1e4);
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
      const argKey = JSON.stringify(args);
      const fullKey = `${cacheKey}:${argKey}`;
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
          this.resultCache.delete(fullKey);
        }
      }
      try {
        const result = await fn.apply(this, args);
        const executionTime = performance.now() - startTime;
        this.updateAvgExecutionTime(executionTime);
        this.metrics.totalExecutionTime += executionTime;
        if (this.config.enableCaching) {
          if (this.resultCache.size >= maxSize) {
            const oldestKey = this.resultCache.keys().next().value;
            this.resultCache.delete(oldestKey);
          }
          this.resultCache.set(fullKey, {
            result,
            timestamp: Date.now(),
            executionTime,
          });
        }
        if (executionTime > this.config.slowOperationThreshold) {
          this.metrics.slowOperations++;
          logger.warning(
            `\u{1F40C} Slow operation detected: ${cacheKey} took ${Math.round(executionTime)}ms`,
            {
              executionTime: Math.round(executionTime),
              args: args.length > 0 ? args[0] : 'no args',
            }
          );
        }
        return result;
      } catch (error) {
        const executionTime = performance.now() - startTime;
        logger.error(
          `\u{1F4A5} Operation failed: ${cacheKey} took ${Math.round(executionTime)}ms`,
          {
            error: error.message,
            executionTime: Math.round(executionTime),
            args: args.length > 0 ? args[0] : 'no args',
          }
        );
        throw error;
      }
    };
  }
  /**
   * Execute operations in parallel with resource management
   */
  async parallelize(tasks, options = {}) {
    if (!this.config.enableParallelization || tasks.length <= 1) {
      const results2 = [];
      for (const task of tasks) {
        results2.push(await task());
      }
      return results2;
    }
    const concurrency = Math.min(tasks.length, options.concurrency || 4);
    const results = new Array(tasks.length);
    const errors = new Array(tasks.length);
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
    const cache = /* @__PURE__ */ new Map();
    return function (...args) {
      const key = resolver ? resolver.apply(this, args) : JSON.stringify(args);
      if (cache.has(key)) {
        return cache.get(key);
      }
      const result = fn.apply(this, args);
      cache.set(key, result);
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
    const uptime = (Date.now() - this.metrics.startTime) / 1e3;
    const opsPerSecond = this.metrics.totalOperations / uptime;
    this.metrics.memoryUsage = currentMemory.heapUsed / currentMemory.heapTotal;
    this.metrics.operationsPerSecond = opsPerSecond;
    if (this.metrics.totalOperations > 0) {
      logger.info('\u{1F4CA} Performance Metrics', {
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
    if (this.metrics.slowOperations > 0) {
      logger.warning(
        `\u26A0\uFE0F  Performance Alert: ${this.metrics.slowOperations} slow operations detected`,
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
    logger.info('\u{1F5D1}\uFE0F  Performance caches cleared');
  }
  /**
   * Optimize for specific workload type
   */
  optimizeForWorkload(workloadType) {
    switch (workloadType) {
      case 'cpu-intensive':
        this.config.maxWorkerThreads = Math.max(2, cpus().length - 2);
        this.config.enableParallelization = true;
        this.config.cacheTTL = this.config.cacheTTL * 2;
        break;
      case 'io-intensive':
        this.config.enableCaching = true;
        this.config.enableCompression = true;
        this.config.maxWorkerThreads = Math.max(1, cpus().length / 2);
        break;
      case 'memory-sensitive':
        this.config.maxCacheSize = Math.floor(this.config.maxCacheSize / 2);
        this.config.cacheTTL = Math.floor(this.config.cacheTTL / 2);
        this.config.enableCompression = true;
        break;
      case 'latency-critical':
        this.config.cacheTTL = Math.floor(this.config.cacheTTL / 2);
        this.config.enablePreloading = true;
        this.config.slowOperationThreshold = Math.floor(this.config.slowOperationThreshold / 2);
        break;
      default:
        break;
    }
    logger.info(`\u2699\uFE0F  Optimized for ${workloadType} workload`, {
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
    logger.info(`\u{1F3C3} Running performance benchmark with ${taskCount} tasks...`);
    const results = {
      taskCount,
      startTime: /* @__PURE__ */ new Date().toISOString(),
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
          timestamp: /* @__PURE__ */ new Date().toISOString(),
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
          timestamp: /* @__PURE__ */ new Date().toISOString(),
        });
      }
    }
    results.totalTime = performance.now() - benchmarkStart;
    results.avgTime = results.totalTime / tasks.length;
    results.opsPerSecond = tasks.length / (results.totalTime / 1e3);
    logger.success(`\u2705 Benchmark completed in ${Math.round(results.totalTime)}ms`, {
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
    logger.info('\u{1F6D1} Shutting down performance optimizer...');
    if (this.metricsInterval) clearInterval(this.metricsInterval);
    if (this.slowOpInterval) clearInterval(this.slowOpInterval);
    for (const workerInfo of this.workerPool) {
      workerInfo.worker.terminate();
    }
    this.clearCaches();
    logger.success('\u2705 Performance optimizer shut down successfully');
  }
};
PerformanceOptimizer = __decorateClass([singleton()], PerformanceOptimizer);
const perfOptimizer = new PerformanceOptimizer();
var performance_optimizer_default = perfOptimizer;
if (!isMainThread) {
  parentPort.on('message', (data) => {
    parentPort.postMessage({ result: 'Worker task completed', id: data.id });
  });
}
export { PerformanceOptimizer, performance_optimizer_default as default, perfOptimizer };
