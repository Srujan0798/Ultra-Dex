// @ultra-dex/dexgraph
// Deterministic workflow orchestration with DAG-based task graphs

export {
  WorkflowDefinition,
  TaskDefinition,
  VerificationRule,
  GraphNode,
  GraphEdge,
  DexGraphResult,
  NodeState,
} from './types.js';

export { parse, loadYAML, resolveTemplates, ParseError, GraphError, StateError } from './parser.js';
export { validateWorkflow, ValidationResult } from './schema.js';
export { DexGraph } from './graph.js';
export { Scheduler, Dispatcher, SchedulerConfig, SchedulerStatus, SchedulerResult } from './scheduler.js';
export { StateMachine, StateTransition, TRANSITIONS } from './stateMachine.js';
export { Dispatcher as TaskDispatcher, DispatcherConfig, DispatchedTask, Verifier } from './dispatcher.js';
export { createVerifier, VerificationResult } from './verifier.js';
export {
  CheckResult,
  checkExecutionSuccess,
  checkOutputExists,
  checkOutputField,
  checkFileExists,
  checkTestsPassed,
  checkConfidence,
  checkDuration,
  CompositeCheckResult,
  runNodeChecks,
} from './checkers.js';
export { ContextInjector } from './contextInjector.js';
export {
  ErrorCategory,
  ErrorSeverity,
  ErrorPosition,
  DexGraphErrorDetails,
  DexGraphError,
  SyntaxError,
  SchemaError,
  DependencyError,
  CycleError,
  ValidationError,
  RuntimeError,
  ConfigError,
  ErrorBuilder,
  AggregateError,
  ErrorReporter,
  errors,
} from './errors.js';
export { DexLogContext, DexLogger, createDexLogger, nullLogger } from './logger.js';

// Standalone engine interfaces & utilities
export {
  ExecutionAdapter,
  ExecutionContext,
  ExecutionResult,
  Cost,
  ResultValidator,
} from './executionAdapter.js';
export {
  WorkflowStore,
  WorkflowMemory,
  ExecutionHistory,
  WorkflowStoreConfig,
} from './workflowStore.js';
export { ContextCollector } from './contextCollector.js';
export {
  GovernanceManager,
  ExecutionBlockedError,
  Rule,
  Decision,
} from './governance.js';
export {
  EventEmitter,
  createEvent,
  DexEvent,
  EventType,
  EventHandler,
} from './observability.js';

export { UltraDexAdapter } from './adapters/ultraDexAdapter.js';
