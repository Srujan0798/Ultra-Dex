// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Cicd module
 * @module commands/cicd
 */

import { Command } from 'commander';
import fs from 'fs/promises';
import { selfHealingCICD } from '../cicd/self-healing.js';
import { printInfo, printSuccess, printError, printWarning } from '../utils/output.js';

export function registerCICDCommand(program) {
  const cicdCommand = program
    .command('cicd')
    .description('Self-healing CI/CD pipeline with autonomous bug fixing');

  cicdCommand
    .command('run')
    .option('-a, --auto-fix', 'Enable auto-fixing of issues')
    .option('-n, --no-notifications', 'Disable notifications')
    .option('-v, --verbose', 'Enable verbose output')
    .option('--max-retries <n>', 'Maximum retry attempts', '3')
    .option('--timeout <ms>', 'Timeout for each stage', '300000')
    .option('--stages <stages>', 'Comma-separated stages to run', 'test,build,deploy')
    .description('Run self-healing CI/CD pipeline')
    .action(async (options) => {
      try {
        await selfHealingCICD.initialize();

        const config = {
          autoFix: options.autoFix,
          notifications: options.notifications,
          verbose: options.verbose,
          maxRetries: parseInt(options.maxRetries, 10),
          timeout: parseInt(options.timeout, 10),
          stages: options.stages.split(',').map((s) => s.trim()),
        };

        printInfo('🔄 Starting self-healing CI/CD pipeline...');
        printInfo(`🔧 Auto-fix: ${config.autoFix ? 'ENABLED' : 'DISABLED'}`);
        printInfo(`📊 Stages: ${config.stages.join(', ')}`);

        const result = await selfHealingCICD.runPipeline(config);

        printSuccess(`✅ Pipeline completed in ${result.duration}ms`);
        printInfo(`🔧 Fixes applied: ${result.fixesApplied}`);
        printInfo(`❌ Errors: ${result.errors.length}`);

        if (result.status === 'success') {
          printSuccess('🎉 Pipeline completed successfully!');
        } else {
          printWarning('⚠️  Pipeline completed with partial success');
        }
      } catch (error) {
        printError(`Pipeline failed: ${error.message}`);
        process.exit(1);
      }
    });

  cicdCommand
    .command('monitor')
    .option('-v, --verbose', 'Enable verbose output')
    .description('Start CI/CD failure monitoring')
    .action(async (options) => {
      try {
        await selfHealingCICD.initialize();

        printInfo('👀 Starting CI/CD monitoring...');

        await selfHealingCICD.startMonitoring();

        printSuccess('✅ Monitoring started. Press Ctrl+C to stop.');

        // Keep process alive
        await new Promise(() => {});
      } catch (error) {
        printError(`Monitoring failed: ${error.message}`);
        process.exit(1);
      }
    });

  cicdCommand
    .command('status')
    .description('Get current pipeline status')
    .action(async () => {
      try {
        const status = await selfHealingCICD.getPipelineStatus();

        printInfo('📊 Pipeline Status:');
        console.log(`  Running: ${status.running ? 'Yes' : 'No'}`);
        console.log(`  Last Run: ${status.lastRun}`);
        console.log(`  Success Rate: ${(status.successRate * 100).toFixed(1)}%`);
        console.log(`  Avg Duration: ${status.avgDuration}`);
        console.log(`  Pending Jobs: ${status.pendingJobs}`);
        console.log(`  Failed Jobs: ${status.failedJobs}`);
      } catch (error) {
        printError(`Status check failed: ${error.message}`);
        process.exit(1);
      }
    });

  cicdCommand
    .command('rules')
    .description('Manage healing rules')
    .action(async () => {
      try {
        await selfHealingCICD.initialize();
        const rules = Array.from(selfHealingCICD.healingRules.entries());

        printSuccess(`📋 ${rules.length} healing rules loaded:`);
        rules.forEach(([pattern, rule]) => {
          console.log(`  ${pattern}: ${rule.description} (${rule.priority})`);
        });
      } catch (error) {
        printError(`Rules check failed: ${error.message}`);
        process.exit(1);
      }
    });

  cicdCommand
    .command('add-rule')
    .argument('<pattern>', 'Regex pattern for error matching')
    .argument('<action>', 'Action to take when pattern matches')
    .option('-d, --description <desc>', 'Rule description')
    .option('-p, --priority <level>', 'Priority level (low, medium, high)', 'medium')
    .description('Add a new healing rule')
    .action(async (pattern, action, options) => {
      try {
        await selfHealingCICD.initialize();

        const rule = {
          action,
          description: options.description || `Auto-fix for ${pattern}`,
          priority: options.priority,
        };

        selfHealingCICD.addHealingRule(new RegExp(pattern), rule);

        printSuccess(`✅ Rule added: ${pattern} -> ${action}`);
      } catch (error) {
        printError(`Rule addition failed: ${error.message}`);
        process.exit(1);
      }
    });

  cicdCommand
    .command('stats')
    .description('Get healing statistics')
    .action(async () => {
      try {
        await selfHealingCICD.initialize();
        const stats = selfHealingCICD.getHealingStats();

        printSuccess('🔧 Self-Healing Statistics:');
        console.log(`  Total Fixes: ${stats.totalFixes}`);
        console.log(`  Success Rate: ${(stats.successRate * 100).toFixed(1)}%`);
        console.log(`  Active Rules: ${stats.rulesCount}`);
        console.log(`  Active Monitors: ${stats.activeMonitors}`);
        if (stats.lastFix) {
          console.log(`  Last Fix: ${stats.lastFix.description}`);
        }
      } catch (error) {
        printError(`Stats retrieval failed: ${error.message}`);
        process.exit(1);
      }
    });

  cicdCommand
    .command('report')
    .option('-f, --format <format>', 'Output format (json, md, txt)', 'json')
    .option('-o, --output <path>', 'Output file path')
    .description('Generate healing report')
    .action(async (options) => {
      try {
        await selfHealingCICD.initialize();
        const report = await selfHealingCICD.exportReport(options.format);

        if (options.output) {
          await fs.writeFile(options.output, report);
          printSuccess(`📊 Report saved to: ${options.output}`);
        } else {
          console.log(report);
        }
      } catch (error) {
        printError(`Report generation failed: ${error.message}`);
        process.exit(1);
      }
    });

  cicdCommand
    .command('setup')
    .argument('<provider>', 'CI provider (github, gitlab, circleci, jenkins, vercel)')
    .description('Set up CI/CD integration')
    .action(async (provider) => {
      try {
        await selfHealingCICD.initialize();

        await selfHealingCICD.setupCIIntegration(provider);

        printSuccess(`✅ ${provider} CI/CD integration set up successfully`);
        printInfo('Run: ultra-dex cicd run to execute pipeline');
      } catch (error) {
        printError(`Setup failed: ${error.message}`);
        process.exit(1);
      }
    });

  cicdCommand
    .command('history')
    .option('-l, --limit <n>', 'Number of entries to show', '10')
    .description('Show healing history')
    .action(async (options) => {
      try {
        await selfHealingCICD.initialize();

        const history = selfHealingCICD.fixHistory.slice(-parseInt(options.limit, 10));

        if (history.length === 0) {
          printInfo('📭 No healing history available');
          return;
        }

        printSuccess(`📋 Last ${history.length} fixes:`);
        history.forEach((entry) => {
          console.log(
            `  ${entry.timestamp}: ${entry.description} (${entry.success ? 'SUCCESS' : 'FAILED'})`
          );
        });
      } catch (error) {
        printError(`History retrieval failed: ${error.message}`);
        process.exit(1);
      }
    });

  // Add cicd as a main command alias
  program
    .command('self-heal')
    .description('Alias for cicd run')
    .option('-a, --auto-fix', 'Enable auto-fixing')
    .option('-v, --verbose', 'Verbose output')
    .action(async (options) => {
      // Delegate to cicd run command
      const config = {
        autoFix: options.autoFix,
        verbose: options.verbose,
        notifications: true,
        maxRetries: 3,
        timeout: 300000,
        stages: ['test', 'build', 'deploy'],
      };

      await selfHealingCICD.initialize();
      const result = await selfHealingCICD.runPipeline(config);

      if (result.status === 'success') {
        printSuccess('✅ Self-healing pipeline completed successfully');
      } else {
        printWarning('⚠️  Self-healing pipeline completed with issues');
      }
    });
}

export default registerCICDCommand;
