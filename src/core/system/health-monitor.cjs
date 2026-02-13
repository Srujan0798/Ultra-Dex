/**
 * System Health Monitor
 * Continuously monitors Ultra-Dex health and performance
 *
 * @module HealthMonitor
 * @version 1.0.0
 */

const { EventEmitter } = require('events');

class HealthMonitor extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      checkInterval: config.checkInterval || 30000, // 30 seconds
      unhealthyThreshold: config.unhealthyThreshold || 3,
      ...config,
    };

    this.checks = new Map();
    this.healthStatus = new Map();
    this.isRunning = false;
    this.intervalId = null;
  }

  /**
   * Register a health check
   * @param {string} name - Check name
   * @param {Function} checkFn - Async function that returns { healthy: boolean, details: {} }
   */
  registerCheck(name, checkFn) {
    this.checks.set(name, checkFn);
    this.healthStatus.set(name, {
      status: 'unknown',
      lastCheck: null,
      consecutiveFailures: 0,
      details: {},
    });
  }

  /**
   * Start monitoring
   */
  start() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.emit('monitoring:started');

    // Run initial check
    this.runChecks();

    // Schedule periodic checks
    this.intervalId = setInterval(() => {
      this.runChecks();
    }, this.config.checkInterval);
  }

  /**
   * Stop monitoring
   */
  stop() {
    if (!this.isRunning) return;

    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.emit('monitoring:stopped');
  }

  /**
   * Run all health checks
   */
  async runChecks() {
    const results = await Promise.allSettled(
      Array.from(this.checks.entries()).map(async ([name, checkFn]) => {
        try {
          const result = await checkFn();
          return { name, result };
        } catch (error) {
          return { name, error };
        }
      })
    );

    for (const outcome of results) {
      if (outcome.status === 'fulfilled') {
        const { name, result, error } = outcome.value;

        if (error) {
          this._markUnhealthy(name, error.message);
        } else if (result.healthy) {
          this._markHealthy(name, result.details);
        } else {
          this._markUnhealthy(name, result.message || 'Check failed');
        }
      } else {
        const name = outcome.reason?.name || 'unknown';
        this._markUnhealthy(name, outcome.reason?.message || 'Check threw exception');
      }
    }

    // Emit overall health status
    const overallHealth = this.getOverallHealth();
    this.emit('health:check', overallHealth);
  }

  /**
   * Get health status for a specific check
   * @param {string} name - Check name
   * @returns {Object} Health status
   */
  getCheckStatus(name) {
    return this.healthStatus.get(name);
  }

  /**
   * Get overall health status
   * @returns {Object} Overall health
   */
  getOverallHealth() {
    let healthy = true;
    let checks = {};

    for (const [name, status] of this.healthStatus) {
      checks[name] = {
        status: status.status,
        lastCheck: status.lastCheck,
      };

      if (status.status === 'unhealthy') {
        healthy = false;
      }
    }

    return {
      healthy,
      status: healthy ? 'healthy' : 'unhealthy',
      checks,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Wait for system to be healthy
   * @param {number} timeout - Timeout in ms
   * @returns {Promise<boolean>}
   */
  async waitForHealthy(timeout = 30000) {
    return new Promise((resolve) => {
      const checkHealth = () => {
        const health = this.getOverallHealth();
        if (health.healthy) {
          resolve(true);
          return;
        }
      };

      // Check immediately
      checkHealth();

      // Set up listener
      const handler = () => {
        checkHealth();
      };

      this.on('health:check', handler);

      // Timeout
      setTimeout(() => {
        this.off('health:check', handler);
        resolve(false);
      }, timeout);
    });
  }

  // Private methods
  _markHealthy(name, details = {}) {
    const status = this.healthStatus.get(name);
    if (!status) return;

    const previousStatus = status.status;

    status.status = 'healthy';
    status.lastCheck = new Date().toISOString();
    status.consecutiveFailures = 0;
    status.details = details;

    if (previousStatus === 'unhealthy') {
      this.emit('check:recovered', { name, details });
    }
  }

  _markUnhealthy(name, message) {
    const status = this.healthStatus.get(name);
    if (!status) return;

    status.consecutiveFailures++;
    status.lastCheck = new Date().toISOString();
    status.details = { error: message };

    if (status.consecutiveFailures >= this.config.unhealthyThreshold) {
      const previousStatus = status.status;
      status.status = 'unhealthy';

      if (previousStatus !== 'unhealthy') {
        this.emit('check:failed', {
          name,
          message,
          consecutiveFailures: status.consecutiveFailures,
        });
      }
    }
  }
}

module.exports = { HealthMonitor };
