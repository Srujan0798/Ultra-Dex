// Copyright (c) 2026 Ultra-Dex

import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import { scanProject } from '../security/auditor.js';
import { formatSecurityReport } from '../security/report.js';
import { issueCertificate } from '../security/certifier.js';
import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';
import {
  validateSafePath,
  hasForbiddenPath,
  scanForSecrets,
  listForbiddenPaths,
} from '../security/validators.js';

export function registerSecurityCommand(program) {
  const cmd = program.command('security').description('Security audit and certification');

  cmd
    .command('audit')
    .description('Run full security audit')
    .action(async () => {
      try {
        const findings = await scanProject(process.cwd());
        const output = formatSecurityReport(findings, 'markdown');
        printInfo(output);
      } catch (error) {
        printError(chalk.red(`Security audit failed: ${error.message}`));
      }
    });

  cmd
    .command('check-secrets')
    .description('Scan repo for exposed secrets')
    .action(async () => {
      try {
        const findings = await scanForSecrets(process.cwd());
        if (!findings.length) {
          printSuccess(chalk.green('✅ No secrets detected.'));
          return;
        }
        printWarning(chalk.yellow(`⚠️  Found ${findings.length} potential secrets:`));
        findings.forEach((f) => {
          printWarning(`- ${f.file}: ${f.pattern}`);
        });
        process.exitCode = 1;
      } catch (error) {
        printError(chalk.red(`Secret scan failed: ${error.message}`));
      }
    });

  cmd
    .command('validate-paths')
    .description('Validate paths for traversal or forbidden entries')
    .option('--path <path>', 'Path to validate', '.')
    .action(async (options) => {
      const safe = validateSafePath(options.path);
      const forbidden = hasForbiddenPath(options.path);
      if (!safe || forbidden) {
        printWarning(chalk.yellow(`⚠️  Invalid path: ${options.path}`));
        printInfo(chalk.gray(`Forbidden paths: ${listForbiddenPaths().join(', ')}`));
        process.exitCode = 1;
        return;
      }
      printSuccess(chalk.green('✅ Path looks safe.'));
    });

  cmd
    .command('scan')
    .option('--format <format>', 'Output format (markdown|json|text)', 'markdown')
    .action(async (options) => {
      try {
        const findings = await scanProject(process.cwd());
        const output = formatSecurityReport(findings, options.format);
        printInfo(output);
      } catch (error) {
        printError(chalk.red(`Security scan failed: ${error.message}`));
      }
    });

  cmd.command('certify').action(async () => {
    try {
      const findings = await scanProject(process.cwd());
      const cert = await issueCertificate(findings);
      printSuccess(chalk.green(`Security score: ${cert.score}`));
      printInfo(chalk.gray(`Certificate: ${path.relative(process.cwd(), cert.mdPath)}`));
    } catch (error) {
      printError(chalk.red(`Certification failed: ${error.message}`));
    }
  });

  cmd
    .command('report')
    .option('--out <path>', 'Write report to file')
    .option('--format <format>', 'Output format', 'markdown')
    .action(async (options) => {
      try {
        const findings = await scanProject(process.cwd());
        const output = formatSecurityReport(findings, options.format);
        if (options.out) {
          await fs.writeFile(path.resolve(options.out), output, 'utf8');
          printSuccess(chalk.green(`Report written to ${options.out}`));
        } else {
          printInfo(output);
        }
      } catch (error) {
        printError(chalk.red(`Report failed: ${error.message}`));
      }
    });
}
