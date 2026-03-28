// Copyright (c) 2026 Ultra-Dex

/**
 * Ultra-Dex Plugin Management Command
 * Allows users to extend Ultra-Dex with custom logic and hooks
 */

import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import { PluginManager, PLUGIN_MANIFEST_EXAMPLE, PLUGIN_EXAMPLE } from '../utils/plugin-system.js';
import { pluginRegistry } from '../plugins/index.js'; // Import the new plugin registry
import { agentMarketplace } from '../marketplace/index.js';

/**
 * Create a plugin from a template
 */
async function createPluginFromTemplate(name, template, pluginPath) {
  const templates = {
    basic: {
      'ultra-dex-plugin.json': JSON.stringify(
        {
          name: name,
          version: '1.0.0',
          description: 'A basic Ultra-Dex plugin',
          main: 'index.js',
          ultraDex: {
            version: '>=3.0.0',
            commands: [],
          },
        },
        null,
        2
      ),
      'capability_manifest.json': JSON.stringify(
        {
          name: name,
          version: '1.0.0',
          tools: [],
        },
        null,
        2
      ),
      'index.js': `/**
 * ${name} - Ultra-Dex Plugin
 */

export function registerCommands(program) {
  // Add your plugin commands here
  program
    .command('${name}')
    .description('A custom plugin command')
    .action(async (options) => {
      logger.log('Plugin ${name} executed');
    });
}

export default {
  registerCommands
};
`,
      'README.md': `# ${name} Plugin\n\nA custom Ultra-Dex plugin.`,
    },
    command: {
      'ultra-dex-plugin.json': JSON.stringify(
        {
          name: name,
          version: '1.0.0',
          description: 'A command plugin for Ultra-Dex',
          main: 'index.js',
          ultraDex: {
            version: '>=3.0.0',
            commands: [name],
          },
        },
        null,
        2
      ),
      'capability_manifest.json': JSON.stringify(
        {
          name: name,
          version: '1.0.0',
          tools: [],
        },
        null,
        2
      ),
      'index.js': `/**
 * ${name} Command Plugin
 */

export function registerCommands(program) {
  program
    .command('${name} <task>')
    .description('Execute ${name} functionality')
    .option('--option <value>', 'An example option')
    .action(async (task, options) => {
      logger.log('Executing ${name} for task:', task);
      logger.log('Options:', options);
    });
}

export default {
  registerCommands
};
`,
      'README.md': `# ${name} Command Plugin\n\nA command plugin for Ultra-Dex.`,
    },
  };

  const templateData = templates[template] || templates.basic;

  for (const [filename, content] of Object.entries(templateData)) {
    await fs.writeFile(path.join(pluginPath, filename), content);
  }
}

const TRUST_REGISTRY = path.join(process.cwd(), '.ultra-dex', 'plugin-trust.json');

async function loadTrustRegistry() {
  try {
    const data = await fs.readFile(TRUST_REGISTRY, 'utf8');
    return JSON.parse(data);
  } catch {
    return { trusted: [] };
  }
}

async function saveTrustRegistry(registry) {
  await fs.mkdir(path.dirname(TRUST_REGISTRY), { recursive: true });
  await fs.writeFile(TRUST_REGISTRY, JSON.stringify(registry, null, 2));
}
import Table from 'cli-table3';
import inquirer from 'inquirer';
import { printError, printInfo, printSuccess, printWarning } from '../utils/output.js';
import { AppError, ValidationError } from '../utils/errors.js';
import { scanPlugin } from '../security/plugin-validator.js';

export function registerPluginCommand(program) {
  const pluginCmd = program
    .command('plugin')
    .alias('plugins')
    .description('Manage Ultra-Dex plugins');

  pluginCmd
    .command('list')
    .alias('ls')
    .description('List installed plugins')
    .action(async () => {
      const plugins = pluginRegistry.getInstalledPlugins();

      if (plugins.length === 0) {
        printWarning(chalk.yellow('\nNo plugins installed.'));
        printInfo(chalk.gray('Use "ultra-dex plugin create" to start building one.\n'));
        return;
      }

      printInfo(chalk.bold.cyan('\n🔌 Installed Plugins\n'));
      const table = new Table({
        head: ['Name', 'Version', 'Author', 'Description', 'Status'],
        style: { head: ['cyan'] },
      });

      plugins.forEach((p) => {
        table.push([
          chalk.green(p.name),
          p.version || 'N/A',
          p.author || '-',
          p.description || '-',
          p.installed ? chalk.green('✓ Active') : chalk.yellow('○ Inactive'),
        ]);
      });

      printInfo(table.toString());
      printInfo('');
    });

  pluginCmd
    .command('marketplace')
    .alias('m')
    .description('Browse community plugins')
    .option('--search <query>', 'Search for plugins')
    .option('--sort <by>', 'Sort by (downloads, rating, name)', 'downloads')
    .action(async (options) => {
      printInfo(chalk.bold.magenta('\n🌟 Ultra-Dex Plugin Marketplace\n'));

      try {
        // Get available plugins from registry
        const availablePlugins = await pluginRegistry.getAvailablePlugins();

        // Filter if search query is provided
        let filteredPlugins = availablePlugins;
        if (options.search) {
          filteredPlugins = availablePlugins.filter(
            (p) =>
              p.name.toLowerCase().includes(options.search.toLowerCase()) ||
              p.description.toLowerCase().includes(options.search.toLowerCase())
          );
        }

        // Sort plugins
        if (options.sort === 'name') {
          filteredPlugins.sort((a, b) => a.name.localeCompare(b.name));
        } else if (options.sort === 'rating') {
          filteredPlugins.sort((a, b) => b.rating - a.rating);
        } else {
          // default to downloads
          filteredPlugins.sort((a, b) => b.downloads - a.downloads);
        }

        const table = new Table({
          head: ['Plugin', 'Description', 'Downloads', 'Rating', 'Author'],
          colWidths: [15, 35, 12, 8, 15],
        });

        filteredPlugins.forEach((p) => {
          table.push([
            chalk.cyan(p.name),
            chalk.white(p.description.substring(0, 32) + (p.description.length > 32 ? '...' : '')),
            chalk.blue(p.downloads.toLocaleString()),
            chalk.yellow('★ ' + p.rating),
            chalk.gray(p.author),
          ]);
        });

        printInfo(table.toString());
        printInfo(chalk.gray('\nTo install: ultra-dex plugin install <name>'));
        printInfo(
          chalk.dim('Submit your plugin: https://github.com/Srujan0798/Ultra-Dex/plugins\n')
        );
      } catch (error) {
        printError(chalk.red(`\n❌ Failed to fetch marketplace: ${error.message}`));
      }
    });

  pluginCmd
    .command('create <name>')
    .description('Create a new plugin template')
    .option('-t, --template <type>', 'Template type (agent, template, integration)')
    .action(async (name, options) => {
      const pluginPath = path.join(process.cwd(), '.ultra-dex/plugins', name);

      try {
        await fs.mkdir(pluginPath, { recursive: true });

        if (options.template) {
          await createPluginFromTemplate(name, options.template, pluginPath);
        } else {
          const manifest = { ...PLUGIN_MANIFEST_EXAMPLE, name, version: '1.0.0' };
          await fs.writeFile(
            path.join(pluginPath, 'ultra-dex-plugin.json'),
            JSON.stringify(manifest, null, 2)
          );

          await fs.writeFile(path.join(pluginPath, 'index.js'), PLUGIN_EXAMPLE);
        }

        printSuccess(chalk.green(`\n✅ Plugin "${name}" created successfully!`));
        printInfo(chalk.gray(`Location: ${pluginPath}`));
        printInfo(chalk.gray(`Edit index.js to start adding custom hooks and logic.\n`));
      } catch (error) {
        printError(chalk.red(`\n❌ Failed to create plugin: ${error.message}`));
      }
    });

  pluginCmd
    .command('install <source>')
    .description('Install a plugin from a local path, git URL, or registry name')
    .option('--force', 'Force installation even if plugin exists')
    .option('--save', 'Save plugin to project configuration')
    .action(async (source, options) => {
      try {
        printInfo(chalk.blue(`\nInstalling plugin: ${source}\n`));
        const result = await agentMarketplace.installAgent(source, options.version);

        if (result.success) {
          printSuccess(chalk.green(`\n✅ Plugin installed: ${result.name}`));
          if (options.save) {
            printInfo(chalk.gray('Plugin saved to project configuration'));
          }
          printInfo(chalk.gray('Restart Ultra-Dex to load the new plugin\n'));
        } else {
          printError(chalk.red(`\n❌ Installation failed: ${result.error}`));
        }
      } catch (error) {
        printError(chalk.red(`\n❌ Installation failed: ${error.message}`));
      }
    });

  pluginCmd
    .command('uninstall <name>')
    .alias('remove')
    .description('Uninstall a plugin')
    .option('-y, --yes', 'Skip confirmation prompt')
    .action(async (name, options) => {
      if (!options.yes) {
        const { confirm } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: `Are you sure you want to uninstall plugin "${name}"?`,
            default: false,
          },
        ]);

        if (!confirm) {
          printInfo(chalk.yellow('\nUninstallation cancelled.'));
          return;
        }
      }

      try {
        await agentMarketplace.uninstallAgent(name);
        printSuccess(chalk.green(`\n✅ Plugin uninstalled: ${name}`));
      } catch (error) {
        printError(chalk.red(`\n❌ ${error.message}`));
      }
    });

  pluginCmd
    .command('info <name>')
    .description('Show detailed plugin information')
    .action(async (name) => {
      await pluginRegistry.initialize();
      const plugin = pluginRegistry.getPluginInfo(name);

      if (!plugin) {
        printError(chalk.red(`\nPlugin "${name}" not found.`));
        return;
      }

      printInfo(chalk.bold.cyan(`\n🔌 Plugin: ${name}`));
      printInfo(chalk.gray('─'.repeat(40)));
      printInfo(`${chalk.bold('Version:')}     ${plugin.version || 'N/A'}`);
      printInfo(`${chalk.bold('Author:')}      ${plugin.author || 'N/A'}`);
      printInfo(`${chalk.bold('License:')}     ${plugin.license || 'N/A'}`);
      printInfo(`${chalk.bold('Path:')}        ${plugin.path || 'N/A'}`);
      printInfo(`${chalk.bold('Description:')} ${plugin.description || 'No description'}`);
      printInfo(
        `${chalk.bold('Status:')}      ${plugin.installed ? chalk.green('✓ Active') : chalk.yellow('○ Inactive')}`
      );

      if (plugin.hooks && plugin.hooks.length > 0) {
        printInfo(`\n${chalk.bold('Registered Hooks:')}`);
        plugin.hooks.forEach((h) => printInfo(`  - ${h}`));
      }

      if (plugin.commands && plugin.commands.length > 0) {
        printInfo(`\n${chalk.bold('Custom Commands:')}`);
        plugin.commands.forEach((c) => printInfo(`  - ${c.name}: ${c.description}`));
      }
      printInfo('');
    });

  pluginCmd
    .command('update [name]')
    .description('Update a plugin to the latest version')
    .option('--all', 'Update all installed plugins')
    .action(async (name, options) => {
      if (options.all) {
        const plugins = pluginRegistry.getInstalledPlugins();
        printInfo(chalk.blue(`\nUpdating all plugins...\n`));

        for (const plugin of plugins) {
          if (!plugin.local) {
            // Skip local plugins
            try {
              await pluginRegistry.updatePlugin(plugin.name);
              printSuccess(chalk.green(`✓ Updated: ${plugin.name}`));
            } catch (error) {
              printError(chalk.red(`✗ Failed to update ${plugin.name}: ${error.message}`));
            }
          } else {
            printInfo(chalk.gray(`- Skipping local plugin: ${plugin.name}`));
          }
        }
      } else if (name) {
        try {
          await pluginRegistry.updatePlugin(name);
          printSuccess(chalk.green(`\n✅ Plugin updated: ${name}`));
        } catch (error) {
          printError(chalk.red(`\n❌ Update failed: ${error.message}`));
        }
      } else {
        printError(chalk.red('\nPlease specify a plugin name or use --all to update all plugins'));
      }
    });

  pluginCmd
    .command('search <query>')
    .description('Search for plugins in the marketplace')
    .action(async (query) => {
      printInfo(chalk.bold.magenta(`\n🔍 Searching for: ${query}\n`));

      try {
        const availablePlugins = await pluginRegistry.getAvailablePlugins();
        const matchedPlugins = availablePlugins.filter(
          (p) =>
            p.name.toLowerCase().includes(query.toLowerCase()) ||
            p.description.toLowerCase().includes(query.toLowerCase())
        );

        if (matchedPlugins.length === 0) {
          printWarning(chalk.yellow('No plugins found matching your search.'));
          return;
        }

        const table = new Table({
          head: ['Plugin', 'Description', 'Downloads', 'Rating'],
          colWidths: [20, 40, 12, 8],
        });

        matchedPlugins.forEach((p) => {
          table.push([
            chalk.cyan(p.name),
            chalk.white(p.description.substring(0, 37) + (p.description.length > 37 ? '...' : '')),
            chalk.blue(p.downloads.toLocaleString()),
            chalk.yellow('★ ' + p.rating),
          ]);
        });

        printInfo(table.toString());
        printInfo('');
      } catch (error) {
        printError(chalk.red(`\n❌ Search failed: ${error.message}`));
      }
    });

  pluginCmd
    .command('scan <name>')
    .description('Scan a plugin for risky patterns')
    .action(async (name) => {
      try {
        const pluginPath = path.join(process.cwd(), '.ultra-dex/plugins', name);
        const findings = await scanPlugin(pluginPath);
        if (!findings.length) {
          printSuccess(chalk.green('✅ No risky patterns detected.'));
          return;
        }
        printWarning(chalk.yellow(`⚠️  ${findings.length} potential issues found:`));
        findings.forEach((f) => {
          printWarning(`- ${f.file}: ${f.pattern}`);
        });
      } catch (error) {
        printError(chalk.red(`Plugin scan failed: ${error.message}`));
      }
    });

  pluginCmd
    .command('trust <name>')
    .description('Mark a plugin as trusted')
    .action(async (name) => {
      try {
        const registry = await loadTrustRegistry();
        if (!registry.trusted.includes(name)) registry.trusted.push(name);
        await saveTrustRegistry(registry);
        printSuccess(chalk.green(`✅ Plugin ${name} marked as trusted.`));
      } catch (error) {
        printError(chalk.red(`Failed to trust plugin: ${error.message}`));
      }
    });
}

export default { registerPluginCommand };
