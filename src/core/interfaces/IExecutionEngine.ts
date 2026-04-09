export interface ExecutionResult {
  status: string;
  output?: string;
  agentId?: string;
}

export interface IExecutionEngine {
  initialize(): Promise<void>;
  execute(objective: string, options?: Record<string, unknown>): Promise<unknown>;
  executeNexus(objective: string, options?: Record<string, unknown>): Promise<unknown>;
  executeTask(
    task: string | Record<string, unknown>,
    options?: Record<string, unknown>
  ): Promise<ExecutionResult>;
  getMetrics(): Record<string, unknown>;
}
