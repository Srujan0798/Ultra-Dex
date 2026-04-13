export interface ExecutionContext {
  nodeId: string;
  taskType: string;
  input: Record<string, unknown>;
  timeout: number;  // ms
  environment?: Record<string, string>;
  retryCount?: number;
}

export interface Cost {
  tokens: number;
  estimatedUSD: number;
  provider: string;
}

export interface ExecutionResult {
  status: 'SUCCESS' | 'FAILED' | 'TIMEOUT' | 'CANCELLED';
  output?: unknown;
  logs: string[];
  error?: string;
  cost: Cost;
  confidence: number;  // 0-1
  duration: number;  // ms
  timestamp: string;  // ISO
}

export interface ExecutionAdapter {
  /**
   * Execute a task node in the workflow
   * @param context - Node context, input, timeout
   * @returns ExecutionResult with output, logs, cost, confidence
   */
  run(context: ExecutionContext): Promise<ExecutionResult>;

  /**
   * Cancel in-flight execution
   * @param nodeId - Node to cancel
   */
  cancel(nodeId: string): Promise<void>;

  /**
   * Get current status of node execution
   */
  status(nodeId: string): Promise<{ running: boolean; progress?: number }>;

  /**
   * Name of adapter for logging
   */
  name(): string;
}
