#!/usr/bin/env node
/**
 * test-report.mjs
 * Run test files and print a PASS/FAIL summary table.
 * Usage: node scripts/test-report.mjs [--dir tests/core]
 */
import { glob } from 'glob';
import { spawn } from 'child_process';

const args = process.argv.slice(2);
let testDir = 'tests/core';
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--dir' && args[i + 1]) testDir = args[i + 1];
}

const files = await glob(`${testDir}/*.test.{js,ts}`);
if (files.length === 0) {
  console.error(`No test files found in ${testDir}`);
  process.exit(1);
}

console.log(`\nRunning ${files.length} test files from ${testDir}/\n`);

const results = await Promise.all(
  files.map(
    (file) =>
      new Promise((resolve) => {
        const child = spawn(
          'node',
          [
            '--import=tsx',
            '--import=reflect-metadata',
            '--test',
            '--test-concurrency=1',
            '--test-force-exit',
            '--test-timeout=10000',
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

        let pass = 0, fail = 0;
        child.stdout.on('data', (d) => {
          const text = d.toString();
          const p = (text.match(/# pass (\d+)/) || [])[1];
          const f = (text.match(/# fail (\d+)/) || [])[1];
          if (p) pass = parseInt(p, 10);
          if (f) fail = parseInt(f, 10);
        });

        child.on('close', (code) => {
          const name = file.split('/').pop();
          const status = code === 0 ? 'PASS' : 'FAIL';
          const color = code === 0 ? '\x1b[32m' : '\x1b[31m';
          console.log(`  ${color}${status}\x1b[0m  ${name}  (${pass}p / ${fail}f)`);
          resolve({ name, status, pass, fail });
        });
      })
  )
);

const totalPass = results.reduce((s, r) => s + r.pass, 0);
const totalFail = results.reduce((s, r) => s + r.fail, 0);
const filePasses = results.filter((r) => r.status === 'PASS').length;
const fileFails = results.filter((r) => r.status === 'FAIL').length;

console.log('\n' + '─'.repeat(55));
console.log(`Files:  ${filePasses} passed / ${fileFails} failed  (${files.length} total)`);
console.log(`Tests:  ${totalPass} passed / ${totalFail} failed`);
console.log('─'.repeat(55) + '\n');

process.exit(fileFails > 0 ? 1 : 0);
