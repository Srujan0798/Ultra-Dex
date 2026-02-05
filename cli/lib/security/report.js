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
      ...findings.map((finding) => `- [${finding.severity}] ${finding.file}:${finding.line} ${finding.message}`)
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
    ...findings.map((finding) => `- **${finding.severity.toUpperCase()}** ${finding.file}:${finding.line} - ${finding.message}`)
  ].join('\n');
}
