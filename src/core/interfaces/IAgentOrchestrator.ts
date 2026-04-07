import { ITask } from './ITask.js';
import { IExecutionResult } from './IExecutionResult.js';
import { IExecutionContext } from './IExecutionContext.js';

export interface INexusConfig {
  goal: string;
  context?: Record<string, unknown>;
  maxIterations?: number;
  timeout?: number;
  agents?: string[];
}

export interface INexusResult {
  success: boolean;
  result?: unknown;
  error?: string;
  iterations: number;
  duration: number;
  agentsUsed: string[];
}

export interface OrchestratorHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  activeTasks: number;
  queuedTasks: number;
  agentCount: number;
  lastHeartbeat: Date;
  errors: string[];
}

export interface IAgentOrchestrator {
  executeTask(task: ITask, context: IExecutionContext): Promise<IExecutionResult>;
  executeNexus(config: INexusConfig): Promise<INexusResult>;
  getHealth(): OrchestratorHealth;
  pause(): Promise<void>;
  resume(): Promise<void>;
  shutdown(): Promise<void>;
}
