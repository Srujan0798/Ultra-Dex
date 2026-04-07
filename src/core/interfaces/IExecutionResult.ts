import { IExecutionError } from './IExecutionError.js';

export interface IExecutionMetrics {
  startTime: number;
  endTime: number;
  duration: number;
  tokensUsed: number;
  cost: number;
  provider: string;
  model: string;
}

export interface IExecutionResult {
  success: boolean;
  result?: unknown;
  error?: IExecutionError;
  metrics: IExecutionMetrics;
  agentId: string;
  taskId: string;
}
