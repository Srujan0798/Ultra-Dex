export type AgentMemoryValue = unknown;

export interface UltraDexConfig {
  apiKey?: string;
  baseUrl?: string;
  defaultProvider?: string;
  timeoutMs?: number;
}

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

export class UltraDex {
  constructor(config?: UltraDexConfig);
  registerProvider(name: string, provider: ProviderContract): this;
  getProvider(name: string): ProviderContract | undefined;
  listProviders(): string[];

  registerAgent(agent: Agent): this;
  getAgent(id: string): Agent | undefined;
  listAgents(): AgentDescriptor[];

  use(plugin: PluginDefinition): this;

  chat(messages: ChatMessage[], opts?: ChatOptions): Promise<ChatResponse>;
  stream(messages: ChatMessage[], opts?: ChatOptions): AsyncIterable<StreamChunk>;
  embed(text: string, opts?: ChatOptions): Promise<EmbeddingResponse>;
  runAgent(agentId: string, task: unknown, context?: Record<string, unknown>): Promise<{
    agentId: string;
    status: 'completed';
    result: unknown;
    timestamp: string;
  }>;
}
