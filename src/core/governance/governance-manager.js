// Copyright (c) 2026 Ultra-Dex

/**
 * Enterprise Governance — Compliance, Audit Trails, Approval Workflows
 *
 * Enterprise customers need three things before they'll put AI in production:
 *   1. Audit trail  — who did what, when, and why (immutable log)
 *   2. Policies     — what agents are allowed to do (guardrails)
 *   3. Approvals    — human-in-the-loop for high-risk actions
 *
 * This module provides all three with zero config for getting started,
 * and deep customization for enterprise requirements.
 *
 * @module Governance
 * @version 1.0.0
 */

/**
 * Exception thrown when governance policy blocks an operation
 */
export class GovernanceDeniedException extends Error {
  constructor(message, context) {
    super(message);
    this.name = 'GovernanceDeniedException';
    this.context = context;
  }
}

import { EventEmitter } from 'events';
import { createHash } from 'crypto';

// ───────────────────────────────────────────────────────────────────────────
// Audit Trail — Immutable, tamper-evident log of all agent actions
// ───────────────────────────────────────────────────────────────────────────

export class AuditTrail {
  constructor({ maxEntries = 10000 } = {}) {
    this.entries = [];
    this.maxEntries = maxEntries;
    this.lastHash = '0';
  }

  /**
   * Record an audit event (entries are hash-chained for integrity)
   */
  record({ agentId, action, resource = null, details = {}, userId = null, outcome = 'success' }) {
    const entry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
      agentId,
      action,
      resource,
      details,
      userId,
      outcome,
      previousHash: this.lastHash,
    };

    // Hash-chain for tamper evidence
    entry.hash = createHash('sha256')
      .update(JSON.stringify({ ...entry, hash: undefined }))
      .digest('hex')
      .slice(0, 16);

    this.lastHash = entry.hash;
    this.entries.push(entry);

    // Evict oldest if over limit
    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(-this.maxEntries);
    }

    return entry;
  }

  /**
   * Verify integrity of the entire audit chain
   */
  verifyIntegrity() {
    for (let i = 1; i < this.entries.length; i++) {
      if (this.entries[i].previousHash !== this.entries[i - 1].hash) {
        return { valid: false, brokenAt: i, entry: this.entries[i].id };
      }
    }
    return { valid: true, entries: this.entries.length };
  }

  /**
   * Query audit entries with filtering
   */
  query({ agentId, action, resource, userId, since, until, limit = 50 } = {}) {
    let results = [...this.entries];
    if (agentId) results = results.filter((e) => e.agentId === agentId);
    if (action) results = results.filter((e) => e.action === action);
    if (resource) results = results.filter((e) => e.resource === resource);
    if (userId) results = results.filter((e) => e.userId === userId);
    if (since) results = results.filter((e) => e.timestamp >= since);
    if (until) results = results.filter((e) => e.timestamp <= until);
    return results.slice(-limit);
  }

  getStats() {
    const now = Date.now();
    const lastHour = this.entries.filter((e) => now - e.timestamp < 3600000);
    const byAction = {};
    for (const e of this.entries) {
      byAction[e.action] = (byAction[e.action] || 0) + 1;
    }
    return {
      totalEntries: this.entries.length,
      lastHourCount: lastHour.length,
      byAction,
      integrityValid: this.verifyIntegrity().valid,
    };
  }
}

// ───────────────────────────────────────────────────────────────────────────
// Policy Engine — Define and enforce rules for agent behavior
// ───────────────────────────────────────────────────────────────────────────

export class PolicyEngine {
  constructor() {
    this.policies = new Map();
    this.violations = [];
  }

  /**
   * Define a policy rule
   */
  addPolicy({ id, name, description = '', scope = 'global', condition, enforcement = 'block' }) {
    this.policies.set(id, {
      id,
      name,
      description,
      scope,
      condition,
      enforcement,
      enabled: true,
      created: Date.now(),
      violationCount: 0,
    });
  }

  /**
   * Set default enterprise policies
   */
  loadDefaults() {
    this.addPolicy({
      id: 'no-delete-production',
      name: 'Prevent Production Deletion',
      description: 'Agents cannot delete production resources',
      condition: (ctx) => !(ctx.action === 'delete' && ctx.environment === 'production'),
      enforcement: 'block',
    });

    this.addPolicy({
      id: 'budget-limit',
      name: 'Per-Request Budget Limit',
      description: 'Single request cannot exceed $1',
      condition: (ctx) => (ctx.estimatedCost || 0) <= 1.0,
      enforcement: 'block',
    });

    this.addPolicy({
      id: 'require-approval-deploy',
      name: 'Require Approval for Deployments',
      description: 'All deployments must be approved by a human',
      condition: (ctx) => ctx.action !== 'deploy' || ctx.approved === true,
      enforcement: 'require-approval',
    });

    this.addPolicy({
      id: 'no-pii-logging',
      name: 'No PII in Logs',
      description: 'Agent outputs must not contain PII patterns',
      condition: (ctx) => {
        const text = JSON.stringify(ctx.output || '');
        const piiPatterns = [
          /\b\d{3}-\d{2}-\d{4}\b/, // SSN
          /\b\d{16}\b/, // Credit card
          /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i, // Email
        ];
        return !piiPatterns.some((p) => p.test(text));
      },
      enforcement: 'warn',
    });

    this.addPolicy({
      id: 'rate-limit',
      name: 'Agent Rate Limit',
      description: 'No more than 100 actions per minute per agent',
      scope: 'per-agent',
      condition: (ctx) => (ctx.actionsInLastMinute || 0) <= 100,
      enforcement: 'block',
    });
  }

  /**
   * Evaluate all applicable policies against a context
   */
  evaluate(context) {
    const results = [];
    let blocked = false;
    let requiresApproval = false;

    for (const [id, policy] of this.policies) {
      if (!policy.enabled) continue;

      try {
        const passed = policy.condition(context);
        if (!passed) {
          policy.violationCount++;
          const violation = {
            policyId: id,
            policyName: policy.name,
            enforcement: policy.enforcement,
            timestamp: Date.now(),
            context: { agentId: context.agentId, action: context.action },
          };
          this.violations.push(violation);

          if (policy.enforcement === 'block') blocked = true;
          if (policy.enforcement === 'require-approval') requiresApproval = true;
          results.push({ ...violation, passed: false });
        } else {
          results.push({ policyId: id, policyName: policy.name, passed: true });
        }
      } catch (error) {
        results.push({
          policyId: id,
          policyName: policy.name,
          passed: false,
          error: error.message,
        });
        blocked = true; // fail-closed
      }
    }

    return { allowed: !blocked, requiresApproval, results };
  }

  getPolicy(id) {
    return this.policies.get(id);
  }

  listPolicies() {
    return [...this.policies.values()].map(({ condition, ...rest }) => rest);
  }

  disablePolicy(id) {
    const p = this.policies.get(id);
    if (p) p.enabled = false;
  }

  enablePolicy(id) {
    const p = this.policies.get(id);
    if (p) p.enabled = true;
  }

  getViolations(limit = 50) {
    return this.violations.slice(-limit);
  }

  getStats() {
    return {
      totalPolicies: this.policies.size,
      enabled: [...this.policies.values()].filter((p) => p.enabled).length,
      totalViolations: this.violations.length,
      byPolicy: Object.fromEntries(
        [...this.policies.values()].map((p) => [
          p.id,
          { name: p.name, violations: p.violationCount },
        ])
      ),
    };
  }
}

// ───────────────────────────────────────────────────────────────────────────
// Approval Workflow — Human-in-the-loop for high-risk actions
// ───────────────────────────────────────────────────────────────────────────

export class ApprovalWorkflow extends EventEmitter {
  constructor({ autoApproveTimeout = null } = {}) {
    super();
    this.pending = new Map();
    this.history = [];
    this.autoApproveTimeout = autoApproveTimeout;
  }

  /**
   * Request approval for a high-risk action
   */
  requestApproval({
    requestId = null,
    agentId,
    action,
    resource = null,
    reason = '',
    riskLevel = 'medium',
  }) {
    const id = requestId || `approval-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const request = {
      id,
      agentId,
      action,
      resource,
      reason,
      riskLevel,
      status: 'pending',
      requestedAt: Date.now(),
      resolvedAt: null,
      resolvedBy: null,
      decision: null,
    };

    this.pending.set(id, request);
    this.emit('approval:requested', request);

    if (this.autoApproveTimeout) {
      setTimeout(() => {
        if (this.pending.has(id) && this.pending.get(id).status === 'pending') {
          this.approve(id, 'system', 'Auto-approved after timeout');
        }
      }, this.autoApproveTimeout);
    }

    return id;
  }

  /**
   * Approve a pending request
   */
  approve(requestId, userId = 'admin', comment = '') {
    const req = this.pending.get(requestId);
    if (!req) return null;
    if (req.status !== 'pending') return req;

    req.status = 'approved';
    req.resolvedAt = Date.now();
    req.resolvedBy = userId;
    req.comment = comment;
    req.decision = 'approved';

    this.pending.delete(requestId);
    this.history.push(req);
    this.emit('approval:approved', req);
    return req;
  }

  /**
   * Reject a pending request
   */
  reject(requestId, userId = 'admin', comment = '') {
    const req = this.pending.get(requestId);
    if (!req) return null;
    if (req.status !== 'pending') return req;

    req.status = 'rejected';
    req.resolvedAt = Date.now();
    req.resolvedBy = userId;
    req.comment = comment;
    req.decision = 'rejected';

    this.pending.delete(requestId);
    this.history.push(req);
    this.emit('approval:rejected', req);
    return req;
  }

  getPending() {
    return [...this.pending.values()];
  }

  getHistory(limit = 50) {
    return this.history.slice(-limit);
  }

  getStats() {
    const approved = this.history.filter((r) => r.decision === 'approved').length;
    const avgResponseTime =
      this.history.length > 0
        ? this.history.reduce((sum, r) => sum + (r.resolvedAt - r.requestedAt), 0) /
          this.history.length
        : 0;

    return {
      pending: this.pending.size,
      totalProcessed: this.history.length,
      approved,
      rejected: this.history.length - approved,
      approvalRate:
        this.history.length > 0 ? Math.round((approved / this.history.length) * 100) : 0,
      avgResponseTimeMs: Math.round(avgResponseTime),
    };
  }
}

// ───────────────────────────────────────────────────────────────────────────
// Governance Manager — Orchestrates all compliance subsystems
// ───────────────────────────────────────────────────────────────────────────

export class GovernanceManager extends EventEmitter {
  constructor(config = {}) {
    super();
    this.audit = new AuditTrail(config.audit);
    this.policies = new PolicyEngine();
    this.approvals = new ApprovalWorkflow(config.approvals);

    if (config.loadDefaults !== false) {
      this.policies.loadDefaults();
    }
  }

  /**
   * Gate an agent action through the full governance pipeline:
   *   1. Evaluate policies
   *   2. If approval required → queue for human review
   *   3. Record in audit trail
   */
  async gate(context) {
    // 1. Policy evaluation
    const evaluation = this.policies.evaluate(context);

    // 2. Record attempt in audit trail
    this.audit.record({
      agentId: context.agentId,
      action: context.action,
      resource: context.resource,
      details: { policyResult: evaluation.allowed ? 'allowed' : 'blocked' },
      outcome: evaluation.allowed ? 'allowed' : 'blocked',
    });

    // 3. If blocked, emit and return
    if (!evaluation.allowed) {
      this.emit('governance:blocked', { context, evaluation });
      return { allowed: false, reason: 'policy-violation', evaluation };
    }

    // 4. If approval required, create request
    if (evaluation.requiresApproval) {
      const approvalId = this.approvals.requestApproval({
        agentId: context.agentId,
        action: context.action,
        resource: context.resource,
        reason: 'Policy requires human approval',
        riskLevel: context.riskLevel || 'high',
      });
      this.emit('governance:approval-required', { context, approvalId });
      return { allowed: false, reason: 'approval-required', approvalId };
    }

    // 5. Allowed
    this.emit('governance:allowed', context);
    return { allowed: true };
  }

  getDashboard() {
    return {
      audit: this.audit.getStats(),
      policies: this.policies.getStats(),
      approvals: this.approvals.getStats(),
    };
  }
}

export default GovernanceManager;
