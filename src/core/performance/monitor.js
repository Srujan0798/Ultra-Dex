/**
 * Ultra-Dex Performance Monitoring
 * Real-time performance metrics and optimization
 */

import { EventEmitter } from 'events';
import fs from 'fs/promises';
import path from 'path';

class PerformanceMonitor extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      enableProfiling: options.enableProfiling !== false,
      enableMetrics: options.enableMetrics !== false,
      metricsInterval: options.metricsInterval || 30000, // 30 seconds
      logPerformance: options.logPerformance !== false,
      performanceLogPath: options.performanceLogPath || '.ultra-dex/performance.log',
      ...options
    };

    this.metrics = {
      requests: 0,
      errors: 0,
      avgResponseTime: 0,
      peakMemory: 0,
      activeAgents: 0,
      tokensProcessed: 0,
      costs: 0,
      startTime: Date.now()
    };

    this.responseTimes = [];
    this.performanceInterval = null;
    this.initialize();
  }

  async initialize() {
    // Create performance log directory
    await fs.mkdir(path.dirname(this.options.performanceLogPath), { recursive: true });
    
    if (this.options.enableMetrics) {
      this.startMetricsCollection();
    }
  }

  startMetricsCollection() {
    this.performanceInterval = setInterval(() => {
      this.collectMetrics();
    }, this.options.metricsInterval);
  }

  /**
   * Collect system performance metrics
   */
  collectMetrics() {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage ? process.cpuUsage() : { user: 0, system: 0 };
    
    const currentMetrics = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        rss: memoryUsage.rss,
        heapTotal: memoryUsage.heapTotal,
        heapUsed: memoryUsage.heapUsed,
        external: memoryUsage.external,
        arrayBuffers: memoryUsage.arrayBuffers
      },
      cpu: cpuUsage,
      eventLoopLag: this.getEventLoopLag(),
      activeHandles: process._getActiveHandles().length,
      activeRequests: process._getActiveRequests().length,
      metrics: { ...this.metrics }
    };

    // Emit metrics event for real-time monitoring
    this.emit('metrics:collected', currentMetrics);

    // Log performance if enabled
    if (this.options.logPerformance) {
      this.logPerformance(currentMetrics);
    }

    return currentMetrics;
  }

  /**
   * Get event loop lag
   * @returns {number} Event loop lag in nanoseconds
   */
  getEventLoopLag() {
    const start = process.hrtime.bigint();
    return new Promise(resolve => {
      setImmediate(() => {
        const diff = process.hrtime.bigint() - start;
        resolve(Number(diff));
      });
    });
  }

  /**
   * Track a request
   * @param {object} requestInfo - Request information
   * @param {number} responseTime - Response time in milliseconds
   */
  trackRequest(requestInfo, responseTime) {
    this.metrics.requests++;
    this.responseTimes.push(responseTime);

    // Keep only last 1000 response times for average calculation
    if (this.responseTimes.length > 1000) {
      this.responseTimes = this.responseTimes.slice(-1000);
    }

    // Update average response time
    if (this.responseTimes.length > 0) {
      this.metrics.avgResponseTime = 
        this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length;
    }

    // Update peak memory usage
    const currentMemory = process.memoryUsage().heapUsed;
    if (currentMemory > this.metrics.peakMemory) {
      this.metrics.peakMemory = currentMemory;
    }

    this.emit('request:tracked', { requestInfo, responseTime, metrics: this.metrics });
  }

  /**
   * Track an error
   */
  trackError() {
    this.metrics.errors++;
    this.emit('error:tracked', { errorCount: this.metrics.errors });
  }

  /**
   * Track tokens processed
   * @param {number} tokens - Number of tokens processed
   */
  trackTokens(tokens) {
    this.metrics.tokensProcessed += tokens;
    this.emit('tokens:tracked', { tokens, total: this.metrics.tokensProcessed });
  }

  /**
   * Track costs
   * @param {number} cost - Cost in USD
   */
  trackCost(cost) {
    this.metrics.costs += cost;
    this.emit('cost:tracked', { cost, total: this.metrics.costs });
  }

  /**
   * Update active agents count
   * @param {number} count - Number of active agents
   */
  updateActiveAgents(count) {
    this.metrics.activeAgents = count;
    this.emit('agents:updated', { count });
  }

  /**
   * Log performance metrics to file
   * @param {object} metrics - Metrics to log
   */
  async logPerformance(metrics) {
    try {
      const logEntry = `${JSON.stringify(metrics)}\n`;
      await fs.appendFile(this.options.performanceLogPath, logEntry);
    } catch (error) {
      console.warn('Failed to log performance metrics:', error.message);
    }
  }

  /**
   * Get performance report
   * @returns {object} Performance report
   */
  getPerformanceReport() {
    const duration = Date.now() - this.metrics.startTime;
    const requestsPerSecond = duration > 0 ? (this.metrics.requests / (duration / 1000)).toFixed(2) : 0;
    const errorRate = this.metrics.requests > 0 ? 
      ((this.metrics.errors / this.metrics.requests) * 100).toFixed(2) : 0;

    return {
      summary: {
        durationSeconds: (duration / 1000).toFixed(2),
        totalRequests: this.metrics.requests,
        totalErrors: this.metrics.errors,
        requestsPerSecond,
        errorRate: `${errorRate}%`,
        avgResponseTime: this.metrics.avgResponseTime.toFixed(2),
        peakMemoryMB: (this.metrics.peakMemory / 1024 / 1024).toFixed(2),
        activeAgents: this.metrics.activeAgents,
        tokensProcessed: this.metrics.tokensProcessed,
        totalCosts: this.metrics.costs.toFixed(4)
      },
      current: {
        memory: process.memoryUsage(),
        uptime: process.uptime(),
        metrics: this.metrics
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Profile a function for performance analysis
   * @param {Function} fn - Function to profile
   * @param {string} name - Name of the function being profiled
   * @returns {Promise<any>} Function result
   */
  async profileFunction(fn, name) {
    if (!this.options.enableProfiling) {
      return await fn();
    }

    const startTime = process.hrtime.bigint();
    const startMemory = process.memoryUsage().heapUsed;

    try {
      const result = await fn();

      const endTime = process.hrtime.bigint();
      const endMemory = process.memoryUsage().heapUsed;
      const durationNs = Number(endTime - startTime);
      const durationMs = durationNs / 1000000;
      const memoryDelta = endMemory - startMemory;

      const profileData = {
        name,
        durationNs,
        durationMs: durationMs.toFixed(3),
        memoryDelta,
        memoryDeltaKB: (memoryDelta / 1024).toFixed(2),
        timestamp: new Date().toISOString()
      };

      this.emit('function:profiled', profileData);

      if (this.options.logPerformance) {
        await this.logPerformance({ type: 'profile', data: profileData });
      }

      return result;
    } catch (error) {
      const endTime = process.hrtime.bigint();
      const durationNs = Number(endTime - startTime);
      
      const profileData = {
        name,
        durationNs,
        durationMs: (durationNs / 1000000).toFixed(3),
        error: error.message,
        timestamp: new Date().toISOString()
      };

      this.emit('function:profiled', profileData);
      throw error;
    }
  }

  /**
   * Get system health information
   * @returns {object} Health information
   */
  getHealth() {
    const memory = process.memoryUsage();
    const uptime = process.uptime();
    
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      system: {
        uptime,
        memory: {
          rss: memory.rss,
          heapTotal: memory.heapTotal,
          heapUsed: memory.heapUsed,
          external: memory.external
        },
        pid: process.pid,
        ppid: process.ppid,
        platform: process.platform,
        arch: process.arch,
        version: process.version
      },
      performance: {
        requests: this.metrics.requests,
        errors: this.metrics.errors,
        avgResponseTime: this.metrics.avgResponseTime,
        activeAgents: this.metrics.activeAgents,
        tokensProcessed: this.metrics.tokensProcessed,
        costs: this.metrics.costs
      }
    };
  }

  /**
   * Close performance monitoring
   */
  async close() {
    if (this.performanceInterval) {
      clearInterval(this.performanceInterval);
      this.performanceInterval = null;
    }
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Export class for instantiation with custom options
export default PerformanceMonitor;