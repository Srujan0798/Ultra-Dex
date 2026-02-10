// Copyright (c) 2026 Ultra-Dex

import { Command } from 'commander';
import chalk from 'chalk';
import { PredictiveDebugger } from '../debugging/predictive.js';
import { printSuccess, printInfo, printError, printTable } from '../ui/index.js';

const debugCommand = new Command('predict')
  .description('Predictive Debugging (Background LLM) - v5.1');

debugCommand
  .command('start')
  .description('Start predictive debugging on a project')
  .argument('[path]', 'Project path', '.')
  .option('-w, --watch', 'Enable file watching', true)
  .action(async (projectPath, options) => {
    printInfo(chalk.blue('🔮 Starting Predictive Debugger...'));

    const debugInstance = new PredictiveDebugger({
      enableBackgroundAnalysis: options.watch,
    });

    debugInstance.on('started', ({ projectPath }) => {
      printSuccess(`Monitoring project: ${chalk.cyan(projectPath)}`);
    });

    debugInstance.on('prediction:new', (prediction) => {
      const severityColor = {
        critical: chalk.red,
        high: chalk.yellow,
        medium: chalk.blue,
        low: chalk.gray,
      }[prediction.severity];

      printWarning(
        `${severityColor(`[${prediction.severity.toUpperCase()}]`)} ` +
        `${prediction.description}`
      );

      if (prediction.fix) {
        printInfo(chalk.gray(`  Suggested fix: ${prediction.fix.description}`));
      }
    });

    debugInstance.on('error', ({ error, filePath }) => {
      printError(`Error analyzing ${filePath}: ${error.message}`);
    });

    await debugInstance.start(projectPath);

    printInfo(chalk.gray('Press Ctrl+C to stop'));

    process.on('SIGINT', async () => {
      printInfo('\n🛑 Stopping debugger...');
      await debugInstance.stop();

      // Print summary
      const stats = debugInstance.getAccuracyStats();
      const report = debugInstance.exportReport();

      printInfo('\n📊 Prediction Summary:');
      printTable([
        ['Total Predictions', report.summary.totalPredictions],
        ['Critical', report.summary.bySeverity.critical],
        ['Medium', report.summary.bySeverity.medium],
        ['Low', report.summary.bySeverity.low],
      ]);

      process.exit(0);
    });
  });

debugCommand
  .command('scan')
  .description('One-time scan of project for potential bugs')
  .argument('[path]', 'Project path', '.')
  .option('-s, --severity <level>', 'Minimum severity (critical/high/medium/low)', 'low')
  .action(async (projectPath, options) => {
    printInfo(chalk.blue('🔍 Scanning project for potential bugs...'));

    const debugInstance = new PredictiveDebugger({
      enableBackgroundAnalysis: false,
    });

    await debugInstance.start(projectPath);

    // Wait for initial scan
    await new Promise(resolve => setTimeout(resolve, 3000));

    const predictions = debugInstance.getPredictions({
      severity: options.severity === 'low' ? undefined : options.severity,
    });

    if (predictions.length === 0) {
      printSuccess('✅ No issues detected!');
    } else {
      printInfo(`\nFound ${predictions.length} potential issue(s):\n`);

      for (const prediction of predictions) {
        const severityColor = {
          critical: chalk.red,
          high: chalk.yellow,
          medium: chalk.blue,
          low: chalk.gray,
        }[prediction.severity];

        console.log(`${severityColor(`[${prediction.severity.toUpperCase()}]`)} ${prediction.description}`);

        if (prediction.fix) {
          console.log(chalk.gray(`  Fix: ${prediction.fix.description}`));
          console.log(chalk.gray(`  Code: ${prediction.fix.replacement}\n`));
        }
      }
    }

    await debugInstance.stop();
  });

debugCommand
  .command('report')
  .description('Generate prediction report')
  .argument('[path]', 'Project path', '.')
  .option('-o, --output <file>', 'Output file')
  .action(async (projectPath, options) => {
    printInfo(chalk.blue('📄 Generating prediction report...'));

    const debugInstance = new PredictiveDebugger({
      enableBackgroundAnalysis: false,
    });

    await debugInstance.start(projectPath);
    await new Promise(resolve => setTimeout(resolve, 3000));

    const report = debugInstance.exportReport();

    if (options.output) {
      const fs = await import('fs/promises');
      await fs.writeFile(options.output, JSON.stringify(report, null, 2));
      printSuccess(`Report saved to ${chalk.cyan(options.output)}`);
    } else {
      console.log(JSON.stringify(report, null, 2));
    }

    await debugInstance.stop();
  });

// Helper function for warnings
function printWarning(message) {
  console.log(chalk.yellow(`⚠️  ${message}`));
}

export default debugCommand;
