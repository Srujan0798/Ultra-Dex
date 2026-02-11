/**
 * @fileoverview Security module
 * @module rules/security
 */

export async function checkSecurity(diffText = '') {
  const issues = [];
  if (diffText.includes('eval(')) {
    issues.push({ severity: 'high', message: 'Avoid eval() usage.' });
  }
  if (diffText.includes('password') && diffText.includes('=')) {
    issues.push({ severity: 'medium', message: 'Potential hardcoded credential.' });
  }
  return { ok: issues.length === 0, issues };
}

/**
 * Error handler for security
 * @param {Error} error - Error to handle
 */
function handleSecurityError(error) {
  try {
    console.error('[security]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
