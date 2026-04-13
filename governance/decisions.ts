import { GraphNode } from '../dexgraph/types.js';
import { ExecutionContext } from '../adapters/executionAdapter.js';
import { Rule } from './types.js';

export type DecisionType = 'allow' | 'block' | 'pause';

export interface Decision {
  type: DecisionType;
  node: GraphNode;
  reason: string;
}

export function applyRule(rule: Rule, node: GraphNode, context: ExecutionContext): Decision {
  const result = rule.evaluate(node, context);
  if (result.allowed) {
    return { type: 'allow', node, reason: result.reason };
  }
  if (result.blockType === 'soft') {
    return { type: 'pause', node, reason: result.reason };
  }
  return { type: 'block', node, reason: result.reason };
}

export function evaluateRules(rules: Rule[], node: GraphNode, context: ExecutionContext): Decision {
  for (const rule of rules) {
    const decision = applyRule(rule, node, context);
    if (decision.type !== 'allow') {
      return decision;
    }
  }
  return { type: 'allow', node, reason: 'All rules passed' };
}
