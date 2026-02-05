import chalk from 'chalk';
import path from 'path';
import { listRules, installRule, publishRule } from '../marketplace/rules.js';
import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';

export function registerRulesCommand(program) {
  const cmd = program.command('rules').description('Cursor rules marketplace');

  cmd
    .command('list')
    .option('--community', 'List community rules')
    .option('--enterprise', 'List enterprise rules')
    .action(async (options) => {
      const type = options.enterprise ? 'enterprise' : 'community';
      const rules = await listRules(type);
      if (!rules.length) {
        printWarning(chalk.yellow('No rules found.'));
        return;
      }
      printInfo(chalk.cyan(`\n${type.toUpperCase()} Rules\n`));
      rules.forEach((rule) => printInfo(`- ${rule.name}`));
    });

  cmd
    .command('install <file>')
    .description('Install a rule from file')
    .action(async (file) => {
      try {
        const target = await installRule(path.resolve(file));
        printSuccess(chalk.green(`Installed rule to ${target}`));
      } catch (error) {
        printError(chalk.red(`Install failed: ${error.message}`));
      }
    });

  cmd
    .command('publish <file>')
    .description('Publish a rule to registry')
    .action(async (file) => {
      const result = await publishRule(path.resolve(file));
      printSuccess(chalk.green(`Rule publish queued (${result.status}).`));
    });
}
