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
var __decorateParam = (index, decorator) => (target, key) => decorator(target, key, index);
import { EventEmitter } from 'events';
import { singleton, inject } from 'tsyringe';
import { DI_TOKENS } from '../di/tokens.js';
let WorkerPool = class extends EventEmitter {
  constructor(logger, config, messageBus) {
    super();
    this.logger = logger;
    this.config = config;
    this.messageBus = messageBus;
    this.startCleanupInterval();
    this.setupMessageHandlers();
  }
  workers = /* @__PURE__ */ new Map();
  assignments = /* @__PURE__ */ new Map();
  heartbeatTimeouts = /* @__PURE__ */ new Map();
  cleanupInterval = null;
  /**
   * Register a new worker
   */
  registerWorker(worker) {
    const fullWorker = {
      ...worker,
      status: 'idle',
      activeTasks: 0,
      queuedTasks: 0,
      load: 0,
      lastHeartbeat: Date.now(),
    };
    this.workers.set(worker.id, fullWorker);
    this.scheduleHeartbeatCheck(worker.id);
    this.logger.info('Worker registered', {
      workerId: worker.id,
      nodeId: worker.nodeId,
      region: worker.region,
    });
    this.emit('worker:registered', fullWorker);
    return fullWorker;
  }
  /**
   * Unregister a worker
   */
  unregisterWorker(workerId) {
    const worker = this.workers.get(workerId);
    if (!worker) {
      return false;
    }
    const timeout = this.heartbeatTimeouts.get(workerId);
    if (timeout) {
      clearTimeout(timeout);
      this.heartbeatTimeouts.delete(workerId);
    }
    this.workers.delete(workerId);
    this.emit('worker:unregistered', worker);
    this.logger.info('Worker unregistered', { workerId });
    return true;
  }
  /**
   * Update worker heartbeat
   */
  heartbeat(workerId, updates) {
    const worker = this.workers.get(workerId);
    if (!worker) {
      return false;
    }
    Object.assign(worker, updates);
    worker.lastHeartbeat = Date.now();
    if (worker.load >= 0.9) {
      worker.status = 'busy';
    } else if (worker.load < 0.1) {
      worker.status = 'idle';
    } else {
      worker.status = 'busy';
    }
    this.scheduleHeartbeatCheck(workerId);
    this.emit('worker:heartbeat', worker);
    return true;
  }
  /**
   * Find workers by capabilities
   */
  findCapableWorkers(requiredCapabilities) {
    return Array.from(this.workers.values()).filter((worker) => {
      if (worker.status === 'offline') return false;
      if (worker.load >= 0.95) return false;
      return requiredCapabilities.every(
        (cap) =>
          worker.capabilities.agentTypes.includes(cap) || worker.capabilities.skills.includes(cap)
      );
    });
  }
  /**
   * Get workers by region
   */
  getWorkersByRegion(region) {
    return Array.from(this.workers.values()).filter(
      (w) => w.region === region && w.status !== 'offline'
    );
  }
  /**
   * Get workers by status
   */
  getWorkersByStatus(status) {
    return Array.from(this.workers.values()).filter((w) => w.status === status);
  }
  /**
   * Claim a worker for a task
   */
  claimWorker(workerId, taskId, timeoutMs = 3e4) {
    const worker = this.workers.get(workerId);
    if (!worker || worker.status === 'offline') {
      return false;
    }
    const availableSlots = worker.capabilities.maxConcurrentTasks - worker.activeTasks;
    if (availableSlots <= 0) {
      return false;
    }
    const assignment = {
      taskId,
      workerId,
      assignedAt: Date.now(),
      expiresAt: Date.now() + timeoutMs,
    };
    this.assignments.set(taskId, assignment);
    worker.activeTasks++;
    worker.load = worker.activeTasks / worker.capabilities.maxConcurrentTasks;
    if (worker.load >= 0.9) {
      worker.status = 'busy';
    }
    this.emit('worker:claimed', { worker, assignment });
    this.logger.debug('Worker claimed', { workerId, taskId });
    return true;
  }
  /**
   * Release a worker after task completion
   */
  releaseWorker(workerId, taskId) {
    const worker = this.workers.get(workerId);
    if (!worker) {
      return false;
    }
    this.assignments.delete(taskId);
    worker.activeTasks = Math.max(0, worker.activeTasks - 1);
    worker.load = worker.activeTasks / worker.capabilities.maxConcurrentTasks;
    if (worker.load < 0.9) {
      worker.status = 'idle';
    }
    this.emit('worker:released', { worker, taskId });
    this.logger.debug('Worker released', { workerId, taskId });
    return true;
  }
  /**
   * Get worker by ID
   */
  getWorker(workerId) {
    return this.workers.get(workerId);
  }
  /**
   * Get all workers
   */
  getAllWorkers() {
    return Array.from(this.workers.values());
  }
  /**
   * Get pool statistics
   */
  getStats() {
    const workers = Array.from(this.workers.values());
    const online = workers.filter((w) => w.status !== 'offline');
    const busy = workers.filter((w) => w.status === 'busy');
    const idle = workers.filter((w) => w.status === 'idle');
    const totalCapacity = workers.reduce((sum, w) => sum + w.capabilities.maxConcurrentTasks, 0);
    return {
      totalWorkers: workers.length,
      onlineWorkers: online.length,
      busyWorkers: busy.length,
      idleWorkers: idle.length,
      totalCapacity,
      activeAssignments: this.assignments.size,
      averageLoad:
        online.length > 0 ? online.reduce((sum, w) => sum + w.load, 0) / online.length : 0,
      averageLatency:
        online.length > 0 ? online.reduce((sum, w) => sum + w.latency, 0) / online.length : 0,
    };
  }
  /**
   * Get assignment for a task
   */
  getAssignment(taskId) {
    return this.assignments.get(taskId);
  }
  /**
   * Shutdown worker pool
   */
  async shutdown() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.heartbeatTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.heartbeatTimeouts.clear();
    this.workers.clear();
    this.assignments.clear();
    this.logger.info('WorkerPool shutdown complete');
  }
  scheduleHeartbeatCheck(workerId) {
    const existing = this.heartbeatTimeouts.get(workerId);
    if (existing) {
      clearTimeout(existing);
    }
    const timeout = this.config.get('mesh.workerTimeout', 3e4);
    const checkTimeout = setTimeout(() => {
      this.checkWorkerHealth(workerId);
    }, timeout);
    this.heartbeatTimeouts.set(workerId, checkTimeout);
  }
  checkWorkerHealth(workerId) {
    const worker = this.workers.get(workerId);
    if (!worker) {
      return;
    }
    const now = Date.now();
    const timeout = this.config.get('mesh.workerTimeout', 3e4);
    if (now - worker.lastHeartbeat > timeout) {
      this.logger.warn('Worker heartbeat timeout', { workerId });
      worker.status = 'offline';
      this.emit('worker:offline', worker);
      this.reassignWorkerTasks(workerId);
    }
  }
  reassignWorkerTasks(workerId) {
    const tasksToReassign = [];
    this.assignments.forEach((assignment, taskId) => {
      if (assignment.workerId === workerId) {
        tasksToReassign.push(taskId);
      }
    });
    tasksToReassign.forEach((taskId) => {
      this.assignments.delete(taskId);
      this.emit('task:reassign', { taskId, fromWorker: workerId });
    });
    this.logger.info('Reassigned tasks from offline worker', {
      workerId,
      taskCount: tasksToReassign.length,
    });
  }
  startCleanupInterval() {
    const interval = this.config.get('mesh.cleanupInterval', 6e4);
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredAssignments();
    }, interval);
  }
  cleanupExpiredAssignments() {
    const now = Date.now();
    this.assignments.forEach((assignment, taskId) => {
      if (now > assignment.expiresAt) {
        this.assignments.delete(taskId);
        this.releaseWorker(assignment.workerId, taskId);
        this.emit('assignment:expired', assignment);
        this.logger.warn('Assignment expired', { taskId, workerId: assignment.workerId });
      }
    });
  }
  setupMessageHandlers() {
    this.messageBus.subscribe('worker.heartbeat', (envelope) => {
      const { workerId, ...updates } = envelope.message;
      this.heartbeat(workerId, updates);
    });
    this.messageBus.subscribe('worker.register', (envelope) => {
      const worker = envelope.message;
      this.registerWorker(worker);
    });
    this.messageBus.subscribe('worker.unregister', (envelope) => {
      const { workerId } = envelope.message;
      this.unregisterWorker(workerId);
    });
  }
};
WorkerPool = __decorateClass(
  [
    singleton(),
    __decorateParam(0, inject(DI_TOKENS.Logger)),
    __decorateParam(1, inject(DI_TOKENS.ConfigService)),
    __decorateParam(2, inject(DI_TOKENS.MessageBus)),
  ],
  WorkerPool
);
export { WorkerPool };
