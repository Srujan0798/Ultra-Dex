import { GraphNode } from '../dexgraph/types.js';

export interface RuleDecision {
  allowed: boolean;
  reason: string;
  blockType?: 'hard' | 'soft';
}

export interface RuleContext {
  workflowId: string;
  totalCost: { tokens: number; estimatedUSD: number };
  testsPassed: boolean;
  nodeHistory: Record<string, unknown>;
}

export interface Rule {
  name: string;
  evaluate(node: GraphNode, context: RuleContext): RuleDecision;
}

export class RuleEngine {
  private rules: Rule[] = [];
  addRule(rule: Rule): void { this.rules.push(rule); }
  evaluate(node: GraphNode, context: RuleContext): RuleDecision {
    for (const rule of this.rules) {
      const decision = rule.evaluate(node, context);
      if (!decision.allowed) return decision;
    }
    return { allowed: true, reason: 'All rules passed' };
  }
}

export class RequireTestsRule implements Rule {
  name = 'require-tests';
  evaluate(node: GraphNode, context: RuleContext): RuleDecision {
    if (node.role === 'tester' && !context.testsPassed) {
      return { allowed: false, reason: 'Tests must pass before proceeding', blockType: 'hard' };
    }
    return { allowed: true, reason: 'Tests passed or not applicable' };
  }
}

export class CostBudgetRule implements Rule {
  private maxUSD: number;
  constructor(maxUSD = 100) { this.maxUSD = maxUSD; }
  name = 'cost-budget';
  evaluate(node: GraphNode, context: RuleContext): RuleDecision {
    if (context.totalCost.estimatedUSD > this.maxUSD) {
      return { allowed: false, reason: `Cost budget exceeded: $${context.totalCost.estimatedUSD.toFixed(2)} > $${this.maxUSD}`, blockType: 'soft' };
    }
    return { allowed: true, reason: 'Within budget' };
  }
}

export class ConfidenceThresholdRule implements Rule {
  private minConfidence: number;
  constructor(minConfidence = 0.7) { this.minConfidence = minConfidence; }
  name = 'confidence-threshold';
  evaluate(node: GraphNode, context: RuleContext): RuleDecision {
    const lastResult = context.nodeHistory[node.id] as { confidence?: number } | undefined;
    if (lastResult && lastResult.confidence !== undefined && lastResult.confidence < this.minConfidence) {
      return { allowed: false, reason: `Confidence ${lastResult.confidence} below threshold ${this.minConfidence}`, blockType: 'soft' };
    }
    return { allowed: true, reason: 'Confidence acceptable or no history' };
  }
}
