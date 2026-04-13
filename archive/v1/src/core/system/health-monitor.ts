import { EventEmitter } from 'events';
import fs from 'fs/promises';
import path from 'path';
class HealthMonitor extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      checkInterval: options.checkInterval || 3e4,
      // 30 seconds
      maxRetries: options.maxRetries || 3,
      retryDelay: options.retryDelay || 5e3,
      // 5 seconds
      backupInterval: options.backupInterval || 3e5,
      // 5 minutes
      ...options,
    };
    this.isMonitoring = false;
    this.healthChecks = /* @__PURE__ */ new Map();
    this.recoveryMechanisms = /* @__PURE__ */ new Map();
    this.systemStatus = {
      overall: 'healthy',
      components: {},
      lastChecked: null,
      uptime: 0,
    };
    this.startupTime = Date.now();
    this.recoveryAttempts = /* @__PURE__ */ new Map();
  }
  /**
   * Start the health monitoring system
   */
  async start() {
    if (this.isMonitoring) {
      console.warn('Health monitor already running');
      return;
    }
    console.log('\u{1F3E5} Starting Ultra-Dex Health Monitor...');
    this.isMonitoring = true;
    await this.performHealthCheck();
    this.monitorInterval = setInterval(() => this.performHealthCheck(), this.options.checkInterval);
    if (this.options.backupInterval > 0) {
      this.backupInterval = setInterval(() => this.performBackup(), this.options.backupInterval);
    }
    console.log('\u2705 Health monitor started');
    this.emit('started');
  }
  /**
   * Stop the health monitoring system
   */
  async stop() {
    if (!this.isMonitoring) {
      return;
    }
    console.log('\u{1F3E5} Stopping Ultra-Dex Health Monitor...');
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
      this.backupInterval = null;
    }
    this.isMonitoring = false;
    console.log('\u2705 Health monitor stopped');
    this.emit('stopped');
  }
  /**
   * Register a health check for a component
   * @param {string} componentName - Name of the component
   * @param {Function} checkFunction - Function that returns health status
   * @param {object} options - Check options
   */
  registerHealthCheck(componentName, checkFunction, options = {}) {
    this.healthChecks.set(componentName, {
      checkFunction,
      options: {
        critical: options.critical || false,
        timeout: options.timeout || 1e4,
        ...options,
      },
    });
    console.log(`\u{1F4CB} Registered health check for: ${componentName}`);
  }
  /**
   * Register a recovery mechanism for a component
   * @param {string} componentName - Name of the component
   * @param {Function} recoveryFunction - Function that performs recovery
   * @param {object} options - Recovery options
   */
  registerRecoveryMechanism(componentName, recoveryFunction, options = {}) {
    this.recoveryMechanisms.set(componentName, {
      recoveryFunction,
      options: {
        maxAttempts: options.maxAttempts || this.options.maxRetries,
        delay: options.delay || this.options.retryDelay,
        ...options,
      },
    });
    console.log(`\u{1F527} Registered recovery mechanism for: ${componentName}`);
  }
  /**
   * Perform a comprehensive health check
   */
  async performHealthCheck() {
    if (!this.isMonitoring) return;
    console.log('\u{1F50D} Performing system health check...');
    this.systemStatus.lastChecked = /* @__PURE__ */ new Date().toISOString();
    this.systemStatus.uptime = Date.now() - this.startupTime;
    const results = {};
    let overallHealthy = true;
    for (const [componentName, healthCheck] of this.healthChecks) {
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Health check timeout')), healthCheck.options.timeout)
        );
        const checkPromise = Promise.resolve(healthCheck.checkFunction());
        const result = await Promise.race([checkPromise, timeoutPromise]);
        results[componentName] = {
          healthy: result.healthy || result === true,
          status: result.status || 'ok',
          details: result.details || {},
          timestamp: /* @__PURE__ */ new Date().toISOString(),
        };
        if (!results[componentName].healthy) {
          console.warn(`\u26A0\uFE0F  Component ${componentName} is unhealthy:`, result);
          if (healthCheck.options.critical) {
            overallHealthy = false;
          }
          await this.attemptRecovery(componentName, results[componentName]);
        }
      } catch (error) {
        console.error(`\u274C Health check failed for ${componentName}:`, error.message);
        results[componentName] = {
          healthy: false,
          status: 'error',
          details: { error: error.message },
          timestamp: /* @__PURE__ */ new Date().toISOString(),
        };
        if (healthCheck.options.critical) {
          overallHealthy = false;
        }
        await this.attemptRecovery(componentName, results[componentName]);
      }
    }
    this.systemStatus.components = results;
    this.systemStatus.overall = overallHealthy ? 'healthy' : 'degraded';
    console.log(`\u{1F3E5} Health check complete. Overall status: ${this.systemStatus.overall}`);
    this.emit('health-check-complete', this.systemStatus);
  }
  /**
   * Attempt to recover an unhealthy component
   * @param {string} componentName - Name of the component
   * @param {object} healthStatus - Current health status
   */
  async attemptRecovery(componentName, healthStatus) {
    const recoveryMech = this.recoveryMechanisms.get(componentName);
    if (!recoveryMech) {
      console.log(`No recovery mechanism registered for ${componentName}`);
      return false;
    }
    const attempts = this.recoveryAttempts.get(componentName) || 0;
    if (attempts >= recoveryMech.options.maxAttempts) {
      console.warn(
        `Maximum recovery attempts (${recoveryMech.options.maxAttempts}) reached for ${componentName}`
      );
      return false;
    }
    console.log(
      `Attempting to recover ${componentName} (attempt ${attempts + 1}/${recoveryMech.options.maxAttempts})`
    );
    try {
      await new Promise((resolve) => setTimeout(resolve, recoveryMech.options.delay));
      const recoveryResult = await recoveryMech.recoveryFunction(healthStatus);
      if (recoveryResult.success) {
        console.log(`\u2705 Recovery successful for ${componentName}`);
        this.recoveryAttempts.set(componentName, 0);
        this.emit('recovery-success', { component: componentName, result: recoveryResult });
        return true;
      } else {
        console.warn(`Recovery failed for ${componentName}:`, recoveryResult.error);
        this.recoveryAttempts.set(componentName, attempts + 1);
        this.emit('recovery-failed', { component: componentName, error: recoveryResult.error });
        return false;
      }
    } catch (error) {
      console.error(`Recovery attempt failed for ${componentName}:`, error.message);
      this.recoveryAttempts.set(componentName, attempts + 1);
      this.emit('recovery-error', { component: componentName, error: error.message });
      return false;
    }
  }
  /**
   * Perform system backup
   */
  async performBackup() {
    console.log('\u{1F4BE} Performing system backup...');
    try {
      const backupDir = path.join(process.cwd(), '.ultra-dex', 'backups');
      await fs.mkdir(backupDir, { recursive: true });
      const timestamp = /* @__PURE__ */ new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = path.join(backupDir, `backup-${timestamp}.json`);
      const backupData = {
        timestamp: /* @__PURE__ */ new Date().toISOString(),
        systemStatus: this.systemStatus,
        config: await this.getConfigSnapshot(),
        memoryState: await this.getMemorySnapshot(),
      };
      await fs.writeFile(backupFile, JSON.stringify(backupData, null, 2));
      console.log(`\u2705 Backup created: ${backupFile}`);
      this.emit('backup-created', { file: backupFile, size: backupData });
    } catch (error) {
      console.error('\u274C Backup failed:', error.message);
      this.emit('backup-error', { error: error.message });
    }
  }
  /**
   * Get a snapshot of the current configuration
   */
  async getConfigSnapshot() {
    try {
      const configPath = path.join(process.cwd(), '.ultra-dex', 'config.json');
      const configExists = await fs
        .access(configPath)
        .then(() => true)
        .catch(() => false);
      if (configExists) {
        const config = await fs.readFile(configPath, 'utf8');
        return JSON.parse(config);
      }
      return null;
    } catch (error) {
      console.warn('Could not create config snapshot:', error.message);
      return { error: error.message };
    }
  }
  /**
   * Get a snapshot of the memory state
   */
  async getMemorySnapshot() {
    try {
      return {
        message: 'Memory snapshot functionality would be implemented here',
        timestamp: /* @__PURE__ */ new Date().toISOString(),
      };
    } catch (error) {
      console.warn('Could not create memory snapshot:', error.message);
      return { error: error.message };
    }
  }
  /**
   * Restart a specific component
   * @param {string} componentName - Name of the component to restart
   */
  async restartComponent(componentName) {
    console.log(`\u{1F504} Restarting component: ${componentName}`);
    this.emit('component-restart', { component: componentName });
    this.recoveryAttempts.set(componentName, 0);
    return { success: true, component: componentName };
  }
  /**
   * Get current system status
   */
  getSystemStatus() {
    return { ...this.systemStatus };
  }
  /**
   * Get health check results for a specific component
   * @param {string} componentName - Name of the component
   */
  getComponentHealth(componentName) {
    return this.systemStatus.components[componentName] || null;
  }
  /**
   * Reset recovery attempts for a component
   * @param {string} componentName - Name of the component
   */
  resetRecoveryAttempts(componentName) {
    this.recoveryAttempts.delete(componentName);
  }
  /**
   * Get recovery statistics
   */
  getRecoveryStats() {
    const stats = {};
    for (const [component, attempts] of this.recoveryAttempts) {
      stats[component] = attempts;
    }
    return stats;
  }
}
var health_monitor_default = HealthMonitor;
let healthMonitorInstance = null;
function getInstance() {
  if (!healthMonitorInstance) {
    healthMonitorInstance = new HealthMonitor();
  }
  return healthMonitorInstance;
}
export { HealthMonitor, health_monitor_default as default, getInstance };
