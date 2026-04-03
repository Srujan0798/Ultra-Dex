// ============================================================================
// Error Classes
// ============================================================================

export class UltraDexError extends Error {
  constructor(
    message: string,
    options?: {
      code?: string;
      cause?: Error;
      details?: Record<string, unknown>;
    }
  );
  code: string;
  cause?: Error;
  details?: Record<string, unknown>;
}

export class ValidationError extends UltraDexError {
  constructor(
    message: string,
    options?: {
      cause?: Error;
      details?: Record<string, unknown>;
    }
  );
}

export class NetworkError extends UltraDexError {
  constructor(
    message: string,
    options?: {
      cause?: Error;
      details?: Record<string, unknown>;
    }
  );
}

export class ProviderError extends UltraDexError {
  constructor(
    message: string,
    provider?: string,
    options?: {
      cause?: Error;
      details?: Record<string, unknown>;
    }
  );
  provider?: string;
}

// ============================================================================
// Core Types
// ============================================================================

export type AgentMemoryValue = unknown;

export interface UltraDexConfig {
  apiKey?: string;
  baseUrl?: string;
  defaultProvider?: string;
  timeoutMs?: number;
  distributedPeers?: string[];
  instanceId?: string;
}

// ============================================================================
// Chat and AI Types
// ============================================================================

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | Record<string, unknown>;
}

export interface ChatOptions {
  provider?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  [key: string]: unknown;
}

export interface ChatResponse {
  content: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens?: number;
    totalCost?: number;
  };
  model: string;
  latencyMs?: number;
}

export interface StreamChunk {
  type: 'text' | 'tool_call' | 'done';
  content?: unknown;
}

export interface EmbeddingResponse {
  embedding: number[];
  dimensions: number;
}

// ============================================================================
// Provider Types
// ============================================================================

export interface ProviderContract {
  chat(messages: ChatMessage[], opts?: ChatOptions): Promise<ChatResponse>;
  stream(messages: ChatMessage[], opts?: ChatOptions): AsyncIterable<StreamChunk>;
  embed(text: string, opts?: Record<string, unknown>): Promise<EmbeddingResponse>;
}

export class BaseProvider implements ProviderContract {
  constructor(config?: Record<string, unknown>);
  config: Record<string, unknown>;
  chat(messages: ChatMessage[], opts?: ChatOptions): Promise<ChatResponse>;
  stream(messages: ChatMessage[], opts?: ChatOptions): AsyncIterable<StreamChunk>;
  embed(text: string, opts?: Record<string, unknown>): Promise<EmbeddingResponse>;
}

// ============================================================================
// Router Types
// ============================================================================

export interface RouterConfig {
  strategy?: 'fastest' | 'cheapest' | 'round-robin' | 'fallback-chain';
  fallbackOrder?: string[];
  budgetLimit?: number;
  costPerToken?: Record<string, number>;
  circuitBreaker?: {
    failureThreshold?: number;
    resetTimeoutMs?: number;
  };
}

export interface ProviderStatsSnapshot {
  p50: number;
  p95: number;
  p99: number;
  avgLatency: number;
  totalTokens: number;
  totalCost: number;
  requestCount: number;
  errorCount: number;
  errorRate: number;
}

export interface ProviderStats {
  recordLatency(ms: number): void;
  recordError(): void;
  recordCost(tokens: number, cost: number): void;
  get p50(): number;
  get p95(): number;
  get p99(): number;
  get avgLatency(): number;
  get errorRate(): number;
  snapshot(): ProviderStatsSnapshot;
}

export interface CircuitBreaker {
  failureThreshold: number;
  resetTimeoutMs: number;
  failures: number;
  state: 'closed' | 'open' | 'half-open';
  lastFailureTime: number;
  get isAvailable(): boolean;
  recordSuccess(): void;
  recordFailure(): void;
}

export interface RouterStats {
  [providerName: string]: ProviderStatsSnapshot & {
    circuitState: string;
  };
}

export interface RoutedResult {
  result: unknown;
  provider: string;
  latencyMs: number;
}

export class SmartRouter {
  constructor(config?: RouterConfig);
  strategy: string;
  fallbackOrder: string[];
  budgetLimit: number;
  costPerToken: Record<string, number>;
  addProvider(name: string, provider: ProviderContract): this;
  removeProvider(name: string): void;
  selectProvider(): string;
  route(method: string, args: unknown[]): Promise<RoutedResult>;
  getStats(providerName: string): ProviderStatsSnapshot | null;
  getAllStats(): RouterStats;
  get totalCost(): number;
  get totalRequests(): number;
}

// ============================================================================
// Middleware Types
// ============================================================================

export interface MiddlewareContext {
  method?: string;
  provider?: string;
  args?: unknown[];
  result?: unknown;
  error?: Error;
  log?: {
    startedAt: string;
    latencyMs?: number;
    success?: boolean;
    tokens?: {
      prompt: number;
      completion: number;
      total: number;
    };
  };
  cached?: boolean;
  attempt?: number;
  [key: string]: unknown;
}

export type MiddlewareFunction = (
  context: MiddlewareContext,
  next: () => Promise<void>
) => Promise<void>;

export interface MiddlewarePipeline {
  use(name: string, fn: MiddlewareFunction): this;
  execute(context: MiddlewareContext): Promise<MiddlewareContext>;
  get length(): number;
  list(): string[];
}

// Built-in middleware functions
export function loggingMiddleware(): MiddlewareFunction;
export function retryMiddleware(options?: {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
}): MiddlewareFunction;
export function cacheMiddleware(options?: { ttlMs?: number; maxSize?: number }): MiddlewareFunction;
export function rateLimitMiddleware(options?: {
  maxRequests?: number;
  windowMs?: number;
}): MiddlewareFunction;

// ============================================================================
// Agent Types
// ============================================================================

export interface AgentDescriptor {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  meta: Record<string, unknown>;
}

export class Agent {
  constructor(options: {
    id: string;
    name?: string;
    description?: string;
    capabilities?: string[];
    meta?: Record<string, unknown>;
  });

  id: string;
  name: string;
  description: string;
  capabilities: string[];
  meta: Record<string, unknown>;

  describe(): AgentDescriptor;
  remember(key: string, value: AgentMemoryValue): this;
  recall(key: string): AgentMemoryValue | undefined;
  clearMemory(): void;
  run(task: unknown, context?: Record<string, unknown>): Promise<unknown>;
}

// ============================================================================
// Plugin Types
// ============================================================================

export interface PluginDefinition {
  id: string;
  version?: string;
  setup?: (loader: PluginLoader) => void;
  hooks?: Record<string, (payload: unknown) => Promise<void> | void>;
}

export class PluginLoader {
  load(plugin: PluginDefinition): PluginDefinition;
  unload(pluginId: string): boolean;
  list(): Array<{ id: string; version: string }>;
  on(event: string, handler: (payload: unknown) => Promise<void> | void): void;
  emit(event: string, payload: unknown): Promise<void>;
}

// ============================================================================
// Execution Types
// ============================================================================

export interface ExecuteOptions {
  provider?: string;
  agents?: string[];
  trace?: boolean;
  mode?: 'simple' | 'detailed' | 'iterative' | 'distributed';
  timeout?: number;
  priority?: number;
  onProgress?: (progress: ExecutionProgress) => void;
}

export interface ExecutionProgress {
  type:
    | 'start'
    | 'step_start'
    | 'step_complete'
    | 'step_error'
    | 'complete'
    | 'error'
    | 'peer_selected'
    | 'fallback_to_local';
  taskId?: string;
  stepId?: string;
  stepIndex?: number;
  totalSteps?: number;
  stepType?: string;
  agent?: string;
  result?: unknown;
  error?: string;
  duration?: number;
  status?: string;
  trace?: unknown;
  distributed?: boolean;
  peerId?: string;
  peers?: number;
}

export interface ExecutionResult {
  run_id: string;
  status: 'completed' | 'failed';
  results?: Record<string, unknown>;
  agents?: string[];
  steps?: string[];
  duration?: number;
  trace?: unknown;
  distributed?: boolean;
  errors?: Array<{ stepId: string; error: string }>;
}

export interface AgentExecutionResult {
  agentId: string;
  status: 'completed';
  result: unknown;
  timestamp: string;
}

// ============================================================================
// Distributed Types
// ============================================================================

export interface DistributedPeer {
  id: string;
  url?: string;
  status: 'connected' | 'disconnected' | 'connecting';
  lastSeen: number;
  capabilities?: string[];
  load?: number;
  configured?: boolean;
}

export interface DistributedCoordinatorConfig {
  instanceId?: string;
  port?: number;
  host?: string;
  discoveryUrls?: string[];
  heartbeatInterval?: number;
  healthCheckInterval?: number;
  loadBalanceThreshold?: number;
  maxConcurrentTasks?: number;
  enableWebSocket?: boolean;
  enableHttpApi?: boolean;
  enableDiscovery?: boolean;
  enableFailover?: boolean;
  enableLoadBalancing?: boolean;
}

export interface DistributedTaskResult {
  taskId: string;
  result: unknown;
  success: boolean;
  trace?: unknown;
}

export class DistributedCoordinator {
  constructor(options?: DistributedCoordinatorConfig);
  instanceId: string;
  status: 'initializing' | 'active' | 'failed' | 'shutting_down' | 'shutdown';
  peers: Map<string, DistributedPeer>;
  initialize(): Promise<this>;
  submitTask(task: unknown, options?: ExecuteOptions): Promise<DistributedTaskResult>;
  addDistributedPeer(peerUrl: string): this;
  removeDistributedPeer(peerUrl: string): this;
  listDistributedPeers(): DistributedPeer[];
  getMetrics(): Record<string, unknown>;
  shutdown(): Promise<void>;
}

// ============================================================================
// Main UltraDex Client
// ============================================================================

export class UltraDex {
  constructor(config?: UltraDexConfig);

  config: UltraDexConfig;
  providers: Map<string, ProviderContract>;
  agents: Map<string, Agent>;
  plugins: PluginLoader;
  router?: SmartRouter;
  middleware: MiddlewarePipeline;
  distributedCoordinator?: DistributedCoordinator;

  // Provider management
  registerProvider(name: string, provider: ProviderContract): this;
  getProvider(name: string): ProviderContract | undefined;
  listProviders(): string[];

  // Agent management
  registerAgent(agent: Agent): this;
  getAgent(id: string): Agent | undefined;
  listAgents(): AgentDescriptor[];

  // Plugin management
  use(plugin: PluginDefinition): this;

  // Router management
  enableRouter(routerConfig?: RouterConfig): this;
  getRouter(): SmartRouter | undefined;
  getRouterStats(): RouterStats;

  // Middleware management
  useMiddleware(name: string, fn: MiddlewareFunction): this;

  // AI operations
  chat(messages: ChatMessage[], opts?: ChatOptions): Promise<ChatResponse>;
  stream(messages: ChatMessage[], opts?: ChatOptions): AsyncIterable<StreamChunk>;
  embed(text: string, opts?: ChatOptions): Promise<EmbeddingResponse>;

  // Agent operations
  runAgent(
    agentId: string,
    task: unknown,
    context?: Record<string, unknown>
  ): Promise<AgentExecutionResult>;

  // Task execution
  execute(task: string, options?: ExecuteOptions): Promise<ExecutionResult>;
  executeStream(task: string, options?: ExecuteOptions): AsyncIterable<ExecutionProgress>;

  // Distributed operations
  addDistributedPeer(peerUrl: string): this;
  removeDistributedPeer(peerUrl: string): this;
  listDistributedPeers(): DistributedPeer[];
}
