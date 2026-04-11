// Copyright (c) 2026 Ultra-Dex

import { Logger } from '../utils/logger.js';

const logger = new Logger({ prefix: 'Gates' });

export const AUTONOMOUS_GATES = {
  architecture: {
    id: 'architecture',
    description: 'Architecture approval required',
    blocking: true,
    check: (result) => result && !result.error,
  },
  security: {
    id: 'security',
    description: 'Security review required',
    blocking: true,
    check: (result) => {
      const str = JSON.stringify(result).toLowerCase();
      return !str.includes('password') && !str.includes('secret') && !str.includes('api_key');
    },
    failReason: 'Result may contain sensitive data',
  },
  deploy: {
    id: 'deploy',
    description: 'Deploy confirmation required',
    blocking: true,
    check: () => true,
  },
  quality: {
    id: 'quality',
    description: 'Quality standards check',
    blocking: false,
    check: (result) => result && result.success !== false,
  },
  testing: {
    id: 'testing',
    description: 'Test coverage verification',
    blocking: false,
    check: (result) => result && result.testsPassed !== false,
  },
};

/**
 * Approval Gates manager for autonomous operations
 */
export class ApprovalGates {
  constructor() {
    this.approvals = new Set();
    this.pending = new Set();
  }

  /**
   * Request approval for a gate
   * @param {string} gateId - Gate identifier
   */
  requestApproval(gateId) {
    this.pending.add(gateId);
  }

  /**
   * Grant approval for a gate
   * @param {string} gateId - Gate identifier
   */
  approve(gateId) {
    this.approvals.add(gateId);
    this.pending.delete(gateId);
  }

  /**
   * Check if gate is approved
   * @param {string} gateId - Gate identifier
   * @returns {boolean}
   */
  isApproved(gateId) {
    return this.approvals.has(gateId);
  }

  /**
   * Check if gate requires approval
   * @param {string} gateId - Gate identifier
   * @returns {boolean}
   */
  requiresApproval(gateId) {
    const gate = AUTONOMOUS_GATES[gateId];
    return gate ? gate.blocking : false;
  }

  /**
   * Get pending approvals
   * @returns {Array}
   */
  getPending() {
    return Array.from(this.pending);
  }

  /**
   * Clear all approvals
   */
  reset() {
    this.approvals.clear();
    this.pending.clear();
  }
}

export function requireGateApproval(gateId, approvals = []) {
  return approvals.includes(gateId);
}

/**
 * Handle errors in gates module
 * @param {Error} error - The error to handle
 * @param {string} [context='gates'] - Error context
 */
function _handleModuleError(error, context = 'gates') {
  try {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`[${context}] Error: ${message}`);
  } catch (_) {
    // Fail silently
  }
}
