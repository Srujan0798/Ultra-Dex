// Copyright (c) 2026 Ultra-Dex

export function detectFailureType(logs = '') {
  const text = logs.toLowerCase();
  if (text.includes('lint') || text.includes('eslint')) return 'lint';
  if (text.includes('test') || text.includes('jest') || text.includes('vitest')) return 'tests';
  if (text.includes('type') || text.includes('tsc')) return 'type';
  if (text.includes('build') || text.includes('compile')) return 'build';
  return 'unknown';
}

export function suggestStrategy(type) {
  switch (type) {
    case 'lint':
      return 'Run lint autofix and re-run CI.';
    case 'tests':
      return 'Inspect failing tests, update mocks or implementation.';
    case 'type':
      return 'Fix TypeScript type errors and re-run build.';
    case 'build':
      return 'Check missing dependencies or incorrect build config.';
    default:
      return 'Manual inspection required.';
  }
}

export default {
  detectFailureType,
  suggestStrategy,
};

/**
 * Handle errors in strategies module
 * @param {Error} error - The error to handle
 * @param {string} [context='strategies'] - Error context
 */
function _handleModuleError(error, context = 'strategies') {
  try {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
  } catch (_) {
    // Fail silently
  }
}
