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
    this.audit = {
      async record(entry = {}) {
        return entry;
      },
    };
  }

  async gate(context = {}) {
    await this.engine.init();

    const agentRole = context.agentId || 'default';
    const action = normalizeAction(context.action);
    const target = context.resource || context.details?.toolName || context.details?.task || '';

    return this.engine.authorize(agentRole, action, target);
  }
}

export default GovernanceManager;
