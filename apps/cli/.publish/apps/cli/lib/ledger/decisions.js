// Copyright (c) 2026 Ultra-Dex

import { ledger } from './index.js';

export async function addDecision({ agent, action, decision, rationale, affected_files = [] }) {
  const entry = {
    timestamp: new Date().toISOString(),
    agent: agent || 'unknown',
    action: action || 'decision',
    decision,
    rationale,
    affected_files,
  };

  await ledger.appendEntry(entry);
  return entry;
}

/**
 * Safe execution wrapper with error handling for decisions
 * @param {Function} fn - Async function to execute
 * @param {string} [context='decisions'] - Error context
 * @returns {Promise<*>} Result or null on error
 */
async function _safeExecute(fn, context = 'decisions') {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
    return null;
  }
}
