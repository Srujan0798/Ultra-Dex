// Copyright (c) 2026 Ultra-Dex
// src/types/index.d.ts

declare module 'ai' {
  // AI SDK types
  export interface LanguageModel {
    readonly defaultObjectGenerationMode: string;
    readonly specificationVersion: string;
    readonly provider: string;
    readonly modelId: string;
  }

  export interface CoreTool {
    parameters: Record<string, unknown>;
  }

  export interface ToolCall<T = unknown> {
    toolName: string;
    toolArguments: T;
  }

  export interface Message {
    role: 'system' | 'user' | 'assistant' | 'tool';
    content: string | Array<{
      type: 'text' | 'image';
      text?: string;
      image?: Uint8Array | string;
    }>;
    toolInvocations?: Array<{
      state: 'result' | 'call';
      toolName: string;
      toolArguments: string;
      result?: unknown;
    }>;
  }

  export interface CallSettings {
    maxTokens?: number;
    temperature?: number;
    topP?: number;
    topK?: number;
    presencePenalty?: number;
    frequencyPenalty?: number;
    stopSequences?: string[];
    seed?: number;
  }

  export interface ModelSettings extends CallSettings {
    model: LanguageModel;
  }

  export interface Provider {
    (modelName: string): LanguageModel;
  }
}

// Ultra-Dex specific types
export interface AgentConfig {
  name: string;
  description: string;
  capabilities: string[];
  modelPreference?: string;
  priority: number; // 1-10 scale
  maxConcurrency: number;
  isActive: boolean;
}

export interface AgentStats {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  avgResponseTime: number;
  totalTokens: number;
  lastActive: Date | null;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  modelPreference: string | null;
  priority: number;
  maxConcurrency: number;
  isActive: boolean;
  stats: AgentStats;
}

export interface MemoryEntry {
  id: string;
  data: unknown;
  context: Record<string, unknown>;
  metadata: {
    createdAt: string;
    updatedAt: string;
    accessCount: number;
    lastAccessed: string | null;
    permanent?: boolean;
    retentionPeriod?: number;
  };
  embedding: number[] | null;
  compressed: boolean;
}

export interface ContextWindow {
  id: string;
  memories: Set<string>;
  createdAt: string;
  lastUpdated: string;
  size: number;
}

export interface AIMetaLayerConfig {
  defaultProvider: string;
  enableRouting: boolean;
  enableFallback: boolean;
  enableCaching: boolean;
  enableMonitoring: boolean;
  cacheExpiry: number;
  providers: {
    openai?: {
      enabled: boolean;
      apiKey?: string;
      defaultModel: string;
      temperature: number;
    };
    anthropic?: {
      enabled: boolean;
      apiKey?: string;
      defaultModel: string;
      temperature: number;
    };
    google?: {
      enabled: boolean;
      apiKey?: string;
      defaultModel: string;
      temperature: number;
    };
    ollama?: {
      enabled: boolean;
      baseUrl: string;
      defaultModel: string;
    };
    azure?: {
      enabled: boolean;
      endpoint?: string;
      apiKey?: string;
      deploymentName?: string;
    };
  };
  orchestration: {
    maxConcurrentAgents: number;
    timeout: number;
    retryPolicy: {
      maxRetries: number;
      backoffMultiplier: number;
      initialDelay: number;
    };
    circuitBreaker: {
      threshold: number;
      timeout: number;
    };
  };
  memory: {
    storage: 'sqlite' | 'postgres' | 'redis' | 'memory';
    ttl: number;
    maxSize: number;
    enableCompression: boolean;
    enableEncryption: boolean;
    retentionPeriod: number;
  };
  security: {
    enableSandbox: boolean;
    allowedDomains: string[];
    rateLimiting: {
      enabled: boolean;
      windowMs: number;
      maxRequests: number;
    };
  };
  monitoring: {
    enableMetrics: boolean;
    enableTracing: boolean;
    samplingRate: number;
  };
}

export interface Task {
  id: string;
  description: string;
  requiredCapabilities: string[];
  complexity: 'low' | 'medium' | 'high';
  deadline?: Date;
  priority: number; // 1-10 scale
  metadata?: Record<string, unknown>;
}

export interface CoordinationContext {
  mainAgent: string;
  coordinatingAgents: string[];
  task: unknown;
  timestamp: number;
}

export interface Session {
  id: string;
  startTime: number;
  task: unknown;
  agentsUsed: string[];
  status: 'active' | 'completed' | 'failed';
  endTime?: number;
}

// Result types
export interface AgentResult {
  success: boolean;
  data: unknown;
  error?: Error;
  responseTime: number;
  tokensUsed: number;
}

export interface CoordinationResult {
  mainResult: unknown;
  coordinationResults: Array<{
    agent: string;
    success: boolean;
    result: unknown;
  }>;
  coordinationContext: CoordinationContext;
}

// Event types
export interface UltraDexEvent {
  type: string;
  timestamp: Date;
  data: unknown;
  metadata?: Record<string, unknown>;
}

// Configuration types
export interface UltraDexConfig {
  metaLayer: {
    version: string;
    name: string;
    mode: 'development' | 'staging' | 'production' | 'benchmark';
  };
  features: {
    enableAgentSwarm: boolean;
    enableAutoHealing: boolean;
    enablePredictiveDebugging: boolean;
    enableCodeGeneration: boolean;
    enableCodeReview: boolean;
    enableSecurityScanning: boolean;
    enablePerformanceOptimization: boolean;
  };
}

// Export all types
export type {
  LanguageModel,
  CoreTool,
  ToolCall,
  Message,
  CallSettings,
  ModelSettings,
  Provider
};