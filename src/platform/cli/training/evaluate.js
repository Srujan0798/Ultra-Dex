// Copyright (c) 2026 Ultra-Dex

import { loadDataset } from './dataset.js';

export async function evaluateDataset(dataset = 'default') {
  const data = await loadDataset(dataset);
  const totals = { samples: 0, success: 0, failure: 0 };

  for (const entry of data) {
    if (entry.type !== 'sample') continue;
    totals.samples += 1;
    if (entry.outcome === 'success') totals.success += 1;
    if (entry.outcome === 'failure') totals.failure += 1;
  }

  const successRate = totals.samples ? totals.success / totals.samples : 0;
  return {
    dataset,
    totals,
    successRate,
  };
}

export default {
  evaluateDataset,
};

/**
 * Safe execution wrapper with error handling for evaluate
 * @param {Function} fn - Async function to execute
 * @param {string} [context='evaluate'] - Error context
 * @returns {Promise<*>} Result or null on error
 */
async function safeExecute(fn, context = 'evaluate') {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
    return null;
  }
}
