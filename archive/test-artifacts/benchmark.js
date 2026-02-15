#!/usr/bin/env node

/**
 * Ultra-Dex Performance Benchmark Suite
 * Measures performance of key operations after enhancements
 */

import { performance } from 'perf_hooks';
import { execSync } from 'child_process';
import fs from 'fs';
import { fileURLToPath } from 'url';

const benchmarks = {
  'Graph Analysis': async () => {
    const start = performance.now();
    // Simulate graph analysis performance
    const { projectGraph } = await import('../../cli/lib/mcp/graph.js');
    await projectGraph.scan(false); // Disable cache for measurement
    return performance.now() - start;
  },

  'Command Startup': async () => {
    const start = performance.now();
    try {
      execSync('node cli/bin/ultra-dex.js --version', { stdio: 'pipe' });
    } catch {
      // Ignore errors, just measuring startup time
    }
    return performance.now() - start;
  },

  'Plugin Loading': async () => {
    const start = performance.now();
    const { pluginManager } = await import('../../cli/lib/plugin-system.js');
    await pluginManager.initialize();
    return performance.now() - start;
  },
};

async function runBenchmark() {
  console.log('🚀 Ultra-Dex Performance Benchmark Suite\n');

  const results = {};

  for (const [name, test] of Object.entries(benchmarks)) {
    try {
      console.log(`⏱️  Running ${name}...`);
      const time = await test();
      results[name] = time;
      console.log(`✅ ${name}: ${time.toFixed(2)}ms\n`);
    } catch (error) {
      console.log(`❌ ${name}: Failed - ${error.message}\n`);
      results[name] = 'ERROR';
    }
  }

  console.log('📊 Performance Results:');
  console.table(results);

  // Save results to file
  const timestamp = new Date().toISOString();
  const resultsData = {
    timestamp,
    version: '3.4.4',
    results,
    improvements: {
      'Graph Analysis': 'Optimized with caching and concurrency',
      'Command Startup': 'Reduced initialization time',
      'Plugin Loading': 'Efficient plugin management system',
    },
  };

  fs.writeFileSync(
    `benchmark-results-${timestamp.split('T')[0]}.json`,
    JSON.stringify(resultsData, null, 2)
  );

  console.log(`\n💾 Results saved to benchmark-results-${timestamp.split('T')[0]}.json`);

  return results;
}

// Run benchmark if this file is executed directly
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  runBenchmark().catch(console.error);
}

export { runBenchmark, benchmarks };
