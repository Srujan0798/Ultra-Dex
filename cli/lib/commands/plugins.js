/**
 * Ultra-Dex Plugin Management Command
 * Allows users to extend Ultra-Dex with custom logic and hooks
 */

import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import { PluginManager, PLUGIN_MANIFEST_EXAMPLE, PLUGIN_EXAMPLE } from '../utils/plugin-system.js';
import Table from 'cli-table3';
import inquirer from 'inquirer';
import { printError, printInfo, printSuccess, printWarning } from '../utils/output.js';
import { AppError, ValidationError } from '../utils/errors.js';

export function registerPluginsCommand(program) {
  const pluginCmd = program
    .command('plugin')
    .alias('plugins')
    .description('Manage Ultra-Dex plugins');

  pluginCmd
    .command('list')
    .description('List installed plugins')
    .action(async () => {
      const manager = new PluginManager(process.cwd());
      await manager.loadPlugins();
      const plugins = manager.listPlugins();

      if (plugins.length === 0) {
        printWarning(chalk.yellow('\nNo plugins installed.'));
        printInfo(chalk.gray('Use "ultra-dex plugin create" to start building one.\n'));
        return;
      }

      printInfo(chalk.bold.cyan('\n🔌 Installed Plugins\n'));
      const table = new Table({
        head: ['Name', 'Version', 'Author', 'Description'],
        style: { head: ['cyan'] }
      });

      plugins.forEach(p => {
        table.push([
          chalk.green(p.name),
          p.version,
          p.author || '-',
          p.description || '-'
        ]);
      });

      printInfo(table.toString());
      printInfo('');
    });

  pluginCmd
    .command('marketplace')
    .alias('m')
    .description('Browse community plugins')
    .action(async () => {
      printInfo(chalk.bold.magenta('\n🌟 Ultra-Dex Plugin Marketplace\n'));

      const communityPlugins = [
        { name: 'logger', desc: 'Detailed activity logging for agent swarms', stars: 124, author: '@srujan' },
        { name: 'slack', desc: 'Real-time Slack notifications for task completion', stars: 89, author: '@dex-dev' },
        { name: 'clerk-auth', desc: 'Advanced Clerk integration templates', stars: 215, author: '@clerk' },
        { name: 'docker-sandbox', desc: 'Enhanced Docker isolation for code execution', stars: 56, author: '@security-team' },
        { name: 'metrics-viz', desc: 'Visual dashboards for project metrics', stars: 42, author: '@viz-pro' }
      ];

      const table = new Table({
        head: ['Plugin', 'Description', 'Rating', 'Author'],
        colWidths: [15, 40, 10, 15]
      });

      communityPlugins.forEach(p => {
        table.push([
          chalk.cyan(p.name),
          chalk.white(p.desc),
          chalk.yellow('★ ' + p.stars),
          chalk.gray(p.author)
        ]);
      });

      printInfo(table.toString());
      printInfo(chalk.gray('\nTo install: ultra-dex plugin install <name>'));
      printInfo(chalk.dim('Submit your plugin: https://github.com/Srujan0798/Ultra-Dex/plugins\n'));
    });

  pluginCmd
    .command('create <name>')
    .description('Create a new plugin template')
    .action(async (name) => {
      const pluginPath = path.join(process.cwd(), '.ultra/plugins', name);
      
      try {
        await fs.mkdir(pluginPath, { recursive: true });
        
        const manifest = { ...PLUGIN_MANIFEST_EXAMPLE, name };
        await fs.writeFile(
          path.join(pluginPath, 'ultra-dex-plugin.json'),
          JSON.stringify(manifest, null, 2)
        );
        
        await fs.writeFile(
          path.join(pluginPath, 'index.js'),
          PLUGIN_EXAMPLE
        );

        printSuccess(chalk.green(`\n✅ Plugin "${name}" created successfully!`));
        printInfo(chalk.gray(`Location: ${pluginPath}`));
        printInfo(chalk.gray(`Edit index.js to start adding custom hooks and logic.\n`));
      } catch (error) {
        printError(chalk.red(`\n❌ Failed to create plugin: ${error.message}`));
      }
    });

  pluginCmd
    .command('install <source>')
    .description('Install a plugin from a local path or git URL')
    .action(async (source) => {
      const manager = new PluginManager(process.cwd());
      await manager.installPlugin(source);
    });

  pluginCmd
    .command('uninstall <name>')
    .description('Uninstall a plugin')
    .action(async (name) => {
      const manager = new PluginManager(process.cwd());
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: `Are you sure you want to uninstall plugin "${name}"?`,
          default: false
        }
      ]);

      if (!confirm) return;

      try {
        await manager.uninstallPlugin(name);
      } catch (error) {
        printError(chalk.red(`\n❌ ${error.message}`));
      }
    });

  pluginCmd
    .command('info <name>')
    .description('Show detailed plugin information')
    .action(async (name) => {
      const manager = new PluginManager(process.cwd());
      await manager.loadPlugins();
      const plugin = manager.plugins.get(name);

      if (!plugin) {
        printError(chalk.red(`\nPlugin "${name}" not found.`));
        return;
      }

      printInfo(chalk.bold.cyan(`\n🔌 Plugin: ${name}`));
      printInfo(chalk.gray('─'.repeat(30)));
      printInfo(`${chalk.bold('Version:')}     ${plugin.manifest.version}`);
      printInfo(`${chalk.bold('Author:')}      ${plugin.manifest.author || 'N/A'}`);
      printInfo(`${chalk.bold('License:')}     ${plugin.manifest.license || 'N/A'}`);
      printInfo(`${chalk.bold('Path:')}        ${plugin.path}`);
      printInfo(`${chalk.bold('Description:')} ${plugin.manifest.description || 'No description'}`);

      if (plugin.manifest.hooks && plugin.manifest.hooks.length > 0) {
        printInfo(`\n${chalk.bold('Registered Hooks:')}`);
        plugin.manifest.hooks.forEach(h => printInfo(`  - ${h}`));
      }

      if (plugin.manifest.commands && plugin.manifest.commands.length > 0) {
        printInfo(`\n${chalk.bold('Custom Commands:')}`);
        plugin.manifest.commands.forEach(c => printInfo(`  - ${c.name}: ${c.description}`));
      }
      printInfo('');
    });
}

export default { registerPluginsCommand };
