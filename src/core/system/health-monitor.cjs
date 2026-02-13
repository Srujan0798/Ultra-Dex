/**
 * Health Monitor for Ultra-Dex
 * Monitors system health and implements self-healing mechanisms
 */

const EventEmitter = require('events');
const fs = require('fs/promises');
const path = require('path');
const { spawn } = require('child_process');

class HealthMonitor extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      checkInterval: options.checkInterval || 30000, // 30 seconds
      maxRetries: options.maxRetries || 3,
      retryDelay: options.retryDelay || 5000, // 5 seconds
      backupInterval: options.backupInterval || 300000, // 5 minutes
      ...options
    };
    
    this.isMonitoring = false;
    this.healthChecks = new Map();
    this.recoveryMechanisms = new Map();
    this.systemStatus = {
      overall: 'healthy',
      components: {},
      lastChecked: null,
      uptime: 0
    };
    
    this.startupTime = Date.now();
    this.recoveryAttempts = new Map();
  }

  /**
   * Start the health monitoring system
   */
  async start() {
    if (this.isMonitoring) {
      console.warn('Health monitor already running');
      return;
    }

    console.log('🏥 Starting Ultra-Dex Health Monitor...');
    this.isMonitoring = true;
    
    // Perform initial health check
    await this.performHealthCheck();
    
    // Start periodic checks
    this.monitorInterval = setInterval(
      () => this.performHealthCheck(),
      this.options.checkInterval
    );
    
    // Start backup process if enabled
    if (this.options.backupInterval > 0) {
      this.backupInterval = setInterval(
        () => this.performBackup(),
        this.options.backupInterval
    );
    }
    
    console.log('✅ Health monitor started');
    this.emit('started');
  }

  /**
   * Stop the health monitoring system
   */
  async stop() {
    if (!this.isMonitoring) {
      return;
    }

    console.log('🏥 Stopping Ultra-Dex Health Monitor...');
    
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
    
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
      this.backupInterval = null;
    }
    
    this.isMonitoring = false;
    console.log('✅ Health monitor stopped');
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
        timeout: options.timeout || 10000,
        ...options
      }
    });
    
    console.log(`📋 Registered health check for: ${componentName}`);
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
        ...options
      }
    });
    
    console.log(`🔧 Registered recovery mechanism for: ${componentName}`);
  }

  /**
   * Perform a comprehensive health check
   */
  async performHealthCheck() {
    if (!this.isMonitoring) return;

    console.log('🔍 Performing system health check...');
    this.systemStatus.lastChecked = new Date().toISOString();
    this.systemStatus.uptime = Date.now() - this.startupTime;

    const results = {};
    let overallHealthy = true;

    // Run all registered health checks
    for (const [componentName, healthCheck] of this.healthChecks) {
      try {
        // Add timeout to health checks
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Health check timeout')), healthCheck.options.timeout)
        );
        
        const checkPromise = Promise.resolve(healthCheck.checkFunction());
        const result = await Promise.race([checkPromise, timeoutPromise]);
        
        results[componentName] = {
          healthy: result.healthy || result === true,
          status: result.status || 'ok',
          details: result.details || {},
          timestamp: new Date().toISOString()
        };

        if (!results[componentName].healthy) {
          console.warn(`⚠️  Component ${componentName} is unhealthy:`, result);
          
          // If component is critical and unhealthy, mark overall as unhealthy
          if (healthCheck.options.critical) {
            overallHealthy = false;
          }
          
          // Trigger recovery if registered
          await this.attemptRecovery(componentName, results[componentName]);
        }
      } catch (error) {
        console.error(`❌ Health check failed for ${componentName}:`, error.message);
        
        results[componentName] = {
          healthy: false,
          status: 'error',
          details: { error: error.message },
          timestamp: new Date().toISOString()
        };

        if (healthCheck.options.critical) {
          overallHealthy = false;
        }
        
        await this.attemptRecovery(componentName, results[componentName]);
      }
    }

    this.systemStatus.components = results;
    this.systemStatus.overall = overallHealthy ? 'healthy' : 'degraded';
    
    console.log(`🏥 Health check complete. Overall status: ${this.systemStatus.overall}`);
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

    // Check if we've exceeded recovery attempts
    const attempts = this.recoveryAttempts.get(componentName) || 0;
    if (attempts >= recoveryMech.options.maxAttempts) {
      console.warn(`Maximum recovery attempts (${recoveryMech.options.maxAttempts}) reached for ${componentName}`);
      return false;
    }

    console.log(`Attempting to recover ${componentName} (attempt ${attempts + 1}/${recoveryMech.options.maxAttempts})`);
    
    try {
      // Wait before attempting recovery
      await new Promise(resolve => setTimeout(resolve, recoveryMech.options.delay));
      
      const recoveryResult = await recoveryMech.recoveryFunction(healthStatus);
      
      if (recoveryResult.success) {
        console.log(`✅ Recovery successful for ${componentName}`);
        this.recoveryAttempts.set(componentName, 0); // Reset attempts on success
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
    console.log('💾 Performing system backup...');
    
    try {
      const backupDir = path.join(process.cwd(), '.ultra-dex', 'backups');
      await fs.mkdir(backupDir, { recursive: true });
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = path.join(backupDir, `backup-${timestamp}.json`);
      
      const backupData = {
        timestamp: new Date().toISOString(),
        systemStatus: this.systemStatus,
        config: await this.getConfigSnapshot(),
        memoryState: await this.getMemorySnapshot()
      };
      
      await fs.writeFile(backupFile, JSON.stringify(backupData, null, 2));
      
      console.log(`✅ Backup created: ${backupFile}`);
      this.emit('backup-created', { file: backupFile, size: backupData });
    } catch (error) {
      console.error('❌ Backup failed:', error.message);
      this.emit('backup-error', { error: error.message });
    }
  }

  /**
   * Get a snapshot of the current configuration
   */
  async getConfigSnapshot() {
    try {
      const configPath = path.join(process.cwd(), '.ultra-dex', 'config.json');
      const configExists = await fs.access(configPath).then(() => true).catch(() => false);
      
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
      // This would connect to the memory system to get a snapshot
      // For now, returning a placeholder
      return {
        message: "Memory snapshot functionality would be implemented here",
        timestamp: new Date().toISOString()
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
    console.log(`🔄 Restarting component: ${componentName}`);
    
    // This would implement component-specific restart logic
    // For now, emitting an event that other parts of the system can listen to
    this.emit('component-restart', { component: componentName });
    
    // Reset recovery attempts for this component
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

// Export the HealthMonitor class
module.exports = { HealthMonitor };

// Export a singleton instance if needed
let healthMonitorInstance = null;
module.exports.getInstance = () => {
  if (!healthMonitorInstance) {
    healthMonitorInstance = new HealthMonitor();
  }
  return healthMonitorInstance;
};