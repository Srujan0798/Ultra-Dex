const DI_TOKENS = {
  // Orchestration
  AgentOrchestrator: Symbol("AgentOrchestrator"),
  ExecutionEngine: Symbol("ExecutionEngine"),
  TaskPlanner: Symbol("TaskPlanner"),
  TaskRouter: Symbol("TaskRouter"),
  AgentRegistry: Symbol("AgentRegistry"),
  AgentStateManager: Symbol("AgentStateManager"),
  CommunicationBus: Symbol("CommunicationBus"),
  DistributedCoordinator: Symbol("DistributedCoordinator"),
  TaskScheduler: Symbol("TaskScheduler"),
  UltraDexCore: Symbol("UltraDexCore"),
  // Memory & AI
  MemoryManager: Symbol("MemoryManager"),
  UnifiedMemory: Symbol("UnifiedMemory"),
  VectorStore: Symbol("VectorStore"),
  GraphEngine: Symbol("GraphEngine"),
  TieredStorage: Symbol("TieredStorage"),
  UltraMemory: Symbol("UltraMemory"),
  ContextManager: Symbol("ContextManager"),
  AIMetaLayer: Symbol("AIMetaLayer"),
  EmbeddingModel: Symbol("EmbeddingModel"),
  // Routing
  SemanticRouter: Symbol("SemanticRouter"),
  CapabilityRouter: Symbol("CapabilityRouter"),
  HybridRouter: Symbol("HybridRouter"),
  // Infrastructure
  Logger: Symbol("Logger"),
  ConfigService: Symbol("ConfigService"),
  TelemetryService: Symbol("TelemetryService"),
  AlertManager: Symbol("AlertManager"),
  // Predictive
  PredictiveEngine: Symbol("PredictiveEngine"),
  ContextCache: Symbol("ContextCache"),
  RedisCache: Symbol("RedisCache"),
  // AI Layer
  ModelRouter: Symbol("ModelRouter"),
  SmartAIRouter: Symbol("SmartAIRouter"),
  ProviderRegistry: Symbol("ProviderRegistry"),
  EvaluationLoop: Symbol("EvaluationLoop"),
  RouterConfig: Symbol("RouterConfig"),
  // Legacy Compatibility
  memoryManager: "IMemoryManager",
  agentRegistry: "IAgentRegistry",
  aiMetaLayer: "IAIMetaLayer",
  executionEngine: "IExecutionEngine",
  telemetryService: "ITelemetryService",
  systemMonitor: "ISystemMonitor"
};
export {
  DI_TOKENS
};
