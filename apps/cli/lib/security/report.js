// Copyright (c) 2026 Ultra-Dex

export function summarizeFindings(findings) {
  const summary = { critical: 0, warning: 0, info: 0 };
  findings.forEach((finding) => {
    if (summary[finding.severity] !== undefined) {
      summary[finding.severity] += 1;
    }
  });
  return summary;
}

export function formatSecurityReport(findings, format = 'markdown') {
  const summary = summarizeFindings(findings);

  if (format === 'json') {
    return JSON.stringify({ summary, findings }, null, 2);
  }

  if (format === 'text') {
    return [
      `Security Report`,
      `Critical: ${summary.critical}`,
      `Warnings: ${summary.warning}`,
      `Info: ${summary.info}`,
      '',
      ...findings.map(
        (finding) => `- [${finding.severity}] ${finding.file}:${finding.line} ${finding.message}`
      ),
    ].join('\n');
  }

  return [
    `# Security Report`,
    '',
    `- Critical: ${summary.critical}`,
    `- Warnings: ${summary.warning}`,
    `- Info: ${summary.info}`,
    '',
    '## Findings',
    ...findings.map(
      (finding) =>
        `- **${finding.severity.toUpperCase()}** ${finding.file}:${finding.line} - ${finding.message}`
    ),
  ].join('\n');
}

/**
 * Handle errors in report module
 * @param {Error} error - The error to handle
 * @param {string} [context='report'] - Error context
 */
function _handleModuleError(error, context = 'report') {
  try {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
  } catch (_) {
    // Fail silently
  }
}
