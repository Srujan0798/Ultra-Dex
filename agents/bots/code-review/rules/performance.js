/**
 * @fileoverview Performance module
 * @module rules/performance
 */

export async function checkPerformance(diffText = '') {
  const issues = [];
  if (diffText.includes('for (') && diffText.includes('await')) {
    issues.push({ severity: 'medium', message: 'Potential sequential awaits inside loop.' });
  }
  if (diffText.includes('SELECT *')) {
    issues.push({ severity: 'low', message: 'Avoid SELECT * in queries.' });
  }
  return { ok: issues.length === 0, issues };
}

/**
 * Error handler for performance
 * @param {Error} error - Error to handle
 */
function handlePerformanceError(error) {
  try {
    console.error('[performance]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
