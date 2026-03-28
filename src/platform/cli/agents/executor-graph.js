// Copyright (c) 2026 Ultra-Dex

/**
 * Executor graph - converts tasks into actionable steps
 */

import { createSimpleGraph, runSimpleGraph } from './graph-utils.js';

const SYSTEM_PROMPT = `You are the Executor agent.
Convert the plan into step-by-step execution instructions.
Return actionable steps with commands or file changes where possible.`;

export function createExecutorGraph(options = {}) {
  return createSimpleGraph({
    ...options,
    nodeName: 'executor',
    systemPrompt: SYSTEM_PROMPT,
  });
}

export async function runExecutorGraph(input, options = {}) {
  return runSimpleGraph(createExecutorGraph, input, options);
}

export default { createExecutorGraph, runExecutorGraph };

/**
 * Safe execution wrapper with error handling for executor-graph
 * @param {Function} fn - Async function to execute
 * @param {string} [context='executor-graph'] - Error context
 * @returns {Promise<*>} Result or null on error
 */
async function safeExecute(fn, context = 'executor-graph') {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`[${context}] Error: ${message}`);
    return null;
  }
}
