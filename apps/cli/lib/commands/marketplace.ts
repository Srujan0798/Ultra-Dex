#!/usr/bin/env node

import { Command } from 'commander';
import { MarketplaceService } from '../../../src/core/marketplace/marketplace-service.js';

const program = new Command();
const marketplace = new MarketplaceService();

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

program.name('marketplace').description('Ultra-Dex Agent Marketplace').version('1.0.0');

// List command
program
  .command('list')
  .description('List available agents')
  .option('--category <category>', 'Filter by category')
  .action(async (options) => {
    console.log('┌─────────────────────────────────────────────────────────────┐');
    console.log('│                   Available Agents                          │');
    console.log('└─────────────────────────────────────────────────────────────┘');
    console.log();

    const filters = options.category ? { category: options.category } : undefined;
    const agents = await marketplace.listAgents(filters);

    if (agents.length === 0) {
      console.log('No agents found.');
      return;
    }

    console.log('Name                          Version   Category      Author      Downloads');
    console.log('─────────────────────────────────────────────────────────────────────────');

    for (const agent of agents) {
      const name = agent.name.padEnd(28);
      const version = agent.version.padEnd(9);
      const category = agent.category.padEnd(13);
      const author = agent.author.padEnd(11);
      const downloads = agent.downloads.toString().padStart(9);
      console.log(`${name} ${version} ${category} ${author} ${downloads}`);
    }

    console.log();
    console.log(`Total: ${agents.length} agents`);
  });

// Install command
program
  .command('install')
  .description('Install an agent from the marketplace')
  .argument('<agent-id>', 'Agent ID to install (e.g., @ultra-dex/planner)')
  .action(async (agentId) => {
    console.log(`Installing agent ${agentId}...`);

    try {
      const success = await marketplace.installAgent(agentId);
      if (success) {
        console.log(`✓ Installed ${agentId}`);
      } else {
        console.log(`✗ Failed to install ${agentId}`);
        process.exit(1);
      }
    } catch (error: unknown) {
      console.error(`Error: ${errorMessage(error)}`);
      process.exit(1);
    }
  });

// Uninstall command
program
  .command('uninstall')
  .description('Uninstall a locally installed agent')
  .argument('<agent-id>', 'Agent ID to uninstall')
  .action(async (agentId) => {
    console.log(`Uninstalling agent ${agentId}...`);

    try {
      const success = await marketplace.uninstallAgent(agentId);
      if (success) {
        console.log(`✓ Uninstalled ${agentId}`);
      } else {
        console.log(`✗ Failed to uninstall ${agentId}`);
        process.exit(1);
      }
    } catch (error: unknown) {
      console.error(`Error: ${errorMessage(error)}`);
      process.exit(1);
    }
  });

// Info command
program
  .command('info')
  .description('Show detailed information about an agent')
  .argument('<agent-id>', 'Agent ID')
  .action(async (agentId) => {
    const agent = await marketplace.getAgent(agentId);

    if (!agent) {
      console.log(`Agent ${agentId} not found.`);
      process.exit(1);
    }

    console.log('┌─────────────────────────────────────────────────────────────┐');
    console.log(`│ ${agent.name.padEnd(59)} │`);
    console.log('└─────────────────────────────────────────────────────────────┘');
    console.log();
    console.log(`ID:          ${agent.id}`);
    console.log(`Version:     ${agent.version}`);
    console.log(`Category:    ${agent.category}`);
    console.log(`Author:      ${agent.author}`);
    console.log(`Downloads:   ${agent.downloads}`);
    console.log();
    console.log('Description:');
    console.log(`  ${agent.description}`);
    console.log();
    console.log('Capabilities:');
    agent.capabilities.forEach((cap) => console.log(`  • ${cap}`));
    console.log();
    console.log('Supported Providers:');
    agent.providers.forEach((prov) => console.log(`  • ${prov}`));
  });

// Search command
program
  .command('search')
  .description('Search for agents in the marketplace')
  .argument('<query>', 'Search query')
  .action(async (query) => {
    console.log(`Searching for "${query}"...`);
    console.log();

    const results = await marketplace.searchAgents(query);

    if (results.length === 0) {
      console.log('No results found.');
      return;
    }

    console.log('Name                          Relevance  Description');
    console.log('─────────────────────────────────────────────────────────────────');

    for (const { agent, relevance } of results) {
      const name = agent.name.padEnd(28);
      const rel = relevance.toFixed(2).padEnd(9);
      const desc = agent.description.slice(0, 40);
      console.log(`${name} ${rel} ${desc}`);
    }

    console.log();
    console.log(`Found ${results.length} results`);
  });

// Publish command
program
  .command('publish')
  .description('Publish an agent to the marketplace')
  .argument('<directory>', 'Directory containing agent package')
  .action(async (directory) => {
    console.log(`Publishing agent from ${directory}...`);

    try {
      const agentId = await marketplace.publishAgent(directory);
      console.log(`✓ Published as ${agentId}`);
    } catch (error: unknown) {
      console.error(`Error: ${errorMessage(error)}`);
      process.exit(1);
    }
  });

program.parse();
