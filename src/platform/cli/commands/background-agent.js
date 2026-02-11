// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Background Agent module
 * @module commands/background-agent
 */

import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import { TicketAgent, defaultTicketSource } from '../background/ticket-agent.js';
import { generatePullRequest } from '../background/pr-generator.js';
import { createReviewResponse, applyReviewFixes } from '../background/reviewer.js';
import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';

const STATE_PATH = path.resolve(process.cwd(), '.ultra-dex', 'background-agent.json');

async function writeState(state) {
  await fs.mkdir(path.dirname(STATE_PATH), { recursive: true });
  await fs.writeFile(STATE_PATH, JSON.stringify(state, null, 2), 'utf8');
}

async function readState() {
  try {
    const raw = await fs.readFile(STATE_PATH, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function registerBackgroundAgentCommand(program) {
  const cmd = program.command('background-agent').description('Autonomous ticket-to-PR agent');

  cmd
    .command('start')
    .option('--source <path>', 'Ticket JSON source file')
    .option('--interval <ms>', 'Polling interval', '30000')
    .action(async (options) => {
      const source = options.source || defaultTicketSource();
      const intervalMs = Number.parseInt(options.interval, 10) || 30000;

      const agent = new TicketAgent({ source, intervalMs });
      agent.on('ticket', (ticket) => {
        printInfo(chalk.cyan(`\n📌 Ticket received: ${ticket.key || ticket.id || 'unknown'}`));
        const pr = generatePullRequest(ticket);
        printInfo(chalk.gray(`Generated PR draft: ${pr.title}`));
        const review = createReviewResponse(ticket.reviewComments || []);
        const outcome = applyReviewFixes(ticket, review);
        printInfo(chalk.gray(outcome.notes));
      });

      await writeState({
        status: 'running',
        source,
        intervalMs,
        startedAt: new Date().toISOString(),
      });
      await agent.start();
      printSuccess(chalk.green('Background agent running. Press Ctrl+C to stop.'));

      process.on('SIGINT', async () => {
        agent.stop();
        await writeState({ status: 'stopped', stoppedAt: new Date().toISOString() });
        process.exit(0);
      });

      // Keep process alive
      process.stdin.resume();
    });

  cmd.command('status').action(async () => {
    const state = await readState();
    if (!state) {
      printWarning(chalk.yellow('Background agent not started.'));
      return;
    }
    printInfo(chalk.cyan(`Status: ${state.status}`));
    if (state.startedAt) printInfo(chalk.gray(`Started: ${state.startedAt}`));
  });

  cmd.command('stop').action(async () => {
    const state = await readState();
    if (!state || state.status !== 'running') {
      printWarning(chalk.yellow('Background agent not running.'));
      return;
    }
    await writeState({ status: 'stopped', stoppedAt: new Date().toISOString() });
    printSuccess(chalk.green('Background agent stopped.'));
  });

  cmd.on('command:*', () => {
    printError(chalk.red('Unknown background-agent command.'));
  });
}
