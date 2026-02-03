/**
 * ultra-dex plugin command
 * Manage Ultra-Dex plugins
 */

import chalk from 'chalk';
import { pluginManager } from '../plugin-system.js';
import fs from 'fs/promises';
import path from 'path';

export function registerPluginCommand(program) {
  const pluginCmd = program
    .command('plugin')
    .description('Manage Ultra-Dex plugins');

  pluginCmd
    .command('list')
    .description('List installed plugins')
    .action(listPlugins);

  pluginCmd
    .command('install <source>')
    .description('Install a plugin from a local file')
    .option('-f, --force', 'Force installation even if plugin exists')
    .action(installPlugin);

  pluginCmd
    .command('uninstall <name>')
    .description('Uninstall a plugin')
    .action(uninstallPlugin);

  pluginCmd
    .command('info <name>')
    .description('Show information about a plugin')
    .action(pluginInfo);

  pluginCmd
    .command('activate-all')
    .description('Activate all installed plugins')
    .action(activateAllPlugins);
}

async function listPlugins() {
  console.log(chalk.cyan('\n🔌 Ultra-Dex Plugins\n'));

  const plugins = pluginManager.getInstalledPlugins();

  if (plugins.length === 0) {
    console.log(chalk.yellow('No plugins installed.'));
    return;
  }

  console.log(chalk.bold('Installed Plugins:\n'));
  
  plugins.forEach(plugin => {
    console.log(`• ${chalk.green(plugin.name)} v${plugin.version}`);
    if (plugin.description) {
      console.log(`  ${chalk.gray(plugin.description)}`);
    }
    if (plugin.author) {
      console.log(`  ${chalk.gray(`by ${plugin.author}`)}`);
    }
    console.log('');
  });
}

async function installPlugin(source, options) {
  console.log(chalk.cyan(`\n🔌 Installing plugin from: ${source}\n`));

  try {
    const result = await pluginManager.installPlugin(source, options);
    
    if (result.success) {
      console.log(chalk.green(`✅ Plugin installed successfully!`));
      console.log(chalk.gray(`Location: ${result.path}`));
    } else {
      console.log(chalk.red(`❌ Plugin installation failed: ${result.error}`));
    }
  } catch (error) {
    console.log(chalk.red(`❌ Plugin installation failed: ${error.message}`));
  }
}

async function uninstallPlugin(name) {
  console.log(chalk.cyan(`\n🔌 Uninstalling plugin: ${name}\n`));

  try {
    const result = await pluginManager.uninstallPlugin(name);
    
    if (result.success) {
      console.log(chalk.green(`✅ Plugin uninstalled successfully!`));
    } else {
      console.log(chalk.red(`❌ Plugin uninstallation failed: ${result.error}`));
    }
  } catch (error) {
    console.log(chalk.red(`❌ Plugin uninstallation failed: ${error.message}`));
  }
}

async function pluginInfo(name) {
  console.log(chalk.cyan(`\n🔌 Plugin Information: ${name}\n`));

  const plugin = pluginManager.getPlugin(name);

  if (!plugin) {
    console.log(chalk.red(`Plugin '${name}' not found.`));
    return;
  }

  console.log(chalk.bold('Details:'));
  console.log(`Name: ${plugin.name}`);
  console.log(`Version: ${plugin.version}`);
  console.log(`Description: ${plugin.description || 'No description'}`);
  console.log(`Author: ${plugin.author || 'Unknown'}`);
  console.log(`Loaded: ${plugin.loaded ? chalk.green('Yes') : chalk.red('No')}`);
  console.log(`Path: ${plugin.path}`);

  // Show hooks this plugin is attached to
  console.log(chalk.bold('\nHooks:'));
  let hasHooks = false;
  for (const [hookName, hooks] of pluginManager.hooks) {
    const pluginHooks = hooks.filter(h => h.pluginName === name);
    if (pluginHooks.length > 0) {
      console.log(`• ${hookName} (${pluginHooks.length} attachment${pluginHooks.length !== 1 ? 's' : ''})`);
      hasHooks = true;
    }
  }
  
  if (!hasHooks) {
    console.log(chalk.gray('This plugin is not attached to any hooks.'));
  }
}

async function activateAllPlugins() {
  console.log(chalk.cyan('\n🔌 Activating all plugins...\n'));

  try {
    await pluginManager.activatePlugins({});
    console.log(chalk.green(`✅ All plugins activated successfully!`));
  } catch (error) {
    console.log(chalk.red(`❌ Plugin activation failed: ${error.message}`));
  }
}