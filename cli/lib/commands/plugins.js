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
        console.log(chalk.yellow('\nNo plugins installed.'));
        console.log(chalk.gray('Use "ultra-dex plugin create" to start building one.\n'));
        return;
      }

      console.log(chalk.bold.cyan('\n🔌 Installed Plugins\n'));
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

      console.log(table.toString());
      console.log();
    });

  pluginCmd
    .command('marketplace')
    .alias('m')
    .description('Browse community plugins')
    .action(async () => {
      console.log(chalk.bold.magenta('\n🌟 Ultra-Dex Plugin Marketplace\n'));
      
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

      console.log(table.toString());
      console.log(chalk.gray('\nTo install: ultra-dex plugin install <name>'));
      console.log(chalk.dim('Submit your plugin: https://github.com/Srujan0798/Ultra-Dex/plugins\n'));
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
        
        console.log(chalk.green(`\n✅ Plugin "${name}" created successfully!`));
        console.log(chalk.gray(`Location: ${pluginPath}`));
        console.log(chalk.gray(`Edit index.js to start adding custom hooks and logic.\n`));
      } catch (error) {
        console.error(chalk.red(`\n❌ Failed to create plugin: ${error.message}`));
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
        console.error(chalk.red(`\n❌ ${error.message}`));
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
        console.log(chalk.red(`\nPlugin "${name}" not found.`));
        return;
      }

      console.log(chalk.bold.cyan(`\n🔌 Plugin: ${name}`));
      console.log(chalk.gray('─'.repeat(30)));
      console.log(`${chalk.bold('Version:')}     ${plugin.manifest.version}`);
      console.log(`${chalk.bold('Author:')}      ${plugin.manifest.author || 'N/A'}`);
      console.log(`${chalk.bold('License:')}     ${plugin.manifest.license || 'N/A'}`);
      console.log(`${chalk.bold('Path:')}        ${plugin.path}`);
      console.log(`${chalk.bold('Description:')} ${plugin.manifest.description || 'No description'}`);
      
      if (plugin.manifest.hooks && plugin.manifest.hooks.length > 0) {
        console.log(`\n${chalk.bold('Registered Hooks:')}`);
        plugin.manifest.hooks.forEach(h => console.log(`  - ${h}`));
      }
      
      if (plugin.manifest.commands && plugin.manifest.commands.length > 0) {
        console.log(`\n${chalk.bold('Custom Commands:')}`);
        plugin.manifest.commands.forEach(c => console.log(`  - ${c.name}: ${c.description}`));
      }
      console.log();
    });
}

export default { registerPluginsCommand };
