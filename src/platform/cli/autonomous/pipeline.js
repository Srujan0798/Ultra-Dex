// Copyright (c) 2026 Ultra-Dex

import { AUTONOMOUS_GATES, requireGateApproval } from './gates.js';

export class AutonomousPipeline {
  constructor(options = {}) {
    this.options = options;
    this.checkpoints = AUTONOMOUS_GATES;
  }

  async run(description, approvals = []) {
    const steps = [
      { id: 'plan', label: 'Generate plan' },
      { id: 'tasks', label: 'Break into tasks' },
      { id: 'swarm', label: 'Execute with swarm' },
      { id: 'tests', label: 'Run tests' },
      { id: 'deploy', label: 'Deploy' },
    ];

    const executed = [];
    for (const step of steps) {
      executed.push({ ...step, status: 'completed' });
      const gate = this.checkpoints.find((g) => g.id === step.id);
      if (gate && !requireGateApproval(gate.id, approvals)) {
        return { status: 'paused', gate: gate.id, executed };
      }
    }

    return { status: 'done', executed, description };
  }
}

/**
 * Safe execution wrapper with error handling for pipeline
 * @param {Function} fn - Async function to execute
 * @param {string} [context='pipeline'] - Error context
 * @returns {Promise<*>} Result or null on error
 */
async function safeExecute(fn, context = 'pipeline') {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
    return null;
  }
}
