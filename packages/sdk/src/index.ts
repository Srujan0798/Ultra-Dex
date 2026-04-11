import { Agent } from './agent.js';

/**
 * @ultra-dex/sdk — Programmatic API for Ultra-Dex
 *
 * Usage:
 *   import { UltraDex, Agent, BaseProvider } from '@ultra-dex/sdk';
 *
 *   const dex = new UltraDex({ defaultProvider: 'nvidia' });
 *   const result = await dex.run({ agent: 'planner', task: 'Design an API' });
 */

// Core SDK entry point
export { UltraDex } from './client.js';
export { UltraDex as default } from './client.js';

// Agent system
export { Agent } from './agent.js';

// Provider abstraction
export { BaseProvider, assertProviderContract } from './provider.js';

// Plugin system
export { PluginLoader } from './plugin.js';

// Smart Router
export { SmartRouter, ProviderStats, CircuitBreaker } from './router.js';

// Middleware pipeline
export {
  MiddlewarePipeline,
  loggingMiddleware,
  retryMiddleware,
  cacheMiddleware,
  rateLimitMiddleware,
} from './middleware.js';

// Runtime / distributed execution
export {
  DistributedCoordinator,
  ExecutionEngine,
  ObservabilitySystem,
  Orchestrator,
} from './runtime.js';

// ---------------------------------------------------------------------------
// Type exports for consumers
// ---------------------------------------------------------------------------

export interface Task {
  agent: string;
  task: string;
  provider?: string;
  memory?: boolean;
  trace?: boolean;
}

export interface ExecutionResult {
  run_id: string;
  results: unknown;
  duration: number;
  trace?: unknown;
  distributed: boolean;
}

export interface Provider {
  name: string;
  chat(messages: unknown[], opts?: Record<string, unknown>): Promise<unknown>;
  stream(messages: unknown[], opts?: Record<string, unknown>): AsyncGenerator<unknown>;
  embed(text: string, opts?: Record<string, unknown>): Promise<number[]>;
}

export interface AgentDescription {
  id: string;
  role: string;
  capabilities: string[];
}

export interface MemoryConfig {
  backend?: 'redis' | 'file';
  redisUrl?: string;
  ttl?: number;
}

export interface GovernancePolicy {
  allowedProviders: string[];
  maxTokens: number;
  maxCostUsd: number;
  requireApproval: boolean;
}

export interface Memory {
  backend: 'redis' | 'file';
  config?: Record<string, unknown>;
}

export interface ExecutionTrace {
  run_id: string;
  duration?: number;
  steps?: unknown[];
  metadata?: Record<string, unknown>;
}

export function createProvider(
  name: string,
  config: Record<string, unknown> = {}
): Provider & { config: Record<string, unknown> } {
  return {
    name,
    config,
    async chat(messages: unknown[], opts: Record<string, unknown> = {}) {
      return { messages, opts, provider: name };
    },
    async *stream(messages: unknown[], opts: Record<string, unknown> = {}) {
      yield { messages, opts, provider: name };
    },
    async embed(text: string) {
      return [text.length];
    },
  };
}

export function createAgent(
  role: string,
  config: { id?: string; capabilities?: string[]; description?: string } = {}
): Agent {
  const AgentCtor: any = Agent;
  return new AgentCtor({
    id: config.id || role,
    name: role,
    description: config.description || '',
    capabilities: config.capabilities || [],
  }) as Agent;
}

export function createMemory(config: MemoryConfig = {}): Memory {
  return {
    backend: config.backend || 'file',
    config: {
      redisUrl: config.redisUrl,
      ttl: config.ttl,
    },
  };
}
