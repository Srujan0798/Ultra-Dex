/**
 * Ultra-Dex SDK Types
 * TypeScript definitions for the SDK
 */

export interface UltraDexConfig {
  apiKey?: string;
  baseUrl?: string;
  providers?: string[];
  defaultStrategy?: 'cost' | 'latency' | 'quality' | 'fallback';
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  strategy?: string;
  provider?: string;
}

export interface ChatResponse {
  content: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  model: string;
  provider: string;
  latencyMs: number;
}

export interface AgentConfig {
  id: string;
  name?: string;
  description?: string;
  capabilities?: string[];
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  state: 'idle' | 'busy' | 'error';
}

export interface Plugin {
  id: string;
  loaded: boolean;
  version?: string;
}

export interface TaskResult {
  agent: string;
  task: string;
  status: 'completed' | 'failed' | 'in-progress';
  result: any;
  timestamp: string;
}
