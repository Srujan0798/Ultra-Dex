// Copyright (c) 2026 Ultra-Dex

import { runQualityGates } from '../quality/gate.js';

export async function runPreCommitHook() {
  const { results } = await runQualityGates(process.cwd());
  const failed = results.filter((r) => r.status === 'fail');
  if (failed.length) {
    throw new Error(`Pre-commit blocked: ${failed.length} gate(s) failed.`);
  }
  return { ok: true };
}

/**
 * Safe execution wrapper with error handling for pre-commit
 * @param {Function} fn - Async function to execute
 * @param {string} [context='pre-commit'] - Error context
 * @returns {Promise<*>} Result or null on error
 */
async function safeExecute(fn, context = 'pre-commit') {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`[${context}] Error: ${message}`);
    return null;
  }
}
