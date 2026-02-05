import chalk from 'chalk';
import { Command } from 'commander';
import integrations from '../integrations/index.js';
import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';

export function registerNotionCommand(program) {
  const notion = new Command('notion');
  notion.description('Notion integration helpers (Alpha - Full sync coming in v3.6.0)');

  notion
    .command('export')
    .description('Export IMPLEMENTATION-PLAN.md to Notion')
    .option('--page-id <id>', 'Notion page/database ID')
    .action(async (options) => {
      printWarning(chalk.yellow('\n⚠️  Notion integration is in Alpha.\n'));
      printInfo(chalk.cyan('ℹ️  Full bi-directional sync coming in v3.6.0 (March 2026).\n'));

      try {
        await integrations.notion.exportPlan({
          planPath: 'IMPLEMENTATION-PLAN.md'
        }, {
          apiToken: process.env.NOTION_API_TOKEN,
          databaseId: options.pageId || process.env.NOTION_DATABASE_ID
        });
        printSuccess(chalk.green('\n✅ Plan content prepared (no API call made).\n'));
        printInfo(chalk.dim('   Use the Notion API manually or wait for v3.6.0.\n'));
      } catch (error) {
        printWarning(chalk.yellow(`Notion export failed: ${error.message}`));
      }
    });

  notion
    .command('import <path>')
    .description('Import Notion content into local plan')
    .action(async (pathArg) => {
      printWarning(chalk.yellow('\n⚠️  Notion import is in Alpha - placeholder only.\n'));

      try {
        await integrations.notion.importPlan({
          outputPath: pathArg,
          content: '# Imported from Notion\n'
        }, {
          apiToken: process.env.NOTION_API_TOKEN,
          databaseId: process.env.NOTION_DATABASE_ID
        });
        printSuccess(chalk.green('\n✅ Placeholder file created.\n'));
        printInfo(chalk.dim('   (No actual API call to Notion - full sync in v3.6.0)\n'));
      } catch (error) {
        printError(chalk.red(`Notion import failed: ${error.message}`));
      }
    });

  program.addCommand(notion);
}
