// Copyright (c) 2026 Ultra-Dex

/**
 * Architect graph - produces high-level system design guidance
 */

import { createSimpleGraph, runSimpleGraph } from './graph-utils.js';

const SYSTEM_PROMPT = `You are the Architect agent.
Design a high-level system architecture based on the input.
Return components, data flow, and key design decisions.`;

export function createArchitectGraph(options = {}) {
  return createSimpleGraph({
    ...options,
    nodeName: 'architect',
    systemPrompt: SYSTEM_PROMPT,
  });
}

export async function runArchitectGraph(input, options = {}) {
  return runSimpleGraph(createArchitectGraph, input, options);
}

export default { createArchitectGraph, runArchitectGraph };

/**
 * Safe execution wrapper with error handling for architect-graph
 * @param {Function} fn - Async function to execute
 * @param {string} [context='architect-graph'] - Error context
 * @returns {Promise<*>} Result or null on error
 */
async function safeExecute(fn, context = 'architect-graph') {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
    return null;
  }
}
