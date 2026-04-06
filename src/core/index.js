// Copyright (c) 2026 Ultra-Dex
/**
 * Ultra-Dex Meta-Layer (v6.2.0)
 * The unified entry point for autonomous AI orchestration.
 *
 * Exports ALL core infrastructure modules for use by agents, APIs, and dashboards.
 */

// ── Original Core ───────────────────────────────────────────────────────
import { aiMetaLayer } from './ai/ai-meta-layer.js';
import { agentOrchestrator } from './orchestration/index.js';
import { ppmManager } from './memory/index.js';

import { HealthService, HealthCheck } from './system/health-service.js';
import { PluginManager, Plugin } from './infrastructure/plugin-manager.js';

// ── Compatibility Fallbacks ─────────────────────────────────────────────
// Legacy infrastructure modules without full implementations yet.
// These are minimal no-op shims until the real modules are implemented.
class NoopSubsystem {
  constructor(config = {}) {
    this.config = config;
  }

  getStats() {
    return null;
  }

  getDashboard() {
    return null;
  }

  async stop() {}
}

class StreamPipeline extends NoopSubsystem {}
class StreamTransform {}
class StreamBuffer {}
class WebhookManager extends NoopSubsystem {}
class WebhookEndpoint {}
class WebhookDelivery {}
class RateLimiter extends NoopSubsystem {}
class SlidingWindow {}
class TokenBucket {}
class CircuitBreaker {}
class CircuitBreakerRegistry {
  getDashboard() {
    return { breakers: 0 };
  }
}
class ProviderFallback extends NoopSubsystem {}
class QueueProcessor extends NoopSubsystem {}
class Job {}

// ── Ultra-Dex Meta-Layer ────────────────────────────────────────────────
class UltraDexMetaLayer {
  constructor() {
    this.brain = agentOrchestrator;
    this.memory = ppmManager;
    this.ai = aiMetaLayer;
    this.version = '6.1.0';

    // Infrastructure singletons
    this.streaming = null;
    this.webhooks = null;
    this.plugins = null;
    this.rateLimiter = null;
    this.circuitBreakers = new CircuitBreakerRegistry();
    this.providerFallback = null;
    this.queue = null;
    this.health = new HealthService({ appName: 'ultra-dex', version: this.version });
  }

  async initialize(config = {}) {
    logger.log(`🌌 Initializing Ultra-Dex Meta-Layer v${this.version}...`);

    // Core systems
    await this.memory.init();
    await this.brain.initialize();

    // Infrastructure (created on demand with config)
    this.streaming = new StreamPipeline(config.streaming);
    this.webhooks = new WebhookManager(config.webhooks);
    this.plugins = new PluginManager(config.plugins);
    this.rateLimiter = new RateLimiter(config.rateLimiting);
    this.providerFallback = new ProviderFallback(config.providerFallback);
    this.queue = new QueueProcessor(config.queue);

    // Health checks
    this.health.addCheck({
      name: 'memory',
      check: async () => this.memory.stats(),
      critical: true,
    });
    this.health.addCheck({
      name: 'orchestrator',
      check: async () => this.brain.getMetrics(),
      critical: true,
    });

    this.health.start();

    logger.log('✅ Ultra-Dex Meta-Layer initialized');
    return this;
  }

  async process(objective, options = {}) {
    return await this.brain.executeNexus(objective, options);
  }

  getStatus() {
    return {
      version: this.version,
      memory: this.memory.stats(),
      orchestrator: this.brain.getMetrics(),
      infrastructure: {
        streaming: this.streaming?.getStats?.() || null,
        webhooks: this.webhooks?.getDashboard?.() || null,
        plugins: this.plugins?.getDashboard?.() || null,
        rateLimiter: this.rateLimiter?.getDashboard?.() || null,
        circuitBreakers: this.circuitBreakers.getDashboard(),
        providerFallback: this.providerFallback?.getDashboard?.() || null,
        queue: this.queue?.getDashboard?.() || null,
        health: this.health.getDashboard(),
      },
      timestamp: new Date().toISOString(),
    };
  }

  async shutdown() {
    logger.log('🛑 Shutting down Ultra-Dex...');
    this.health.stop();
    if (this.streaming) this.streaming.stop?.();
    if (this.queue) await this.queue.stop();
    if (this.plugins) {
      for (const name of this.plugins.plugins?.keys?.() || []) {
        await this.plugins.unload?.(name);
      }
    }
    logger.log('👋 Ultra-Dex shut down complete');
  }
}

export const ultraDex = new UltraDexMetaLayer();
export default ultraDex;
export { UltraDexMetaLayer };

// ── Named Exports ───────────────────────────────────────────────────────
// Core
export { aiMetaLayer, agentOrchestrator, ppmManager };

// Sprint 8: Infrastructure
export { StreamPipeline, StreamTransform, StreamBuffer };
export { WebhookManager, WebhookEndpoint, WebhookDelivery };
export { PluginManager, Plugin };
export { RateLimiter, SlidingWindow, TokenBucket };

// Sprint 9: Production-Critical
export { CircuitBreaker, CircuitBreakerRegistry };
export { ProviderFallback };
export { QueueProcessor, Job };
export { HealthService, HealthCheck };
