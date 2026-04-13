import { ExecutionAdapter, ExecutionContext, ExecutionResult } from '../adapters/executionAdapter.js';
import { GraphNode } from './types.js';
import { StateMachine } from './stateMachine.js';
import { ResultValidator } from '../adapters/resultValidator.js';
import { ContextInjector } from './contextInjector.js';

export interface DispatcherConfig {
  maxConcurrent: number;
  adapter: ExecutionAdapter;
}

export interface DispatchedTask {
  nodeId: string;
  node: GraphNode;
  startTime: number;
  promise: Promise<ExecutionResult>;
}

export interface Verifier {
  verify(node: GraphNode, result: ExecutionResult): Promise<{ valid: boolean; reason?: string; confidence?: number }>;
}

export class Dispatcher {
  private config: DispatcherConfig;
  private queue: DispatchedTask[] = [];
  private inFlight: Map<string, DispatchedTask> = new Map();
  private results: Map<string, ExecutionResult> = new Map();
  private contextInjector?: ContextInjector;

  constructor(config: DispatcherConfig, contextInjector?: ContextInjector) {
    this.config = config;
    this.contextInjector = contextInjector;
  }

  dispatch(node: GraphNode): Promise<ExecutionResult> {
    const context = this.buildContext(node);
    const promise = this.config.adapter.run(context);
    const task: DispatchedTask = { nodeId: node.id, node, startTime: Date.now(), promise };
    this.queue.push(task);
    this.inFlight.set(node.id, task);
    promise
      .then((result) => { this.results.set(node.id, result); this.inFlight.delete(node.id); })
      .catch((error) => {
        const result: ExecutionResult = {
          status: 'FAILED', logs: [(error as Error).message], error: (error as Error).message,
          cost: { tokens: 0, estimatedUSD: 0, provider: this.config.adapter.name() },
          confidence: 0, duration: Date.now() - task.startTime, timestamp: new Date().toISOString(),
        };
        this.results.set(node.id, result);
        this.inFlight.delete(node.id);
      });
    return promise;
  }

  async dispatchWithContext(node: GraphNode, verifier?: Verifier): Promise<ExecutionResult> {
    if (!this.contextInjector) {
      throw new Error('ContextInjector not provided to Dispatcher');
    }

    // Step 1: Wait for dependencies if needed
    await this.contextInjector.waitForDependencies(
      node.id,
      node.context?.timeout ? Number(node.context.timeout) : 300000
    );

    // Step 2: Inject context
    this.contextInjector.injectContext(node.id);

    // Step 3: Build execution context with injections
    const injectedInput = this.contextInjector.buildExecutionContext(node.id);

    // Step 4: Create execution context with injected input
    const context: ExecutionContext = {
      nodeId: node.id,
      taskType: node.role || 'default',
      input: injectedInput,  // Includes dependency outputs
      timeout: node.context?.timeout ? Number(node.context.timeout) : 300000,
      environment: this.extractEnvironment(node),
      retryCount: node.context?.retryCount ? Number(node.context.retryCount) : 0
    };

    // Step 5: Dispatch to adapter (no re-prompting needed)
    const promise = this.config.adapter.run(context);
    
    const task: DispatchedTask = {
      nodeId: node.id,
      node,
      startTime: Date.now(),
      promise
    };

    this.queue.push(task);
    this.inFlight.set(node.id, task);

    let result: ExecutionResult;
    try {
      result = await promise;
    } catch (error) {
      result = {
        status: 'FAILED',
        logs: [(error as Error).message],
        error: (error as Error).message,
        cost: { tokens: 0, estimatedUSD: 0, provider: this.config.adapter.name() },
        confidence: 0,
        duration: Date.now() - task.startTime,
        timestamp: new Date().toISOString()
      };
    }
    
    this.results.set(node.id, result);
    this.inFlight.delete(node.id);

    // Step 6: Verify (if enabled)
    if (verifier && result.status === 'SUCCESS') {
      const verification = await verifier.verify(node, result);
      if (!verification.valid) {
        result.status = 'FAILED';
        result.error = verification.reason ?? 'Verification failed';
        if (verification.confidence !== undefined) result.confidence = Math.min(result.confidence, verification.confidence);
      }
    }

    return result;
  }

  async dispatchWithVerification(node: GraphNode, verifier: Verifier): Promise<ExecutionResult> {
    const result = await this.dispatch(node);
    if (result.status === 'SUCCESS') {
      const verification = await verifier.verify(node, result);
      if (!verification.valid) {
        result.status = 'FAILED';
        result.error = verification.reason ?? 'Verification failed';
        if (verification.confidence !== undefined) result.confidence = Math.min(result.confidence, verification.confidence);
      }
    }
    return result;
  }

  async handleResult(nodeId: string, result: ExecutionResult, stateMachine: StateMachine, getNode: (id: string) => GraphNode): Promise<void> {
    const validation = ResultValidator.validate(result);
    if (!validation.valid) throw new Error(`Invalid result: ${validation.errors.join(', ')}`);
    const node = getNode(nodeId);
    switch (result.status) {
      case 'SUCCESS': stateMachine.transition(node, 'VERIFYING', 'Awaiting verification'); break;
      case 'FAILED': stateMachine.transition(node, 'FAILED', result.error ?? 'Unknown error'); break;
      case 'TIMEOUT': stateMachine.transition(node, 'FAILED', 'Task timeout'); break;
      case 'CANCELLED': stateMachine.transition(node, 'FAILED', 'Task cancelled'); break;
    }
  }

  async waitForResult(nodeId: string, timeoutMs = 300000): Promise<ExecutionResult> {
    const task = this.inFlight.get(nodeId);
    if (!task) {
      const cached = this.results.get(nodeId);
      if (cached) return cached;
      throw new Error(`Task ${nodeId} not found`);
    }
    return Promise.race([
      task.promise,
      new Promise<ExecutionResult>((_, reject) => setTimeout(() => reject(new Error('Dispatcher timeout')), timeoutMs)),
    ]);
  }

  getResult(nodeId: string): ExecutionResult | undefined { return this.results.get(nodeId); }
  isInflight(nodeId: string): boolean { return this.inFlight.has(nodeId); }
  inflightCount(): number { return this.inFlight.size; }
  canDispatch(): boolean { return this.inFlight.size < this.config.maxConcurrent; }

  private buildContext(node: GraphNode): ExecutionContext {
    return {
      nodeId: node.id, taskType: node.role, input: { instruction: node.instruction, context: node.context },
      timeout: 300000, environment: this.extractEnvironment(node), retryCount: 0,
    };
  }

  private extractNodeInput(node: GraphNode): Record<string, unknown> {
    return { instruction: node.instruction, context: node.context };
  }

  private extractEnvironment(node: GraphNode): Record<string, string> {
    const env: Record<string, string> = {};
    for (const [k, v] of Object.entries(node.context)) env[k] = String(v);
    return env;
  }
}
