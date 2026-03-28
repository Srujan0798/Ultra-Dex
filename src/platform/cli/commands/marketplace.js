// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Marketplace module
 * @module commands/marketplace
 */

import { Command } from 'commander';
import { exec } from 'child_process';
import { agentMarketplace } from '../marketplace/index.js';
import { printInfo, printSuccess, printError, printWarning } from '../utils/output.js';

export function registerMarketplaceCommand(program) {
  const marketplaceCommand = program
    .command('marketplace')
    .alias('market')
    .description('Agent marketplace and plugin management');

  // Install command
  marketplaceCommand
    .command('install')
    .argument('<agent>', 'Agent name to install')
    .option('-v, --version <version>', 'Specific version to install (default: latest)')
    .option('-f, --force', 'Force reinstall if already installed')
    .description('Install an agent from the marketplace')
    .action(async (agentName, options) => {
      try {
        await agentMarketplace.initialize();
        const result = await agentMarketplace.installAgent(agentName, options.version);
        
        if (result.success) {
          printSuccess(result.message);
        }
      } catch (error) {
        printError(`Installation failed: ${error.message}`);
        process.exit(1);
      }
    });

  // Search command
  marketplaceCommand
    .command('search')
    .argument('[query]', 'Search query')
    .option('-c, --category <category>', 'Filter by category')
    .option('-t, --tier <tier>', 'Filter by tier (basic, pro, enterprise)')
    .option('-s, --sort <field>', 'Sort by field (downloads, rating, date)', 'downloads')
    .option('-l, --limit <n>', 'Limit results', '20')
    .description('Search for agents in the marketplace')
    .action(async (query, options) => {
      try {
        await agentMarketplace.initialize();
        const results = await agentMarketplace.searchAgents(query || '', {
          category: options.category,
          tier: options.tier,
          sort: options.sort,
          limit: parseInt(options.limit)
        });

        if (results.length === 0) {
          printInfo('📭 No agents found matching your search');
          return;
        }

        printSuccess(`🔍 Found ${results.length} agents:`);
        results.forEach(agent => {
          console.log(`\n${agent.name} v${agent.version}`);
          console.log(`   ${agent.description}`);
          console.log(`   🏷️  ${agent.tags?.join(', ') || 'No tags'}`);
          console.log(`   📥 ${agent.downloads || 0} downloads`);
          console.log(`   ⭐ ${agent.rating || 'N/A'} rating`);
        });
      } catch (error) {
        printError(`Search failed: ${error.message}`);
        process.exit(1);
      }
    });

  // List command
  marketplaceCommand
    .command('list')
    .alias('ls')
    .option('-a, --all', 'Show all details')
    .description('List installed agents')
    .action(async (options) => {
      try {
        await agentMarketplace.initialize();
        const agents = await agentMarketplace.listInstalledAgents();

        if (agents.length === 0) {
          printInfo('📭 No agents installed');
          return;
        }

        printSuccess(`📦 ${agents.length} installed agents:`);
        agents.forEach(agent => {
          console.log(`\n${agent.name} v${agent.version}`);
          console.log(`   ${agent.description}`);
          if (options.all) {
            console.log(`   📁 ${agent.path}`);
            console.log(`   🏷️  ${agent.tags?.join(', ') || 'No tags'}`);
            console.log(`   🛠️  ${agent.capabilities?.join(', ') || 'No capabilities'}`);
          }
        });
      } catch (error) {
        printError(`List failed: ${error.message}`);
        process.exit(1);
      }
    });

  // Uninstall command
  marketplaceCommand
    .command('uninstall')
    .alias('remove')
    .argument('<agent>', 'Agent name to uninstall')
    .option('-f, --force', 'Force removal without confirmation')
    .description('Uninstall an agent')
    .action(async (agentName, options) => {
      try {
        if (!options.force) {
          const { confirm } = await import('inquirer');
          const { yes } = await confirm.prompt([
            {
              type: 'confirm',
              name: 'yes',
              message: `Are you sure you want to uninstall ${agentName}?`,
              default: false
            }
          ]);

          if (!yes) {
            printInfo('❌ Uninstall cancelled');
            return;
          }
        }

        await agentMarketplace.initialize();
        const result = await agentMarketplace.uninstallAgent(agentName);
        
        if (result.success) {
          printSuccess(result.message);
        }
      } catch (error) {
        printError(`Uninstall failed: ${error.message}`);
        process.exit(1);
      }
    });

  // Update command
  marketplaceCommand
    .command('update')
    .argument('[agent]', 'Agent to update (all if not specified)')
    .option('-a, --all', 'Update all installed agents')
    .description('Update installed agents')
    .action(async (agentName, options) => {
      try {
        await agentMarketplace.initialize();
        
        if (options.all || !agentName) {
          const agents = await agentMarketplace.listInstalledAgents();
          for (const agent of agents) {
            printInfo(`Updating ${agent.name}...`);
            await agentMarketplace.updateAgent(agent.name);
          }
        } else {
          const result = await agentMarketplace.updateAgent(agentName);
          if (result.success) {
            printSuccess(result.message);
          }
        }
      } catch (error) {
        printError(`Update failed: ${error.message}`);
        process.exit(1);
      }
    });

  // Create command
  marketplaceCommand
    .command('create')
    .argument('<name>', 'Name for the new agent')
    .option('-t, --type <type>', 'Agent type (custom, backend, frontend, security, etc.)', 'custom')
    .description('Create a new agent template')
    .action(async (name, options) => {
      try {
        await agentMarketplace.initialize();
        const result = await agentMarketplace.createAgentTemplate(name, options.type);
        
        if (result.success) {
          printSuccess(result.message);
          printInfo(`\nNext steps:`);
          printInfo(`1. cd ${result.path}`);
          printInfo(`2. Edit src/agent.js to implement your logic`);
          printInfo(`3. Run tests: npm test`);
          printInfo(`4. Publish: ultra-dex market publish`);
        }
      } catch (error) {
        printError(`Creation failed: ${error.message}`);
        process.exit(1);
      }
    });

  // Publish command
  marketplaceCommand
    .command('publish')
    .option('-p, --path <path>', 'Path to agent directory (default: current directory)')
    .option('-k, --key <key>', 'API key for publishing')
    .description('Publish an agent to the marketplace')
    .action(async (options) => {
      try {
        const agentPath = options.path || process.cwd();
        const apiKey = options.key || process.env.ULTRA_DEX_MARKETPLACE_KEY;
        
        if (!apiKey) {
          printError('API key required. Set ULTRA_DEX_MARKETPLACE_KEY or use --key');
          process.exit(1);
        }

        await agentMarketplace.initialize();
        const result = await agentMarketplace.publishAgent(agentPath, apiKey);
        
        if (result.success) {
          printSuccess(result.message);
          printInfo(`Published at: ${result.agent.url}`);
        }
      } catch (error) {
        printError(`Publish failed: ${error.message}`);
        process.exit(1);
      }
    });

  // Info command
  marketplaceCommand
    .command('info')
    .argument('<agent>', 'Agent name to get info for')
    .description('Get detailed information about an agent')
    .action(async (agentName) => {
      try {
        await agentMarketplace.initialize();
        const agent = await agentMarketplace.getAgentDetails(agentName);
        
        if (!agent) {
          printError(`Agent not found: ${agentName}`);
          process.exit(1);
        }

        printSuccess(`${agent.name} v${agent.version}`);
        console.log(`\n${agent.description}`);
        console.log(`\n👤 Author: ${agent.author}`);
        console.log(`📋 Type: ${agent.type}`);
        console.log(`🏷️  Tags: ${agent.tags?.join(', ') || 'None'}`);
        console.log(`🛠️  Capabilities: ${agent.capabilities?.join(', ') || 'None'}`);
        console.log(`🔑 Permissions: ${agent.permissions?.join(', ') || 'None'}`);
        
        if (agent.downloads) {
          console.log(`📥 Downloads: ${agent.downloads}`);
        }
        
        if (agent.rating) {
          console.log(`⭐ Rating: ${agent.rating}/5`);
        }
      } catch (error) {
        printError(`Info retrieval failed: ${error.message}`);
        process.exit(1);
      }
    });

  // Browse command (opens marketplace in browser)
  marketplaceCommand
    .command('browse')
    .description('Open marketplace in browser')
    .action(() => {
      const url = 'https://marketplace.ultra-dex.ai';
      
      let command;
      switch (process.platform) {
        case 'darwin': // macOS
          command = `open ${url}`;
          break;
        case 'win32': // Windows
          command = `start ${url}`;
          break;
        default: // Linux and others
          command = `xdg-open ${url}`;
      }
      
      exec(command, (error) => {
        if (error) {
          printInfo(`🌐 Marketplace URL: ${url}`);
          printInfo('Open the URL in your browser to browse the marketplace');
        } else {
          printSuccess('🌐 Opening marketplace in browser...');
        }
      });
    });
}

export default registerMarketplaceCommand;
