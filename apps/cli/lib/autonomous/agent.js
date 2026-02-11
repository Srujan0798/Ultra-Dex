// Copyright (c) 2026 Ultra-Dex

import { AutonomousPipeline } from './pipeline.js';

export class AutonomousAgent {
  constructor(options = {}) {
    this.pipeline = new AutonomousPipeline(options);
  }

  async execute(description, approvals = []) {
    return await this.pipeline.run(description, approvals);
  }
}

/**
 * Safe execution wrapper with error handling for agent
 * @param {Function} fn - Async function to execute
 * @param {string} [context='agent'] - Error context
 * @returns {Promise<*>} Result or null on error
 */
async function safeExecute(fn, context = 'agent') {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
    return null;
  }
}
