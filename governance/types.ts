import { GraphNode } from '../dexgraph/types.js';
import { ExecutionContext } from '../adapters/executionAdapter.js';

export interface RuleDecision {
  allowed: boolean;
  reason: string;
  blockType?: 'hard' | 'soft';
}

export interface Rule {
  name: string;
  evaluate(node: GraphNode, context: ExecutionContext): RuleDecision;
}
