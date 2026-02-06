// Copyright (c) 2026 Ultra-Dex

import chalk from 'chalk';
import {
  exportPrivacyData,
  deletePrivacyData,
  updateConsent,
  readConsent,
  getPrivacyAudit,
} from '../privacy/gdpr.js';
import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';

export function registerPrivacyCommand(program) {
  const cmd = program.command('privacy').description('GDPR privacy controls');

  cmd
    .command('consent <value>')
    .description('Set consent true/false')
    .action(async (value) => {
      const consent = value === 'true' || value === '1' || value === 'yes';
      await updateConsent(consent);
      printSuccess(chalk.green(`Consent set to ${consent}`));
    });

  cmd
    .command('status')
    .description('Show consent status')
    .action(async () => {
      const consent = await readConsent();
      printInfo(chalk.cyan(`Consent: ${consent.consent}`));
      if (consent.updatedAt) printInfo(chalk.gray(`Updated: ${consent.updatedAt}`));
    });

  cmd
    .command('export')
    .description('Export all stored data')
    .action(async () => {
      try {
        const dir = await exportPrivacyData();
        printSuccess(chalk.green(`Export prepared at ${dir}`));
      } catch (error) {
        printError(chalk.red(`Export failed: ${error.message}`));
      }
    });

  cmd
    .command('delete')
    .description('Delete all stored data')
    .action(async () => {
      try {
        await deletePrivacyData();
        printWarning(chalk.yellow('All stored data deleted.'));
      } catch (error) {
        printError(chalk.red(`Delete failed: ${error.message}`));
      }
    });

  cmd
    .command('audit')
    .description('Show privacy audit log')
    .action(async () => {
      const events = await getPrivacyAudit();
      if (!events.length) {
        printWarning(chalk.yellow('No privacy audit entries.'));
        return;
      }
      events.forEach((event) => {
        printInfo(`${event.timestamp} ${event.action} ${event.reason || ''}`.trim());
      });
    });
}
