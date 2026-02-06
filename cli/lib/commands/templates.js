// Copyright (c) 2026 Ultra-Dex

import chalk from 'chalk';
import { Command } from 'commander';
import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';
import {
  listInstalledTemplates,
  searchTemplates,
  installTemplate,
  uninstallTemplate,
  publishTemplate,
} from '../marketplace/templates.js';

export function registerTemplatesCommand(program) {
  const templates = new Command('templates');
  templates.description('Manage Ultra-Dex template marketplace');

  templates
    .command('list')
    .description('List installed templates')
    .action(async () => {
      const installed = await listInstalledTemplates();
      if (!installed.length) {
        printWarning(chalk.yellow('\nNo templates installed.\n'));
        return;
      }
      printInfo(chalk.cyan('\nInstalled templates:\n'));
      installed.forEach((name) => printInfo(`  • ${name}`));
    });

  templates
    .command('search <query>')
    .description('Search template registry')
    .action(async (query) => {
      const results = await searchTemplates(query);
      if (!results.length) {
        printWarning(chalk.yellow('\nNo templates found.\n'));
        return;
      }
      printInfo(chalk.cyan('\nTemplate results:\n'));
      results.forEach((t) => {
        printInfo(chalk.white(`  ${t.name}`));
        printInfo(chalk.gray(`    ${t.description}`));
        if (t.category) printInfo(chalk.gray(`    Category: ${t.category}`));
      });
    });

  templates
    .command('install <name>')
    .description('Install template by name')
    .action(async (name) => {
      try {
        const result = await installTemplate(name);
        printSuccess(chalk.green(`\n✅ Installed template ${result.name} (${result.version})`));
        printInfo(chalk.gray(`   Path: ${result.path}\n`));
      } catch (error) {
        printError(chalk.red(`Install failed: ${error.message}`));
      }
    });

  templates
    .command('uninstall <name>')
    .description('Remove installed template')
    .action(async (name) => {
      await uninstallTemplate(name);
      printSuccess(chalk.green(`\n✅ Uninstalled template ${name}\n`));
    });

  templates
    .command('publish <path>')
    .description('Publish a local template to registry')
    .option('--name <name>', 'Template name')
    .option('--version <version>', 'Template version', '1.0.0')
    .option('--description <description>', 'Template description', '')
    .option('--category <category>', 'Template category', 'custom')
    .action(async (templatePath, options) => {
      try {
        if (!options.name) {
          printError(chalk.red('Template name is required (--name).'));
          return;
        }

        const entry = await publishTemplate(
          {
            name: options.name,
            version: options.version,
            description: options.description,
            category: options.category,
          },
          templatePath
        );

        printSuccess(chalk.green(`\n✅ Published template ${entry.name}@${entry.version}\n`));
      } catch (error) {
        printError(chalk.red(`Publish failed: ${error.message}`));
      }
    });

  program.addCommand(templates);
}
