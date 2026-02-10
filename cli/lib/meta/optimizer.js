// Copyright (c) 2026 Ultra-Dex

import { evaluatePerformance } from './evaluator.js';

export async function suggestOptimization() {
  const metrics = await evaluatePerformance();
  if (metrics.total === 0) {
    return { recommendation: 'Collect more outcomes to tune prompts.', metrics };
  }

  if (metrics.successRate < 0.7) {
    return { recommendation: 'Increase review steps and add stricter validation.', metrics };
  }

  if (metrics.averageRating !== null && metrics.averageRating < 3.5) {
    return { recommendation: 'Refine prompt tone and add more examples.', metrics };
  }

  return { recommendation: 'Performance healthy. Keep monitoring.', metrics };
}

/**
 * Safe execution wrapper with error handling for optimizer
 * @param {Function} fn - Async function to execute
 * @param {string} [context='optimizer'] - Error context
 * @returns {Promise<*>} Result or null on error
 */
async function safeExecute(fn, context = 'optimizer') {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
    return null;
  }
}
