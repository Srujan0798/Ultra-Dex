// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Governance module
 * @module commands/governance
 */

import chalk from 'chalk';
import { GovernanceEngine } from '../governance/index.js';
import {
  readAuditLog,
  exportAuditLog,
  generateComplianceReport,
} from '../governance/audit.js';
import { checkADRGovernance } from '../governance/adr-check.js';
import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';

function formatList(items) {
  if (!items || items.length === 0) return chalk.gray('none');
  return items.map((item) => chalk.white(item)).join(', ');
}

export function registerGovernanceCommand(program) {
  const cmd = program
    .command('governance')
    .description('Governance policy checks and audit utilities');

  cmd
    .command('status')
    .description('Show active governance policies')
    .action(async () => {
      const engine = new GovernanceEngine(process.cwd());
      await engine.init();

      const config = engine.config || {};
      printInfo(chalk.cyan.bold('\n🛡️  Governance Status\n'));
      printInfo(`Allowlist: ${formatList(config.allowlist || [])}`);
      printInfo(`Blocklist: ${formatList(config.blocklist || [])}`);

      if (config.roles) {
        printInfo(`Custom roles: ${Object.keys(config.roles).join(', ') || 'none'}`);
      }
    });

  cmd
    .command('authorize')
    .description('Evaluate a governance decision for an agent action')
    .requiredOption('--agent <role>', 'Agent role (e.g., backend, planner)')
    .requiredOption('--action <action>', 'Action type (read|write|execute)')
    .requiredOption('--target <target>', 'Target path or command')
    .action(async (options) => {
      const engine = new GovernanceEngine(process.cwd());
      await engine.init();

      const result = engine.authorize(options.agent, options.action, options.target);
      if (result.allowed) {
        printSuccess(chalk.green(`✅ Allowed: ${options.agent} can ${options.action} ${options.target}`));
        return;
      }

      printError(chalk.red(`❌ Blocked: ${result.reason}`));
      process.exitCode = 1;
    });

  cmd
    .command('audit')
    .description('Show recent governance audit events')
    .option('-l, --limit <n>', 'Number of entries to show', '20')
    .action(async (options) => {
      const events = await readAuditLog();
      const limit = Math.max(parseInt(options.limit, 10) || 20, 1);
      const slice = events.slice(-limit).reverse();

      if (slice.length === 0) {
        printWarning(chalk.yellow('No governance audit events found.'));
        return;
      }

      printInfo(chalk.cyan.bold(`\n📜 Governance Audit (last ${slice.length})\n`));
      slice.forEach((event) => {
        const status = event.allowed ? chalk.green('ALLOW') : chalk.red('BLOCK');
        const actor = event.agent?.id || event.agent || 'unknown';
        const op = event.operation || 'unknown';
        printInfo(
          `${status} ${chalk.white(actor)} ${chalk.gray(op)} ${chalk.white(
            event.target || ''
          )} ${chalk.dim(event.timestamp || '')}`
        );
      });
    });

  cmd
    .command('report')
    .description('Generate a compliance report from audit logs')
    .option('--since <date>', 'Start date (ISO)')
    .option('--until <date>', 'End date (ISO)')
    .option('--output <path>', 'Write report to file')
    .option('--format <format>', 'Report format (json|csv)', 'json')
    .action(async (options) => {
      try {
        const report = await generateComplianceReport({
          since: options.since,
          until: options.until,
          writeToFile: Boolean(options.output),
        });

        if (options.output) {
          const exported = await exportAuditLog({
            format: options.format,
            since: options.since,
            until: options.until,
            outputPath: options.output,
          });
          printSuccess(chalk.green(`✅ Report saved to ${exported.outputPath}`));
        } else {
          printInfo(JSON.stringify(report, null, 2));
        }
      } catch (error) {
        printError(chalk.red(`Failed to generate governance report: ${error.message}`));
        process.exitCode = 1;
      }
    });

  cmd
    .command('adr')
    .description('Run ADR compliance checks and list violations')
    .option('--task <name>', 'Task or change description', 'general')
    .option('--json', 'Output JSON')
    .option('--strict', 'Exit non-zero on violations')
    .action(async (options) => {
      try {
        const result = await checkADRGovernance(options.task);

        if (options.json) {
          printInfo(JSON.stringify(result, null, 2));
          if (options.strict && !result.compliant) process.exit(1);
          return;
        }

        if (result.checkedADRs?.length) {
          printInfo(chalk.cyan.bold('\n📘 ADR Compliance\n'));
          printInfo(`Checked ADRs: ${result.checkedADRs.join(', ')}`);
        } else {
          printWarning(chalk.yellow('No ADRs found to validate.'));
        }

        if (result.compliant) {
          printSuccess(chalk.green('✅ ADR compliance passed'));
          return;
        }

        printError(chalk.red('\n❌ ADR violations detected:'));
        result.violations.forEach((violation) => {
          printError(
            `- ${violation.adrId}: ${violation.title} (${violation.reason || 'non-compliant'})`
          );
        });

        if (options.strict) process.exit(1);
      } catch (error) {
        printError(chalk.red(`ADR check failed: ${error.message}`));
        process.exit(1);
      }
    });
}
