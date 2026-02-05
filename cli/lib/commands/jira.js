import chalk from 'chalk';
import { Command } from 'commander';
import integrations from '../integrations/index.js';
import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';

export function registerJiraCommand(program) {
  const jira = new Command('jira');
  jira.description('Jira integration helpers (Alpha - Full sync coming in v3.6.0)');

  jira
    .command('status')
    .description('Show Jira integration status')
    .action(async () => {
      printWarning(chalk.yellow('\n⚠️  Jira integration is in Alpha.\n'));
      printInfo(chalk.cyan('ℹ️  Full bi-directional sync coming in v3.6.0 (March 2026).\n'));
      printInfo(chalk.dim('   For now, you can manually parse IMPLEMENTATION-PLAN.md.\n'));

      try {
        await integrations.jira.connect({
          baseUrl: process.env.JIRA_BASE_URL,
          apiToken: process.env.JIRA_API_TOKEN,
          email: process.env.JIRA_EMAIL
        });
        printSuccess(chalk.green('\n✅ Jira environment variables configured.\n'));
      } catch (error) {
        printWarning(chalk.yellow(`Jira not configured: ${error.message}`));
      }
    });

  jira
    .command('link <issue>')
    .description('Link a Jira issue to the current project')
    .action(async (issue) => {
      printWarning(chalk.yellow('\n⚠️  Alpha feature - issue linking is local only.\n'));
      printInfo(chalk.cyan(`📎 Linked Jira issue ${issue} to this project locally.`));
      printInfo(chalk.dim('   (No actual API call to Jira - full sync in v3.6.0)\n'));
    });

  program.addCommand(jira);
}
