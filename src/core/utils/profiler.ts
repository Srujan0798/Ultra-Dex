import { performance } from "perf_hooks";
import chalk from "chalk";
import { logger } from './logging.js';
const metrics = /* @__PURE__ */ new Map();
const activeTimers = /* @__PURE__ */ new Map();
function startTimer(label) {
  activeTimers.set(label, performance.now());
}
function endTimer(label) {
  const startTime = activeTimers.get(label);
  if (!startTime) {
    logger.warn(chalk.yellow(`\u26A0\uFE0F  No timer found for: ${label}`));
    return 0;
  }
  const duration = performance.now() - startTime;
  activeTimers.delete(label);
  if (!metrics.has(label)) {
    metrics.set(label, []);
  }
  metrics.get(label).push(duration);
  return duration;
}
async function timeAsync(label, fn) {
  startTimer(label);
  try {
    const result = await fn();
    const duration = endTimer(label);
    logger.log(chalk.dim(`\u23F1\uFE0F  ${label}: ${formatDuration(duration)}`));
    return result;
  } catch (error) {
    endTimer(label);
    throw error;
  }
}
function timeSync(label, fn) {
  startTimer(label);
  try {
    const result = fn();
    const duration = endTimer(label);
    logger.log(chalk.dim(`\u23F1\uFE0F  ${label}: ${formatDuration(duration)}`));
    return result;
  } catch (error) {
    endTimer(label);
    throw error;
  }
}
function formatDuration(ms) {
  if (ms < 1) {
    return `${(ms * 1e3).toFixed(2)}\u03BCs`;
  } else if (ms < 1e3) {
    return `${ms.toFixed(2)}ms`;
  } else {
    return `${(ms / 1e3).toFixed(2)}s`;
  }
}
function getStatistics() {
  const stats = {};
  for (const [label, durations] of metrics) {
    if (durations.length === 0)
      continue;
    const sorted = [...durations].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);
    stats[label] = {
      count: durations.length,
      total: sum,
      average: sum / durations.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)] || sorted[sorted.length - 1]
    };
  }
  return stats;
}
function showReport() {
  const stats = getStatistics();
  const labels = Object.keys(stats).sort((a, b) => stats[b].total - stats[a].total);
  if (labels.length === 0) {
    logger.log(chalk.yellow("\n\u26A0\uFE0F  No performance data collected\n"));
    return;
  }
  logger.log(chalk.bold("\n\u{1F4CA} Performance Report\n"));
  logger.log(chalk.dim("\u2500".repeat(80)));
  logger.log(
    chalk.bold("Operation").padEnd(30),
    chalk.bold("Count").padStart(6),
    chalk.bold("Total").padStart(10),
    chalk.bold("Avg").padStart(10),
    chalk.bold("Min").padStart(10),
    chalk.bold("Max").padStart(10)
  );
  logger.log(chalk.dim("\u2500".repeat(80)));
  for (const label of labels) {
    const s = stats[label];
    logger.log(
      label.substring(0, 29).padEnd(30),
      String(s.count).padStart(6),
      formatDuration(s.total).padStart(10),
      formatDuration(s.average).padStart(10),
      formatDuration(s.min).padStart(10),
      formatDuration(s.max).padStart(10)
    );
  }
  logger.log(chalk.dim("\u2500".repeat(80)));
  const grandTotal = Object.values(stats).reduce((sum, s) => sum + s.total, 0);
  logger.log(chalk.bold(`
Total time: ${formatDuration(grandTotal)}`));
  logger.log(chalk.dim(`Operations profiled: ${labels.length}
`));
}
function clearMetrics() {
  metrics.clear();
  activeTimers.clear();
}
async function profileCommand(commandName, commandFn) {
  logger.log(chalk.bold(`
\u{1F50D} Profiling: ${commandName}
`));
  const startTime = performance.now();
  try {
    await commandFn();
  } finally {
    const totalTime = performance.now() - startTime;
    logger.log(chalk.bold(`
\u2705 Command completed in ${formatDuration(totalTime)}`));
    showReport();
    provideSuggestions();
  }
}
function provideSuggestions() {
  const stats = getStatistics();
  const suggestions = [];
  for (const [label, data] of Object.entries(stats)) {
    if (data.average > 1e3) {
      if (label.includes("file") || label.includes("read")) {
        suggestions.push(`\u2022 ${label}: Consider caching file reads or using async batching`);
      }
      if (label.includes("scan") || label.includes("glob")) {
        suggestions.push(
          `\u2022 ${label}: Consider excluding directories or using incremental scanning`
        );
      }
      if (label.includes("fetch") || label.includes("api")) {
        suggestions.push(`\u2022 ${label}: Consider implementing request caching or parallelization`);
      }
    }
    if (data.count > 10 && data.average > 100) {
      suggestions.push(`\u2022 ${label}: Called ${data.count} times, consider batching or memoization`);
    }
  }
  if (suggestions.length > 0) {
    logger.log(chalk.cyan("\n\u{1F4A1} Optimization Suggestions:\n"));
    suggestions.forEach((s) => logger.log(s));
    logger.log();
  }
}
var profiler_default = {
  startTimer,
  endTimer,
  timeAsync,
  timeSync,
  getStatistics,
  showReport,
  clearMetrics,
  profileCommand
};
export {
  clearMetrics,
  profiler_default as default,
  endTimer,
  getStatistics,
  profileCommand,
  showReport,
  startTimer,
  timeAsync,
  timeSync
};
