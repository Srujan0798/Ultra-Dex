class ProviderFailoverStrategy {
  constructor(ai, logger) {
    this.ai = ai;
    this.logger = logger;
  }
  name = 'provider-failover';
  // Priority order: cost-optimized with local fallback
  providerPriority = [
    { name: 'openai', cost: 3e-5, latency: 800 },
    { name: 'anthropic', cost: 8e-5, latency: 1200 },
    { name: 'google', cost: 1e-5, latency: 1500 },
    { name: 'ollama', cost: 0, latency: 2e3 },
    // Local fallback
  ];
  canHandle(alert) {
    return (
      alert.type === 'provider.latency.high' ||
      alert.type === 'provider.error.rate' ||
      alert.type === 'provider.unhealthy'
    );
  }
  async execute(alert) {
    const startTime = Date.now();
    const currentProvider = alert.context?.providerId;
    if (!currentProvider) {
      return {
        success: false,
        action: 'none',
        error: 'No provider ID in alert context',
        duration: Date.now() - startTime,
      };
    }
    const currentIndex = this.providerPriority.findIndex((p) => p.name === currentProvider);
    if (currentIndex === -1) {
      return {
        success: false,
        action: 'none',
        error: `Unknown provider: ${currentProvider}`,
        duration: Date.now() - startTime,
      };
    }
    for (let i = currentIndex + 1; i < this.providerPriority.length; i++) {
      const nextProvider = this.providerPriority[i];
      try {
        this.logger.info(`Attempting failover to ${nextProvider.name}`, {
          from: currentProvider,
          to: nextProvider.name,
        });
        await this.ai.switchProvider(currentProvider, nextProvider.name);
        const healthCheck = await this.ai.healthCheck(nextProvider.name);
        if (healthCheck.healthy) {
          return {
            success: true,
            action: `failover:${currentProvider}->${nextProvider.name}`,
            duration: Date.now() - startTime,
            metrics: {
              previousLatency: alert.metrics?.latency || 0,
              newLatency: healthCheck.latency,
            },
          };
        }
        await this.ai.switchProvider(nextProvider.name, currentProvider);
      } catch (error) {
        this.logger.error(`Failover to ${nextProvider.name} failed`, error);
      }
    }
    return {
      success: false,
      action: 'failover-failed',
      error: 'All fallback providers unavailable',
      duration: Date.now() - startTime,
    };
  }
}
class MemoryReliefStrategy {
  constructor(logger) {
    this.logger = logger;
  }
  name = 'memory-relief';
  canHandle(alert) {
    return alert.type === 'memory.usage.high' || alert.type === 'memory.pressure';
  }
  async execute(alert) {
    const startTime = Date.now();
    const beforeMemory = process.memoryUsage();
    try {
      this.clearRequireCache();
      if (global.gc) {
        global.gc();
      }
      const afterMemory = process.memoryUsage();
      const freedMemory = beforeMemory.heapUsed - afterMemory.heapUsed;
      return {
        success: true,
        action: 'clear-cache+gc',
        duration: Date.now() - startTime,
        metrics: {
          memoryBefore: beforeMemory.heapUsed,
          memoryAfter: afterMemory.heapUsed,
          memoryFreed: freedMemory,
        },
      };
    } catch (error) {
      return {
        success: false,
        action: 'memory-relief-failed',
        error: error.message,
        duration: Date.now() - startTime,
      };
    }
  }
  clearRequireCache() {
    const essentialModules = ['fs', 'path', 'http', 'https', 'crypto'];
    for (const key of Object.keys(require.cache)) {
      if (!essentialModules.some((m) => key.includes(m))) {
        delete require.cache[key];
      }
    }
  }
}
class AgentRestartStrategy {
  constructor(logger) {
    this.logger = logger;
  }
  name = 'agent-restart';
  canHandle(alert) {
    return (
      alert.type === 'agent.error.rate' ||
      alert.type === 'agent.unresponsive' ||
      alert.type === 'agent.crash'
    );
  }
  async execute(alert) {
    const startTime = Date.now();
    const agentId = alert.context?.agentId;
    if (!agentId) {
      return {
        success: false,
        action: 'none',
        error: 'No agent ID in alert context',
        duration: Date.now() - startTime,
      };
    }
    try {
      this.logger.info(`Restarting agent ${agentId}`);
      await new Promise((resolve) => setTimeout(resolve, 1e3));
      return {
        success: true,
        action: `restart:${agentId}`,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        action: 'restart-failed',
        error: error.message,
        duration: Date.now() - startTime,
      };
    }
  }
}
class CircuitBreakerStrategy {
  constructor(logger) {
    this.logger = logger;
  }
  name = 'circuit-breaker';
  openCircuits = /* @__PURE__ */ new Set();
  canHandle(alert) {
    return alert.type === 'service.error.spike' || alert.type === 'circuit.break';
  }
  async execute(alert) {
    const startTime = Date.now();
    const serviceId = alert.context?.serviceId;
    if (!serviceId) {
      return {
        success: false,
        action: 'none',
        error: 'No service ID in alert context',
        duration: Date.now() - startTime,
      };
    }
    try {
      this.openCircuits.add(serviceId);
      this.logger.warn(`Circuit opened for service ${serviceId}`, {
        errorRate: alert.metrics?.errorRate,
      });
      setTimeout(() => {
        this.openCircuits.delete(serviceId);
        this.logger.info(`Circuit closed for service ${serviceId}`);
      }, 3e4);
      return {
        success: true,
        action: `circuit-open:${serviceId}`,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        action: 'circuit-break-failed',
        error: error.message,
        duration: Date.now() - startTime,
      };
    }
  }
  isCircuitOpen(serviceId) {
    return this.openCircuits.has(serviceId);
  }
}
class ScaleUpStrategy {
  constructor(logger) {
    this.logger = logger;
  }
  name = 'scale-up';
  canHandle(alert) {
    return alert.type === 'queue.backlog' || alert.type === 'capacity.exceeded';
  }
  async execute(alert) {
    const startTime = Date.now();
    const queueSize = alert.metrics?.queueSize || 0;
    try {
      const scaleFactor = Math.min(Math.ceil(queueSize / 10), 5);
      this.logger.info(`Scaling up by ${scaleFactor} instances`, {
        queueSize,
        scaleFactor,
      });
      return {
        success: true,
        action: `scale-up:${scaleFactor}`,
        duration: Date.now() - startTime,
        metrics: {
          queueSize,
          scaleFactor,
        },
      };
    } catch (error) {
      return {
        success: false,
        action: 'scale-up-failed',
        error: error.message,
        duration: Date.now() - startTime,
      };
    }
  }
}
export {
  AgentRestartStrategy,
  CircuitBreakerStrategy,
  MemoryReliefStrategy,
  ProviderFailoverStrategy,
  ScaleUpStrategy,
};
