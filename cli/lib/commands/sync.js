/**
 * ultra-dex sync command
 * Synchronizes project state and graph across devices
 */

import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import { loadState, saveState } from './state.js';
import { buildGraph } from '../utils/graph.js';

export function registerSyncCommand(program) {
  program
    .command('sync')
    .description('Synchronize project state and graph (God Mode Sync)')
    .option('--push', 'Push local state to sync target')
    .option('--pull', 'Pull state from sync target')
    .option('--target <path>', 'Sync target (local folder or s3-like)', '.ultra/sync')
    .action(async (options) => {
      console.log(chalk.cyan('\n🔄 Ultra-Dex State Sync\n'));

      const syncTarget = path.resolve(options.target);
      await fs.mkdir(syncTarget, { recursive: true });

      if (options.push) {
        await handlePush(syncTarget);
      } else if (options.pull) {
        await handlePull(syncTarget);
      } else {
        // Default: Bidirectional Sync (Simplified for Phase 2.1)
        console.log(chalk.yellow('Defaulting to PUSH local state to target.'));
        await handlePush(syncTarget);
      }
    });
}

async function handlePush(target) {
  const spinner = (await import('ora')).default('Pushing state to sync target...').start();
  try {
    const state = await loadState();
    if (!state) throw new Error('No local state found');

    const graph = await buildGraph();
    
    const bundle = {
      state,
      graph,
      timestamp: new Date().toISOString(),
      machine: process.env.USER || 'unknown'
    };

    await fs.writeFile(path.join(target, 'sync-bundle.json'), JSON.stringify(bundle, null, 2));
    spinner.succeed(chalk.green(`State pushed to ${target}`));
  } catch (e) {
    spinner.fail(chalk.red(`Push failed: ${e.message}`));
  }
}

async function handlePull(target) {
  const spinner = (await import('ora')).default('Pulling state from sync target...').start();
  try {
    const bundleContent = await fs.readFile(path.join(target, 'sync-bundle.json'), 'utf8');
    const bundle = JSON.parse(bundleContent);

    await saveState(bundle.state);
    spinner.succeed(chalk.green('Local state updated from sync bundle.'));
    console.log(chalk.gray(`   Bundle Timestamp: ${bundle.timestamp}`));
    console.log(chalk.gray(`   Source Machine: ${bundle.machine}`));
  } catch (e) {
    spinner.fail(chalk.red(`Pull failed: ${e.message}`));
  }
}