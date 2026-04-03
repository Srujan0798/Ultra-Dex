// Copyright (c) 2026 Ultra-Dex
// benchmarks/benchmark-runner.js

import { EventEmitter } from 'events';
import { performance } from 'perf_hooks';
import fs from 'fs/promises';
import path from 'path';
import { createLogger } from '../src/utils/logging.js';

class BenchmarkRunner extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      outputDir: options.outputDir || './benchmark-results',
      warmUpRuns: options.warmUpRuns || 3,
      measurementRuns: options.measurementRuns || 10,
      timeout: options.timeout || 30000,
      ...options,
    };

    // Initialize logger synchronously for now
    this.logger = { info: console.log, warn: console.warn, error: console.error };
    this.results = [];

    // Initialize async logger in background
    createLogger('BenchmarkRunner')
      .then((logger) => {
        this.logger = logger;
      })
      .catch(() => {
        // Keep console logger as fallback
      });
  }

  /**
   * Run a benchmark suite
   */
  async runSuite(suiteName, benchmarks) {
    this.logger.info('Starting benchmark suite', { suiteName, benchmarkCount: benchmarks.length });

    const suiteResults = {
      suiteName,
      timestamp: new Date().toISOString(),
      benchmarks: [],
      summary: {},
    };

    for (const benchmark of benchmarks) {
      try {
        this.logger.info('Running benchmark', { name: benchmark.name });
        const result = await this.runBenchmark(benchmark);
        suiteResults.benchmarks.push(result);
        this.emit('benchmark:completed', result);
      } catch (error) {
        this.logger.error('Benchmark failed', { name: benchmark.name, error: error.message });
        suiteResults.benchmarks.push({
          name: benchmark.name,
          status: 'failed',
          error: error.message,
        });
      }
    }

    suiteResults.summary = this.generateSummary(suiteResults.benchmarks);
    await this.saveResults(suiteResults);

    this.logger.info('Benchmark suite completed', {
      suiteName,
      totalBenchmarks: suiteResults.benchmarks.length,
      passed: suiteResults.summary.passed,
      failed: suiteResults.summary.failed,
    });

    return suiteResults;
  }

  /**
   * Run a single benchmark
   */
  async runBenchmark(benchmark) {
    const { name, setup, run, teardown, iterations = 1000 } = benchmark;

    // Warm-up phase
    if (setup) await setup();
    for (let i = 0; i < this.options.warmUpRuns; i++) {
      await run();
    }
    if (teardown) await teardown();

    // Measurement phase
    if (setup) await setup();

    const measurements = [];
    for (let i = 0; i < this.options.measurementRuns; i++) {
      const startTime = performance.now();
      const startMemory = process.memoryUsage();

      try {
        await Promise.race([
          run(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Benchmark timeout')), this.options.timeout)
          ),
        ]);

        const endTime = performance.now();
        const endMemory = process.memoryUsage();

        measurements.push({
          duration: endTime - startTime,
          memoryDelta: endMemory.heapUsed - startMemory.heapUsed,
          cpuUsage: process.cpuUsage(),
        });
      } catch (error) {
        measurements.push({
          duration: performance.now() - startTime,
          error: error.message,
        });
      }
    }

    if (teardown) await teardown();

    // Calculate statistics
    const validMeasurements = measurements.filter((m) => !m.error);
    const stats = this.calculateStats(validMeasurements);

    return {
      name,
      status: validMeasurements.length > 0 ? 'passed' : 'failed',
      iterations,
      measurements: validMeasurements.length,
      stats,
      errors: measurements.filter((m) => m.error).length,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Calculate statistics from measurements
   */
  calculateStats(measurements) {
    if (measurements.length === 0) return {};

    const durations = measurements.map((m) => m.duration).sort((a, b) => a - b);
    const memoryDeltas = measurements.map((m) => m.memoryDelta || 0);

    const sum = durations.reduce((a, b) => a + b, 0);
    const mean = sum / durations.length;

    const variance =
      durations.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / durations.length;
    const stdDev = Math.sqrt(variance);

    return {
      mean: Math.round(mean * 100) / 100,
      median: Math.round(durations[Math.floor(durations.length / 2)] * 100) / 100,
      min: Math.round(Math.min(...durations) * 100) / 100,
      max: Math.round(Math.max(...durations) * 100) / 100,
      stdDev: Math.round(stdDev * 100) / 100,
      p95: Math.round(durations[Math.floor(durations.length * 0.95)] * 100) / 100,
      p99: Math.round(durations[Math.floor(durations.length * 0.99)] * 100) / 100,
      memoryAvg: Math.round(memoryDeltas.reduce((a, b) => a + b, 0) / memoryDeltas.length),
      throughput: Math.round((1000 / mean) * 100) / 100, // ops per second
    };
  }

  /**
   * Generate suite summary
   */
  generateSummary(benchmarks) {
    const passed = benchmarks.filter((b) => b.status === 'passed').length;
    const failed = benchmarks.filter((b) => b.status === 'failed').length;
    const totalDuration = benchmarks.reduce((sum, b) => sum + (b.stats?.mean || 0), 0);

    return {
      passed,
      failed,
      total: benchmarks.length,
      totalDuration: Math.round(totalDuration * 100) / 100,
      avgDuration: passed > 0 ? Math.round((totalDuration / passed) * 100) / 100 : 0,
    };
  }

  /**
   * Save results to file
   */
  async saveResults(results) {
    await fs.mkdir(this.options.outputDir, { recursive: true });

    const filename = `${results.suiteName}_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const filepath = path.join(this.options.outputDir, filename);

    await fs.writeFile(filepath, JSON.stringify(results, null, 2));
    this.logger.info('Benchmark results saved', { filepath });
  }

  /**
   * Compare results with baseline
   */
  async compareWithBaseline(results, baselinePath) {
    try {
      const baseline = JSON.parse(await fs.readFile(baselinePath, 'utf8'));
      const comparison = this.compareSuites(results, baseline);

      this.logger.info('Baseline comparison completed', {
        regressions: comparison.regressions.length,
        improvements: comparison.improvements.length,
      });

      return comparison;
    } catch (error) {
      this.logger.warn('Failed to load baseline', { baselinePath, error: error.message });
      return null;
    }
  }

  /**
   * Compare two benchmark suites
   */
  compareSuites(current, baseline) {
    const regressions = [];
    const improvements = [];

    for (const currentBench of current.benchmarks) {
      const baselineBench = baseline.benchmarks.find((b) => b.name === currentBench.name);

      if (!baselineBench) continue;

      const currentMean = currentBench.stats?.mean || 0;
      const baselineMean = baselineBench.stats?.mean || 0;
      const changePercent = ((currentMean - baselineMean) / baselineMean) * 100;

      if (Math.abs(changePercent) > 5) {
        // 5% threshold
        const comparison = {
          name: currentBench.name,
          current: currentMean,
          baseline: baselineMean,
          changePercent: Math.round(changePercent * 100) / 100,
        };

        if (changePercent > 0) {
          regressions.push(comparison);
        } else {
          improvements.push(comparison);
        }
      }
    }

    return { regressions, improvements };
  }
}

export { BenchmarkRunner };
export default BenchmarkRunner;
