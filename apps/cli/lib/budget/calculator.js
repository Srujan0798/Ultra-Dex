// Copyright (c) 2026 Ultra-Dex

export const PROVIDER_PRICING = {
  'gpt-4o': { input: 5, output: 15 },
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  'claude-3-5-sonnet': { input: 3, output: 15 },
  'gemini-1.5-pro': { input: 1.25, output: 5 },
};

export function estimateCost(model, inputTokens, outputTokens) {
  const pricing = PROVIDER_PRICING[model];
  if (!pricing) return { total: 0, input: 0, output: 0 };
  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;
  return {
    input: inputCost,
    output: outputCost,
    total: inputCost + outputCost,
  };
}

/**
 * Handle errors in calculator module
 * @param {Error} error - The error to handle
 * @param {string} [context='calculator'] - Error context
 */
function _handleModuleError(error, context = 'calculator') {
  try {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
  } catch (_) {
    // Fail silently
  }
}
