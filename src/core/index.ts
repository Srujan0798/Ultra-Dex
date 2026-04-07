import { aiMetaLayer } from './ai/ai-meta-layer.js';
import { smartRouter } from './ai/router.js';
import { AgentOrchestrator, agentOrchestrator } from './orchestration/index.js';
import { ppmManager } from './memory/index.js';
import { HealthService, HealthCheck } from './system/health-service.js';
import { PluginManager, Plugin } from './infrastructure/plugin-manager.js';
import { StreamPipeline, StreamTransform, StreamBuffer } from './infrastructure/stream-pipeline.js';
import { RateLimiter, SlidingWindow, TokenBucket } from './infrastructure/rate-limiter.js';
import {
  CircuitBreaker,
  CircuitBreakerRegistry,
  ProviderFallback
} from './infrastructure/provider-fallback.js';
import { QueueProcessor, Job } from './infrastructure/queue-processor.js';
import {
  WebhookManager,
  WebhookEndpoint,
  WebhookDelivery
} from './infrastructure/webhook-manager.js';
import { logger } from './utils/logging.js';
import { enterpriseAnalytics } from './analytics/enterprise-analytics.js';
import {
  registerSingleton,
  resolveFromContainer
} from './di/container.js';
import { DI_TOKENS } from './di/tokens.js';
class UltraDexMetaLayer {
  constructor(options = {}) {
    this.brain = options.orchestrator || agentOrchestrator;
    this.memory = options.memory || ppmManager;
    this.ai = options.ai || aiMetaLayer;
    this.telemetry = options.telemetry || enterpriseAnalytics;
    this.version = options.version || "2.1.0";
    this.streaming = null;
    this.webhooks = null;
    this.plugins = null;
    this.rateLimiter = null;
    this.circuitBreakers = new CircuitBreakerRegistry();
    this.providerFallback = null;
    this.queue = null;
    this.health = new HealthService({ appName: "ultra-dex", version: this.version });
    this.eventSubscriptions = [];
  }
  async initialize(config = {}) {
    logger.info(`Initializing Ultra-Dex Meta-Layer v${this.version}...`);
    await this.memory.init();
    await this.brain.initialize();
    this.streaming = new StreamPipeline(config.streaming);
    this.webhooks = new WebhookManager(config.webhooks);
    this.plugins = new PluginManager(config.plugins);
    this.rateLimiter = new RateLimiter(config.rateLimiting);
    this.queue = new QueueProcessor(config.queue);
    this.providerFallback = new ProviderFallback({
      circuitBreakers: this.circuitBreakers,
      ...config.providerFallback || {}
    });
    this.circuitBreakers = this.providerFallback.registry;
    this.ai.setStreamPipeline?.(this.streaming);
    this.ai.setRateLimiter?.(this.rateLimiter);
    smartRouter.setProviderFallback?.(this.providerFallback);
    this.brain.setQueueProcessor?.(this.queue);
    await this.attachWebhookRelays();
    this.health.addCheck({
      name: "memory",
      check: async () => this.memory.stats(),
      critical: true
    });
    this.health.addCheck({
      name: "orchestrator",
      check: async () => this.brain.getMetrics(),
      critical: true
    });
    this.health.start();
    logger.info("Ultra-Dex Meta-Layer initialized");
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
        health: this.health.getDashboard()
      },
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  clearEventSubscriptions() {
    for (const { emitter, eventName, handler } of this.eventSubscriptions) {
      emitter.off?.(eventName, handler);
    }
    this.eventSubscriptions = [];
  }
  subscribeToWebhookEvent(emitter, eventName, targetEvent = null) {
    if (!this.webhooks?.deliver || !emitter?.on) {
      return;
    }
    const normalizedEvent = targetEvent || eventName.replace(/[:/]/g, ".").replace(/-+/g, ".");
    const handler = (payload) => {
      void this.webhooks.deliver(normalizedEvent, {
        ...payload,
        sourceEvent: eventName
      }).catch((error) => {
        logger.warn("Webhook delivery relay failed", {
          eventName: normalizedEvent,
          error: error instanceof Error ? error.message : String(error)
        });
      });
    };
    emitter.on(eventName, handler);
    this.eventSubscriptions.push({ emitter, eventName, handler });
  }
  async attachWebhookRelays() {
    this.clearEventSubscriptions();
    this.subscribeToWebhookEvent(this.brain, "task:start", "task.start");
    this.subscribeToWebhookEvent(this.brain, "task:queued", "task.queued");
    this.subscribeToWebhookEvent(this.brain, "task:complete", "task.complete");
    this.subscribeToWebhookEvent(this.brain, "task:error", "task.error");
    this.subscribeToWebhookEvent(this.brain, "task:autopsy", "task.autopsy");
    this.subscribeToWebhookEvent(this.brain, "task:autopsy:error", "task.autopsy.error");
    const selfHealing = await this.brain.getSelfHealing?.();
    if (selfHealing?.on) {
      this.subscribeToWebhookEvent(selfHealing, "agent-error", "agent.error");
      this.subscribeToWebhookEvent(selfHealing, "agent-recovery", "agent.recovery");
    }
  }
  async shutdown() {
    logger.info("Shutting down Ultra-Dex...");
    this.health.stop();
    this.clearEventSubscriptions();
    if (this.streaming)
      this.streaming.stop?.();
    if (this.webhooks)
      await this.webhooks.stop?.();
    if (this.queue)
      await this.queue.stop();
    if (this.plugins) {
      for (const name of this.plugins.plugins?.keys?.() || []) {
        await this.plugins.unload?.(name);
      }
    }
    logger.info("Ultra-Dex shut down complete");
  }
}
async function initializeDiamondState(config = {}) {
  return await ultraDex.initialize(config);
}
registerSingleton(
  UltraDexMetaLayer,
  (scopedContainer) => new UltraDexMetaLayer({
    orchestrator: scopedContainer.resolve(AgentOrchestrator),
    memory: scopedContainer.resolve(DI_TOKENS.memoryManager),
    ai: scopedContainer.resolve(DI_TOKENS.aiMetaLayer),
    telemetry: scopedContainer.resolve(DI_TOKENS.telemetryService)
  })
);
const ultraDex = resolveFromContainer(UltraDexMetaLayer);
var core_default = ultraDex;
import { AlertManager } from './monitoring/alert-manager.js';
export {
  AlertManager,
  CircuitBreaker,
  CircuitBreakerRegistry,
  DI_TOKENS,
  HealthCheck,
  HealthService,
  Job,
  Plugin,
  PluginManager,
  ProviderFallback,
  QueueProcessor,
  RateLimiter,
  smartRouter as SemanticRouter,
  SlidingWindow,
  StreamBuffer,
  StreamPipeline,
  StreamTransform,
  TokenBucket,
  UltraDexMetaLayer,
  WebhookDelivery,
  WebhookEndpoint,
  WebhookManager,
  agentOrchestrator,
  aiMetaLayer,
  core_default as default,
  initializeDiamondState,
  ppmManager,
  ultraDex
};
