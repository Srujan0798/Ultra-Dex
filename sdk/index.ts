/**
 * Ultra-Dex SDK — Developer API
 *
 * The public API surface for external integrations.
 * Import from here to use Ultra-Dex programmatically.
 *
 * @example
 * ```typescript
 * import { ExecutionEngine, MockAdapter, createEventBus } from 'ultra-dex/sdk';
 *
 * const engine = new ExecutionEngine(new MockAdapter());
 * engine.events.on('task.completed', e => console.log(e.taskId, 'done'));
 * const result = await engine.run('./workflow.dex');
 * ```
 */

// ── DexGraph core ──────────────────────────────────────────────────────────────
export { parse } from '../dexgraph/parser.js';
export { DexGraph } from '../dexgraph/graph.js';
export { StateMachine } from '../dexgraph/stateMachine.js';
export { Scheduler } from '../dexgraph/scheduler.js';
export { Dispatcher } from '../dexgraph/dispatcher.js';
export { ContextInjector } from '../dexgraph/contextInjector.js';
export { createVerifier } from '../dexgraph/verifier.js';
export { runNodeChecks } from '../dexgraph/checkers.js';

// ── Types ─────────────────────────────────────────────────────────────────────
export type {
  WorkflowDefinition,
  TaskDefinition,
  GraphNode,
  NodeState,
  GraphEdge,
  DexGraphResult,
  VerificationRule,
} from '../dexgraph/types.js';

export type {
  ExecutionAdapter,
  ExecutionContext,
  ExecutionResult,
} from '../adapters/executionAdapter.js';

export type {
  SchedulerConfig,
  SchedulerResult,
  SchedulerStatus,
} from '../dexgraph/scheduler.js';

export type {
  VerificationResult,
  Verifier,
} from '../dexgraph/verifier.js';

// ── Adapters ──────────────────────────────────────────────────────────────────
export { MockAdapter, OpenAIAdapter, AnthropicAdapter, ResultValidator } from '../adapters/index.js';
export type { OpenAIAdapterConfig, AnthropicAdapterConfig } from '../adapters/index.js';

// ── Memory ────────────────────────────────────────────────────────────────────
export { WorkflowStore } from '../memory/workflowStore.js';
export { ContextCollector } from '../memory/contextCollector.js';
export type {
  WorkflowMemory,
  WorkflowStoreConfig,
} from '../memory/workflowStore.js';

// ── Governance ────────────────────────────────────────────────────────────────
export { GovernanceManager, ExecutionBlockedError } from '../governance/governance-manager.js';
export { RuleEngine, RequireTests, RequireApproval, CostBudget, ConfidenceThreshold } from '../governance/rules.js';
export type { Rule } from '../governance/types.js';

// ── Events ────────────────────────────────────────────────────────────────────
export { EventBus, createEventBus, getGlobalEventBus } from '../core/events.js';
export type {
  UltraDexEvent,
  UltraDexEventType,
  WorkflowStartedEvent,
  TaskStartedEvent,
  TaskCompletedEvent,
  TaskFailedEvent,
  TaskRetryEvent,
  TaskBlockedEvent,
  WorkflowCompletedEvent,
  StateTransitionEvent,
} from '../core/events.js';

// ── Observability ─────────────────────────────────────────────────────────────
export { EventEmitter, createEvent } from '../observability/eventEmitter.js';
export type { EventType, DexEvent } from '../observability/eventEmitter.js';

// ── Runtime ───────────────────────────────────────────────────────────────────
export { ExecutionEngine } from '../runtime/execution_engine/index.js';
export type { EngineConfig, EngineRunResult } from '../runtime/execution_engine/index.js';
export { Executor } from '../runtime/executor/index.js';
export { Worker, createWorkerPool } from '../runtime/worker/index.js';

// ── Tools ─────────────────────────────────────────────────────────────────────
export { ToolRegistry, getGlobalToolRegistry } from '../tools/registry/index.js';
export type { ToolSchema, ToolResult } from '../tools/registry/index.js';

// ── Security ──────────────────────────────────────────────────────────────────
export {
  RBAC,
  PolicyEngine,
  AuthorizationError,
  EncryptionService,
  TokenService,
  SecretManager,
  createUser,
  createResource,
  sanitizeInput,
  generateId,
} from '../security/index.js';

export type {
  Role,
  Permission,
  User,
  Resource,
  AccessRequest,
} from '../security/index.js';

// ── Cache ─────────────────────────────────────────────────────────────────────
export {
  LRUCache,
  NamespacedCache,
  MultiLevelCache,
} from '../cache/index.js';

export type {
  LRUCacheOptions,
} from '../cache/index.js';

// ── Errors ────────────────────────────────────────────────────────────────────
export {
  DexGraphError,
  ErrorBuilder,
  ErrorReporter,
  ErrorCategory,
  ErrorSeverity,
} from '../dexgraph/errors.js';
