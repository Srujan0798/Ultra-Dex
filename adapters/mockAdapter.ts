import { ExecutionAdapter, ExecutionContext, ExecutionResult } from './executionAdapter.js';

export class MockAdapter implements ExecutionAdapter {
  private tasks: Map<string, { running: boolean; progress: number }> = new Map();
  private delay: number;
  private failNodes: Set<string>;

  constructor(delay: number = 100, failNodes: string[] = []) {
    this.delay = delay;
    this.failNodes = new Set(failNodes);
  }

  async run(context: ExecutionContext): Promise<ExecutionResult> {
    this.tasks.set(context.nodeId, { running: true, progress: 0 });
    
    try {
      const shouldFail = this.failNodes.has(context.nodeId);
      
      await new Promise(r => setTimeout(r, this.delay));

      this.tasks.set(context.nodeId, { running: false, progress: 100 });

      if (shouldFail) {
        return {
          status: 'FAILED',
          logs: ['Mock task failed as configured'],
          error: 'Intentional failure for testing',
          cost: { tokens: 0, estimatedUSD: 0, provider: 'mock' },
          confidence: 0.5,
          duration: this.delay,
          timestamp: new Date().toISOString()
        };
      }

      return {
        status: 'SUCCESS',
        output: { result: 'mock output', input: context.input },
        logs: ['Mock execution completed', JSON.stringify(context.input)],
        cost: { tokens: 100, estimatedUSD: 0.001, provider: 'mock' },
        confidence: 0.95,
        duration: this.delay,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'FAILED',
        logs: ['Mock execution error'],
        error: error instanceof Error ? error.message : String(error),
        cost: { tokens: 0, estimatedUSD: 0, provider: 'mock' },
        confidence: 0,
        duration: this.delay,
        timestamp: new Date().toISOString()
      };
    }
  }

  async cancel(nodeId: string): Promise<void> {
    this.tasks.delete(nodeId);
  }

  async status(nodeId: string): Promise<{ running: boolean; progress?: number }> {
    return this.tasks.get(nodeId) || { running: false, progress: 0 };
  }

  name(): string {
    return 'MockAdapter';
  }
}
