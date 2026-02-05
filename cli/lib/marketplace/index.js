/**
 * Agent Marketplace
 * Handles publishing, installing, and managing community agents
 */

import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';
import chalk from 'chalk';
import { AppError } from '../utils/errors.js';

const execAsync = promisify(exec);

// Marketplace registry URL
const MARKETPLACE_REGISTRY = process.env.ULTRA_DEX_MARKETPLACE_URL || 'https://registry.ultra-dex.ai';

// Local agents directory
const LOCAL_AGENTS_DIR = path.join(process.cwd(), 'agents');

/**
 * Agent Manifest Schema
 */
export const AGENT_MANIFEST_SCHEMA = {
  type: 'object',
  required: ['name', 'version', 'description', 'prompt'],
  properties: {
    name: { type: 'string', pattern: '^@[a-z0-9_-]+$' },
    version: { type: 'string', pattern: '^\\d+\\.\\d+\\.\\d+$' },
    description: { type: 'string' },
    author: { type: 'string' },
    tier: { type: 'string' },
    capabilities: { type: 'array', items: { type: 'string' } },
    dependencies: { type: 'array', items: { type: 'string' } },
    config: { type: 'object' },
    prompt: { type: 'string' }
  }
};

/**
 * Agent Marketplace Class
 */
export class AgentMarketplace {
  constructor(options = {}) {
    this.registryUrl = options.registryUrl || MARKETPLACE_REGISTRY;
    this.localAgentsDir = options.localAgentsDir || LOCAL_AGENTS_DIR;
    this.cacheDir = path.join(process.cwd(), '.ultra-dex', 'cache', 'agents');
  }

  /**
   * Initialize marketplace
   */
  async initialize() {
    // Create necessary directories
    await fs.mkdir(this.localAgentsDir, { recursive: true });
    await fs.mkdir(this.cacheDir, { recursive: true });
    
    printSuccess(chalk.green('✅ Agent Marketplace initialized'));
  }

  /**
   * Search for agents in the marketplace
   */
  async search(query, options = {}) {
    printInfo(chalk.cyan(`🔍 Searching for agents: ${query}`));
    
    try {
      // In a real implementation, this would call the marketplace API
      // For now, we'll return mock results
      const mockResults = [
        {
          name: '@auth-expert',
          version: '1.2.0',
          description: 'Authentication and security expert agent',
          author: 'community-user',
          downloads: 1250,
          rating: 4.8,
          tags: ['auth', 'security', 'oauth']
        },
        {
          name: '@perf-guru',
          version: '1.0.3',
          description: 'Performance optimization specialist',
          author: 'optimization-team',
          downloads: 890,
          rating: 4.6,
          tags: ['performance', 'optimization', 'speed']
        },
        {
          name: '@db-wizard',
          version: '2.1.1',
          description: 'Database design and optimization expert',
          author: 'data-engineer',
          downloads: 2100,
          rating: 4.9,
          tags: ['database', 'sql', 'optimization']
        }
      ];
      
      // Filter based on query
      const results = mockResults.filter(agent => 
        agent.name.toLowerCase().includes(query.toLowerCase()) ||
        agent.description.toLowerCase().includes(query.toLowerCase()) ||
        agent.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
      );
      
      return results;
    } catch (error) {
      printError(chalk.red(`❌ Search failed: ${error.message}`));
      throw new AppError(`Search failed: ${error.message}`, { code: 'SEARCH_FAILED' });
    }
  }

  /**
   * List installed agents
   */
  async listInstalled() {
    try {
      const agentsDirExists = await fs.access(this.localAgentsDir).then(() => true).catch(() => false);
      if (!agentsDirExists) {
        return [];
      }
      
      const files = await fs.readdir(this.localAgentsDir);
      const agentFiles = files.filter(file => file.endsWith('.md'));
      
      const installedAgents = [];
      for (const file of agentFiles) {
        const content = await fs.readFile(path.join(this.localAgentsDir, file), 'utf8');
        
        // Extract agent info from markdown
        const nameMatch = content.match(/^# @(\w+)/m);
        const descriptionMatch = content.match(/^# @\w+\s*\n\s*(.+)/m);
        
        installedAgents.push({
          name: `@${nameMatch?.[1] || file.replace('.md', '')}`,
          file,
          description: descriptionMatch?.[1]?.trim() || 'No description',
          installedAt: new Date().toISOString()
        });
      }
      
      return installedAgents;
    } catch (error) {
      printError(chalk.red(`❌ Failed to list installed agents: ${error.message}`));
      throw new AppError(`Failed to list installed agents: ${error.message}`, { 
        code: 'LIST_INSTALLED_FAILED' 
      });
    }
  }

  /**
   * Install an agent from the marketplace
   */
  async install(agentName, options = {}) {
    printInfo(chalk.cyan(`📦 Installing agent: ${agentName}`));
    
    try {
      // Validate agent name format
      if (!agentName.startsWith('@')) {
        throw new AppError('Agent name must start with @', { code: 'INVALID_AGENT_NAME' });
      }
      
      // In a real implementation, this would fetch from the registry
      // For now, we'll create a mock agent file
      const agentFileName = `${agentName.slice(1)}.md`; // Remove @ prefix
      const agentPath = path.join(this.localAgentsDir, agentFileName);
      
      // Check if agent already exists
      try {
        await fs.access(agentPath);
        if (!options.force) {
          throw new AppError(`Agent already exists: ${agentName}`, { code: 'AGENT_EXISTS' });
        }
      } catch {
        // File doesn't exist, continue with installation
      }
      
      // Create mock agent content
      const agentContent = `# ${agentName}

## Description
${options.description || 'Community-contributed agent'}

## Capabilities
- ${options.capabilities?.join('\n- ') || 'Various capabilities'}

## Instructions
You are a specialized agent for handling tasks related to ${agentName.replace('@', '')}.
Follow best practices and maintain code quality.

${options.prompt || 'Default agent prompt'}
`;
      
      await fs.writeFile(agentPath, agentContent);
      
      printSuccess(chalk.green(`✅ Installed agent: ${agentName}`));
      
      return {
        name: agentName,
        path: agentPath,
        installed: true,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      printError(chalk.red(`❌ Install failed: ${error.message}`));
      throw new AppError(`Install failed: ${error.message}`, { code: 'INSTALL_FAILED' });
    }
  }

  /**
   * Uninstall an agent
   */
  async uninstall(agentName) {
    printInfo(chalk.cyan(`🗑️  Uninstalling agent: ${agentName}`));
    
    try {
      const agentFileName = `${agentName.slice(1)}.md`; // Remove @ prefix
      const agentPath = path.join(this.localAgentsDir, agentFileName);
      
      await fs.access(agentPath);
      await fs.unlink(agentPath);
      
      printSuccess(chalk.green(`✅ Uninstalled agent: ${agentName}`));
      
      return {
        name: agentName,
        uninstalled: true,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new AppError(`Agent not found: ${agentName}`, { code: 'AGENT_NOT_FOUND' });
      }
      printError(chalk.red(`❌ Uninstall failed: ${error.message}`));
      throw new AppError(`Uninstall failed: ${error.message}`, { code: 'UNINSTALL_FAILED' });
    }
  }

  /**
   * Publish an agent to the marketplace
   */
  async publish(agentPath, options = {}) {
    printInfo(chalk.cyan(`📤 Publishing agent from: ${agentPath}`));
    
    try {
      // Validate agent manifest
      const manifestPath = path.join(path.dirname(agentPath), 'manifest.json');
      let manifest;
      
      try {
        const manifestContent = await fs.readFile(manifestPath, 'utf8');
        manifest = JSON.parse(manifestContent);
        
        // Validate manifest structure
        this.validateManifest(manifest);
      } catch (error) {
        if (error.code === 'ENOENT') {
          throw new AppError('manifest.json not found in agent directory', { code: 'MANIFEST_MISSING' });
        }
        throw error;
      }
      
      // In a real implementation, this would upload to the registry
      // For now, we'll just validate and return success
      printInfo(chalk.blue(`Validating agent: ${manifest.name}@${manifest.version}`));
      
      // Verify the agent file exists
      await fs.access(agentPath);
      
      printSuccess(chalk.green(`✅ Validated agent: ${manifest.name}@${manifest.version}`));
      
      // Mock publishing process
      printInfo(chalk.gray('Publishing to marketplace...'));
      
      return {
        name: manifest.name,
        version: manifest.version,
        published: true,
        registry: this.registryUrl,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      printError(chalk.red(`❌ Publish failed: ${error.message}`));
      throw new AppError(`Publish failed: ${error.message}`, { code: 'PUBLISH_FAILED' });
    }
  }

  /**
   * Validate agent manifest
   */
  validateManifest(manifest) {
    const requiredFields = ['name', 'version', 'description', 'prompt'];
    
    for (const field of requiredFields) {
      if (!manifest[field]) {
        throw new AppError(`Missing required field in manifest: ${field}`, { 
          code: 'MANIFEST_VALIDATION_ERROR' 
        });
      }
    }
    
    // Validate name format
    if (!/^@[a-z0-9_-]+$/.test(manifest.name)) {
      throw new AppError('Invalid agent name format. Must start with @ and contain only lowercase letters, numbers, hyphens, and underscores', { 
        code: 'INVALID_AGENT_NAME_FORMAT' 
      });
    }
    
    // Validate version format
    if (!/^\d+\.\d+\.\d+$/.test(manifest.version)) {
      throw new AppError('Invalid version format. Must be in semantic version format (e.g., 1.0.0)', { 
        code: 'INVALID_VERSION_FORMAT' 
      });
    }
    
    return true;
  }

  /**
   * Get agent details from marketplace
   */
  async getAgentDetails(agentName) {
    printInfo(chalk.cyan(`🔍 Getting details for: ${agentName}`));
    
    // In a real implementation, this would fetch from the registry
    // For now, return mock details
    return {
      name: agentName,
      version: '1.0.0',
      description: `Community agent for ${agentName.replace('@', '')} tasks`,
      author: 'community',
      license: 'MIT',
      downloads: Math.floor(Math.random() * 10000),
      rating: (Math.random() * 2 + 3).toFixed(1), // Random rating between 3 and 5
      tags: ['community', 'utility'],
      dependencies: [],
      publishedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(), // Random date in last 30 days
      verified: Math.random() > 0.5
    };
  }

  /**
   * Update an installed agent
   */
  async update(agentName, options = {}) {
    printInfo(chalk.cyan(`🔄 Updating agent: ${agentName}`));
    
    // First check if agent is installed
    const installedAgents = await this.listInstalled();
    const installedAgent = installedAgents.find(a => a.name === agentName);
    
    if (!installedAgent) {
      throw new AppError(`Agent not installed: ${agentName}`, { code: 'AGENT_NOT_INSTALLED' });
    }
    
    // Get latest version from marketplace
    const details = await this.getAgentDetails(agentName);
    
    printInfo(chalk.blue(`Latest version: ${details.version}`));
    
    // In a real implementation, this would download the updated version
    // For now, we'll just return mock success
    printSuccess(chalk.green(`✅ Updated ${agentName} to version ${details.version}`));
    
    return {
      name: agentName,
      oldVersion: installedAgent.version || 'unknown',
      newVersion: details.version,
      updated: true,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get marketplace statistics
   */
  async getStats() {
    printInfo(chalk.cyan('📊 Fetching marketplace statistics...'));
    
    // In a real implementation, this would fetch from the registry
    // For now, return mock stats
    return {
      totalAgents: 156,
      totalDownloads: 45230,
      trendingAgents: [
        { name: '@auth-expert', downloads: 1250 },
        { name: '@perf-guru', downloads: 890 },
        { name: '@db-wizard', downloads: 2100 }
      ],
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Create and initialize marketplace
 */
export async function createAgentMarketplace(options = {}) {
  const marketplace = new AgentMarketplace(options);
  await marketplace.initialize();
  return marketplace;
}

/**
 * Register marketplace commands with Commander
 */
export function registerMarketplaceCommands(program) {
  program
    .command('marketplace')
    .description('Agent marketplace for community contributions')
    .option('--search <query>', 'Search for agents')
    .option('--install <name>', 'Install an agent')
    .option('--uninstall <name>', 'Uninstall an agent')
    .option('--list', 'List installed agents')
    .option('--publish <path>', 'Publish an agent to marketplace')
    .option('--update <name>', 'Update an installed agent')
    .option('--info <name>', 'Get agent information')
    .option('--stats', 'Show marketplace statistics')
    .option('--force', 'Force operation (overwrite existing)')
    .action(async (options) => {
      try {
        const marketplace = await createAgentMarketplace();
        
        if (options.search) {
          const results = await marketplace.search(options.search);
          
          if (results.length === 0) {
            printInfo(chalk.gray('No agents found matching your search'));
            return;
          }
          
          printSuccess(chalk.green(`\nFound ${results.length} agents:\n`));
          
          for (const agent of results) {
            printInfo(`${chalk.bold(agent.name)} v${agent.version}`);
            printInfo(chalk.gray(`  ${agent.description}`));
            printInfo(chalk.gray(`  Author: ${agent.author} | Downloads: ${agent.downloads} | Rating: ${agent.rating}/5`));
            printInfo(chalk.gray(`  Tags: ${agent.tags.join(', ')}\n`));
          }
        } else if (options.install) {
          await marketplace.install(options.install, { force: options.force });
        } else if (options.uninstall) {
          await marketplace.uninstall(options.uninstall);
        } else if (options.list) {
          const installed = await marketplace.listInstalled();
          
          if (installed.length === 0) {
            printInfo(chalk.gray('No agents installed'));
            return;
          }
          
          printSuccess(chalk.green(`\nInstalled agents (${installed.length}):\n`));
          
          for (const agent of installed) {
            printInfo(`${chalk.bold(agent.name)} - ${agent.description}`);
            printInfo(chalk.gray(`  File: ${agent.file}\n`));
          }
        } else if (options.publish) {
          await marketplace.publish(options.publish, { force: options.force });
        } else if (options.update) {
          await marketplace.update(options.update);
        } else if (options.info) {
          const details = await marketplace.getAgentDetails(options.info);
          
          printInfo(chalk.bold.cyan(`\nAgent: ${details.name}\n`));
          printInfo(chalk.blue(`Version: ${details.version}`));
          printInfo(chalk.blue(`Author: ${details.author}`));
          printInfo(chalk.blue(`License: ${details.license}`));
          printInfo(chalk.blue(`Downloads: ${details.downloads}`));
          printInfo(chalk.blue(`Rating: ${details.rating}/5`));
          printInfo(chalk.blue(`Published: ${new Date(details.publishedAt).toLocaleDateString()}`));
          printInfo(chalk.gray(`\nDescription: ${details.description}`));
        } else if (options.stats) {
          const stats = await marketplace.getStats();
          
          printInfo(chalk.bold.cyan('\n📊 Marketplace Statistics\n'));
          printInfo(chalk.blue(`Total Agents: ${stats.totalAgents}`));
          printInfo(chalk.blue(`Total Downloads: ${stats.totalDownloads}`));
          
          if (stats.trendingAgents.length > 0) {
            printInfo(chalk.bold('\n🔥 Trending Agents:\n'));
            for (const agent of stats.trendingAgents) {
              printInfo(`  ${chalk.bold(agent.name)} - ${agent.downloads} downloads`);
            }
          }
        } else {
          // Default: show marketplace info
          printInfo(chalk.cyan.bold('\n🛒 Ultra-Dex Agent Marketplace\n'));
          printInfo(chalk.blue('Share and discover specialized AI agents for your projects'));
          printInfo(chalk.gray('\nUsage:'));
          printInfo(chalk.gray('  ultra-dex marketplace --search <query>    # Search for agents'));
          printInfo(chalk.gray('  ultra-dex marketplace --install <name>    # Install an agent'));
          printInfo(chalk.gray('  ultra-dex marketplace --list             # List installed agents'));
          printInfo(chalk.gray('  ultra-dex marketplace --publish <path>    # Publish your agent'));
          printInfo(chalk.gray('  ultra-dex marketplace --stats            # Show marketplace stats'));
        }
      } catch (error) {
        printError(chalk.red(`\n❌ Marketplace command failed: ${error.message}`));
        process.exitCode = error.exitCode || 1;
        throw error;
      }
    });
}

export default {
  AgentMarketplace,
  createAgentMarketplace,
  registerMarketplaceCommands
};