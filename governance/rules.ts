import { GraphNode } from '../dexgraph/types.js';
import { ExecutionContext } from '../adapters/executionAdapter.js';
import { Rule, RuleDecision } from './types.js';

export class RuleEngine {
  private rules: Rule[] = [];

  addRule(rule: Rule): void {
    this.rules.push(rule);
  }

  evaluate(node: GraphNode, context: ExecutionContext): RuleDecision {
    for (const rule of this.rules) {
      const decision = rule.evaluate(node, context);
      if (!decision.allowed) {
        return decision;
      }
    }
    return { allowed: true, reason: 'All rules passed' };
  }
}

/**
 * Rule to require tests for specific tasks (e.g. before deploy)
 */
export class RequireTests implements Rule {
  name = 'RequireTests';
  
  constructor(private requireForRoles: string[] = ['deployer']) {}

  evaluate(node: GraphNode, context: ExecutionContext): RuleDecision {
    if (this.requireForRoles.includes(node.role)) {
      // simplistic check: if context does not have a boolean testsPassed = true
      if (context.input?.testsPassed !== true) {
        return {
          allowed: false,
          reason: `Tests must pass before task of role ${node.role} can execute`,
          blockType: 'hard'
        };
      }
    }
    return { allowed: true, reason: 'Tests checked or not required' };
  }
}

/**
 * Rule to require manual approval
 */
export class RequireApproval implements Rule {
  name = 'RequireApproval';
  
  constructor(private requireForRoles: string[] = ['deployer']) {}

  evaluate(node: GraphNode, context: ExecutionContext): RuleDecision {
    if (this.requireForRoles.includes(node.role)) {
      if (context.input?.approved !== true) {
        return {
          allowed: false,
          reason: `Manual approval required for role ${node.role}`,
          blockType: 'soft' // soft block means pause and wait
        };
      }
    }
    return { allowed: true, reason: 'Approval checked or not required' };
  }
}

/**
 * Rule to enforce cost budget
 */
export class CostBudget implements Rule {
  name = 'CostBudget';
  
  constructor(private maxUSD: number) {}

  evaluate(node: GraphNode, context: ExecutionContext): RuleDecision {
    const cost = Number(context.input?.totalCostUSD || 0);
    if (cost > this.maxUSD) {
      return {
        allowed: false,
        reason: `Budget exceeded: ${cost} > ${this.maxUSD}`,
        blockType: 'soft' // Can be overridden or paused
      };
    }
    return { allowed: true, reason: 'Within budget' };
  }
}

/**
 * Rule to require minimum confidence score from LLM
 */
export class ConfidenceThreshold implements Rule {
  name = 'ConfidenceThreshold';
  
  constructor(private minConfidence: number) {}

  evaluate(node: GraphNode, context: ExecutionContext): RuleDecision {
    // If context has a confidence from a previous step, we check it.
    // Actually, execution result confidence isn't available until AFTER run. 
    // But we might be checking dependency confidences passed via input.
    const conf = context.input?.averageConfidence as number;
    if (conf !== undefined && conf < this.minConfidence) {
      return {
        allowed: false,
        reason: `Confidence too low: ${conf} < ${this.minConfidence}`,
        blockType: 'hard'
      };
    }
    return { allowed: true, reason: 'Confidence threshold met' };
  }
}
