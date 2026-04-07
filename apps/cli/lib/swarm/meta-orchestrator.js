// Copyright (c) 2026 Ultra-Dex

import { executeSwarm } from './orchestrator.js';
import { classifyTask } from '../router/model-router.js';

export function selectAgents(tier) {
  const mapping = {
    leadership: ['cto', 'planner', 'research'],
    development: ['backend', 'frontend', 'database'],
    security: ['auth', 'security'],
    devops: ['devops'],
    quality: ['testing', 'reviewer', 'debugger'],
    specialist: ['performance', 'refactoring'],
  };
  return mapping[tier] || ['planner'];
}

export async function orchestrate(task, options = {}) {
  const tier = classifyTask(task)?.tier || 'leadership';
  const agents = selectAgents(tier);
  return executeSwarm(agents, task, options);
}

export default { orchestrate, selectAgents };

/**
 * Safe execution wrapper with error handling for meta-orchestrator
 * @param {Function} fn - Async function to execute
 * @param {string} [context='meta-orchestrator'] - Error context
 * @returns {Promise<*>} Result or null on error
 */
async function _safeExecute(fn, context = 'meta-orchestrator') {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
    return null;
  }
}
