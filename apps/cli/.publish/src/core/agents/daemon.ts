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
import { EventEmitter } from 'events';
let Daemon = class extends EventEmitter {
  constructor(options = {}) {
    super();
    this.processes = /* @__PURE__ */ new Map();
    this.config = {
      restartOnFailure: options.restartOnFailure !== false,
      maxRestarts: options.maxRestarts || 5,
      restartDelay: options.restartDelay || 1e3,
      healthCheckInterval: options.healthCheckInterval || 1e4,
      ...options,
    };
    this.state = 'idle';
    this.healthChecker = null;
  }
  /**
   * Initialize daemon
   */
  async initialize() {
    this.state = 'ready';
    this.startHealthChecks();
    this.emit('daemon.ready');
    return this;
  }
  /**
   * Start a daemon process
   */
  async startProcess(processId, agent, options = {}) {
    if (this.processes.has(processId)) {
      throw new Error(`Process ${processId} already running`);
    }
    const process = {
      id: processId,
      agent,
      status: 'starting',
      startedAt: Date.now(),
      restartCount: 0,
      lastError: null,
      pid: Math.random().toString(36).substr(2, 9),
      ...options,
    };
    this.processes.set(processId, process);
    this.emit('process.starting', { processId });
    try {
      if (agent.initialize) {
        await agent.initialize();
      }
      process.status = 'running';
      process.startedAt = Date.now();
      this.emit('process.started', { processId, pid: process.pid });
      return process;
    } catch (error) {
      process.status = 'failed';
      process.lastError = error;
      this.emit('process.start-failed', { processId, error });
      throw error;
    }
  }
  /**
   * Stop a daemon process
   */
  async stopProcess(processId) {
    const process = this.processes.get(processId);
    if (!process) {
      return false;
    }
    this.emit('process.stopping', { processId });
    try {
      if (process.agent.shutdown) {
        await process.agent.shutdown();
      }
      process.status = 'stopped';
      this.processes.delete(processId);
      this.emit('process.stopped', { processId });
      return true;
    } catch (error) {
      this.emit('process.stop-failed', { processId, error });
      throw error;
    }
  }
  /**
   * Restart a daemon process
   */
  async restartProcess(processId) {
    const process = this.processes.get(processId);
    if (!process) {
      throw new Error(`Process ${processId} not found`);
    }
    this.emit('process.restarting', { processId });
    try {
      if (process.agent.shutdown) {
        await process.agent.shutdown();
      }
      process.status = 'running';
      process.restartCount++;
      process.startedAt = Date.now();
      if (process.agent.initialize) {
        await process.agent.initialize();
      }
      this.emit('process.restarted', { processId, restartCount: process.restartCount });
      return process;
    } catch (error) {
      process.status = 'failed';
      process.lastError = error;
      this.emit('process.restart-failed', { processId, error });
      throw error;
    }
  }
  /**
   * Start health checks
   */
  startHealthChecks() {
    if (this.healthChecker) {
      clearInterval(this.healthChecker);
    }
    this.healthChecker = setInterval(() => {
      this.performHealthChecks();
    }, this.config.healthCheckInterval);
  }
  /**
   * Perform health checks on all processes
   */
  async performHealthChecks() {
    for (const [processId, process] of this.processes) {
      if (process.status !== 'running') continue;
      try {
        const healthy = await this.checkProcessHealth(process);
        if (!healthy) {
          process.status = 'unhealthy';
          this.emit('process.unhealthy', { processId });
          if (this.config.restartOnFailure) {
            await this.handleProcessFailure(processId, process);
          }
        }
      } catch (error) {
        process.status = 'unhealthy';
        process.lastError = error;
        if (this.config.restartOnFailure) {
          await this.handleProcessFailure(processId, process);
        }
      }
    }
  }
  /**
   * Check individual process health
   */
  async checkProcessHealth(process) {
    try {
      if (process.agent.getStatus) {
        const status = process.agent.getStatus();
        return status && status.state !== 'error';
      }
      return process.agent !== null;
    } catch {
      return false;
    }
  }
  /**
   * Handle process failure
   */
  async handleProcessFailure(processId, process) {
    if (process.restartCount >= this.config.maxRestarts) {
      this.emit('process.max-restarts-exceeded', {
        processId,
        restartCount: process.restartCount,
      });
      return;
    }
    const delay = this.config.restartDelay * Math.pow(2, process.restartCount - 1);
    this.emit('process.scheduling-restart', { processId, delay });
    setTimeout(() => {
      this.restartProcess(processId).catch((error) => {
        this.emit('process.restart-error', { processId, error });
      });
    }, delay);
  }
  /**
   * Get process status
   */
  getProcessStatus(processId) {
    const process = this.processes.get(processId);
    if (!process) return null;
    return {
      id: process.id,
      status: process.status,
      startedAt: process.startedAt,
      uptime: Date.now() - process.startedAt,
      restartCount: process.restartCount,
      lastError: process.lastError,
      pid: process.pid,
    };
  }
  /**
   * List all processes
   */
  listProcesses(filter = {}) {
    let processes = Array.from(this.processes.values());
    if (filter.status) {
      processes = processes.filter((p) => p.status === filter.status);
    }
    return processes.map((p) => ({
      id: p.id,
      status: p.status,
      uptime: Date.now() - p.startedAt,
      restartCount: p.restartCount,
    }));
  }
  /**
   * Get daemon statistics
   */
  getStats() {
    const processes = Array.from(this.processes.values());
    const running = processes.filter((p) => p.status === 'running').length;
    const stopped = processes.filter((p) => p.status === 'stopped').length;
    const unhealthy = processes.filter((p) => p.status === 'unhealthy').length;
    return {
      totalProcesses: processes.length,
      running,
      stopped,
      unhealthy,
      totalRestarts: processes.reduce((sum, p) => sum + p.restartCount, 0),
      daemonUptime: this.daemonStartTime ? Date.now() - this.daemonStartTime : 0,
    };
  }
  /**
   * Shutdown daemon
   */
  async shutdown() {
    if (this.healthChecker) {
      clearInterval(this.healthChecker);
    }
    const processIds = Array.from(this.processes.keys());
    for (const processId of processIds) {
      await this.stopProcess(processId).catch(() => null);
    }
    this.state = 'shutdown';
    this.emit('daemon.shutdown');
  }
};
Daemon = __decorateClass([singleton()], Daemon);
var daemon_default = Daemon;
export { Daemon, daemon_default as default };
