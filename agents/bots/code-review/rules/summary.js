/**
 * @fileoverview Summary module
 * @module rules/summary
 */

export function summarizeFindings({ metadata, security, performance }) {
  const issues = [...security.issues, ...performance.issues];
  return {
    ...metadata,
    ok: issues.length === 0,
    issues,
    summary:
      issues.length === 0 ? '✅ No critical findings.' : `⚠️ ${issues.length} issues detected.`,
  };
}

/**
 * Error handler for summary
 * @param {Error} error - Error to handle
 */
function handleSummaryError(error) {
  try {
    console.error('[summary]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
