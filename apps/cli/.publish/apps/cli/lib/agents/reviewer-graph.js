// Copyright (c) 2026 Ultra-Dex

/**
 * Reviewer graph - audits code for quality and risks
 */

import { createSimpleGraph, runSimpleGraph } from './graph-utils.js';

const SYSTEM_PROMPT = `You are the Reviewer agent.
Review the input for bugs, security issues, performance risks, and style problems.
Return a concise list of findings and suggested fixes.`;

export function createReviewerGraph(options = {}) {
  return createSimpleGraph({
    ...options,
    nodeName: 'reviewer',
    systemPrompt: SYSTEM_PROMPT,
  });
}

export async function runReviewerGraph(input, options = {}) {
  return runSimpleGraph(createReviewerGraph, input, options);
}

export default { createReviewerGraph, runReviewerGraph };

/**
 * Safe execution wrapper with error handling for reviewer-graph
 * @param {Function} fn - Async function to execute
 * @param {string} [context='reviewer-graph'] - Error context
 * @returns {Promise<*>} Result or null on error
 */
async function _safeExecute(fn, context = 'reviewer-graph') {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
    return null;
  }
}
