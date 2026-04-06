// Copyright (c) 2026 Ultra-Dex

import { GovernanceEngine } from '../../platform/cli/governance/index.js';
import { AuditDatabase } from './audit-db.js';
import { v4 as uuidv4 } from 'uuid';

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

    // Initialize audit database
    const dbPath = options.auditDbPath || undefined;
    this._auditDb = new AuditDatabase(dbPath);

    this.audit = {
      /**
       * Record an audit entry to the database
       * @param {Object} entry - Audit entry
       */
      async record(entry = {}) {
        const auditEntry = {
          ...entry,
          timestamp: Date.now(),
          id: entry.id || `audit-${uuidv4()}`,
        };
        await this._db.insert(auditEntry);
        return auditEntry;
      },

      /**
       * Query audit entries from the database
       * @param {Object} filter - Query filter
       * @returns {Promise<Array>} Array of audit entries
       */
      async query(filter = {}) {
        return this._db.query(filter);
      },

      // Reference to the database instance for internal use
      _db: this._auditDb,
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
          task: context.resource,
          result: 'blocked',
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
        task: context.resource,
        result: 'allowed',
        outcome: 'allowed',
        details: context.details,
      });
      return { allowed: true };
    }

    await this.audit.record({
      agentId: context.agentId,
      action: context.action,
      task: context.resource,
      result: 'allowed',
      outcome: 'allowed',
      details: context.details,
    });

    return { allowed: true };
  }

  /**
   * Get the audit log (for backward compatibility)
   * @returns {Promise<Array>} Array of audit entries
   */
  async getAuditLog() {
    return this.audit.query({ limit: 50 });
  }

  /**
   * Close the audit database connection
   */
  async close() {
    await this._auditDb.close();
  }
}

export default GovernanceManager;
