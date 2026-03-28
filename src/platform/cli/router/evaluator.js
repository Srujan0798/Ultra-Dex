// Copyright (c) 2026 Ultra-Dex

import { runQualityGates } from '../quality/gate.js';

export async function evaluateOutput({
  output = '',
  projectDir = process.cwd(),
  requireQuality = false,
} = {}) {
  if (!requireQuality) {
    return { passed: Boolean(output), reason: output ? 'Output present' : 'Empty output' };
  }

  const { results } = await runQualityGates(projectDir);
  const failed = results.filter((result) => {
    const threshold = result.rule?.threshold ?? null;
    if (threshold === null) return false;
    if (result.value === null || result.value === undefined) return false;
    return result.rule?.severity === 'error' && result.value < threshold;
  });

  return {
    passed: failed.length === 0,
    reason: failed.length ? `${failed.length} quality gates failed` : 'Quality gates passed',
    failed,
  };
}

/**
 * Safe execution wrapper with error handling for evaluator
 * @param {Function} fn - Async function to execute
 * @param {string} [context='evaluator'] - Error context
 * @returns {Promise<*>} Result or null on error
 */
async function safeExecute(fn, context = 'evaluator') {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`[${context}] Error: ${message}`);
    return null;
  }
}
