// Copyright (c) 2026 Ultra-Dex
// benchmarks/run-benchmarks.js

import BenchmarkRunner from './benchmark-runner.js';
import { createLogger } from '../src/utils/logging.js';

const logger = createLogger('BenchmarkRunner');

const [, , command] = process.argv;

if (!command || command === '--help') {
  console.log(`
Ultra-Dex Performance Benchmarks

Usage: node benchmarks/run-benchmarks.js <command>

Commands:
  core          Run core component benchmarks
  distributed   Run distributed coordinator benchmarks  
  integration   Run system integration benchmarks
  regression    Run performance regression tests
  all           Run all benchmark suites

Examples:
  node benchmarks/run-benchmarks.js core
  node benchmarks/run-benchmarks.js all
`);
  process.exit(0);
}

async function runBenchmarks() {
  try {
    const runner = new BenchmarkRunner({
      outputDir: `./benchmark-results/${command}`,
      warmUpRuns: 2,
      measurementRuns: 3,
    });

    const mockBenchmarks = [
      {
        name: `mock-${command}-benchmark`,
        description: `Mock benchmark for ${command} testing`,
        async setup() {},
        async run() {
          await new Promise((resolve) => setTimeout(resolve, Math.random() * 100 + 50));
        },
        async teardown() {},
      },
    ];

    console.log(`Running ${command} benchmarks (mock)`);
    const results = await runner.runSuite(`${command}-benchmarks`, mockBenchmarks);
    console.log(`${command} benchmarks completed`, {
      benchmarks: results.benchmarks.length,
      passed: results.summary.passed,
      failed: results.summary.failed,
    });
  } catch (error) {
    console.error('Benchmark execution failed:', error.message);
    process.exit(1);
  }
}

runBenchmarks();
