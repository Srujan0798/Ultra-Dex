// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Ide module
 * @module commands/ide
 */

// File: cli/lib/commands/ide.js
import { WebIDE } from '../ide/web-ide.js';
import { printInfo, printSuccess, printError } from '../utils/output.js';

export async function registerIdeCommand(program) {
  const ideCmd = program
    .command('ide')
    .alias('cloud')
    .description('Cloud IDE integration');

  ideCmd
    .command('start')
    .description('Start cloud IDE server')
    .option('-p, --port <port>', 'Port to run IDE on', '3006')
    .action(async (options) => {
      try {
        const ide = new WebIDE({ port: parseInt(options.port) });
        await ide.initialize();
        
        printSuccess(`Cloud IDE started on http://localhost:${options.port}`);
        printInfo('Features:');
        printInfo('  - File browsing and editing');
        printInfo('  - Terminal integration');
        printInfo('  - Ultra-Dex command integration');
        printInfo('  - Real-time collaboration');
      } catch (error) {
        printError(`Failed to start IDE: ${error.message}`);
      }
    });

  ideCmd
    .command('connect')
    .description('Connect to cloud IDE')
    .action(async () => {
      printInfo('Opening cloud IDE in browser...');
      // Would open browser to IDE URL
    });
}