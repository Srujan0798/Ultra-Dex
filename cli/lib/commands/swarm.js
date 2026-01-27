import chalk from 'chalk';
import fs from 'fs/promises';
import { createProvider, getDefaultProvider, checkConfiguredProviders } from '../providers/index.js';
import { loadState } from './plan.js';
import { SwarmCoordinator } from '../swarm/coordinator.js';

async function readProjectContext() {
  const context = {};
  try { context.plan = await fs.readFile('IMPLEMENTATION-PLAN.md', 'utf8'); } catch { context.plan = null; }
  try { context.context = await fs.readFile('CONTEXT.md', 'utf8'); } catch { context.context = null; }
  context.state = await loadState();
  return context;
}

export async function swarmCommand(feature, options) {
  console.log(chalk.cyan('\n🐝 Ultra-Dex Hive Mind (Swarm Orchestration)\n'));
  
  // Check Provider
  const configured = checkConfiguredProviders();
  const hasProvider = configured.some(p => p.configured) || options.key;

  if (!hasProvider) {
    console.log(chalk.yellow('⚠️  No AI provider configured.'));
    console.log(chalk.white('Swarm mode requires an active AI connection.'));
    return;
  }

  const providerId = options.provider || getDefaultProvider();
  const provider = createProvider(providerId, { apiKey: options.key, maxTokens: 8000 });
  
  // Load Context
  const context = await readProjectContext();
  
  // Initialize Coordinator
  const coordinator = new SwarmCoordinator(provider, context);
  
  // 1. Plan
  const tasks = await coordinator.plan(feature);
  
  if (!tasks || tasks.length === 0) {
    console.log(chalk.red('❌ Failed to generate a valid execution plan.'));
    return;
  }

  // Preview Plan
  console.log(chalk.bold('\n📋 Execution Plan:'));
  tasks.forEach(t => {
    console.log(chalk.gray(`  ${t.id}. [${t.agent.toUpperCase()}] ${t.task}`));
  });

  if (options.dryRun) {
    console.log(chalk.yellow('\nDry run enabled. Skipping execution.'));
    return;
  }

  // 2. Execute
  await coordinator.execute(tasks);
}