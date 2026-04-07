import chalk from 'chalk';
import { MCPRegistry } from '../../../../src/core/mcp/registry.js';
import { MarketplaceAPI } from '../../../../src/core/mcp/marketplace-api.js';
import { printInfo, printSuccess, printWarning } from '../utils/output.js';

function defaultFactories() {
  return {
    createRegistry: async () => {
      const registry = new MCPRegistry();
      await registry.initialize();
      return registry;
    },
    createMarketplace: () => new MarketplaceAPI(),
  };
}

export function registerMcpCommand(program, factories = {}) {
  const resolvedFactories = {
    ...defaultFactories(),
    ...factories,
  };

  const mcp = program.command('mcp').description('MCP marketplace and plugin lifecycle commands');

  mcp
    .command('search <query>')
    .option('--category <category>', 'Filter by category')
    .option('--author <author>', 'Filter by author')
    .action(async (query, options) => {
      const marketplace = resolvedFactories.createMarketplace();
      const results = await marketplace.search(query, {
        category: options.category,
        author: options.author,
      });

      if (!results.length) {
        printWarning(chalk.yellow('No plugins found.'));
        return;
      }

      for (const plugin of results) {
        printInfo(
          `${plugin.id || plugin.name} ${plugin.version ? `(${plugin.version})` : ''} ${plugin.description ? `- ${plugin.description}` : ''}`
        );
      }
    });

  mcp
    .command('info <pluginId>')
    .description('Show marketplace details for a plugin')
    .action(async (pluginId) => {
      const marketplace = resolvedFactories.createMarketplace();
      const plugin = await marketplace.getPlugin(pluginId);
      printInfo(JSON.stringify(plugin, null, 2));
    });

  mcp
    .command('publish [pluginPath]')
    .option('--registry <registryUrl>', 'Remote registry URL override')
    .option('--token <token>', 'Marketplace auth token')
    .description('Publish a plugin locally and optionally to a remote marketplace')
    .action(async (pluginPath = 'packages/plugins', options) => {
      const registry = await resolvedFactories.createRegistry();
      const manifest = await registry.publish(pluginPath);
      printSuccess(chalk.green(`Published ${manifest.id}@${manifest.version} locally.`));

      if (options.registry || options.token) {
        const marketplace = resolvedFactories.createMarketplace();
        if (options.registry) {
          marketplace.registryUrl = options.registry;
        }
        await marketplace.publish(pluginPath, options.token || process.env.ULTRA_DEX_MCP_TOKEN);
        printSuccess(chalk.green('Published to remote marketplace.'));
      }
    });

  mcp
    .command('install <pluginId>')
    .option('--version <version>', 'Plugin version', 'latest')
    .description('Install and activate a plugin')
    .action(async (pluginId, options) => {
      const registry = await resolvedFactories.createRegistry();
      await registry.install(pluginId, options.version);
      await registry.load(pluginId);
      printSuccess(chalk.green(`Installed and activated ${pluginId}.`));
    });

  mcp
    .command('uninstall <pluginId>')
    .description('Deactivate and uninstall a plugin')
    .action(async (pluginId) => {
      const registry = await resolvedFactories.createRegistry();
      try {
        await registry.unload(pluginId);
      } catch {
        // Plugin may already be inactive or missing from runtime, continue to uninstall.
      }
      await registry.uninstall(pluginId);
      printSuccess(chalk.green(`Uninstalled ${pluginId}.`));
    });

  mcp
    .command('list')
    .option('--verbose', 'Show verbose plugin status')
    .description('List installed or discovered MCP plugins')
    .action(async (options) => {
      const registry = await resolvedFactories.createRegistry();
      const plugins = registry.list();

      if (!plugins.length) {
        printWarning(chalk.yellow('No MCP plugins discovered.'));
        return;
      }

      for (const plugin of plugins) {
        const detail = options.verbose
          ? JSON.stringify(plugin)
          : `${plugin.id} (${plugin.status})${plugin.version ? ` v${plugin.version}` : ''}`;
        printInfo(detail);
      }
    });

  mcp
    .command('update')
    .description('Refresh the local MCP plugin catalogue')
    .action(async () => {
      const registry = await resolvedFactories.createRegistry();
      await registry.initialize();
      const count = (await registry.discover({})).length;
      printSuccess(chalk.green(`Updated local MCP registry (${count} published entries).`));
    });

  return mcp;
}

export default registerMcpCommand;
