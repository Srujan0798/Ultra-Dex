import { DexGraph } from './graph.js';
import { StateMachine } from './stateMachine.js';
import { GraphNode, NodeState } from './types.js';
import { GovernanceManager, ExecutionBlockedError } from '../governance/governance-manager.js';

export interface Dispatcher {
  dispatch(node: GraphNode): Promise<any>;
}

export interface SchedulerConfig {
  maxRetries: number;
  maxConcurrent: number;
  timeoutMs: number;
  onFailure: 'halt' | 'continue' | 'rollback';
}

export interface SchedulerStatus {
  running: boolean;
  completed: number;
  failed: number;
  pending: number;
  total: number;
}

export interface SchedulerResult {
  success: boolean;
  completedNodes: string[];
  failedNodes: string[];
  rolledBackNodes: string[];
  duration: number;
}

export class Scheduler {
  private graph: DexGraph;
  private stateMachine: StateMachine;
  private config: Required<SchedulerConfig>;
  private running: boolean = false;
  private dispatcher: Dispatcher;
  private activeTasks: Set<string> = new Set();
  private governanceManager?: GovernanceManager;

  constructor(graph: DexGraph, dispatcher: Dispatcher, config?: Partial<SchedulerConfig>, governanceManager?: GovernanceManager) {
    this.graph = graph;
    this.stateMachine = new StateMachine();
    this.dispatcher = dispatcher;
    this.governanceManager = governanceManager;
    this.config = {
      maxRetries: config?.maxRetries ?? 2,
      maxConcurrent: config?.maxConcurrent ?? 4,
      timeoutMs: config?.timeoutMs ?? 300000,
      onFailure: config?.onFailure ?? 'rollback',
    };
  }

  async run(): Promise<SchedulerResult> {
    const startTime = Date.now();
    this.running = true;
    this.activeTasks.clear();

    // 1. Root nodes: CREATED → READY
    for (const node of this.graph.getRootNodes()) {
      if (node.state === 'CREATED') {
        this.stateMachine.transition(node, 'READY', 'Workflow started');
      }
    }

    // 2. Scheduler Loop
    while (this.running && !this.isComplete()) {
      const executable = this.getExecutableNodes();

      if (executable.length === 0) {
        if (this.activeTasks.size === 0) {
          // Deadlock or completed with unrunnable branches
          this.running = false;
          break;
        }
        await this.sleep(10);
        continue;
      }

      const capacity = this.config.maxConcurrent - this.activeTasks.size;
      const toDispatch = executable.slice(0, Math.max(0, capacity));

      toDispatch.forEach(node => {
        this.activeTasks.add(node.id);
        this.executeNode(node).finally(() => {
          this.activeTasks.delete(node.id);
        });
      });

      await this.sleep(10);
    }

    // Wait for remaining active tasks to finish if we stopped due to halt or completion
    while (this.activeTasks.size > 0) {
      await this.sleep(10);
    }

    const duration = Date.now() - startTime;
    const allNodes = this.graph.getAllNodes();
    const success = allNodes.every(n => n.state === 'SUCCESS');

    return {
      success,
      completedNodes: allNodes.filter(n => n.state === 'SUCCESS').map(n => n.id),
      failedNodes: allNodes.filter(n => n.state === 'FAILED').map(n => n.id),
      rolledBackNodes: allNodes.filter(n => n.state === 'ROLLBACK').map(n => n.id),
      duration
    };
  }

  private getExecutableNodes(): GraphNode[] {
    return this.graph.getAllNodes().filter(node => {
      if (node.state !== 'READY') return false;
      if (this.activeTasks.has(node.id)) return false; // Safety check
      const dependencies = this.graph.getDependencies(node.id);
      return dependencies.every(depId => this.graph.getNode(depId).state === 'SUCCESS');
    });
  }

  private async executeNode(node: GraphNode): Promise<void> {
    while (this.running) {
      try {
        if (this.governanceManager) {
          const context: any = {
            nodeId: node.id,
            taskType: node.role || 'default',
            input: node.context || {},
            timeout: this.config.timeoutMs
          };
          const decision = this.governanceManager.evaluate(node, context);
          if (decision.type === 'block') {
            throw new ExecutionBlockedError(`Execution blocked by governance: ${decision.reason}`);
          } else if (decision.type === 'pause') {
            this.stateMachine.transition(node, 'BLOCKED', `Execution paused by governance: ${decision.reason}`);
            break; // Exit retry loop because it is paused
          }
        }

        this.stateMachine.transition(node, 'RUNNING');
        
        await Promise.race([
          this.dispatcher.dispatch(node),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error(`Task timeout after ${this.config.timeoutMs}ms`)), this.config.timeoutMs)
          )
        ]);

        this.stateMachine.transition(node, 'VERIFYING');
        this.stateMachine.transition(node, 'SUCCESS');
        this.unlockDependents(node.id);
        break; // Success, exit retry loop
      } catch (error: any) {
        if (error instanceof ExecutionBlockedError) {
           this.stateMachine.transition(node, 'FAILED', error.message);
           // Blocked errors should halt or rollback immediately, bypassing retries
           switch (this.config.onFailure) {
             case 'halt': this.stop(); break;
             case 'rollback': this.stateMachine.rollback(node, this.graph); break;
             case 'continue': this.stateMachine.transition(node, 'ROLLBACK', 'Execution blocked, continuing other branches'); break;
           }
           break;
        }

        this.stateMachine.transition(node, 'FAILED', error.message);

        if (this.stateMachine.shouldRetry(node, this.config.maxRetries)) {
          const retryCount = this.stateMachine.getRetryCount(node.id);
          const backoff = this.stateMachine.getBackoffMs(retryCount);
          await this.sleep(backoff);
          
          if (!this.running) break;

          this.stateMachine.transition(node, 'RETRY', `Retry count: ${retryCount + 1}`);
          // Loop will continue and transition RETRY -> RUNNING
        } else {
          // Max retries reached
          switch (this.config.onFailure) {
            case 'halt':
              this.stop();
              break;
            case 'rollback':
              this.stateMachine.rollback(node, this.graph);
              break;
            case 'continue':
              this.stateMachine.transition(node, 'ROLLBACK', 'Max retries exceeded');
              break;
          }
          break; // Exit retry loop
        }
      }
    }
  }

  private unlockDependents(completedNodeId: string): void {
    const dependents = this.graph.getDependents(completedNodeId);
    for (const depId of dependents) {
      const dep = this.graph.getNode(depId);
      if (dep.state !== 'CREATED') continue;

      const allDepsSatisfied = this.graph.getDependencies(depId)
        .every(d => this.graph.getNode(d).state === 'SUCCESS');
      
      if (allDepsSatisfied) {
        this.stateMachine.transition(dep, 'READY', 'Dependencies satisfied');
      }
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(r => setTimeout(r, ms));
  }

  private isComplete(): boolean {
    return this.graph.getAllNodes().every(n => this.stateMachine.isTerminal(n.state));
  }

  stop(): void {
    this.running = false;
  }

  getStatus(): SchedulerStatus {
    const nodes = this.graph.getAllNodes();
    return {
      running: this.running,
      completed: nodes.filter(n => n.state === 'SUCCESS').length,
      failed: nodes.filter(n => n.state === 'FAILED').length,
      pending: nodes.filter(n => !this.stateMachine.isTerminal(n.state)).length,
      total: nodes.length
    };
  }
}
