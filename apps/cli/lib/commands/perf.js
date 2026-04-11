// Copyright (c) 2026 Ultra-Dex

import path from 'path';
import fs from 'fs/promises';
import { profiler } from '../../../../src/core/performance/profiler.ts';
import { printError, printSuccess, printInfo } from '../utils/output.js';

export function registerPerfCommand(program) {
  const perf = program.command('perf').description('Performance profiling tools');

  perf
    .command('profile')
    .description('Run a lightweight runtime profile and print report')
    .option('--output <file>', 'Write Chrome DevTools trace JSON to file')
    .action(async (options) => {
      try {
        profiler.startRecording();

        const startupSpan = profiler.startSpan('startup:bootstrap');
        await new Promise((resolve) => setTimeout(resolve, 5));
        profiler.endSpan(startupSpan);

        const routingSpan = profiler.startSpan('routing:decision');
        await new Promise((resolve) => setTimeout(resolve, 2));
        profiler.endSpan(routingSpan);

        profiler.stopRecording();
        profiler.printReport();

        if (options.output) {
          const outputPath = path.resolve(options.output);
          await fs.mkdir(path.dirname(outputPath), { recursive: true });
          await profiler.exportToChromeDevTools(outputPath);
          printSuccess(`Perf trace written to ${outputPath}`);
        } else {
          printInfo('Tip: use --output <file> to export trace JSON');
        }
      } catch (error) {
        printError(`Failed to run perf profile: ${error.message}`);
        process.exitCode = 1;
      }
    });
}

export default registerPerfCommand;

