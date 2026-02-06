// Copyright (c) 2026 Ultra-Dex

import chalk from 'chalk';
import fs from 'fs/promises';
import { telemetryLogPath, loadTelemetryConfig, saveTelemetryConfig } from '../utils/telemetry.js';
import { privacyReport } from '../utils/privacy.js';
import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';

async function getTelemetrySummary() {
  const config = (await loadTelemetryConfig()) || { enabled: false };
  let logCount = 0;
  try {
    const data = await fs.readFile(telemetryLogPath, 'utf8');
    logCount = data.trim() ? data.trim().split('\n').length : 0;
  } catch {
    logCount = 0;
  }
  return { config, logCount, logPath: telemetryLogPath, privacy: privacyReport() };
}

export function registerTelemetryCommand(program) {
  const cmd = program.command('telemetry').description('Manage opt-in CLI telemetry');

  cmd
    .command('status')
    .description('Show telemetry status')
    .action(async () => {
      const summary = await getTelemetrySummary();
      printInfo(chalk.cyan('\n📡 Telemetry Status\n'));
      printInfo(`Enabled: ${summary.config.enabled ? chalk.green('Yes') : chalk.red('No')}`);
      printInfo(`Log: ${chalk.gray(summary.logPath)}`);
      printInfo(`Events: ${chalk.yellow(summary.logCount)}`);
      printInfo(
        `Privacy: localOnly=${summary.privacy.localOnly}, encryption=${summary.privacy.encryption}`
      );
    });

  cmd
    .command('enable')
    .description('Enable telemetry (opt-in)')
    .action(async () => {
      await saveTelemetryConfig({ enabled: true, source: 'telemetry' });
      printSuccess('✅ Telemetry enabled.');
    });

  cmd
    .command('disable')
    .description('Disable telemetry')
    .action(async () => {
      await saveTelemetryConfig({ enabled: false, source: 'telemetry' });
      printSuccess('✅ Telemetry disabled.');
    });

  cmd
    .command('report')
    .description('Show telemetry privacy report')
    .action(async () => {
      const summary = await getTelemetrySummary();
      printInfo(chalk.cyan('\n🔒 Privacy Report\n'));
      printInfo(JSON.stringify(summary.privacy, null, 2));
    });

  cmd
    .command('export')
    .description('Export telemetry log to a file')
    .option('-o, --output <path>', 'Output file path', 'telemetry-export.jsonl')
    .action(async (options) => {
      try {
        const data = await fs.readFile(telemetryLogPath, 'utf8');
        await fs.writeFile(options.output, data);
        printSuccess(`✅ Exported telemetry to ${options.output}`);
      } catch (error) {
        printError(chalk.red(`Failed to export telemetry: ${error.message}`));
      }
    });

  cmd._examples = [
    { command: 'ultra-dex telemetry status', description: 'Show telemetry status' },
    { command: 'ultra-dex telemetry enable', description: 'Enable telemetry' },
    { command: 'ultra-dex telemetry disable', description: 'Disable telemetry' },
    { command: 'ultra-dex telemetry export --output telemetry.jsonl', description: 'Export log' },
  ];
}

export default { registerTelemetryCommand };
