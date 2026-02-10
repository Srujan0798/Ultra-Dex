// Copyright (c) 2026 Ultra-Dex

/**
 * Debugger graph - analyzes failures and proposes fixes
 */

import { createSimpleGraph, runSimpleGraph } from './graph-utils.js';

const SYSTEM_PROMPT = `You are the Debugger agent.
Analyze the error log or code snippet, identify root cause, and propose a fix.
Return: root cause, fix steps, and verification steps.`;

export function createDebuggerGraph(options = {}) {
  return createSimpleGraph({
    ...options,
    nodeName: 'debugger',
    systemPrompt: SYSTEM_PROMPT,
  });
}

export async function runDebuggerGraph(input, options = {}) {
  return runSimpleGraph(createDebuggerGraph, input, options);
}

export default { createDebuggerGraph, runDebuggerGraph };

/**
 * Safe execution wrapper with error handling for debugger-graph
 * @param {Function} fn - Async function to execute
 * @param {string} [context='debugger-graph'] - Error context
 * @returns {Promise<*>} Result or null on error
 */
async function safeExecute(fn, context = 'debugger-graph') {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
    return null;
  }
}
