import { GraphNode } from '../dexgraph/types.js';
import { ExecutionContext } from '../adapters/executionAdapter.js';
import { Rule } from './types.js';
import { Decision, evaluateRules } from './decisions.js';

export class ExecutionBlockedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ExecutionBlockedError';
  }
}

export class GovernanceManager {
  private auditLog: { timestamp: string; node: string; decision: string; reason: string }[] = [];

  constructor(private rules: Rule[] = []) {}

  addRule(rule: Rule): void {
    this.rules.push(rule);
  }

  evaluate(node: GraphNode, context: ExecutionContext): Decision {
    const decision = evaluateRules(this.rules, node, context);
    this.logDecision(node, decision);
    return decision;
  }

  private logDecision(node: GraphNode, decision: Decision): void {
    this.auditLog.push({
      timestamp: new Date().toISOString(),
      node: node.id,
      decision: decision.type,
      reason: decision.reason,
    });
  }

  getAuditLogs() {
    return [...this.auditLog];
  }
}
