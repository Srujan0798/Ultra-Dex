// Copyright (c) 2026 Ultra-Dex

import chalk from 'chalk';
import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';

const BENCHMARK_DEFAULT = path.resolve('docs/completed/reports/benchmark.js');
const BENCHMARK_SUITE = path.resolve('docs/completed/reports/benchmark-suite.js');

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function runNodeScript(scriptPath, args = []) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [scriptPath, ...args], { stdio: 'inherit' });
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Benchmark exited with code ${code}`));
    });
  });
}

export function registerBenchmarkCommand(program) {
  program
    .command('benchmark')
    .description('Run Ultra-Dex benchmark suite')
    .option('--suite', 'Run full benchmark suite')
    .option('--output <path>', 'Write benchmark output to a file')
    .action(async (options) => {
      try {
        const scriptPath = options.suite ? BENCHMARK_SUITE : BENCHMARK_DEFAULT;
        const exists = await fileExists(scriptPath);

        if (!exists) {
          printError(chalk.red(`Benchmark script not found: ${scriptPath}`));
          printInfo(
            chalk.gray('Run benchmarks from the repo root or check docs/completed/reports/')
          );
          return;
        }

        printInfo(chalk.cyan('\n🏁 Running benchmark...\n'));

        if (options.output) {
          const outputPath = path.resolve(options.output);
          const child = spawn('node', [scriptPath], { stdio: ['ignore', 'pipe', 'pipe'] });
          let output = '';
          child.stdout.on('data', (chunk) => {
            process.stdout.write(chunk);
            output += chunk.toString();
          });
          child.stderr.on('data', (chunk) => {
            process.stderr.write(chunk);
            output += chunk.toString();
          });
          await new Promise((resolve, reject) => {
            child.on('close', (code) => {
              if (code === 0) resolve();
              else reject(new Error(`Benchmark exited with code ${code}`));
            });
          });
          await fs.writeFile(outputPath, output);
          printSuccess(`✅ Benchmark output saved to ${outputPath}`);
          return;
        }

        await runNodeScript(scriptPath);
        printSuccess('\n✅ Benchmark complete');
      } catch (error) {
        printWarning(chalk.yellow(`Benchmark failed: ${error.message}`));
      }
    });
}

export default { registerBenchmarkCommand };
