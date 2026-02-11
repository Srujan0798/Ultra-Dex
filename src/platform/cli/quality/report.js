// Copyright (c) 2026 Ultra-Dex

/**
 * Quality gate reporting utilities
 */

import chalk from 'chalk';

export function summarizeGateResults(results = []) {
  const summary = {
    total: results.length,
    failed: 0,
    passed: 0,
    warnings: 0,
  };

  results.forEach((gate) => {
    const { rule, value } = gate;
    if (!rule) return;
    const threshold = rule.threshold;
    const isPass =
      value === null
        ? true
        : rule.severity === 'warning'
          ? value >= threshold
          : value >= threshold && value !== null;

    if (isPass) summary.passed += 1;
    else {
      if (rule.severity === 'warning') summary.warnings += 1;
      else summary.failed += 1;
    }
  });

  return summary;
}

export function formatGateTable(results = []) {
  const lines = [];
  lines.push(chalk.gray('Gate                     Result   Threshold   Severity'));
  lines.push(chalk.gray('------------------------------------------------------'));

  results.forEach((gate) => {
    const threshold = gate.rule?.threshold ?? '-';
    const severity = gate.rule?.severity ?? 'info';
    const value = gate.value === null ? 'N/A' : gate.value;
    const pass = gate.value === null ? true : gate.value >= threshold;
    const color = pass ? chalk.green : severity === 'warning' ? chalk.yellow : chalk.red;
    lines.push(
      color(
        `${gate.id.padEnd(24)} ${String(value).padEnd(8)} ${String(threshold).padEnd(10)} ${severity}`
      )
    );
  });

  return lines.join('\n');
}

export function renderGateReportHtml(results = [], summary = null) {
  const rows = results
    .map((gate) => {
      const threshold = gate.rule?.threshold ?? '-';
      const severity = gate.rule?.severity ?? 'info';
      const value = gate.value === null ? 'N/A' : gate.value;
      const pass = gate.value === null ? true : gate.value >= threshold;
      const cls = pass ? 'good' : severity === 'warning' ? 'warn' : 'bad';
      return `<tr class="${cls}">
      <td>${gate.id}</td>
      <td>${value}</td>
      <td>${threshold}</td>
      <td>${severity}</td>
    </tr>`;
    })
    .join('');

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Ultra-Dex Quality Gates</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 24px; background: #0f172a; color: #e2e8f0; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th, td { border: 1px solid #334155; padding: 8px; }
    tr.good { background: #0f3d2e; }
    tr.warn { background: #4a3f0f; }
    tr.bad { background: #4a1010; }
  </style>
</head>
<body>
  <h1>Quality Gate Report</h1>
  ${summary ? `<p>Passed: ${summary.passed} | Failed: ${summary.failed} | Warnings: ${summary.warnings}</p>` : ''}
  <table>
    <thead>
      <tr><th>Gate</th><th>Value</th><th>Threshold</th><th>Severity</th></tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>
</body>
</html>`;
}

export default {
  summarizeGateResults,
  formatGateTable,
  renderGateReportHtml,
};

/**
 * Handle errors in report module
 * @param {Error} error - The error to handle
 * @param {string} [context='report'] - Error context
 */
function handleModuleError(error, context = 'report') {
  try {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
  } catch (_) {
    // Fail silently
  }
}
