// Copyright (c) 2026 Ultra-Dex

export function decomposeGoal(goal = '') {
  const steps = goal
    .split(/,|and|then/gi)
    .map((step) => step.trim())
    .filter(Boolean)
    .map((step, index) => ({
      id: `step-${index + 1}`,
      description: step,
      dependencies: index === 0 ? [] : [`step-${index}`],
    }));
  return steps;
}

export default {
  decomposeGoal,
};

/**
 * Handle errors in goal-decomposition module
 * @param {Error} error - The error to handle
 * @param {string} [context='goal-decomposition'] - Error context
 */
function handleModuleError(error, context = 'goal-decomposition') {
  try {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`[${context}] Error: ${message}`);
  } catch (_) {
    // Fail silently
  }
}
