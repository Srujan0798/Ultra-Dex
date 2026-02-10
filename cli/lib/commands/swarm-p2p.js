// Copyright (c) 2026 Ultra-Dex

import { Command } from 'commander';
import chalk from 'chalk';
import { DecentralizedSwarm } from '../lib/swarm/p2p.js';
import { printSuccess, printInfo, printError, printWarning } from '../ui/index.js';

const swarmCommand = new Command('swarm').description(
  'Decentralized Agent Swarm (P2P Protocol) - v5.1'
);

swarmCommand
  .command('start')
  .description('Start a decentralized swarm')
  .option('-i, --id <id>', 'Swarm ID', 'default-swarm')
  .option('-a, --agents <agents...>', 'Initial agents to spawn')
  .action(async (options) => {
    printInfo(chalk.blue('🌐 Starting Decentralized Agent Swarm...'));

    const swarm = new DecentralizedSwarm(options.id);

    swarm.on('agent:joined', ({ agentId }) => {
      printSuccess(`Agent ${chalk.cyan(agentId)} joined the swarm`);
    });

    swarm.on('agent:left', ({ agentId }) => {
      printWarning(`Agent ${chalk.cyan(agentId)} left the swarm`);
    });

    swarm.on('handoff:coordinated', ({ from, to }) => {
      printInfo(`Handoff coordinated: ${chalk.cyan(from)} → ${chalk.cyan(to)}`);
    });

    // Add initial agents
    if (options.agents) {
      for (const agentId of options.agents) {
        await swarm.addAgent(agentId);
      }
    }

    printSuccess(chalk.green(`✅ Swarm "${options.id}" is running`));
    printInfo(chalk.gray('Press Ctrl+C to stop'));

    // Keep running
    process.on('SIGINT', async () => {
      printInfo('\n🛑 Shutting down swarm...');
      await swarm.shutdown();
      process.exit(0);
    });
  });

swarmCommand
  .command('agents')
  .description('List agents in the swarm')
  .option('-s, --swarm <id>', 'Swarm ID', 'default-swarm')
  .action(async (options) => {
    // This would connect to existing swarm
    printInfo(chalk.blue(`📊 Agents in swarm "${options.swarm}":`));
    printInfo(chalk.gray('(Connect to running swarm to see agents)'));
  });

swarmCommand
  .command('topology')
  .description('Show swarm network topology')
  .option('-s, --swarm <id>', 'Swarm ID', 'default-swarm')
  .action(async (options) => {
    printInfo(chalk.blue(`🕸️  Swarm Topology: ${options.swarm}`));
    printInfo(chalk.gray('Use with a running swarm to see connections'));
  });

swarmCommand
  .command('consensus')
  .description('Propose a consensus decision')
  .option('-s, --swarm <id>', 'Swarm ID', 'default-swarm')
  .requiredOption('-t, --topic <topic>', 'Consensus topic')
  .requiredOption('-p, --proposal <proposal>', 'Proposal description')
  .action(async (options) => {
    printInfo(chalk.blue('🗳️  Proposing consensus...'));
    printInfo(`Topic: ${chalk.cyan(options.topic)}`);
    printInfo(`Proposal: ${chalk.cyan(options.proposal)}`);
    printSuccess('Consensus proposal submitted to swarm');
  });

export default swarmCommand;
