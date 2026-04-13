import { NodeState, GraphNode } from './types.js';
import { StateError } from './parser.js';
import { DexGraph } from './graph.js';

// Valid transitions matrix
export const TRANSITIONS: Record<NodeState, NodeState[]> = {
  CREATED:   ['READY', 'ROLLBACK'],
  READY:     ['RUNNING', 'BLOCKED', 'ROLLBACK', 'FAILED'],
  RUNNING:   ['VERIFYING', 'FAILED', 'ROLLBACK'],
  VERIFYING: ['SUCCESS', 'FAILED', 'ROLLBACK'],
  SUCCESS:   [],  // terminal
  FAILED:    ['RETRY', 'ROLLBACK'],
  RETRY:     ['RUNNING'],
  BLOCKED:   ['READY', 'ROLLBACK', 'FAILED'],  // unblocked by governance or failed/rolled back
  ROLLBACK:  [],  // terminal
};

export interface StateTransition {
  nodeId: string;
  from: NodeState;
  to: NodeState;
  timestamp: number;
  reason?: string;
}

export class StateMachine {
  private history: StateTransition[];

  constructor() {
    this.history = [];
  }

  /**
   * Check if a transition from one state to another is allowed
   */
  canTransition(from: NodeState, to: NodeState): boolean {
    const allowed = TRANSITIONS[from] || [];
    return allowed.includes(to);
  }

  /**
   * Perform a state transition for a node
   * @throws {StateError} if transition is illegal
   */
  transition(node: GraphNode, to: NodeState, reason?: string): void {
    const from = node.state;
    if (from === to) return; // Ignore self-transitions

    if (!this.canTransition(from, to)) {
      throw new StateError(`Invalid transition: ${from} → ${to} for node "${node.id}"`);
    }

    node.state = to;
    this.history.push({
      nodeId: node.id,
      from,
      to,
      timestamp: Date.now(),
      reason
    });
  }

  /**
   * Get current state of a node
   */
  getState(node: GraphNode): NodeState {
    return node.state;
  }

  /**
   * Get transition history
   * @param nodeId Optional filter for a specific node
   */
  getHistory(nodeId?: string): StateTransition[] {
    if (nodeId) {
      return this.history.filter(t => t.nodeId === nodeId);
    }
    return [...this.history];
  }

  /**
   * Count FAILED → RETRY transitions for a specific node
   */
  getRetryCount(nodeId: string): number {
    return this.history.filter(t => t.nodeId === nodeId && t.from === 'FAILED' && t.to === 'RETRY').length;
  }

  /**
   * Check if a state is terminal
   */
  isTerminal(state: NodeState): boolean {
    return state === 'SUCCESS' || state === 'ROLLBACK';
  }

  /**
   * Handle task failure with retry or rollback escalation
   */
  handleFailure(node: GraphNode, maxRetries: number): NodeState {
    if (this.shouldRetry(node, maxRetries)) {
      this.transition(node, 'RETRY', `Retry count: ${this.getRetryCount(node.id) + 1}`);
      this.transition(node, 'RUNNING', 'Retrying execution');
      return 'RUNNING';
    } else {
      this.transition(node, 'ROLLBACK', 'Max retries exceeded');
      return 'ROLLBACK';
    }
  }

  /**
   * Check if a node should be retried based on maxRetries policy
   */
  shouldRetry(node: GraphNode, maxRetries: number): boolean {
    return this.getRetryCount(node.id) < maxRetries;
  }

  /**
   * Calculate exponential backoff duration (capped at 30s)
   */
  getBackoffMs(retryCount: number): number {
    const backoff = 1000 * Math.pow(2, retryCount);
    return Math.min(backoff, 30000);
  }

  /**
   * Transition node to ROLLBACK and propagate to all dependents
   */
  rollback(node: GraphNode, graph: DexGraph): string[] {
    const rolledBack: string[] = [];
    
    const propagate = (n: GraphNode) => {
      if (this.isTerminal(n.state)) return;
      
      this.transition(n, 'ROLLBACK', 'Parent node rolled back');
      rolledBack.push(n.id);
      
      const dependents = graph.getDependents(n.id);
      for (const depId of dependents) {
        propagate(graph.getNode(depId));
      }
    };

    // Transition the source node itself if not already ROLLBACK
    if (node.state !== 'ROLLBACK') {
      this.transition(node, 'ROLLBACK', 'Failure escalation or manual rollback');
      rolledBack.push(node.id);
    }

    const initialDependents = graph.getDependents(node.id);
    for (const depId of initialDependents) {
      propagate(graph.getNode(depId));
    }

    return rolledBack;
  }
}
