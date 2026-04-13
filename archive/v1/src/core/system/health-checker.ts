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
import os from 'os';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from '../../utils/logging.js';
const execAsync = promisify(exec);
let SystemHealthChecker = class {
  constructor(options = {}) {
    this.config = {
      enableDeepScanning: options.enableDeepScanning !== false,
      enableExternalChecks: options.enableExternalChecks !== false,
      checkInterval: options.checkInterval || 3e4,
      // 30 seconds
      criticalThreshold: options.criticalThreshold || 0.9,
      // 90% threshold
      warningThreshold: options.warningThreshold || 0.7,
      // 70% threshold
      maxConcurrentChecks: options.maxConcurrentChecks || 5,
      ...options,
    };
    this.healthStatus = {
      overall: 'unknown',
      timestamp: /* @__PURE__ */ new Date().toISOString(),
      components: {},
      metrics: {},
      recommendations: [],
    };
    this.checkHistory = [];
    this.maxHistory = 100;
  }
  /**
   * Perform comprehensive system health check
   */
  async performHealthCheck() {
    const startTime = performance.now();
    logger.info('\u{1F3E5} Performing system health check...');
    const checks = [
      this.checkSystemResources.bind(this),
      this.checkDiskSpace.bind(this),
      this.checkMemory.bind(this),
      this.checkNetworkConnectivity.bind(this),
      this.checkProcessHealth.bind(this),
      this.checkFilePermissions.bind(this),
      this.checkDependencies.bind(this),
      this.checkSecurity.bind(this),
    ];
    const results = await this.runChecksWithConcurrencyLimit(checks);
    const healthStatus = this.compileHealthStatus(results);
    this.checkHistory.push(healthStatus);
    if (this.checkHistory.length > this.maxHistory) {
      this.checkHistory.shift();
    }
    const duration = performance.now() - startTime;
    logger.info(`\u2705 Health check completed in ${Math.round(duration)}ms`, {
      status: healthStatus.overall,
      checksPerformed: results.length,
      duration: Math.round(duration),
    });
    return healthStatus;
  }
  /**
   * Alias for performHealthCheck to support MonitoringService
   */
  async checkHealth() {
    return await this.performHealthCheck();
  }
  /**
   * Run checks with concurrency limit
   */
  async runChecksWithConcurrencyLimit(checks) {
    const results = [];
    const semaphore = new Semaphore(this.config.maxConcurrentChecks);
    const checkPromises = checks.map((checkFn) =>
      (async () => {
        await semaphore.acquire();
        try {
          return await checkFn();
        } finally {
          semaphore.release();
        }
      })()
    );
    const settledResults = await Promise.allSettled(checkPromises);
    for (const [index, result] of settledResults.entries()) {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        results.push({
          name: checks[index].name || `check-${index}`,
          status: 'error',
          message: result.reason.message,
          critical: false,
        });
      }
    }
    return results;
  }
  /**
   * Check system resources (CPU, memory, load)
   */
  async checkSystemResources() {
    const cpus = os.cpus();
    const loadAvg = os.loadavg();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsagePercent = (usedMemory / totalMemory) * 100;
    const cpuUsage = this.calculateCpuUsage();
    const cpuUsagePercent =
      ((cpuUsage.user + cpuUsage.system) / (cpuUsage.user + cpuUsage.system + cpuUsage.idle)) * 100;
    const status = {
      name: 'system-resources',
      status: 'healthy',
      message: 'System resources within normal parameters',
      critical: false,
      details: {
        cpu: {
          count: cpus.length,
          model: cpus[0]?.model,
          speed: cpus[0]?.speed,
          usagePercent: cpuUsagePercent.toFixed(2),
        },
        memory: {
          total: this.formatBytes(totalMemory),
          used: this.formatBytes(usedMemory),
          free: this.formatBytes(freeMemory),
          usagePercent: memoryUsagePercent.toFixed(2),
        },
        load: {
          avg1min: loadAvg[0].toFixed(2),
          avg5min: loadAvg[1].toFixed(2),
          avg15min: loadAvg[2].toFixed(2),
        },
        uptime: this.formatUptime(os.uptime()),
      },
    };
    if (cpuUsagePercent > this.config.criticalThreshold * 100) {
      status.status = 'critical';
      status.message = `CPU usage critically high: ${cpuUsagePercent.toFixed(2)}%`;
      status.critical = true;
    } else if (cpuUsagePercent > this.config.warningThreshold * 100) {
      status.status = 'warning';
      status.message = `CPU usage elevated: ${cpuUsagePercent.toFixed(2)}%`;
    }
    if (memoryUsagePercent > this.config.criticalThreshold * 100) {
      status.status = 'critical';
      status.message = `Memory usage critically high: ${memoryUsagePercent.toFixed(2)}%`;
      status.critical = true;
    } else if (memoryUsagePercent > this.config.warningThreshold * 100) {
      status.status = 'warning';
      status.message = `Memory usage elevated: ${memoryUsagePercent.toFixed(2)}%`;
    }
    return status;
  }
  /**
   * Check disk space availability
   */
  async checkDiskSpace() {
    try {
      const { stdout } = await execAsync('df -h /');
      const lines = stdout.trim().split('\n');
      const diskInfo = lines[1].split(/\s+/);
      const usagePercent = parseInt(diskInfo[4].replace('%', ''));
      const availableSpace = diskInfo[3];
      const status = {
        name: 'disk-space',
        status: 'healthy',
        message: `Disk space sufficient: ${availableSpace} available`,
        critical: false,
        details: {
          filesystem: diskInfo[0],
          size: diskInfo[1],
          used: diskInfo[2],
          available: availableSpace,
          usagePercent,
        },
      };
      if (usagePercent > this.config.criticalThreshold * 100) {
        status.status = 'critical';
        status.message = `Disk space critically low: ${usagePercent}% used`;
        status.critical = true;
      } else if (usagePercent > this.config.warningThreshold * 100) {
        status.status = 'warning';
        status.message = `Disk space running low: ${usagePercent}% used`;
      }
      return status;
    } catch (error) {
      return {
        name: 'disk-space',
        status: 'error',
        message: `Unable to check disk space: ${error.message}`,
        critical: false,
        details: {},
      };
    }
  }
  /**
   * Check memory usage in detail
   */
  async checkMemory() {
    const processMemory = process.memoryUsage();
    const systemMemory = os.totalmem();
    const systemFreeMemory = os.freemem();
    const systemUsedMemory = systemMemory - systemFreeMemory;
    const status = {
      name: 'memory-usage',
      status: 'healthy',
      message: 'Memory usage within normal parameters',
      critical: false,
      details: {
        process: {
          rss: this.formatBytes(processMemory.rss),
          heapTotal: this.formatBytes(processMemory.heapTotal),
          heapUsed: this.formatBytes(processMemory.heapUsed),
          external: this.formatBytes(processMemory.external),
        },
        system: {
          total: this.formatBytes(systemMemory),
          used: this.formatBytes(systemUsedMemory),
          free: this.formatBytes(systemFreeMemory),
          usagePercent: ((systemUsedMemory / systemMemory) * 100).toFixed(2),
        },
      },
    };
    const processMemoryPercent = processMemory.heapUsed / systemMemory;
    if (processMemoryPercent > this.config.criticalThreshold * 0.1) {
      status.status = 'critical';
      status.message = `Process memory usage critically high: ${this.formatBytes(processMemory.heapUsed)} used`;
      status.critical = true;
    } else if (processMemoryPercent > this.config.warningThreshold * 0.1) {
      status.status = 'warning';
      status.message = `Process memory usage elevated: ${this.formatBytes(processMemory.heapUsed)} used`;
    }
    return status;
  }
  /**
   * Check network connectivity
   */
  async checkNetworkConnectivity() {
    const status = {
      name: 'network-connectivity',
      status: 'healthy',
      message: 'Network connectivity verified',
      critical: false,
      details: {
        hostname: os.hostname(),
        platform: os.platform(),
        networkInterfaces: os.networkInterfaces(),
      },
    };
    if (this.config.enableExternalChecks) {
      try {
        const connectivityTests = [
          { name: 'google', url: 'https://www.google.com', timeout: 5e3 },
          { name: 'github', url: 'https://api.github.com', timeout: 5e3 },
          { name: 'ultra-dex', url: 'https://api.ultra-dex.ai', timeout: 5e3 },
          // Hypothetical API
        ];
        const results = await Promise.allSettled(
          connectivityTests.map(async (test) => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), test.timeout);
            try {
              const response = await fetch(test.url, {
                signal: controller.signal,
                method: 'HEAD',
              });
              clearTimeout(timeoutId);
              return { name: test.name, success: response.ok, status: response.status };
            } catch (error) {
              clearTimeout(timeoutId);
              return { name: test.name, success: false, error: error.message };
            }
          })
        );
        status.details.connectivityTests = results.map((result, index) => {
          if (result.status === 'fulfilled') {
            return result.value;
          } else {
            return {
              name: connectivityTests[index].name,
              success: false,
              error: result.reason.message,
            };
          }
        });
        const failedTests = status.details.connectivityTests.filter((test) => !test.success);
        if (failedTests.length > 0) {
          status.status = 'warning';
          status.message = `Network connectivity issues detected: ${failedTests.map((t) => t.name).join(', ')}`;
        }
      } catch (error) {
        status.status = 'warning';
        status.message = `Network connectivity check failed: ${error.message}`;
      }
    }
    return status;
  }
  /**
   * Check process health
   */
  async checkProcessHealth() {
    const status = {
      name: 'process-health',
      status: 'healthy',
      message: 'Process health is normal',
      critical: false,
      details: {
        pid: process.pid,
        uptime: this.formatUptime(process.uptime()),
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        activeHandles: process._getActiveHandles().length,
        activeRequests: process._getActiveRequests().length,
      },
    };
    if (status.details.activeHandles > 1e3) {
      status.status = 'warning';
      status.message = `High number of active handles: ${status.details.activeHandles}`;
    }
    if (status.details.activeRequests > 100) {
      status.status = 'warning';
      status.message = `High number of active requests: ${status.details.activeRequests}`;
    }
    return status;
  }
  /**
   * Check file permissions and accessibility
   */
  async checkFilePermissions() {
    const criticalPaths = [
      process.cwd(),
      path.join(process.cwd(), '.ultra-dex'),
      path.join(process.cwd(), 'CONTEXT.md'),
      path.join(process.cwd(), 'IMPLEMENTATION-PLAN.md'),
      path.join(process.cwd(), 'package.json'),
    ];
    const status = {
      name: 'file-permissions',
      status: 'healthy',
      message: 'All critical files accessible',
      critical: false,
      details: {
        checkedPaths: [],
        inaccessiblePaths: [],
      },
    };
    for (const filePath of criticalPaths) {
      try {
        await fs.access(filePath);
        status.details.checkedPaths.push({ path: filePath, accessible: true });
      } catch (error) {
        status.details.checkedPaths.push({
          path: filePath,
          accessible: false,
          error: error.message,
        });
        status.details.inaccessiblePaths.push(filePath);
      }
    }
    if (status.details.inaccessiblePaths.length > 0) {
      status.status = 'critical';
      status.message = `Critical files inaccessible: ${status.details.inaccessiblePaths.join(', ')}`;
      status.critical = true;
    }
    return status;
  }
  /**
   * Check dependencies and versions
   */
  async checkDependencies() {
    const status = {
      name: 'dependencies',
      status: 'healthy',
      message: 'All dependencies appear to be functioning',
      critical: false,
      details: {
        nodeVersion: process.version,
        npmVersion: await this.getNpmVersion(),
        dependencies: await this.getDependencyInfo(),
      },
    };
    const nodeMajor = parseInt(process.version.split('.')[0].replace('v', ''));
    if (nodeMajor < 18) {
      status.status = 'warning';
      status.message = `Node version ${process.version} may be outdated (recommended: >=18.0.0)`;
    }
    return status;
  }
  /**
   * Check security aspects
   */
  async checkSecurity() {
    const status = {
      name: 'security',
      status: 'healthy',
      message: 'Security checks passed',
      critical: false,
      details: {
        environment: {
          nodeEnv: process.env.NODE_ENV || 'development',
          hasApiKey:
            !!process.env.OPENAI_API_KEY ||
            !!process.env.ANTHROPIC_API_KEY ||
            !!process.env.GOOGLE_API_KEY,
          secureStorage: this.checkSecureStorage(),
        },
        permissions: {
          umask: process.umask(),
          effectiveUserId: process.geteuid ? process.geteuid() : 'N/A',
          effectiveGroupId: process.getegid ? process.getegid() : 'N/A',
        },
      },
    };
    if (process.env.NODE_ENV === 'development' && status.details.environment.hasApiKey) {
      status.status = 'warning';
      status.message = 'API keys detected in development environment';
    }
    if (!status.details.environment.secureStorage) {
      status.status = 'warning';
      status.message = 'Secure credential storage not detected';
    }
    return status;
  }
  /**
   * Compile overall health status from individual checks
   */
  compileHealthStatus(checkResults) {
    const criticalFailures = checkResults.filter(
      (check) => check.critical && check.status !== 'healthy'
    );
    const warnings = checkResults.filter((check) => check.status === 'warning');
    const errors = checkResults.filter((check) => check.status === 'error');
    let overallStatus = 'healthy';
    if (criticalFailures.length > 0) {
      overallStatus = 'critical';
    } else if (errors.length > 0) {
      overallStatus = 'error';
    } else if (warnings.length > 0) {
      overallStatus = 'warning';
    }
    const recommendations = this.generateRecommendations(checkResults);
    return {
      overall: overallStatus,
      timestamp: /* @__PURE__ */ new Date().toISOString(),
      components: Object.fromEntries(checkResults.map((check) => [check.name, check])),
      metrics: {
        totalChecks: checkResults.length,
        healthy: checkResults.filter((c) => c.status === 'healthy').length,
        warnings: warnings.length,
        errors: errors.length,
        critical: criticalFailures.length,
      },
      recommendations,
      details: checkResults,
    };
  }
  /**
   * Generate recommendations based on health check results
   */
  generateRecommendations(checkResults) {
    const recommendations = [];
    for (const check of checkResults) {
      switch (check.name) {
        case 'system-resources':
          if (check.status === 'warning' || check.status === 'critical') {
            if (check.details.cpu.usagePercent > 80) {
              recommendations.push(
                'Consider optimizing CPU-intensive operations or scaling horizontally'
              );
            }
            if (check.details.memory.usagePercent > 80) {
              recommendations.push('Consider optimizing memory usage or increasing available RAM');
            }
          }
          break;
        case 'disk-space':
          if (check.status === 'warning' || check.status === 'critical') {
            recommendations.push('Clean up unnecessary files or expand disk space');
          }
          break;
        case 'network-connectivity':
          if (check.status === 'warning') {
            recommendations.push('Check network configuration and firewall settings');
          }
          break;
        case 'process-health':
          if (check.status === 'warning') {
            recommendations.push('Monitor for potential memory leaks or resource accumulation');
          }
          break;
        case 'file-permissions':
          if (check.status === 'critical') {
            recommendations.push('Restore access to critical files and directories');
          }
          break;
        case 'security':
          if (check.status === 'warning') {
            recommendations.push('Move API keys to secure storage and use environment variables');
          }
          break;
      }
    }
    return recommendations;
  }
  /**
   * Get npm version
   */
  async getNpmVersion() {
    try {
      const { stdout } = await execAsync('npm --version');
      return stdout.trim();
    } catch {
      return 'unknown';
    }
  }
  /**
   * Get dependency information
   */
  async getDependencyInfo() {
    try {
      const packagePath = path.join(process.cwd(), 'package.json');
      const pkg = JSON.parse(await fs.readFile(packagePath, 'utf8'));
      return {
        ultraDexVersion: pkg.version,
        dependencies: Object.keys(pkg.dependencies || {}).length,
        devDependencies: Object.keys(pkg.devDependencies || {}).length,
      };
    } catch {
      return {
        ultraDexVersion: 'unknown',
        dependencies: 0,
        devDependencies: 0,
      };
    }
  }
  /**
   * Check for secure storage
   */
  checkSecureStorage() {
    const secureStorageIndicators = [
      '.env.production',
      '.env.local',
      'config/secrets.json',
      '.vault',
      'keytar',
      // Node.js keychain module
    ];
    for (const indicator of secureStorageIndicators) {
      try {
        const indicatorPath = path.join(process.cwd(), indicator);
        if (fs.accessSync(indicatorPath)) {
          return true;
        }
      } catch {
        continue;
      }
    }
    return false;
  }
  /**
   * Calculate CPU usage
   */
  calculateCpuUsage() {
    const cpus = os.cpus();
    let user = 0,
      nice = 0,
      sys = 0,
      idle = 0,
      irq = 0;
    for (const cpu of cpus) {
      const times = cpu.times;
      user += times.user;
      nice += times.nice;
      sys += times.sys;
      idle += times.idle;
      irq += times.irq;
    }
    return { user, nice, sys, idle, irq };
  }
  /**
   * Format bytes to human-readable format
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  /**
   * Format uptime to human-readable format
   */
  formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor(((seconds % 86400) % 3600) / 60);
    const secs = Math.floor(((seconds % 86400) % 3600) % 60);
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
    return parts.join(' ');
  }
  /**
   * Get health check history
   */
  getHealthHistory() {
    return [...this.checkHistory];
  }
  /**
   * Get current health status
   */
  getCurrentHealth() {
    if (this.checkHistory.length > 0) {
      return this.checkHistory[this.checkHistory.length - 1];
    }
    return null;
  }
  /**
   * Start periodic health monitoring
   */
  startMonitoring() {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
    }
    this.monitorInterval = setInterval(async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        logger.error('Health monitoring error:', error.message);
      }
    }, this.config.checkInterval);
    logger.info(`\u{1F3E5} Health monitoring started (interval: ${this.config.checkInterval}ms)`);
  }
  /**
   * Stop periodic health monitoring
   */
  stopMonitoring() {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
      logger.info('\u{1F3E5} Health monitoring stopped');
    }
  }
  /**
   * Run a quick health check (only critical checks)
   */
  async quickHealthCheck() {
    logger.info('\u{1F3E5} Running quick health check...');
    const quickChecks = [
      this.checkSystemResources.bind(this),
      this.checkProcessHealth.bind(this),
      this.checkFilePermissions.bind(this),
    ];
    const results = await Promise.all(quickChecks.map((check) => check()));
    const healthStatus = this.compileHealthStatus(results);
    logger.info(`\u2705 Quick health check completed: ${healthStatus.overall}`);
    return healthStatus;
  }
};
SystemHealthChecker = __decorateClass([singleton()], SystemHealthChecker);
class Semaphore {
  constructor(maxConcurrency) {
    this.maxConcurrency = maxConcurrency;
    this.currentConcurrency = 0;
    this.queue = [];
  }
  async acquire() {
    if (this.currentConcurrency < this.maxConcurrency) {
      this.currentConcurrency++;
      return;
    }
    return new Promise((resolve) => {
      this.queue.push(resolve);
    });
  }
  release() {
    this.currentConcurrency--;
    if (this.queue.length > 0) {
      this.currentConcurrency++;
      const next = this.queue.shift();
      next();
    }
  }
}
const systemHealthChecker = new SystemHealthChecker();
var health_checker_default = systemHealthChecker;
export {
  SystemHealthChecker,
  health_checker_default as default,
  systemHealthChecker,
  systemHealthChecker as healthChecker,
};
