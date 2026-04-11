import { performance } from 'perf_hooks';
import fs from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { logger } from './logging.js';
const PERF_DIR = '.ultra-dex';
const PERF_FILE = 'performance.json';
class PerformanceTracker {
  metrics;
  sessionStart;
  currentOperation;
  constructor() {
    this.metrics = [];
    this.sessionStart = performance.now();
    this.currentOperation = null;
  }
  start(operation, metadata = {}) {
    this.currentOperation = {
      name: operation,
      startTime: performance.now(),
      startMemory: process.memoryUsage(),
      metadata,
    };
    return this;
  }
  end(result = 'success', error = null) {
    if (!this.currentOperation) return null;
    const endTime = performance.now();
    const endMemory = process.memoryUsage();
    const duration = endTime - this.currentOperation.startTime;
    const metric = {
      timestamp: /* @__PURE__ */ new Date().toISOString(),
      operation: this.currentOperation.name,
      duration: Math.round(duration * 100) / 100,
      durationFormatted: this.formatDuration(duration),
      memoryDelta: {
        heapUsed: endMemory.heapUsed - this.currentOperation.startMemory.heapUsed,
        external: endMemory.external - this.currentOperation.startMemory.external,
        rss: endMemory.rss - this.currentOperation.startMemory.rss,
      },
      result,
      error: error ? error.message : null,
      metadata: this.currentOperation.metadata,
    };
    this.metrics.push(metric);
    this.currentOperation = null;
    return metric;
  }
  formatDuration(ms) {
    if (ms < 1e3) return `${Math.round(ms)}ms`;
    if (ms < 6e4) return `${(ms / 1e3).toFixed(1)}s`;
    const minutes = Math.floor(ms / 6e4);
    const seconds = ((ms % 6e4) / 1e3).toFixed(1);
    return `${minutes}m ${seconds}s`;
  }
  save() {
    const perfPath = join(process.cwd(), PERF_DIR, PERF_FILE);
    let existing = [];
    if (fs.existsSync(perfPath)) {
      try {
        existing = JSON.parse(fs.readFileSync(perfPath, 'utf8'));
      } catch (error) {
        // Corrupted metrics file - will be overwritten with new data
      }
    } else {
      fs.mkdirSync(join(process.cwd(), PERF_DIR), { recursive: true });
    }
    const allMetrics = [...existing, ...this.metrics];
    const trimmed = allMetrics.slice(-1e3);
    fs.writeFileSync(perfPath, JSON.stringify(trimmed, null, 2));
    return trimmed.length;
  }
  getSummary(days = 7) {
    const perfPath = join(process.cwd(), PERF_DIR, PERF_FILE);
    if (!fs.existsSync(perfPath)) return null;
    const metrics = JSON.parse(fs.readFileSync(perfPath, 'utf8'));
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1e3;
    const recent = metrics.filter((m) => new Date(m.timestamp).getTime() > cutoff);
    if (recent.length === 0) return null;
    const byOperation = {};
    recent.forEach((m) => {
      if (!byOperation[m.operation]) {
        byOperation[m.operation] = [];
      }
      byOperation[m.operation].push(m);
    });
    const summary = {
      totalOperations: recent.length,
      period: `${days} days`,
      operations: {},
    };
    Object.entries(byOperation).forEach(([op, data]) => {
      const durations = data.map((d) => d.duration);
      const successes = data.filter((d) => d.result === 'success').length;
      summary.operations[op] = {
        count: data.length,
        avgDuration:
          Math.round((durations.reduce((a, b) => a + b, 0) / durations.length) * 100) / 100,
        minDuration: Math.min(...durations),
        maxDuration: Math.max(...durations),
        successRate: Math.round((successes / data.length) * 100),
        lastRun: data[data.length - 1].timestamp,
      };
    });
    return summary;
  }
}
const globalTracker = new PerformanceTracker();
function withPerformance(commandName, fn) {
  return async function (...args) {
    const tracker = new PerformanceTracker();
    const spinner = ora(`Running ${commandName}...`).start();
    tracker.start(commandName, {
      args: args.map((a) => (typeof a === 'object' ? '[options]' : a)),
      cwd: process.cwd(),
    });
    try {
      const result = await fn.apply(this, args);
      const metric = tracker.end('success');
      tracker.save();
      spinner.succeed(`${commandName} completed in ${metric.durationFormatted}`);
      return result;
    } catch (error) {
      const metric = tracker.end(
        'error',
        error instanceof Error ? error : new Error(String(error))
      );
      tracker.save();
      spinner.fail(`${commandName} failed after ${metric.durationFormatted}`);
      throw error;
    }
  };
}
function registerPerformanceCommand(program) {
  program
    .command('perf')
    .alias('performance')
    .description('Performance monitoring and analytics')
    .option('--summary', 'Show performance summary')
    .option('--days <n>', 'Number of days for summary', '7')
    .option('--operation <name>', 'Filter by operation name')
    .option('--export <file>', 'Export metrics to file')
    .option('--clear', 'Clear performance history')
    .option('--compare', 'Compare current vs previous runs')
    .action(async (options) => {
      logger.log(chalk.cyan.bold('\n\u26A1 Ultra-Dex Performance Monitor\n'));
      if (options.clear) {
        const perfPath = join(process.cwd(), PERF_DIR, PERF_FILE);
        if (fs.existsSync(perfPath)) {
          fs.unlinkSync(perfPath);
          logger.log(chalk.green('\u2705 Performance history cleared'));
        } else {
          logger.log(chalk.gray('No performance data to clear'));
        }
        return;
      }
      if (options.export) {
        const perfPath = join(process.cwd(), PERF_DIR, PERF_FILE);
        if (!fs.existsSync(perfPath)) {
          logger.log(chalk.yellow('No performance data found'));
          return;
        }
        const data = JSON.parse(fs.readFileSync(perfPath, 'utf8'));
        const exportData = options.operation
          ? data.filter((d) => d.operation === options.operation)
          : data;
        fs.writeFileSync(options.export, JSON.stringify(exportData, null, 2));
        logger.log(
          chalk.green(`\u2705 Exported ${exportData.length} metrics to ${options.export}`)
        );
        return;
      }
      if (options.summary || !options.operation) {
        const days = parseInt(options.days || '7');
        const summary = globalTracker.getSummary(days);
        if (!summary) {
          logger.log(chalk.yellow(`No performance data found for the last ${days} days`));
          logger.log(chalk.gray('Run some commands first to generate metrics\n'));
          return;
        }
        logger.log(
          chalk.white.bold(`\u{1F4CA} Summary (Last ${summary.period})
`)
        );
        logger.log(
          chalk.gray(`Total Operations: ${summary.totalOperations}
`)
        );
        const ops = Object.entries(summary.operations).sort((a, b) => b[1].count - a[1].count);
        ops.forEach(([name, stats]) => {
          const color =
            stats.successRate >= 90 ? 'green' : stats.successRate >= 70 ? 'yellow' : 'red';
          logger.log(chalk.cyan.bold(`${name}`));
          logger.log(`  Runs: ${stats.count} | Success: ${chalk[color](stats.successRate + '%')}`);
          logger.log(
            `  Avg: ${chalk.white(stats.avgDuration + 'ms')} | Min: ${stats.minDuration}ms | Max: ${stats.maxDuration}ms`
          );
          logger.log(chalk.gray(`  Last: ${new Date(stats.lastRun).toLocaleString()}`));
          logger.log();
        });
        const slowOps = ops.filter(([_name, s]) => s.avgDuration > 5e3);
        if (slowOps.length > 0) {
          logger.log(chalk.yellow.bold('\u26A0\uFE0F  Slow Operations (>5s):'));
          slowOps.forEach(([name, _stats]) => logger.log(chalk.yellow(`  \u2022 ${name}`)));
          logger.log();
        }
        const failingOps = ops.filter(([_name, s]) => s.successRate < 70);
        if (failingOps.length > 0) {
          logger.log(chalk.red.bold('\u274C Unreliable Operations (<70% success):'));
          failingOps.forEach(([name, _stats]) => logger.log(chalk.red(`  \u2022 ${name}`)));
          logger.log();
        }
      }
      if (options.operation) {
        const perfPath = join(process.cwd(), PERF_DIR, PERF_FILE);
        if (!fs.existsSync(perfPath)) {
          logger.log(chalk.yellow('No performance data found'));
          return;
        }
        const data = JSON.parse(fs.readFileSync(perfPath, 'utf8'));
        const filtered = data.filter((d) => d.operation === options.operation).slice(-20);
        if (filtered.length === 0) {
          logger.log(chalk.yellow(`No data found for operation: ${options.operation}`));
          return;
        }
        logger.log(
          chalk.white.bold(`\u{1F4C8} Recent runs of: ${options.operation}
`)
        );
        filtered.reverse().forEach((m) => {
          const time = new Date(m.timestamp).toLocaleTimeString();
          const icon = m.result === 'success' ? chalk.green('\u2713') : chalk.red('\u2717');
          const duration = chalk.cyan(m.durationFormatted);
          logger.log(`  ${icon} ${chalk.gray(time)} ${duration}`);
          if (m.error) {
            logger.log(chalk.red(`     Error: ${m.error}`));
          }
        });
        logger.log();
      }
      if (options.compare) {
        logger.log(chalk.white.bold('\u{1F4CA} Performance Comparison\n'));
        logger.log(chalk.gray('Comparison feature coming in next update...\n'));
      }
      logger.log(chalk.gray('\u{1F4A1} Tips:'));
      logger.log(chalk.gray("  \u2022 Use --days 1 for today's metrics"));
      logger.log(chalk.gray('  \u2022 Use --operation <name> to see specific command history'));
      logger.log(chalk.gray('  \u2022 Use --export metrics.json to analyze externally\n'));
    });
}
function trackMetric(name, value, unit = 'ms') {
  const metric = {
    timestamp: /* @__PURE__ */ new Date().toISOString(),
    operation: 'custom',
    name,
    value,
    unit,
    type: 'custom',
  };
  const perfPath = join(process.cwd(), PERF_DIR, PERF_FILE);
  let data = [];
  if (fs.existsSync(perfPath)) {
    try {
      data = JSON.parse(fs.readFileSync(perfPath, 'utf8'));
    } catch (error) {
      // Corrupted metrics file - start fresh
    }
  }
  data.push(metric);
  fs.writeFileSync(perfPath, JSON.stringify(data.slice(-1e3), null, 2));
}
function getTracker() {
  return globalTracker;
}
var performance_default = {
  PerformanceTracker,
  withPerformance,
  registerPerformanceCommand,
  trackMetric,
  getTracker,
};
export {
  performance_default as default,
  getTracker,
  registerPerformanceCommand,
  trackMetric,
  withPerformance,
};
