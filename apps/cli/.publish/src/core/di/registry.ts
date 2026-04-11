import { container } from './container.js';
import { DI_TOKENS } from './tokens.js';
import { MemoryManager } from '../memory/manager.js';
import { UnifiedMemory } from '../memory/unified-api.js';
import { VectorStore } from '../memory/vector-store.js';
import { GraphEngine } from '../memory/graph-engine.js';
import { TieredStorage } from '../memory/tiered-storage.js';
import { UltraMemory } from '../memory/ultra-memory.js';
import { PredictiveEngine } from '../memory/predictive-engine.js';
import { ContextCache } from '../memory/context-cache.js';
import { Orchestrator as AgentOrchestrator } from '../orchestration/orchestrator.js';
import { ExecutionEngine } from '../orchestration/execution-engine.js';
import { Planner as TaskPlanner } from '../orchestration/planner.js';
import { TaskRouter } from '../orchestration/task-router.js';
import { AgentRegistry } from '../orchestration/registry.js';
import { AgentStateMachine as AgentStateManager } from '../orchestration/agent-state.js';
import { AgentCommunicationBus as CommunicationBus } from '../orchestration/communication-bus.js';
import { DistributedCoordinator } from '../orchestration/distributed-coordinator.js';
import { Scheduler as TaskScheduler } from '../orchestration/scheduler.js';
import { UltraDexCore } from '../orchestration/ultra-dex-core.js';
import { PluginManager } from '../infrastructure/plugin-manager.js';
import { ProviderFallback } from '../infrastructure/provider-fallback.js';
import { QueueProcessor } from '../infrastructure/queue-processor.js';
import { RateLimiter } from '../infrastructure/rate-limiter.js';
import { StreamPipeline } from '../infrastructure/stream-pipeline.js';
import { WebhookManager } from '../infrastructure/webhook-manager.js';
import { RedisAdapter } from '../mesh/redis-adapter.js';
import { KafkaAdapter } from '../mesh/kafka-adapter.js';
import { WorkerPool } from '../mesh/worker-pool.js';
import { LoadBalancer } from '../mesh/load-balancer.js';
class DIRegistry {
  static registerAll() {
    console.log('[DIRegistry] Registering Diamond State services...');
    container.registerSingleton(DI_TOKENS.MemoryManager, () => new MemoryManager());
    container.registerSingleton(DI_TOKENS.UnifiedMemory, () => new UnifiedMemory());
    container.registerSingleton(DI_TOKENS.VectorStore, () => new VectorStore());
    container.registerSingleton(DI_TOKENS.GraphEngine, () => new GraphEngine());
    container.registerSingleton(DI_TOKENS.TieredStorage, () => new TieredStorage());
    container.registerSingleton(DI_TOKENS.UltraMemory, () => new UltraMemory());
    container.registerSingleton(DI_TOKENS.PredictiveEngine, () => new PredictiveEngine());
    container.registerSingleton(DI_TOKENS.ContextCache, () => new ContextCache());
    container.registerSingleton(DI_TOKENS.AgentOrchestrator, () => new AgentOrchestrator());
    container.registerSingleton(DI_TOKENS.ExecutionEngine, () => new ExecutionEngine());
    container.registerSingleton(DI_TOKENS.TaskPlanner, () => new TaskPlanner());
    container.registerSingleton(DI_TOKENS.TaskRouter, () => new TaskRouter());
    container.registerSingleton(DI_TOKENS.AgentRegistry, () => new AgentRegistry());
    container.registerSingleton(DI_TOKENS.AgentStateManager, () => new AgentStateManager());
    container.registerSingleton(DI_TOKENS.CommunicationBus, () => new CommunicationBus());
    container.registerSingleton(
      DI_TOKENS.DistributedCoordinator,
      () => new DistributedCoordinator()
    );
    container.registerSingleton(DI_TOKENS.TaskScheduler, () => new TaskScheduler());
    container.registerSingleton(DI_TOKENS.UltraDexCore, () => new UltraDexCore());
    container.registerSingleton(DI_TOKENS.PluginManager, () => new PluginManager());
    container.registerSingleton(DI_TOKENS.ProviderFallback, () => new ProviderFallback());
    container.registerSingleton(DI_TOKENS.QueueProcessor, () => new QueueProcessor());
    container.registerSingleton(DI_TOKENS.RateLimiter, () => new RateLimiter());
    container.registerSingleton(DI_TOKENS.StreamPipeline, () => new StreamPipeline());
    container.registerSingleton(DI_TOKENS.WebhookManager, () => new WebhookManager());
    container.registerSingleton(DI_TOKENS.RedisAdapter, () => new RedisAdapter());
    container.registerSingleton(DI_TOKENS.KafkaAdapter, () => new KafkaAdapter());
    container.registerSingleton(DI_TOKENS.WorkerPool, () => new WorkerPool());
    container.registerSingleton(DI_TOKENS.LoadBalancer, () => new LoadBalancer());
    console.log('[DIRegistry] Registration complete');
  }
  static getServiceStatus() {
    return {
      Logger: container.isRegistered(DI_TOKENS.Logger),
      ConfigService: container.isRegistered(DI_TOKENS.ConfigService),
      AlertManager: container.isRegistered(DI_TOKENS.AlertManager),
      TelemetryService: container.isRegistered(DI_TOKENS.TelemetryService),
      EmbeddingModel: container.isRegistered(DI_TOKENS.EmbeddingModel),
      SemanticRouter: container.isRegistered(DI_TOKENS.SemanticRouter),
      MemoryManager: container.isRegistered(DI_TOKENS.MemoryManager),
      AgentOrchestrator: container.isRegistered(DI_TOKENS.AgentOrchestrator),
      ExecutionEngine: container.isRegistered(DI_TOKENS.ExecutionEngine),
      AIMetaLayer: container.isRegistered(DI_TOKENS.AIMetaLayer),
      ModelRouter: container.isRegistered(DI_TOKENS.ModelRouter),
      SmartAIRouter: container.isRegistered(DI_TOKENS.SmartAIRouter),
      ProviderRegistry: container.isRegistered(DI_TOKENS.ProviderRegistry),
      EvaluationLoop: container.isRegistered(DI_TOKENS.EvaluationLoop),
      AgentRegistry: container.isRegistered(DI_TOKENS.AgentRegistry),
      RedisAdapter: container.isRegistered(DI_TOKENS.RedisAdapter),
      KafkaAdapter: container.isRegistered(DI_TOKENS.KafkaAdapter),
      WorkerPool: container.isRegistered(DI_TOKENS.WorkerPool),
      LoadBalancer: container.isRegistered(DI_TOKENS.LoadBalancer),
    };
  }
}
export { DIRegistry };
