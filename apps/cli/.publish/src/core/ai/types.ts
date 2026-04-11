/**
 * AI Provider Types and Interfaces
 * Type definitions for AI abstraction layer
 */

// Provider configuration
export interface ProviderConfig {
  name: string;
  apiKey: string;
  baseUrl?: string;
  defaultModel: string;
  models: ModelDefinition[];
  pricing: PricingConfig;
  capabilities?: ProviderCapabilities;
  failureThreshold?: number;
  resetTimeout?: number;
}

// Model definition
export interface ModelDefinition {
  id: string;
  name: string;
  contextWindow: number;
  maxTokens: number;
  supportsStreaming: boolean;
  supportsFunctionCalling: boolean;
  supportsVision: boolean;
  quality: 'low' | 'medium' | 'high' | 'very-high';
  latency: 'fast' | 'medium' | 'slow';
  costTier: 'free' | 'low' | 'medium' | 'high';
}

// Pricing configuration
export interface PricingConfig {
  [modelId: string]: {
    input: number; // Cost per 1K tokens
    output: number; // Cost per 1K tokens
  };
  default?: {
    input: number;
    output: number;
  };
}

// Provider capabilities
export interface ProviderCapabilities {
  streaming: boolean;
  functionCalling: boolean;
  vision: boolean;
  maxTokens: number;
  jsonMode: boolean;
  systemPrompts: boolean;
}

// Message types
export interface Message {
  role: 'system' | 'user' | 'assistant' | 'function';
  content: string;
  name?: string;
  function_call?: FunctionCall;
}

export interface FunctionCall {
  name: string;
  arguments: string;
}

// Generation options
export interface GenerationOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stream?: boolean;
  stop?: string[];
  timeout?: number;
  retry?: number;
}

// Generation result
export interface GenerationResult {
  content: string;
  model: string;
  provider: string;
  usage: TokenUsage;
  finishReason: 'stop' | 'length' | 'function_call' | 'error';
  latency: number;
  cached?: boolean;
}

// Token usage
export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

// Stream chunk
export interface StreamChunk {
  content: string;
  model: string;
  usage?: Partial<TokenUsage>;
  finishReason?: string;
}

// Routing strategy
export type RoutingStrategy = 'cost' | 'latency' | 'quality' | 'explicit';

export interface RoutingOptions {
  strategy: RoutingStrategy;
  preferredProvider?: string;
  preferredModel?: string;
  minQuality?: 'low' | 'medium' | 'high';
  maxCost?: number;
  maxLatency?: number;
  requireStreaming?: boolean;
  requireVision?: boolean;
  fallbackChain?: string[];
}

// Provider health
export interface ProviderHealth {
  provider: string;
  state: 'healthy' | 'degraded' | 'unhealthy';
  lastCheck: Date;
  avgLatency: number;
  successRate: number;
  errorCount: number;
}

// Circuit breaker state
export interface CircuitBreakerState {
  failures: number;
  lastFailure: number | null;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  threshold: number;
  timeout: number;
}

// Metrics
export interface ProviderMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgResponseTime: number;
  totalTokens: number;
  cacheHits: number;
  cacheMisses: number;
  costEstimate: number;
}

// AI Meta Layer config
export interface AIMetaLayerConfig {
  defaultProvider?: string;
  enableRouting?: boolean;
  enableFallback?: boolean;
  enableCaching?: boolean;
  enableMonitoring?: boolean;
  enableBatching?: boolean;
  cacheExpiry?: number;
  mockMode?: boolean;
  rateLimiter?: RateLimiterConfig;
  streamPipeline?: StreamPipelineConfig;
}

export interface RateLimiterConfig {
  requestsPerSecond: number;
  burstSize: number;
}

export interface StreamPipelineConfig {
  bufferSize: number;
  flushInterval: number;
}

// Batch request
export interface BatchRequest {
  model: string;
  messages: Message[];
  options: GenerationOptions;
  resolve: (value: GenerationResult) => void;
  reject: (reason: Error) => void;
}

// Provider interface (for base provider)
export interface IAIProvider {
  name: string;

  generate(messages: Message[], options: GenerationOptions): Promise<GenerationResult>;
  stream(messages: Message[], options: GenerationOptions): AsyncGenerator<StreamChunk>;
  getModels(): Promise<ModelDefinition[]>;
  calculateCost(usage: TokenUsage, model: string): number;
  isHealthy(): boolean;
  recordSuccess(): void;
  recordFailure(): void;
  validate(): boolean;
  getCapabilities(): ProviderCapabilities;
}
