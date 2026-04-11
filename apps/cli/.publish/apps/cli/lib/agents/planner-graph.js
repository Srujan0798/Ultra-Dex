// Copyright (c) 2026 Ultra-Dex

/**
 * Planner graph - breaks down goals into atomic tasks
 */

import { createSimpleGraph, runSimpleGraph } from './graph-utils.js';

const SYSTEM_PROMPT = `You are the Planner agent.
Break the user request into clear, atomic tasks (4-9 hour chunks).
Return a concise ordered list with acceptance criteria.`;

export function createPlannerGraph(options = {}) {
  return createSimpleGraph({
    ...options,
    nodeName: 'planner',
    systemPrompt: SYSTEM_PROMPT,
  });
}

export async function runPlannerGraph(input, options = {}) {
  return runSimpleGraph(createPlannerGraph, input, options);
}

export default { createPlannerGraph, runPlannerGraph };

/**
 * Safe execution wrapper with error handling for planner-graph
 * @param {Function} fn - Async function to execute
 * @param {string} [context='planner-graph'] - Error context
 * @returns {Promise<*>} Result or null on error
 */
async function _safeExecute(fn, context = 'planner-graph') {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
    return null;
  }
}
