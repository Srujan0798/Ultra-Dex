// Copyright (c) 2026 Ultra-Dex

/**
 * Auto-Scaling System v6.0
 * Dynamic resource allocation based on demand
 */

import EventEmitter from 'events';


/**
 * AutoScaler - Dynamic scaling of agents and resources
 */
export class AutoScaler extends EventEmitter {
  constructor(options = {}) {
    super();
    this.minInstances = options.minInstances || 1;
    this.maxInstances = options.maxInstances || 20;
    this.targetCPU = options.targetCPU || 70;
    this.targetMemory = options.targetMemory || 80;
    this.targetQueueDepth = options.targetQueueDepth || 10;
    this.scaleUpCooldown = options.scaleUpCooldown || 60000; // 1 minute
    this.scaleDownCooldown = options.scaleDownCooldown || 300000; // 5 minutes

    this.instances = new Map();
    this.metrics = {
      scaleUpEvents: 0,
      scaleDownEvents: 0,
      lastScaleUp: null,
      lastScaleDown: null,
    };
    this.isRunning = false;
    this.checkInterval = null;
  }

  async start() {
    if (this.isRunning) return;
    this.isRunning = true;

    // Initialize with minimum instances
    await this.scaleTo(this.minInstances);

    // Start monitoring
    this.checkInterval = setInterval(() => {
      this.evaluateScaling();
    }, 30000); // Check every 30 seconds

    this.emit('started', { instances: this.instances.size });
  }

  async stop() {
    this.isRunning = false;
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    // Scale down to minimum
    await this.scaleTo(this.minInstances);
    this.emit('stopped');
  }

  async evaluateScaling() {
    const stats = this.getClusterStats();
    const currentInstances = this.instances.size;

    // Calculate desired instances based on multiple factors
    const cpuFactor = stats.avgCPU / this.targetCPU;
    const memoryFactor = stats.avgMemory / this.targetMemory;
    const queueFactor = stats.queueDepth / this.targetQueueDepth;

    const scaleFactor = Math.max(cpuFactor, memoryFactor, queueFactor);
    const desiredInstances = Math.min(
      this.maxInstances,
      Math.max(this.minInstances, Math.ceil(currentInstances * scaleFactor))
    );

    if (desiredInstances > currentInstances) {
      await this.scaleUp(desiredInstances - currentInstances);
    } else if (desiredInstances < currentInstances) {
      await this.scaleDown(currentInstances - desiredInstances);
    }
  }

  async scaleUp(count) {
    // Check cooldown
    if (this.metrics.lastScaleUp && Date.now() - this.metrics.lastScaleUp < this.scaleUpCooldown) {
      return;
    }

    const currentCount = this.instances.size;
    const targetCount = Math.min(currentCount + count, this.maxInstances);
    const actualCount = targetCount - currentCount;

    if (actualCount <= 0) return;

    this.emit('scaling:up', {
      from: currentCount,
      to: targetCount,
      delta: actualCount,
    });

    const promises = [];
    for (let i = 0; i < actualCount; i++) {
      promises.push(this.createInstance());
    }

    await Promise.all(promises);

    this.metrics.scaleUpEvents++;
    this.metrics.lastScaleUp = Date.now();

    this.emit('scaled:up', {
      total: this.instances.size,
      added: actualCount,
    });
  }

  async scaleDown(count) {
    // Check cooldown
    if (
      this.metrics.lastScaleDown &&
      Date.now() - this.metrics.lastScaleDown < this.scaleDownCooldown
    ) {
      return;
    }

    const currentCount = this.instances.size;
    const targetCount = Math.max(currentCount - count, this.minInstances);
    const actualCount = currentCount - targetCount;

    if (actualCount <= 0) return;

    this.emit('scaling:down', {
      from: currentCount,
      to: targetCount,
      delta: actualCount,
    });

    // Remove least busy instances
    const instancesToRemove = this.getLeastBusyInstances(actualCount);

    for (const instanceId of instancesToRemove) {
      await this.destroyInstance(instanceId);
    }

    this.metrics.scaleDownEvents++;
    this.metrics.lastScaleDown = Date.now();

    this.emit('scaled:down', {
      total: this.instances.size,
      removed: actualCount,
    });
  }

  async scaleTo(count) {
    const current = this.instances.size;
    if (count > current) {
      await this.scaleUp(count - current);
    } else if (count < current) {
      await this.scaleDown(current - count);
    }
  }

  async createInstance() {
    const id = `instance-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const instance = {
      id,
      created: Date.now(),
      cpu: 0,
      memory: 0,
      queueDepth: 0,
      tasksProcessed: 0,
      status: 'creating',
    };

    this.instances.set(id, instance);

    // Simulate instance startup
    await new Promise((resolve) => setTimeout(resolve, 1000));
    instance.status = 'running';

    this.emit('instance:created', instance);
    return instance;
  }

  async destroyInstance(id) {
    const instance = this.instances.get(id);
    if (!instance) return;

    instance.status = 'destroying';

    // Drain tasks
    await this.drainInstance(instance);

    this.instances.delete(id);
    this.emit('instance:destroyed', { id });
  }

  async drainInstance(instance) {
    // Wait for current tasks to complete (up to 30 seconds)
    const timeout = 30000;
    const start = Date.now();

    while (instance.queueDepth > 0 && Date.now() - start < timeout) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  getLeastBusyInstances(count) {
    const instances = Array.from(this.instances.values())
      .filter((i) => i.status === 'running')
      .sort((a, b) => a.queueDepth + a.cpu - (b.queueDepth + b.cpu));

    return instances.slice(0, count).map((i) => i.id);
  }

  getClusterStats() {
    let totalCPU = 0;
    let totalMemory = 0;
    let totalQueueDepth = 0;
    let totalTasks = 0;

    for (const instance of this.instances.values()) {
      totalCPU += instance.cpu;
      totalMemory += instance.memory;
      totalQueueDepth += instance.queueDepth;
      totalTasks += instance.tasksProcessed;
    }

    const count = this.instances.size || 1;

    return {
      instanceCount: count,
      avgCPU: totalCPU / count,
      avgMemory: totalMemory / count,
      queueDepth: totalQueueDepth,
      totalTasks,
      instances: Array.from(this.instances.values()),
    };
  }

  updateInstanceMetrics(id, metrics) {
    const instance = this.instances.get(id);
    if (instance) {
      Object.assign(instance, metrics);
    }
  }

  getStatus() {
    return {
      instances: this.instances.size,
      min: this.minInstances,
      max: this.maxInstances,
      stats: this.getClusterStats(),
      metrics: this.metrics,
    };
  }
}

/**
 * Load Balancer - Distribute work across instances
 */
export class LoadBalancer extends EventEmitter {
  constructor(strategy = 'round-robin') {
    super();
    this.strategy = strategy;
    this.instances = [];
    this.currentIndex = 0;
    this.weights = new Map();
  }

  addInstance(instance) {
    this.instances.push(instance);
    this.weights.set(instance.id, 1);
  }

  removeInstance(id) {
    this.instances = this.instances.filter((i) => i.id !== id);
    this.weights.delete(id);
  }

  getNextInstance() {
    if (this.instances.length === 0) {
      return null;
    }

    switch (this.strategy) {
      case 'round-robin':
        return this.roundRobin();
      case 'least-connections':
        return this.leastConnections();
      case 'weighted':
        return this.weighted();
      case 'random':
        return this.random();
      default:
        return this.roundRobin();
    }
  }

  roundRobin() {
    const instance = this.instances[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.instances.length;
    return instance;
  }

  leastConnections() {
    return this.instances.reduce((min, instance) =>
      instance.connections < min.connections ? instance : min
    );
  }

  weighted() {
    const totalWeight = Array.from(this.weights.values()).reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;

    for (const instance of this.instances) {
      random -= this.weights.get(instance.id) || 1;
      if (random <= 0) {
        return instance;
      }
    }

    return this.instances[0];
  }

  random() {
    return this.instances[Math.floor(Math.random() * this.instances.length)];
  }

  setWeight(instanceId, weight) {
    this.weights.set(instanceId, weight);
  }
}

/**
 * Resource Quota Manager
 */
export class QuotaManager extends EventEmitter {
  constructor() {
    super();
    this.quotas = new Map();
    this.usage = new Map();
  }

  setQuota(entity, limits) {
    this.quotas.set(entity, {
      cpu: limits.cpu || Infinity,
      memory: limits.memory || Infinity,
      requests: limits.requests || Infinity,
      tokens: limits.tokens || Infinity,
    });
    this.usage.set(entity, {
      cpu: 0,
      memory: 0,
      requests: 0,
      tokens: 0,
    });
  }

  checkQuota(entity, resource, amount) {
    const quota = this.quotas.get(entity);
    const current = this.usage.get(entity);

    if (!quota || !current) {
      return { allowed: true };
    }

    const limit = quota[resource];
    const used = current[resource];

    if (used + amount > limit) {
      return {
        allowed: false,
        reason: `Quota exceeded: ${resource}`,
        limit,
        used,
        requested: amount,
      };
    }

    return { allowed: true };
  }

  consumeQuota(entity, resource, amount) {
    const check = this.checkQuota(entity, resource, amount);

    if (!check.allowed) {
      this.emit('quota:exceeded', { entity, resource, ...check });
      return false;
    }

    const usage = this.usage.get(entity);
    usage[resource] += amount;

    // Check if approaching limit
    const quota = this.quotas.get(entity);
    const ratio = usage[resource] / quota[resource];

    if (ratio > 0.8) {
      this.emit('quota:warning', { entity, resource, ratio });
    }

    return true;
  }

  resetQuota(entity) {
    if (this.usage.has(entity)) {
      this.usage.set(entity, {
        cpu: 0,
        memory: 0,
        requests: 0,
        tokens: 0,
      });
    }
  }

  getStatus(entity) {
    const quota = this.quotas.get(entity);
    const usage = this.usage.get(entity);

    if (!quota || !usage) {
      return null;
    }

    return {
      entity,
      quota,
      usage,
      percentages: {
        cpu: ((usage.cpu / quota.cpu) * 100).toFixed(2),
        memory: ((usage.memory / quota.memory) * 100).toFixed(2),
        requests: ((usage.requests / quota.requests) * 100).toFixed(2),
        tokens: ((usage.tokens / quota.tokens) * 100).toFixed(2),
      },
    };
  }
}

/**
 * Cost Optimizer - Minimize resource costs
 */
export class CostOptimizer extends EventEmitter {
  constructor() {
    super();
    this.pricing = {
      cpuPerHour: 0.05,
      memoryPerGBHour: 0.01,
      requestPer1K: 0.1,
    };
    this.spotInstances = false;
    this.savings = 0;
  }

  calculateCost(usage) {
    const cpuCost = (usage.cpu / 100) * this.pricing.cpuPerHour * usage.hours;
    const memoryCost = (usage.memory / 1024) * this.pricing.memoryPerGBHour * usage.hours;
    const requestCost = (usage.requests / 1000) * this.pricing.requestPer1K;

    return {
      cpu: cpuCost,
      memory: memoryCost,
      requests: requestCost,
      total: cpuCost + memoryCost + requestCost,
    };
  }

  optimize(instances) {
    const recommendations = [];

    // Find underutilized instances
    for (const instance of instances) {
      if (instance.cpu < 20 && instance.memory < 30) {
        recommendations.push({
          type: 'consolidate',
          instance: instance.id,
          reason: 'Underutilized (< 20% CPU, < 30% memory)',
          savings: '20-30%',
        });
      }
    }

    // Find over-provisioned instances
    const highCPU = instances.filter((i) => i.cpu > 90);
    if (highCPU.length > instances.length * 0.8) {
      recommendations.push({
        type: 'scale-up',
        reason: 'High CPU utilization across cluster',
        action: 'Add more instances or upgrade instance size',
      });
    }

    return recommendations;
  }

  getSavingsReport() {
    return {
      totalSavings: this.savings,
      recommendations: this.optimize([]),
      pricing: this.pricing,
    };
  }
}

export default {
  AutoScaler,
  LoadBalancer,
  QuotaManager,
  CostOptimizer,
};
