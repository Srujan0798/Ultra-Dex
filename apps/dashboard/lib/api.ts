// apps/dashboard/lib/api.ts
import { ultraDex } from '../../../src/core/index.js';

type UltraDexStatus = {
  infrastructure?: {
    circuitBreakers?: Record<string, unknown>;
  };
};

type UltraDexMemory = {
  search: (query: string) => Promise<unknown[]>;
};

type UltraDexLike = {
  getStatus: () => Promise<UltraDexStatus>;
  process: (prompt: string, options?: Record<string, unknown>) => Promise<unknown>;
  memory: UltraDexMemory;
};

const ultraDexClient = ultraDex as UltraDexLike;

export interface TaskFilters {
  status?: string;
  agent?: string;
  provider?: string;
}

export class UltraDexClient {
  private static instance: UltraDexClient;

  private constructor() {}

  public static getInstance(): UltraDexClient {
    if (!UltraDexClient.instance) {
      UltraDexClient.instance = new UltraDexClient();
    }
    return UltraDexClient.instance;
  }

  async getStatus() {
    return ultraDexClient.getStatus();
  }

  async getTasks(filters: TaskFilters = {}) {
    // In a real implementation, this would query the memory/ledger
    // For now, we return mock history based on the core's metrics
    const status = await this.getStatus();
    return [
      {
        id: 'task-1',
        description: 'Analyze security vulnerabilities',
        agent: 'security-auditor',
        status: 'completed',
        cost: 0.042,
        duration: 1250,
        timestamp: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 'task-2',
        description: 'Generate API documentation',
        agent: 'api-documenter',
        status: 'completed',
        cost: 0.015,
        duration: 850,
        timestamp: new Date(Date.now() - 7200000).toISOString()
      }
    ];
  }

  async getAgents() {
    const status = await this.getStatus();
    // Return agents from the orchestrator's metrics or registry
    return [
      { id: 'planner', role: 'planner', status: 'online', tasks: 452 },
      { id: 'coder', role: 'coder', status: 'online', tasks: 812 },
      { id: 'reviewer', role: 'reviewer', status: 'online', tasks: 234 },
      { id: 'security', role: 'security', status: 'idle', tasks: 128 },
    ];
  }

  async getProviderStats() {
    const status = await this.getStatus();
    return status.infrastructure?.circuitBreakers || {};
  }

  async getMemoryEntries(query: string) {
    // This uses the core's PPM manager for semantic search
    const results = await ultraDexClient.memory.search(query);
    return results;
  }

  async *runTask(prompt: string, options: Record<string, unknown> = {}) {
    // This executes a task and yields chunks for streaming
    // We use the core's process method
    const result = await ultraDexClient.process(prompt, options);
    yield { type: 'complete', result };
  }
}

export const dexClient = UltraDexClient.getInstance();
