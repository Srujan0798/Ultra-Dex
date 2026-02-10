// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Plugin Scan module
 * @module commands/plugin-scan
 */

import chalk from 'chalk';
import path from 'path';
import { scanPlugin } from '../security/plugin-validator.js';
import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';

export function registerPluginScanCommand(program) {
  program
    .command('plugin-scan <name>')
    .description('Scan a plugin for risky patterns')
    .action(async (name) => {
      try {
        const pluginPath = path.join(process.cwd(), '.ultra-dex/plugins', name);
        const findings = await scanPlugin(pluginPath);
        if (!findings.length) {
          printSuccess(chalk.green('✅ No risky patterns detected.'));
          return;
        }
        printWarning(chalk.yellow(`⚠️  ${findings.length} potential issues found:`));
        findings.forEach((f) => {
          printWarning(`- ${f.file}: ${f.pattern}`);
        });
      } catch (error) {
        printError(chalk.red(`Plugin scan failed: ${error.message}`));
      }
    });
}
