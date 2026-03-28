// Copyright (c) 2026 Ultra-Dex

/**
 * Advanced Swarm Commands
 * Enhanced swarm with checkpoint/resume, conflict resolution, and cost tracking
 */

import chalk from 'chalk';
import Table from 'cli-table3';
import {
  CheckpointManager,
  ConflictResolver,
  CostTracker,
  ProgressReporter,
} from '../swarm/orchestrator.js';
import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';

/**
 * Start swarm with checkpoint support
 */
export async function startSwarmWithCheckpoint(options = {}) {
  const checkpointManager = new CheckpointManager();
  await checkpointManager.initialize();

  const costTracker = new CostTracker();
  const progressReporter = new ProgressReporter();

  // Show progress in terminal
  progressReporter.onProgress((data) => {
    if (data.type === 'agent') {
      logger.log(chalk.gray(`[${data.agent}] ${data.status}: ${data.message || ''}`));
    } else if (data.type === 'overall') {
      const percent = Math.round((data.completedSteps / data.totalSteps) * 100);
      logger.log(chalk.cyan(`Progress: ${percent}% (${data.completedSteps}/${data.totalSteps})`));
    }
  });

  printInfo(chalk.cyan.bold('\n🐝 Starting Advanced Swarm\n'));

  // If resuming from checkpoint
  if (options.checkpoint) {
    printInfo(chalk.yellow(`Resuming from checkpoint: ${options.checkpoint}`));
    const checkpoint = await checkpointManager.loadCheckpoint(options.checkpoint);
    printInfo(chalk.gray(`Restored state from ${checkpoint.timestamp}`));
    return checkpoint.state;
  }

  // Create initial checkpoint
  const swarmId = generateSwarmId();
  const initialState = {
    swarmId,
    status: 'running',
    startedAt: Date.now(),
    parallel: options.parallel || false,
    maxWorkers: options.parallel || 4,
  };

  const checkpointId = await checkpointManager.createCheckpoint(swarmId, initialState);
  printInfo(chalk.gray(`Created checkpoint: ${checkpointId}`));

  return {
    swarmId,
    checkpointId,
    checkpointManager,
    costTracker,
    progressReporter,
  };
}

/**
 * Show swarm status
 */
export async function showSwarmStatus(swarmId) {
  const checkpointManager = new CheckpointManager();
  const checkpoints = await checkpointManager.listCheckpoints(swarmId);

  printInfo(chalk.cyan.bold(`\n📊 Swarm Status: ${swarmId}\n`));

  if (checkpoints.length === 0) {
    printWarning(chalk.yellow('No checkpoints found'));
    return;
  }

  logger.log(chalk.white(`Checkpoints: ${checkpoints.length}`));
  checkpoints.forEach((cp, i) => {
    logger.log(chalk.gray(`  ${i + 1}. ${cp.id} - ${new Date(cp.timestamp).toLocaleString()}`));
  });
}

/**
 * Resume swarm from checkpoint
 */
export async function resumeSwarm(checkpointId, options = {}) {
  const checkpointManager = new CheckpointManager();

  try {
    const checkpoint = await checkpointManager.loadCheckpoint(checkpointId);
    printSuccess(chalk.green(`\n✅ Resumed from checkpoint: ${checkpointId}`));
    printInfo(chalk.gray(`Swarm: ${checkpoint.swarmId}`));
    printInfo(chalk.gray(`Saved at: ${new Date(checkpoint.timestamp).toLocaleString()}`));

    return checkpoint.state;
  } catch (error) {
    printError(chalk.red(`Failed to resume: ${error.message}`));
    return null;
  }
}

/**
 * List all checkpoints
 */
export async function listCheckpoints() {
  const checkpointManager = new CheckpointManager();

  // Get all checkpoint files
  const { readdir } = await import('fs/promises');
  const { join } = await import('path');

  try {
    const files = await readdir(checkpointManager.checkpointDir);
    const checkpoints = [];

    for (const file of files) {
      if (!file.startsWith('checkpoint-')) continue;

      const content = await fs.readFile(join(checkpointManager.checkpointDir, file), 'utf8');
      const checkpoint = JSON.parse(content);
      checkpoints.push(checkpoint);
    }

    if (checkpoints.length === 0) {
      printWarning(chalk.yellow('No checkpoints found'));
      return;
    }

    printInfo(chalk.cyan.bold(`\n📋 Checkpoints (${checkpoints.length})\n`));

    const table = new Table({
      head: ['ID', 'Swarm', 'Timestamp'],
      style: { head: ['cyan'] },
    });

    checkpoints.forEach((cp) => {
      table.push([
        cp.id,
        cp.swarmId.substring(0, 16) + '...',
        new Date(cp.timestamp).toLocaleString(),
      ]);
    });

    logger.log(table.toString());
  } catch (error) {
    printError(chalk.red(`Failed to list checkpoints: ${error.message}`));
  }
}

/**
 * Show cost report
 */
export function showCostReport(costTracker) {
  const report = costTracker.generateReport();

  printInfo(chalk.cyan.bold('\n💰 Cost Report\n'));
  logger.log(chalk.white(`Total Cost: ${chalk.bold(report.total)}`));

  if (report.byAgent.length > 0) {
    logger.log(chalk.white('\nBy Agent:'));
    report.byAgent.forEach(({ agent, cost }) => {
      logger.log(chalk.gray(`  ${agent}: ${cost}`));
    });
  }

  if (report.byProvider.length > 0) {
    logger.log(chalk.white('\nBy Provider:'));
    report.byProvider.forEach(({ provider, costFormatted, input, output }) => {
      logger.log(
        chalk.gray(`  ${provider}: ${costFormatted} (${input} in / ${output} out tokens)`)
      );
    });
  }
}

/**
 * Handle conflicts
 */
export async function handleConflicts(edits, options = {}) {
  const resolver = new ConflictResolver({
    resolutionStrategy: options.strategy || 'manual',
  });

  const conflicts = resolver.detectConflicts(edits);

  if (conflicts.length === 0) {
    printSuccess(chalk.green('✅ No conflicts detected'));
    return [];
  }

  printWarning(chalk.yellow(`\n⚠️  Detected ${conflicts.length} conflict(s)\n`));

  const resolutions = await resolver.resolveConflicts(conflicts, {
    inquirer: options.inquirer,
  });

  return resolutions;
}

/**
 * Generate swarm ID
 */
function generateSwarmId() {
  return `swarm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Import fs
import fs from 'fs/promises';
