#!/usr/bin/env node
import { glob } from 'glob';
import { spawn } from 'child_process';
import { resolve } from 'path';

// Parse command line arguments
const args = process.argv.slice(2);
let testDir = 'tests/core'; // default

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--dir' && i + 1 < args.length) {
    testDir = args[i + 1];
  }
}

console.log(`Running tests from: ${testDir}`);

// Get all test files
const pattern = `${testDir}/*.test.{js,ts}`;
glob(pattern, {}, (err, files) => {
  if (err) {
    console.error('Error finding test files:', err);
    process.exit(1);
  }

  if (files.length === 0) {
    console.error(`No test files found matching pattern: ${pattern}`);
    process.exit(1);
  }

  console.log(`Found ${files.length} test files`);

  const results = [];
  let completed = 0;

  // Run each test file with timeout
  files.forEach((file) => {
    const testProcess = spawn(
      'node',
      [
        '--import=tsx',
        '--import=reflect-metadata',
        '--test',
        '--test-concurrency=1',
        '--test-force-exit',
        '--test-timeout=10000', // 10 second timeout
        file,
      ],
      {
        env: {
          ...process.env,
          NODE_ENV: 'test',
          MEMORY_BACKEND: 'file',
          SKIP_POSTGRES: 'true',
        },
      }
    );

    let stdout = '';
    let stderr = '';

    testProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    testProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    testProcess.on('close', (code) => {
      completed++;
      const success = code === 0;
      const status = success ? 'PASS' : 'FAIL';
      const error = !success && stderr ? stderr.trim() : '';

      results.push({
        file: file.split('/').pop(),
        status,
        error,
      });

      // Print result immediately
      const statusColor = success ? '\x1b[32m' : '\x1b[31m'; // Green for pass, red for fail
      console.log(`${statusColor}${status}\x1b[0m: ${file.split('/').pop()}`);

      // If we've processed all files, print summary
      if (completed === files.length) {
        printSummary(results);
      }
    });
  });
});

function printSummary(results) {
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));

  const passes = results.filter((r) => r.status === 'PASS').length;
  const fails = results.filter((r) => r.status === 'FAIL').length;

  // Print table
  console.log(`${'FILE'.padEnd(30)} ${'STATUS'.padEnd(10)}`);
  console.log('-'.repeat(40));

  results.forEach((result) => {
    const statusColor = result.status === 'PASS' ? '\x1b[32m' : '\x1b[31m';
    console.log(`${result.file.padEnd(30)} ${statusColor}${result.status.padEnd(10)}\x1b[0m`);
  });

  console.log('-'.repeat(40));
  console.log(`TOTAL: ${results.length} | PASS: ${passes} | FAIL: ${fails}`);
  console.log('='.repeat(60));

  // Exit with failure code if any tests failed
  if (fails > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}
