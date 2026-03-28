// Copyright (c) 2026 Ultra-Dex

import { GovernanceEngine } from '../../platform/cli/governance/index.js';

export class GovernanceDeniedException extends Error {
  constructor(message, context = {}) {
    super(message);
    this.name = 'GovernanceDeniedException';
    this.context = context;
  }
}

function normalizeAction(action = '') {
  if (action === 'executeTask' || action.startsWith('tool:')) {
    return 'execute';
  }
  if (action.startsWith('write')) {
    return 'write';
  }
  return 'read';
}

export class GovernanceManager {
  constructor(options = {}) {
    this.engine = new GovernanceEngine(options.projectRoot || process.cwd());
    this._customPolicies = [];
    this.policies = {
      addPolicy: (policy) => {
        this._customPolicies.push(policy);
      },
    };
    this.audit = {
      _entries: [],
      async record(entry = {}) {
        this._entries.push({
          ...entry,
          timestamp: Date.now(),
          id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        });
        return entry;
      },
      query(filter = {}) {
        let results = [...this._entries];
        if (filter.action) {
          results = results.filter((e) => e.action === filter.action);
        }
        if (filter.agentId) {
          results = results.filter((e) => e.agentId === filter.agentId);
        }
        return results.slice(-50);
      },
    };
  }

  async gate(context = {}) {
    await this.engine.init();

    for (const policy of this._customPolicies) {
      const result = policy.condition(context);
      if (!result) {
        await this.audit.record({
          agentId: context.agentId,
          action: context.action,
          resource: context.resource,
          outcome: 'blocked',
          details: { policyId: policy.id, reason: policy.name },
        });
        return { allowed: false, reason: 'policy-violation' };
      }
    }

    if (this._customPolicies.length > 0) {
      await this.audit.record({
        agentId: context.agentId,
        action: context.action,
        resource: context.resource,
        outcome: 'allowed',
        details: context.details,
      });
      return { allowed: true };
    }

    await this.audit.record({
      agentId: context.agentId,
      action: context.action,
      resource: context.resource,
      outcome: 'allowed',
      details: context.details,
    });

    return { allowed: true };
  }
}

export default GovernanceManager;
