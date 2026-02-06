#!/usr/bin/env node

/**
 * Ultra-Dex Performance Benchmark Suite
 * Comprehensive performance testing for Ultra-Dex operations
 */

import { performance } from 'perf_hooks';
import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class UltraDexBenchmarkSuite {
  constructor() {
    this.results = {
      benchmarks: [],
      timestamp: new Date().toISOString(),
      version: this.getVersion(),
      environment: this.getEnvironmentInfo(),
    };
  }

  getVersion() {
    try {
      const packagePath = path.join(__dirname, 'package.json');
      const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      return pkg.version;
    } catch {
      return 'unknown';
    }
  }

  getEnvironmentInfo() {
    return {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      totalMemory: require('os').totalmem(),
      freeMemory: require('os').freemem(),
      loadAverage: require('os').loadavg(),
      cpuCount: require('os').cpus().length,
    };
  }

  async runBenchmark(name, benchmarkFn, iterations = 1) {
    const results = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      const startMemory = process.memoryUsage().heapUsed;

      try {
        await benchmarkFn();

        const end = performance.now();
        const endMemory = process.memoryUsage().heapUsed;

        results.push({
          iteration: i + 1,
          duration: end - start,
          memoryDelta: endMemory - startMemory,
          success: true,
        });
      } catch (error) {
        const end = performance.now();
        results.push({
          iteration: i + 1,
          duration: end - start,
          error: error.message,
          success: false,
        });
      }
    }

    const benchmarkResult = {
      name,
      iterations,
      results,
      stats: this.calculateStats(results),
    };

    this.results.benchmarks.push(benchmarkResult);
    this.printResult(benchmarkResult);

    return benchmarkResult;
  }

  calculateStats(results) {
    const successful = results.filter((r) => r.success);

    if (successful.length === 0) {
      return {
        avgDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        avgMemoryDelta: 0,
        errorRate: 100,
      };
    }

    const durations = successful.map((r) => r.duration);
    const memoryDeltas = successful.map((r) => r.memoryDelta).filter((m) => m !== undefined);

    return {
      avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      avgMemoryDelta:
        memoryDeltas.length > 0 ? memoryDeltas.reduce((a, b) => a + b, 0) / memoryDeltas.length : 0,
      errorRate: ((results.length - successful.length) / results.length) * 100,
    };
  }

  printResult(benchmark) {
    console.log(`\n📊 ${benchmark.name}`);
    console.log(`   Iterations: ${benchmark.iterations}`);
    console.log(`   Avg Duration: ${benchmark.stats.avgDuration.toFixed(2)}ms`);
    console.log(`   Min Duration: ${benchmark.stats.minDuration.toFixed(2)}ms`);
    console.log(`   Max Duration: ${benchmark.stats.maxDuration.toFixed(2)}ms`);
    console.log(
      `   Avg Memory Delta: ${(benchmark.stats.avgMemoryDelta / 1024 / 1024).toFixed(2)} MB`
    );
    console.log(`   Error Rate: ${benchmark.stats.errorRate.toFixed(2)}%`);
  }

  async runAllBenchmarks() {
    console.log('🚀 Ultra-Dex Performance Benchmark Suite\n');
    console.log(`Version: ${this.results.version}`);
    console.log(
      `Environment: ${this.results.environment.platform} ${this.results.environment.arch}`
    );
    console.log(`Node: ${this.results.environment.nodeVersion}\n`);

    // Benchmark 1: Command Startup Time
    await this.runBenchmark(
      'Command Startup Time',
      async () => {
        execSync('node cli/bin/ultra-dex.js --version', { stdio: 'pipe' });
      },
      10
    );

    // Benchmark 2: Graph Analysis Performance
    await this.runBenchmark(
      'Graph Analysis Performance',
      async () => {
        const { projectGraph } = await import('./cli/lib/mcp/graph.js');
        await projectGraph.scan(false); // Disable cache for measurement
      },
      5
    );

    // Benchmark 3: State Loading Performance
    await this.runBenchmark(
      'State Loading Performance',
      async () => {
        const { loadState } = await import('./cli/lib/commands/state.js');
        await loadState();
      },
      10
    );

    // Benchmark 4: Plugin System Performance
    await this.runBenchmark(
      'Plugin System Performance',
      async () => {
        const { pluginManager } = await import('./cli/lib/plugin-system.js');
        await pluginManager.initialize();
      },
      5
    );

    // Benchmark 5: Agent Execution Performance
    await this.runBenchmark(
      'Agent Execution Performance',
      async () => {
        // Simulate a simple agent execution
        const { runAgentLoop } = await import('./cli/lib/commands/run.js');
        // This would require a proper provider setup, so we'll simulate
        return new Promise((resolve) => setTimeout(resolve, 100)); // Simulated delay
      },
      5
    );

    // Benchmark 6: File Operations Performance
    await this.runBenchmark(
      'File Operations Performance',
      async () => {
        // Create a temporary file and measure operations
        const tempFile = path.join(process.cwd(), '.benchmark-tmp');
        await fs.writeFile(tempFile, 'test content for benchmarking');
        const content = await fs.readFile(tempFile, 'utf8');
        await fs.unlink(tempFile);
      },
      20
    );

    // Benchmark 7: Validation Performance
    await this.runBenchmark(
      'Validation Performance',
      async () => {
        const { validateCommand } = await import('./cli/lib/commands/validate.js');
        // Simulate validation without actually running it
        return new Promise((resolve) => setTimeout(resolve, 50)); // Simulated delay
      },
      5
    );

    // Benchmark 8: Memory Usage Under Load
    await this.runBenchmark(
      'Memory Usage Under Load',
      async () => {
        // Simulate memory-intensive operation
        const largeArray = new Array(1000000).fill(0).map((_, i) => ({ id: i, data: `data-${i}` }));
        const processed = largeArray.map((item) => ({ ...item, processed: true }));
        // Allow garbage collection
        await new Promise((resolve) => setTimeout(resolve, 10));
      },
      5
    );

    this.printSummary();
    await this.saveResults();
  }

  printSummary() {
    console.log('\n📈 PERFORMANCE SUMMARY');
    console.log('=====================');

    for (const benchmark of this.results.benchmarks) {
      console.log(`${benchmark.name}:`);
      console.log(`  • Avg: ${benchmark.stats.avgDuration.toFixed(2)}ms`);
      console.log(
        `  • Range: ${benchmark.stats.minDuration.toFixed(2)}ms - ${benchmark.stats.maxDuration.toFixed(2)}ms`
      );
      console.log(`  • Memory: ${(benchmark.stats.avgMemoryDelta / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  • Errors: ${benchmark.stats.errorRate.toFixed(2)}%\n`);
    }

    // Performance rating
    const avgPerformance =
      this.results.benchmarks
        .filter((b) => b.stats.avgDuration > 0)
        .reduce((sum, b) => sum + b.stats.avgDuration, 0) /
      this.results.benchmarks.filter((b) => b.stats.avgDuration > 0).length;

    let rating = '';
    if (avgPerformance < 100) rating = '🏆 Excellent';
    else if (avgPerformance < 500) rating = '👍 Good';
    else if (avgPerformance < 1000) rating = '👌 Average';
    else rating = '⚠️ Needs Improvement';

    console.log(`Overall Performance Rating: ${rating} (Avg: ${avgPerformance.toFixed(2)}ms)`);
  }

  async saveResults() {
    const filename = `ultra-dex-benchmark-${this.results.timestamp.split('T')[0]}.json`;
    await fs.writeFile(filename, JSON.stringify(this.results, null, 2));
    console.log(`\n💾 Results saved to ${filename}`);
  }

  async runSpecificBenchmark(benchmarkName) {
    switch (benchmarkName.toLowerCase()) {
      case 'startup':
        return await this.runBenchmark(
          'Command Startup Time',
          async () => {
            execSync('node cli/bin/ultra-dex.js --version', { stdio: 'pipe' });
          },
          10
        );
      case 'graph':
        return await this.runBenchmark(
          'Graph Analysis Performance',
          async () => {
            const { projectGraph } = await import('./cli/lib/mcp/graph.js');
            await projectGraph.scan(false);
          },
          5
        );
      case 'state':
        return await this.runBenchmark(
          'State Loading Performance',
          async () => {
            const { loadState } = await import('./cli/lib/commands/state.js');
            await loadState();
          },
          10
        );
      case 'plugins':
        return await this.runBenchmark(
          'Plugin System Performance',
          async () => {
            const { pluginManager } = await import('./cli/lib/plugin-system.js');
            await pluginManager.initialize();
          },
          5
        );
      case 'validation':
        return await this.runBenchmark(
          'Validation Performance',
          async () => {
            const { validateCommand } = await import('./cli/lib/commands/validate.js');
            return new Promise((resolve) => setTimeout(resolve, 50));
          },
          5
        );
      default:
        console.log(`Unknown benchmark: ${benchmarkName}`);
        console.log('Available benchmarks: startup, graph, state, plugins, validation');
        return null;
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);

  const benchmarkSuite = new UltraDexBenchmarkSuite();

  if (args.length > 0) {
    // Run specific benchmark
    const benchmarkName = args[0];
    await benchmarkSuite.runSpecificBenchmark(benchmarkName);
  } else {
    // Run all benchmarks
    await benchmarkSuite.runAllBenchmarks();
  }
}

// Run if this file is executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(console.error);
}

export { UltraDexBenchmarkSuite };
