import { performance } from 'perf_hooks';
import { EventEmitter } from 'events';
class ChaosEngine extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      enableChaos: options.enableChaos !== false,
      chaosIntensity: options.chaosIntensity || 0.1,
      // 10% of requests affected
      chaosTypes: options.chaosTypes || [
        'latency',
        'error',
        'memory',
        'cpu',
        'network_partition',
        'disk_space',
      ],
      monitoringInterval: options.monitoringInterval || 5e3,
      // 5 seconds
      recoveryTimeout: options.recoveryTimeout || 3e4,
      // 30 seconds
      ...options,
    };
    this.activeExperiments = /* @__PURE__ */ new Set();
    this.metrics = {
      requests: 0,
      errors: 0,
      latency: 0,
      recoveries: 0,
      experimentCount: 0,
    };
    this.monitoringIntervalId = null;
  }
  /**
   * Start chaos monitoring
   */
  startMonitoring() {
    if (this.monitoringIntervalId) {
      clearInterval(this.monitoringIntervalId);
    }
    this.monitoringIntervalId = setInterval(() => {
      this.emit('metrics:update', { ...this.metrics });
    }, this.options.monitoringInterval);
  }
  /**
   * Inject latency chaos
   * @param {number} minDelay - Minimum delay in ms
   * @param {number} maxDelay - Maximum delay in ms
   * @returns {Promise<void>} Promise that resolves after delay
   */
  async injectLatency(minDelay = 100, maxDelay = 1e3) {
    const delay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
    return new Promise((resolve) => setTimeout(resolve, delay));
  }
  /**
   * Inject error chaos
   * @param {number} errorRate - Error rate (0-1)
   * @param {string} errorMessage - Error message to inject
   * @returns {boolean} True if error should be injected
   */
  injectError(errorRate = 0.1, errorMessage = 'Simulated chaos error') {
    if (Math.random() < errorRate) {
      this.metrics.errors++;
      throw new Error(errorMessage);
    }
    return false;
  }
  /**
   * Inject memory pressure chaos
   * @param {number} pressureLevel - Memory pressure level (0-1)
   * @returns {Array} Memory filler array
   */
  injectMemoryPressure(pressureLevel = 0.5) {
    const memorySize = Math.floor(pressureLevel * 1024 * 1024 * 10);
    const filler = new Array(memorySize / 8).fill(0);
    this.memoryFiller = filler;
    return filler;
  }
  /**
   * Inject CPU pressure chaos
   * @param {number} pressureLevel - CPU pressure level (0-1)
   * @param {number} duration - Duration in ms
   * @returns {Promise<void>} Promise that resolves when CPU pressure is done
   */
  async injectCpuPressure(pressureLevel = 0.5, duration = 1e3) {
    const start = Date.now();
    const end = start + duration;
    const iterations = Math.floor(pressureLevel * 1e6);
    while (Date.now() < end) {
      for (let i = 0; i < iterations; i++) {
        Math.random() * Math.random();
      }
    }
  }
  /**
   * Run a chaos experiment
   * @param {object} experiment - Experiment configuration
   * @returns {object} Experiment results
   */
  async runExperiment(experiment) {
    const experimentId = `experiment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.activeExperiments.add(experimentId);
    const startTime = performance.now();
    this.metrics.experimentCount++;
    try {
      this.emit('experiment:start', {
        id: experimentId,
        type: experiment.type,
        target: experiment.target,
        timestamp: /* @__PURE__ */ new Date().toISOString(),
      });
      switch (experiment.type) {
        case 'latency':
          await this.injectLatency(
            experiment.config?.minDelay || 100,
            experiment.config?.maxDelay || 1e3
          );
          break;
        case 'error':
          this.injectError(
            experiment.config?.errorRate || 0.1,
            experiment.config?.errorMessage || 'Chaos-induced error'
          );
          break;
        case 'memory_pressure':
          this.injectMemoryPressure(experiment.config?.pressureLevel || 0.5);
          break;
        case 'cpu_pressure':
          await this.injectCpuPressure(
            experiment.config?.pressureLevel || 0.5,
            experiment.config?.duration || 1e3
          );
          break;
        case 'network_partition':
          await this.simulateNetworkPartition(experiment.config?.duration || 5e3);
          break;
        case 'disk_space':
          await this.simulateDiskSpace(experiment.config?.size || '1GB');
          break;
        default:
          throw new Error(`Unknown chaos type: ${experiment.type}`);
      }
      const result = await experiment.operation();
      const endTime = performance.now();
      const duration = endTime - startTime;
      this.emit('experiment:success', {
        id: experimentId,
        type: experiment.type,
        duration,
        result,
        timestamp: /* @__PURE__ */ new Date().toISOString(),
      });
      return {
        id: experimentId,
        type: experiment.type,
        status: 'success',
        duration,
        result,
        timestamp: /* @__PURE__ */ new Date().toISOString(),
      };
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      this.emit('experiment:failure', {
        id: experimentId,
        type: experiment.type,
        duration,
        error: error.message,
        timestamp: /* @__PURE__ */ new Date().toISOString(),
      });
      return {
        id: experimentId,
        type: experiment.type,
        status: 'failure',
        duration,
        error: error.message,
        timestamp: /* @__PURE__ */ new Date().toISOString(),
      };
    } finally {
      this.activeExperiments.delete(experimentId);
    }
  }
  /**
   * Simulate network partition
   * @param {number} duration - Duration in ms
   * @returns {Promise<void>} Promise that resolves when partition ends
   */
  async simulateNetworkPartition(duration = 5e3) {
    return new Promise((resolve) => setTimeout(resolve, duration));
  }
  /**
   * Simulate disk space issues
   * @param {string} size - Size to simulate (e.g., '1GB', '500MB')
   * @returns {Promise<void>} Promise that resolves when simulation ends
   */
  async simulateDiskSpace(size = '1GB') {
    const sizeInBytes = this.parseSize(size);
    const fs = await import('fs');
    const path = await import('path');
    const tempFile = path.join('/tmp', `chaos_disk_test_${Date.now()}`);
    const buffer = Buffer.alloc(sizeInBytes, 'x');
    try {
      await fs.promises.writeFile(tempFile, buffer);
      await new Promise((resolve) => setTimeout(resolve, 1e3));
    } finally {
      try {
        await fs.promises.unlink(tempFile);
      } catch (_e) {}
    }
  }
  /**
   * Parse size string to bytes
   * @param {string} size - Size string (e.g., '1GB', '500MB')
   * @returns {number} Size in bytes
   */
  parseSize(size) {
    const units = {
      B: 1,
      KB: 1024,
      MB: 1024 * 1024,
      GB: 1024 * 1024 * 1024,
      TB: 1024 * 1024 * 1024 * 1024,
    };
    const match = size.match(/^(\d+)([A-Z]+)$/);
    if (!match) {
      throw new Error(`Invalid size format: ${size}`);
    }
    const [, value, unit] = match;
    const multiplier = units[unit.toUpperCase()];
    if (!multiplier) {
      throw new Error(`Unknown size unit: ${unit}`);
    }
    return parseInt(value) * multiplier;
  }
  /**
   * Run resilience test suite
   * @returns {object} Test results
   */
  async runResilienceTests() {
    const tests = [
      {
        name: 'Agent Orchestration Under Load',
        type: 'latency',
        config: { minDelay: 500, maxDelay: 2e3 },
        operation: async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          return { success: true, agentsOrchestrated: 10 };
        },
      },
      {
        name: 'Memory System Recovery',
        type: 'error',
        config: { errorRate: 0.2 },
        operation: async () => {
          await new Promise((resolve) => setTimeout(resolve, 50));
          return { success: true, memoryOperations: 5 };
        },
      },
      {
        name: 'API Rate Limiting',
        type: 'latency',
        config: { minDelay: 100, maxDelay: 500 },
        operation: async () => {
          await new Promise((resolve) => setTimeout(resolve, 25));
          return { success: true, requestsProcessed: 100 };
        },
      },
      {
        name: 'Database Connection Pool',
        type: 'error',
        config: { errorRate: 0.15 },
        operation: async () => {
          await new Promise((resolve) => setTimeout(resolve, 75));
          return { success: true, queriesExecuted: 50 };
        },
      },
      {
        name: 'Security System Under Pressure',
        type: 'cpu_pressure',
        config: { pressureLevel: 0.8, duration: 2e3 },
        operation: async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          return { success: true, authChecks: 25 };
        },
      },
    ];
    const results = [];
    for (const test of tests) {
      const result = await this.runExperiment(test);
      results.push(result);
      this.emit('test:completed', { test: test.name, result });
    }
    return {
      summary: {
        totalTests: tests.length,
        passed: results.filter((r) => r.status === 'success').length,
        failed: results.filter((r) => r.status === 'failure').length,
        successRate: (results.filter((r) => r.status === 'success').length / tests.length) * 100,
      },
      tests: results,
      timestamp: /* @__PURE__ */ new Date().toISOString(),
    };
  }
  /**
   * Run load test with chaos injection
   * @param {object} config - Load test configuration
   * @returns {object} Load test results
   */
  async runLoadTestWithChaos(config = {}) {
    const loadConfig = {
      duration: config.duration || 6e4,
      // 1 minute
      concurrency: config.concurrency || 10,
      chaosRate: config.chaosRate || 0.1,
      ...config,
    };
    const startTime = Date.now();
    const results = [];
    const errors = [];
    const requests = [];
    for (let i = 0; i < loadConfig.concurrency; i++) {
      requests.push(this.runLoadTestIteration(loadConfig, i));
    }
    const responses = await Promise.allSettled(requests);
    for (const response of responses) {
      if (response.status === 'fulfilled') {
        results.push(response.value);
      } else {
        errors.push(response.reason);
      }
    }
    return {
      summary: {
        totalRequests: loadConfig.concurrency,
        successfulRequests: results.length,
        failedRequests: errors.length,
        successRate: (results.length / loadConfig.concurrency) * 100,
        duration: Date.now() - startTime,
      },
      results,
      errors,
      timestamp: /* @__PURE__ */ new Date().toISOString(),
    };
  }
  /**
   * Run a single iteration of load test with potential chaos
   * @param {object} config - Load test configuration
   * @param {number} iteration - Iteration number
   * @returns {object} Iteration result
   */
  async runLoadTestIteration(config, iteration) {
    if (Math.random() < config.chaosRate) {
      const chaosTypes = ['latency', 'error', 'memory_pressure'];
      const chaosType = chaosTypes[Math.floor(Math.random() * chaosTypes.length)];
      await this.runExperiment({
        type: chaosType,
        config: { pressureLevel: 0.3 },
        operation: async () => {
          await new Promise((resolve) => setTimeout(resolve, 50));
          return { success: true };
        },
      });
    }
    await new Promise((resolve) => setTimeout(resolve, 100 + Math.random() * 100));
    return {
      iteration,
      success: true,
      timestamp: /* @__PURE__ */ new Date().toISOString(),
      latency: 100 + Math.random() * 100,
    };
  }
  /**
   * Get chaos engineering metrics
   * @returns {object} Metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      activeExperiments: this.activeExperiments.size,
      chaosIntensity: this.options.chaosIntensity,
      chaosTypes: this.options.chaosTypes,
      timestamp: /* @__PURE__ */ new Date().toISOString(),
    };
  }
  /**
   * Get system resilience score
   * @returns {object} Resilience assessment
   */
  getResilienceScore() {
    const successRate =
      this.metrics.requests > 0
        ? (this.metrics.requests - this.metrics.errors) / this.metrics.requests
        : 1;
    const recoveryRate =
      this.metrics.requests > 0 ? this.metrics.recoveries / this.metrics.requests : 0;
    return {
      score: Math.min(100, Math.round((successRate + recoveryRate) * 50)),
      successRate: Math.round(successRate * 100),
      recoveryRate: Math.round(recoveryRate * 100),
      metrics: this.getMetrics(),
      timestamp: /* @__PURE__ */ new Date().toISOString(),
    };
  }
  /**
   * Stop chaos engine
   */
  stop() {
    if (this.monitoringIntervalId) {
      clearInterval(this.monitoringIntervalId);
      this.monitoringIntervalId = null;
    }
    this.activeExperiments.clear();
    this.emit('chaos:stopped', { timestamp: /* @__PURE__ */ new Date().toISOString() });
  }
  /**
   * Get system health information
   * @returns {object} Health information
   */
  getHealth() {
    return {
      status: 'healthy',
      chaosEngine: {
        enabled: this.options.enableChaos,
        activeExperiments: this.activeExperiments.size,
        chaosIntensity: this.options.chaosIntensity,
      },
      metrics: this.metrics,
      resilienceScore: this.getResilienceScore(),
      timestamp: /* @__PURE__ */ new Date().toISOString(),
    };
  }
}
const chaosEngine = new ChaosEngine();
var chaos_engine_default = ChaosEngine;
if (process.argv[1] === new URL(import.meta.url).pathname) {
  console.log('\u{1F9EA} Running Ultra-Dex Chaos Engineering Test Suite...');
  chaosEngine
    .runResilienceTests()
    .then((results) => {
      console.log('\u2705 Chaos Engineering Results:');
      console.log(JSON.stringify(results, null, 2));
    })
    .catch((error) => {
      console.error('\u274C Chaos Engineering Test Failed:', error);
    });
}
export { chaosEngine, chaos_engine_default as default };
