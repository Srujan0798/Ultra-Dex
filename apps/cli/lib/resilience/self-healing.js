// Copyright (c) 2026 Ultra-Dex

/**
 * Self-Healing System v6.0
 * Auto-recovery, fault tolerance, and chaos resilience
 */

import EventEmitter from 'events';
import { setTimeout as sleep } from 'timers/promises';
import fs from 'fs/promises';
import path from 'path';

const STORAGE_FILE = path.join(process.cwd(), '.ultra', 'circuit-breakers.json');

/**
 * Circuit Breaker Pattern
 */
export class CircuitBreaker extends EventEmitter {
  constructor(options = {}) {
    super();
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 60000; // 1 minute
    this.halfOpenRequests = options.halfOpenRequests || 3;

    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failures = 0;
    this.successes = 0;
    this.lastFailureTime = null;
    this.pendingRequests = 0;
    this.metrics = {
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      rejectedCalls: 0,
    };
  }

  async execute(fn, ...args) {
    this.metrics.totalCalls++;

    // Check if we can transition from OPEN to HALF_OPEN
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = 'HALF_OPEN';
        this.successes = 0;
        this.emit('state:half-open');
      } else {
        this.metrics.rejectedCalls++;
        throw new Error('Circuit breaker is OPEN');
      }
    }

    // Enforce concurrency limit in HALF_OPEN state
    if (this.state === 'HALF_OPEN') {
      if (this.pendingRequests >= this.halfOpenRequests) {
        this.metrics.rejectedCalls++;
        throw new Error('Circuit breaker is HALF_OPEN (max concurrency reached)');
      }
    }

    this.pendingRequests++;

    try {
      const result = await fn(...args);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    } finally {
      this.pendingRequests--;
    }
  }

  onSuccess() {
    this.metrics.successfulCalls++;

    if (this.state === 'HALF_OPEN') {
      this.successes++;
      if (this.successes >= this.halfOpenRequests) {
        this.state = 'CLOSED';
        this.failures = 0;
        this.emit('state:closed');
      }
    } else {
      this.failures = 0;
    }
  }

  onFailure() {
    this.metrics.failedCalls++;
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.state === 'HALF_OPEN') {
      this.state = 'OPEN';
      this.emit('state:open');
    } else if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
      this.emit('state:open');
    }
  }

  getStats() {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      pending: this.pendingRequests,
      metrics: this.metrics,
      uptime: this.lastFailureTime ? Date.now() - this.lastFailureTime : null,
    };
  }
}

/**
 * Retry Strategy with Exponential Backoff
 */
export class RetryStrategy extends EventEmitter {
  constructor(options = {}) {
    super();
    this.maxRetries = options.maxRetries || 3;
    this.baseDelay = options.baseDelay || 1000;
    this.maxDelay = options.maxDelay || 30000;
    this.backoffMultiplier = options.backoffMultiplier || 2;
    this.retryableErrors = options.retryableErrors || [];
  }

  async execute(fn, context = {}) {
    let lastError;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const result = await fn(attempt);

        if (attempt > 0) {
          this.emit('retry:success', { attempt, context });
        }

        return result;
      } catch (error) {
        lastError = error;

        if (!this.isRetryable(error) || attempt === this.maxRetries) {
          throw error;
        }

        const delay = this.calculateDelay(attempt);
        this.emit('retry:attempt', { attempt, delay, error, context });

        await sleep(delay);
      }
    }

    throw lastError;
  }

  isRetryable(error) {
    if (this.retryableErrors.length === 0) return true;
    return this.retryableErrors.some((e) => error.message.includes(e));
  }

  calculateDelay(attempt) {
    const delay = this.baseDelay * Math.pow(this.backoffMultiplier, attempt);
    return Math.min(delay, this.maxDelay);
  }
}

/**
 * Health Monitor
 */
export class HealthMonitor extends EventEmitter {
  constructor(options = {}) {
    super();
    this.checks = new Map();
    this.interval = options.interval || 30000; // 30 seconds
    this.timeout = options.timeout || 5000;
    this.history = [];
    this.maxHistory = 1000;
    this.isRunning = false;
    this.timer = null;
  }

  register(name, checkFn, options = {}) {
    this.checks.set(name, {
      fn: checkFn,
      interval: options.interval || this.interval,
      timeout: options.timeout || this.timeout,
      lastCheck: null,
      status: 'unknown',
      consecutiveFailures: 0,
      consecutiveSuccesses: 0,
    });
  }

  async start() {
    if (this.isRunning) return;
    this.isRunning = true;

    // Run initial checks
    await this.runAllChecks();

    // Schedule periodic checks
    this.timer = setInterval(() => {
      this.runAllChecks();
    }, this.interval);

    this.emit('started');
  }

  async stop() {
    this.isRunning = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.emit('stopped');
  }

  async runAllChecks() {
    const promises = [];

    for (const [name, check] of this.checks) {
      promises.push(this.runCheck(name, check));
    }

    await Promise.allSettled(promises);
  }

  async runCheck(name, check) {
    const startTime = Date.now();

    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Health check timeout')), check.timeout);
      });

      const result = await Promise.race([check.fn(), timeoutPromise]);

      const duration = Date.now() - startTime;
      check.lastCheck = Date.now();
      check.consecutiveSuccesses++;
      check.consecutiveFailures = 0;

      const previousStatus = check.status;
      check.status = 'healthy';

      if (previousStatus !== 'healthy') {
        this.emit('health:recovered', { name, duration, result });
      }

      this.recordCheck(name, 'healthy', duration);
    } catch (error) {
      const duration = Date.now() - startTime;
      check.lastCheck = Date.now();
      check.consecutiveFailures++;
      check.consecutiveSuccesses = 0;

      const previousStatus = check.status;
      check.status = 'unhealthy';

      if (previousStatus === 'healthy') {
        this.emit('health:degraded', { name, error, duration });
      }

      this.recordCheck(name, 'unhealthy', duration, error);
    }
  }

  recordCheck(name, status, duration, error = null) {
    const record = {
      name,
      status,
      duration,
      timestamp: Date.now(),
      error: error?.message,
    };

    this.history.push(record);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
  }

  getStatus() {
    const result = {
      overall: 'healthy',
      checks: {},
      healthy: 0,
      unhealthy: 0,
      unknown: 0,
    };

    for (const [name, check] of this.checks) {
      result.checks[name] = {
        status: check.status,
        lastCheck: check.lastCheck,
        consecutiveFailures: check.consecutiveFailures,
        consecutiveSuccesses: check.consecutiveSuccesses,
      };

      if (check.status === 'healthy') result.healthy++;
      else if (check.status === 'unhealthy') result.unhealthy++;
      else result.unknown++;
    }

    if (result.unhealthy > 0) {
      result.overall = result.unhealthy > result.healthy ? 'critical' : 'degraded';
    }

    return result;
  }

  getHistory(name, limit = 100) {
    return this.history.filter((h) => !name || h.name === name).slice(-limit);
  }
}

/**
 * Self-Healing Orchestrator
 */
export class SelfHealingOrchestrator extends EventEmitter {
  constructor() {
    super();
    this.healthMonitor = new HealthMonitor();
    this.circuitBreakers = new Map();
    this.retryStrategies = new Map();
    this.recoveryActions = new Map();
    this.initialized = false;
    this.metrics = {
      incidents: 0,
      recoveries: 0,
      failedRecoveries: 0,
      averageRecoveryTime: 0,
    };
  }

  async loadState() {
    try {
      const data = await fs.readFile(STORAGE_FILE, 'utf8');
      const state = JSON.parse(data);
      for (const [name, breakerState] of Object.entries(state)) {
        const breaker = this.getCircuitBreaker(name);
        breaker.state = breakerState.state;
        breaker.failures = breakerState.failures;
        breaker.successes = breakerState.successes;
        breaker.lastFailureTime = breakerState.lastFailureTime;
        breaker.metrics = breakerState.metrics;
      }
    } catch (error) {
      // Ignore if file doesn't exist
    }
  }

  async saveState() {
    try {
      const state = {};
      for (const [name, breaker] of this.circuitBreakers.entries()) {
        state[name] = {
          state: breaker.state,
          failures: breaker.failures,
          successes: breaker.successes,
          lastFailureTime: breaker.lastFailureTime,
          metrics: breaker.metrics
        };
      }
      await fs.mkdir(path.dirname(STORAGE_FILE), { recursive: true });
      await fs.writeFile(STORAGE_FILE, JSON.stringify(state, null, 2));
    } catch (error) {
      console.error('Failed to save circuit breaker state:', error);
    }
  }

  async initialize() {
    if (this.initialized) return;
    this.initialized = true;

    await this.loadState();

    // Register default health checks
    this.healthMonitor.register('memory', async () => {
      const usage = process.memoryUsage();
      const threshold = 0.9; // 90%
      const total = usage.heapTotal + usage.external;
      const limit = require('v8').getHeapStatistics().heap_size_limit;

      if (total / limit > threshold) {
        throw new Error(`Memory usage critical: ${((total / limit) * 100).toFixed(2)}%`);
      }
      return { usage: total, limit };
    });

    this.healthMonitor.register('event-loop', async () => {
      return new Promise((resolve, reject) => {
        const start = process.hrtime.bigint();
        setImmediate(() => {
          const delay = Number(process.hrtime.bigint() - start) / 1000000; // ms
          if (delay > 100) {
            reject(new Error(`Event loop lag: ${delay.toFixed(2)}ms`));
          } else {
            resolve({ lag: delay });
          }
        });
      });
    });

    // Listen for health changes
    this.healthMonitor.on('health:degraded', ({ name, error }) => {
      this.handleDegradation(name, error);
    });

    this.healthMonitor.on('health:recovered', ({ name }) => {
      this.emit('recovery:success', { component: name });
    });

    await this.healthMonitor.start();

    // Start periodic save
    setInterval(() => this.saveState(), 60000).unref(); // Every minute

    this.emit('initialized');
  }

  getCircuitBreaker(name, options = {}) {
    if (!this.circuitBreakers.has(name)) {
      const breaker = new CircuitBreaker(options);
      this.circuitBreakers.set(name, breaker);
    }
    return this.circuitBreakers.get(name);
  }

  getRetryStrategy(name, options = {}) {
    if (!this.retryStrategies.has(name)) {
      const strategy = new RetryStrategy(options);
      this.retryStrategies.set(name, strategy);
    }
    return this.retryStrategies.get(name);
  }

  registerRecoveryAction(component, action) {
    this.recoveryActions.set(component, action);
  }

  async handleDegradation(component, error) {
    this.metrics.incidents++;
    const startTime = Date.now();

    this.emit('incident:start', { component, error, timestamp: startTime });

    const recoveryAction = this.recoveryActions.get(component);

    if (recoveryAction) {
      try {
        await recoveryAction(error);
        const recoveryTime = Date.now() - startTime;

        this.metrics.recoveries++;
        this.updateAverageRecoveryTime(recoveryTime);

        this.emit('incident:resolved', {
          component,
          recoveryTime,
          timestamp: Date.now(),
        });
      } catch (recoveryError) {
        this.metrics.failedRecoveries++;
        this.emit('incident:failed', {
          component,
          originalError: error,
          recoveryError,
          timestamp: Date.now(),
        });
      }
    }
  }

  updateAverageRecoveryTime(newTime) {
    const total = this.metrics.averageRecoveryTime * (this.metrics.recoveries - 1) + newTime;
    this.metrics.averageRecoveryTime = total / this.metrics.recoveries;
  }

  /**
   * Execute operation with full resilience stack
   */
  async execute(operation, context = {}) {
    const {
      circuitBreakerName = 'default',
      retryStrategyName = 'default',
      operation: fn,
      args = [],
    } = operation;

    const breaker = this.getCircuitBreaker(circuitBreakerName, context.circuitBreaker);
    const retry = this.getRetryStrategy(retryStrategyName, context.retry);

    // Auto-save on failure state change? No, too frequent. Rely on periodic or manual.
    try {
      return await breaker.execute(() => retry.execute(fn, context));
    } finally {
      // Consider saving if state changed, but periodic is safer for performance.
    }
  }

  getHealthStatus() {
    return {
      monitor: this.healthMonitor.getStatus(),
      circuitBreakers: Array.from(this.circuitBreakers.entries()).map(([name, cb]) => ({
        name,
        ...cb.getStats(),
      })),
      metrics: this.metrics,
    };
  }

  async shutdown() {
    await this.healthMonitor.stop();
    await this.saveState();
  }
}

/**
 * Chaos Engineering - Test resilience
 */
export class ChaosEngineering extends EventEmitter {
  constructor(orchestrator) {
    super();
    this.orchestrator = orchestrator;
    this.experiments = new Map();
    this.running = false;
  }

  registerExperiment(name, config) {
    this.experiments.set(name, {
      name,
      target: config.target,
      fault: config.fault,
      duration: config.duration || 60000,
      rollback: config.rollback,
      status: 'registered',
    });
  }

  async runExperiment(name) {
    const experiment = this.experiments.get(name);
    if (!experiment) {
      throw new Error(`Experiment ${name} not found`);
    }

    experiment.status = 'running';
    this.emit('experiment:start', experiment);

    try {
      // Inject fault
      await experiment.fault();

      // Monitor for recovery
      await sleep(experiment.duration);

      // Check system health
      const health = this.orchestrator.getHealthStatus();

      if (health.monitor.overall === 'healthy') {
        experiment.status = 'success';
        this.emit('experiment:success', experiment);
      } else {
        experiment.status = 'failed';
        this.emit('experiment:failed', { experiment, health });
      }
    } catch (error) {
      experiment.status = 'error';
      this.emit('experiment:error', { experiment, error });
    } finally {
      // Rollback
      if (experiment.rollback) {
        await experiment.rollback();
      }
    }
  }

  getExperiments() {
    return Array.from(this.experiments.values());
  }
}

// Singleton instance
export const orchestrator = new SelfHealingOrchestrator();

export default {
  SelfHealingOrchestrator,
  HealthMonitor,
  CircuitBreaker,
  RetryStrategy,
  ChaosEngineering,
  orchestrator
};
