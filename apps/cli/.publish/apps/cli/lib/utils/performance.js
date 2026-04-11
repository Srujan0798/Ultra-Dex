// Copyright (c) 2026 Ultra-Dex

/**
 * Performance Monitoring System for Ultra-Dex
 * Tracks command execution times, memory usage, and provides insights
 */

import { performance } from 'perf_hooks';
import fs from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import ora from './ora.js';
import { logger } from './logger.js';

const PERF_DIR = '.ultra-dex';
const PERF_FILE = 'performance.json';

/**
 * Performance tracker class
 */
class PerformanceTracker {
  constructor() {
    this.metrics = [];
    this.sessionStart = performance.now();
    this.currentOperation = null;
  }

  /**
   * Start tracking an operation
   */
  start(operation, metadata = {}) {
    this.currentOperation = {
      name: operation,
      startTime: performance.now(),
      startMemory: process.memoryUsage(),
      metadata,
    };
    return this;
  }

  /**
   * End tracking and record metrics
   */
  end(result = 'success', error = null) {
    if (!this.currentOperation) return null;

    const endTime = performance.now();
    const endMemory = process.memoryUsage();
    const duration = endTime - this.currentOperation.startTime;

    const metric = {
      timestamp: new Date().toISOString(),
      operation: this.currentOperation.name,
      duration: Math.round(duration * 100) / 100, // Round to 2 decimals
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

  /**
   * Format duration for display
   */
  formatDuration(ms) {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(1);
    return `${minutes}m ${seconds}s`;
  }

  /**
   * Save metrics to disk
   */
  save() {
    const perfPath = join(process.cwd(), PERF_DIR, PERF_FILE);

    // Load existing metrics
    let existing = [];
    if (fs.existsSync(perfPath)) {
      try {
        existing = JSON.parse(fs.readFileSync(perfPath, 'utf8'));
      } catch {
        /* ignore */
      }
    } else {
      fs.mkdirSync(join(process.cwd(), PERF_DIR), { recursive: true });
    }

    // Append new metrics
    const allMetrics = [...existing, ...this.metrics];

    // Keep only last 1000 metrics to prevent file bloat
    const trimmed = allMetrics.slice(-1000);

    fs.writeFileSync(perfPath, JSON.stringify(trimmed, null, 2));
    return trimmed.length;
  }

  /**
   * Get summary statistics
   */
  getSummary(days = 7) {
    const perfPath = join(process.cwd(), PERF_DIR, PERF_FILE);
    if (!fs.existsSync(perfPath)) return null;

    const metrics = JSON.parse(fs.readFileSync(perfPath, 'utf8'));
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
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

// Global tracker instance
const globalTracker = new PerformanceTracker();

/**
 * Middleware to wrap command execution with performance tracking
 */
export function withPerformance(commandName, fn) {
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
      const metric = tracker.end('error', error);
      tracker.save();

      spinner.fail(`${commandName} failed after ${metric.durationFormatted}`);
      throw error;
    }
  };
}

/**
 * Register performance command
 */
export function registerPerformanceCommand(program) {
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
      logger.print(chalk.cyan.bold('\n⚡ Ultra-Dex Performance Monitor\n'));

      if (options.clear) {
        const perfPath = join(process.cwd(), PERF_DIR, PERF_FILE);
        if (fs.existsSync(perfPath)) {
          fs.unlinkSync(perfPath);
          logger.print(chalk.green('✅ Performance history cleared'));
        } else {
          logger.print(chalk.gray('No performance data to clear'));
        }
        return;
      }

      if (options.export) {
        const perfPath = join(process.cwd(), PERF_DIR, PERF_FILE);
        if (!fs.existsSync(perfPath)) {
          logger.print(chalk.yellow('No performance data found'));
          return;
        }

        const data = JSON.parse(fs.readFileSync(perfPath, 'utf8'));
        const exportData = options.operation
          ? data.filter((d) => d.operation === options.operation)
          : data;

        fs.writeFileSync(options.export, JSON.stringify(exportData, null, 2));
        logger.print(chalk.green(`✅ Exported ${exportData.length} metrics to ${options.export}`));
        return;
      }

      if (options.summary || !options.operation) {
        const days = parseInt(options.days);
        const summary = globalTracker.getSummary(days);

        if (!summary) {
          logger.print(chalk.yellow(`No performance data found for the last ${days} days`));
          logger.print(chalk.gray('Run some commands first to generate metrics\n'));
          return;
        }

        logger.print(chalk.white.bold(`📊 Summary (Last ${summary.period})\n`));
        logger.print(chalk.gray(`Total Operations: ${summary.totalOperations}\n`));

        const ops = Object.entries(summary.operations).sort((a, b) => b[1].count - a[1].count);

        ops.forEach(([name, stats]) => {
          const color =
            stats.successRate >= 90 ? 'green' : stats.successRate >= 70 ? 'yellow' : 'red';

          logger.print(chalk.cyan.bold(`${name}`));
          logger.print(
            `  Runs: ${stats.count} | Success: ${chalk[color](stats.successRate + '%')}`
          );
          logger.print(
            `  Avg: ${chalk.white(stats.avgDuration + 'ms')} | Min: ${stats.minDuration}ms | Max: ${stats.maxDuration}ms`
          );
          logger.print(chalk.gray(`  Last: ${new Date(stats.lastRun).toLocaleString()}`));
          logger.print();
        });

        // Show recommendations
        const slowOps = ops.filter(([_, s]) => s.avgDuration > 5000);
        if (slowOps.length > 0) {
          logger.print(chalk.yellow.bold('⚠️  Slow Operations (>5s):'));
          slowOps.forEach(([name, _]) => logger.print(chalk.yellow(`  • ${name}`)));
          logger.print();
        }

        const failingOps = ops.filter(([_, s]) => s.successRate < 70);
        if (failingOps.length > 0) {
          logger.print(chalk.red.bold('❌ Unreliable Operations (<70% success):'));
          failingOps.forEach(([name, _]) => logger.print(chalk.red(`  • ${name}`)));
          logger.print();
        }
      }

      if (options.operation) {
        const perfPath = join(process.cwd(), PERF_DIR, PERF_FILE);
        if (!fs.existsSync(perfPath)) {
          logger.print(chalk.yellow('No performance data found'));
          return;
        }

        const data = JSON.parse(fs.readFileSync(perfPath, 'utf8'));
        const filtered = data.filter((d) => d.operation === options.operation).slice(-20);

        if (filtered.length === 0) {
          logger.print(chalk.yellow(`No data found for operation: ${options.operation}`));
          return;
        }

        logger.print(chalk.white.bold(`📈 Recent runs of: ${options.operation}\n`));

        filtered.reverse().forEach((m) => {
          const time = new Date(m.timestamp).toLocaleTimeString();
          const icon = m.result === 'success' ? chalk.green('✓') : chalk.red('✗');
          const duration = chalk.cyan(m.durationFormatted);
          logger.print(`  ${icon} ${chalk.gray(time)} ${duration}`);
          if (m.error) {
            logger.print(chalk.red(`     Error: ${m.error}`));
          }
        });
        logger.print();
      }

      if (options.compare) {
        // Compare current session vs average
        logger.print(chalk.white.bold('📊 Performance Comparison\n'));
        logger.print(chalk.gray('Comparison feature coming in next update...\n'));
      }

      logger.print(chalk.gray('💡 Tips:'));
      logger.print(chalk.gray("  • Use --days 1 for today's metrics"));
      logger.print(chalk.gray('  • Use --operation <name> to see specific command history'));
      logger.print(chalk.gray('  • Use --export metrics.json to analyze externally\n'));
    });
}

/**
 * Track a custom metric
 */
export function trackMetric(name, value, unit = 'ms') {
  const metric = {
    timestamp: new Date().toISOString(),
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
    } catch {
      /* ignore */
    }
  }

  data.push(metric);
  fs.writeFileSync(perfPath, JSON.stringify(data.slice(-1000), null, 2));
}

/**
 * Get performance tracker instance
 */
export function getTracker() {
  return globalTracker;
}

export default {
  PerformanceTracker,
  withPerformance,
  registerPerformanceCommand,
  trackMetric,
  getTracker,
};
