#!/usr/bin/env node

// Copyright (c) 2026 Ultra-Dex
// benchmarks/run-benchmarks.js

import BenchmarkRunner from './benchmark-runner.js';
import { executionEngineBenchmarks } from './core/execution-engine-benchmarks.js';
import { distributedCoordinatorBenchmarks } from './distributed/distributed-coordinator-benchmarks.js';
import { systemIntegrationBenchmarks } from './integration/system-integration-benchmarks.js';
import { runPerformanceRegressionTests } from './regression/performance-regression-tests.js';
import { createLogger } from '../src/utils/logging.js';

const logger = createLogger('BenchmarkRunner');

// Simple CLI argument parsing
const [,, command, ...args] = process.argv;

async function runBenchmarks() {
  try {
    switch (command) {
      case 'core':
        await runCoreBenchmarks();
        break;
      case 'distributed':
        await runDistributedBenchmarks();
        break;
      case 'integration':
        await runIntegrationBenchmarks();
        break;
      case 'regression':
        await runRegressionTests();
        break;
      case 'all':
        await runAllBenchmarks();
        break;
      default:
        showHelp();
    }
  } catch (error) {
    logger.error('Benchmark execution failed', { error: error.message });
    process.exit(1);
  }
}

async function runCoreBenchmarks() {
  const runner = new BenchmarkRunner({
    outputDir: './benchmark-results/core',
    warmUpRuns: 3,
    measurementRuns: 10,
  });

  logger.info('Running core benchmarks');
  const results = await runner.runSuite('core-benchmarks', executionEngineBenchmarks);
  logger.info('Core benchmarks completed', {
    benchmarks: results.benchmarks.length,
    passed: results.summary.passed,
    failed: results.summary.failed,
  });
}

async function runDistributedBenchmarks() {
  const runner = new BenchmarkRunner({
    outputDir: './benchmark-results/distributed',
    warmUpRuns: 2,
    measurementRuns: 5,
  });

  logger.info('Running distributed benchmarks');
  const results = await runner.runSuite('distributed-benchmarks', distributedCoordinatorBenchmarks);
  logger.info('Distributed benchmarks completed', {
    benchmarks: results.benchmarks.length,
    passed: results.summary.passed,
    failed: results.summary.failed,
  });
}

async function runIntegrationBenchmarks() {
  const runner = new BenchmarkRunner({
    outputDir: './benchmark-results/integration',
    warmUpRuns: 1,
    measurementRuns: 3,
  });

  logger.info('Running integration benchmarks');
  const results = await runner.runSuite('integration-benchmarks', systemIntegrationBenchmarks);
  logger.info('Integration benchmarks completed', {
    benchmarks: results.benchmarks.length,
    passed: results.summary.passed,
    failed: results.summary.failed,
  });
}

async function runRegressionTests() {
  logger.info('Running performance regression tests');
  await runPerformanceRegressionTests();
  logger.info('Regression tests completed');
}

async function runAllBenchmarks() {
  logger.info('Running all benchmark suites');

  // Core benchmarks
  const coreRunner = new BenchmarkRunner({
    outputDir: './benchmark-results/core',
    warmUpRuns: 2,
    measurementRuns: 5,
  });

  logger.info('Starting core benchmarks');
  const coreResults = await coreRunner.runSuite('core-benchmarks', executionEngineBenchmarks);

  // Distributed benchmarks
  const distRunner = new BenchmarkRunner({
    outputDir: './benchmark-results/distributed',
    warmUpRuns: 2,
    measurementRuns: 5,
  });

  logger.info('Starting distributed benchmarks');
  const distResults = await distRunner.runSuite('distributed-benchmarks', distributedCoordinatorBenchmarks);

  // Integration benchmarks
  const intRunner = new BenchmarkRunner({
    outputDir: './benchmark-results/integration',
    warmUpRuns: 1,
    measurementRuns: 3,
  });

  logger.info('Starting integration benchmarks');
  const intResults = await intRunner.runSuite('integration-benchmarks', systemIntegrationBenchmarks);

  // Regression tests
  logger.info('Starting regression tests');
  await runPerformanceRegressionTests();

  // Summary
  const totalBenchmarks = coreResults.benchmarks.length + distResults.benchmarks.length + intResults.benchmarks.length;
  const totalPassed = coreResults.summary.passed + distResults.summary.passed + intResults.summary.passed;
  const totalFailed = coreResults.summary.failed + distResults.summary.failed + intResults.summary.failed;

  logger.info('All benchmark suites completed', {
    totalBenchmarks,
    totalPassed,
    totalFailed,
    core: { passed: coreResults.summary.passed, failed: coreResults.summary.failed },
    distributed: { passed: distResults.summary.passed, failed: distResults.summary.failed },
    integration: { passed: intResults.summary.passed, failed: intResults.summary.failed },
  });
}

function showHelp() {
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
}

// Execute the CLI
runBenchmarks().catch((error) => {
  logger.error('Benchmark execution failed', { error: error.message });
  process.exit(1);
});

// Error handling
process.on('unhandledRejection', (error) => {
  logger.error('Unhandled promise rejection', { error: error.message });
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error: error.message });
  process.exit(1);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully');
  process.exit(0);
});
  const runner = new BenchmarkRunner({
    outputDir: './benchmark-results/integration',
    warmUpRuns: 1,
    measurementRuns: 3,
  });

  logger.info('Running integration benchmarks');
  const results = await runner.runSuite('integration-benchmarks', systemIntegrationBenchmarks);
  logger.info('Integration benchmarks completed', {
    benchmarks: results.benchmarks.length,
    passed: results.summary.passed,
    failed: results.summary.failed,
  });
}

async function runRegressionTests() {
  logger.info('Running performance regression tests');
  await runPerformanceRegressionTests();
  logger.info('Regression tests completed');
}

async function runAllBenchmarks() {
  logger.info('Running all benchmark suites');

  // Core benchmarks
  const coreRunner = new BenchmarkRunner({
    outputDir: './benchmark-results/core',
    warmUpRuns: 2,
    measurementRuns: 5,
  });

  logger.info('Starting core benchmarks');
  const coreResults = await coreRunner.runSuite('core-benchmarks', executionEngineBenchmarks);

  // Distributed benchmarks
  const distRunner = new BenchmarkRunner({
    outputDir: './benchmark-results/distributed',
    warmUpRuns: 2,
    measurementRuns: 5,
  });

  logger.info('Starting distributed benchmarks');
  const distResults = await distRunner.runSuite('distributed-benchmarks', distributedCoordinatorBenchmarks);

  // Integration benchmarks
  const intRunner = new BenchmarkRunner({
    outputDir: './benchmark-results/integration',
    warmUpRuns: 1,
    measurementRuns: 3,
  });

  logger.info('Starting integration benchmarks');
  const intResults = await intRunner.runSuite('integration-benchmarks', systemIntegrationBenchmarks);

  // Regression tests
  logger.info('Starting regression tests');
  await runPerformanceRegressionTests();

  // Summary
  const totalBenchmarks = coreResults.benchmarks.length + distResults.benchmarks.length + intResults.benchmarks.length;
  const totalPassed = coreResults.summary.passed + distResults.summary.passed + intResults.summary.passed;
  const totalFailed = coreResults.summary.failed + distResults.summary.failed + intResults.summary.failed;

  logger.info('All benchmark suites completed', {
    totalBenchmarks,
    totalPassed,
    totalFailed,
    core: { passed: coreResults.summary.passed, failed: coreResults.summary.failed },
    distributed: { passed: distResults.summary.passed, failed: distResults.summary.failed },
    integration: { passed: intResults.summary.passed, failed: intResults.summary.failed },
  });
}

function showHelp() {
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
}

    logger.info('Running core benchmarks');
    const results = await runner.runSuite('core-benchmarks', executionEngineBenchmarks);
    logger.info('Core benchmarks completed', {
      benchmarks: results.benchmarks.length,
      passed: results.summary.passed,
      failed: results.summary.failed,
}

    logger.info('Running distributed benchmarks');
    const results = await runner.runSuite(
      'distributed-benchmarks',
      distributedCoordinatorBenchmarks
    );
    logger.info('Distributed benchmarks completed', {
      benchmarks: results.benchmarks.length,
      passed: results.summary.passed,
      failed: results.summary.failed,
    });
  });

program
  .command('integration')
  .description('Run system integration benchmarks')
  .option('-o, --output <dir>', 'Output directory for results', './benchmark-results/integration')
  .option('-w, --warmup <runs>', 'Number of warmup runs', '1')
  .option('-m, --measurements <runs>', 'Number of measurement runs', '3')
  .action(async (options) => {
    const runner = new BenchmarkRunner({
      outputDir: options.output,
      warmUpRuns: parseInt(options.warmup),
      measurementRuns: parseInt(options.measurements),
    });

    logger.info('Running integration benchmarks');
    const results = await runner.runSuite('integration-benchmarks', systemIntegrationBenchmarks);
    logger.info('Integration benchmarks completed', {
      benchmarks: results.benchmarks.length,
      passed: results.summary.passed,
      failed: results.summary.failed,
    });
  });

program
  .command('regression')
  .description('Run performance regression tests')
  .action(async () => {
    logger.info('Running performance regression tests');
    await runPerformanceRegressionTests();
    logger.info('Regression tests completed');
  });

program
  .command('all')
  .description('Run all benchmark suites')
  .option('-o, --output <dir>', 'Base output directory for results', './benchmark-results')
  .option('-w, --warmup <runs>', 'Number of warmup runs', '2')
  .option('-m, --measurements <runs>', 'Number of measurement runs', '5')
  .action(async (options) => {
    const baseDir = options.output;
    const warmupRuns = parseInt(options.warmup);
    const measurementRuns = parseInt(options.measurements);

    logger.info('Running all benchmark suites');

    // Core benchmarks
    const coreRunner = new BenchmarkRunner({
      outputDir: `${baseDir}/core`,
      warmUpRuns: warmupRuns,
      measurementRuns: measurementRuns,
    });

    logger.info('Starting core benchmarks');
    const coreResults = await coreRunner.runSuite('core-benchmarks', executionEngineBenchmarks);

    // Distributed benchmarks
    const distRunner = new BenchmarkRunner({
      outputDir: `${baseDir}/distributed`,
      warmUpRuns: warmupRuns,
      measurementRuns: measurementRuns,
    });

    logger.info('Starting distributed benchmarks');
    const distResults = await distRunner.runSuite(
      'distributed-benchmarks',
      distributedCoordinatorBenchmarks
    );

    // Integration benchmarks
    const intRunner = new BenchmarkRunner({
      outputDir: `${baseDir}/integration`,
      warmUpRuns: Math.max(1, warmupRuns - 1), // Fewer warmup for integration
      measurementRuns: Math.max(1, measurementRuns - 2), // Fewer measurements for integration
    });

    logger.info('Starting integration benchmarks');
    const intResults = await intRunner.runSuite(
      'integration-benchmarks',
      systemIntegrationBenchmarks
    );

    // Regression tests
    logger.info('Starting regression tests');
    await runPerformanceRegressionTests();

    // Summary
    const totalBenchmarks =
      coreResults.benchmarks.length + distResults.benchmarks.length + intResults.benchmarks.length;
    const totalPassed =
      coreResults.summary.passed + distResults.summary.passed + intResults.summary.passed;
    const totalFailed =
      coreResults.summary.failed + distResults.summary.failed + intResults.summary.failed;

    logger.info('All benchmark suites completed', {
      totalBenchmarks,
      totalPassed,
      totalFailed,
      core: { passed: coreResults.summary.passed, failed: coreResults.summary.failed },
      distributed: { passed: distResults.summary.passed, failed: distResults.summary.failed },
      integration: { passed: intResults.summary.passed, failed: intResults.summary.failed },
    });
  });

program
  .command('compare')
  .description('Compare benchmark results with baseline')
  .argument('<suite>', 'Benchmark suite name')
  .argument('<resultsFile>', 'Results file to compare')
  .argument('<baselineFile>', 'Baseline file to compare against')
  .action(async (suite, resultsFile, baselineFile) => {
    const runner = new BenchmarkRunner();
    const comparison = await runner.compareWithBaseline(
      JSON.parse(await fs.readFile(resultsFile, 'utf8')),
      baselineFile
    );

    if (comparison) {
      logger.info('Baseline comparison completed', {
        regressions: comparison.regressions.length,
        improvements: comparison.improvements.length,
      });

      if (comparison.regressions.length > 0) {
        console.log('\n🚨 Performance Regressions:');
        comparison.regressions.forEach((r) => {
          console.log(
            `  ${r.name}: ${r.changePercent}% slower (${r.current}ms vs ${r.baseline}ms)`
          );
        });
      }

      if (comparison.improvements.length > 0) {
        console.log('\n✅ Performance Improvements:');
        comparison.improvements.forEach((i) => {
          console.log(
            `  ${i.name}: ${Math.abs(i.changePercent)}% faster (${i.current}ms vs ${i.baseline}ms)`
          );
        });
      }
    } else {
      logger.warn('Could not perform baseline comparison');
    }
  });

// Execute the CLI
runBenchmarks().catch((error) => {
  logger.error('Benchmark execution failed', { error: error.message });
  process.exit(1);
});

// Error handling
process.on('unhandledRejection', (error) => {
  logger.error('Unhandled promise rejection', { error: error.message });
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error: error.message });
  process.exit(1);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully');
  process.exit(0);
});
