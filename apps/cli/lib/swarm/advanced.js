import fs from 'fs/promises';
import path from 'path';
import { listCheckpoints as listNamedCheckpoints, loadCheckpoint as loadNamedCheckpoint } from './checkpoint.js';
import { printInfo, printSuccess, printWarning } from '../utils/output.js';

const LEGACY_CHECKPOINT = path.join(process.cwd(), '.ultra-dex', 'swarm-checkpoint.json');

async function readLegacyCheckpoint() {
  try {
    const raw = await fs.readFile(LEGACY_CHECKPOINT, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function printCheckpointSummary(label, checkpoint) {
  printInfo(`${label}:`);
  printInfo(`  task: ${checkpoint.task || 'unknown'}`);
  printInfo(`  updated: ${checkpoint.timestamp || checkpoint.savedAt || 'unknown'}`);
  if (Array.isArray(checkpoint.completedAgents) && checkpoint.completedAgents.length > 0) {
    printInfo(`  completed agents: ${checkpoint.completedAgents.join(', ')}`);
  }
}

export async function listCheckpoints() {
  const namedCheckpoints = await listNamedCheckpoints();
  const legacyCheckpoint = await readLegacyCheckpoint();

  if (!legacyCheckpoint && namedCheckpoints.length === 0) {
    printWarning('No swarm checkpoints found.');
    return [];
  }

  if (legacyCheckpoint) {
    printCheckpointSummary('latest', legacyCheckpoint);
  }

  if (namedCheckpoints.length > 0) {
    printInfo('named checkpoints:');
    namedCheckpoints.forEach((checkpointId) => printInfo(`  - ${checkpointId}`));
  }

  return {
    latest: legacyCheckpoint,
    named: namedCheckpoints,
  };
}

export async function showSwarmStatus(swarmId) {
  if (swarmId) {
    try {
      const checkpoint = await loadNamedCheckpoint(swarmId);
      printCheckpointSummary(`checkpoint ${swarmId}`, checkpoint);
      return checkpoint;
    } catch {
      printWarning(`Checkpoint '${swarmId}' was not found. Falling back to latest checkpoint.`);
    }
  }

  const checkpoint = await readLegacyCheckpoint();
  if (!checkpoint) {
    printWarning('No active swarm checkpoint found.');
    return null;
  }

  printCheckpointSummary('latest swarm checkpoint', checkpoint);
  return checkpoint;
}

export async function resumeSwarm(checkpointId) {
  let checkpoint = null;

  if (checkpointId) {
    try {
      checkpoint = await loadNamedCheckpoint(checkpointId);
    } catch {
      checkpoint = null;
    }
  }

  if (!checkpoint) {
    checkpoint = await readLegacyCheckpoint();
  }

  if (!checkpoint?.task) {
    printWarning('No resumable swarm checkpoint found.');
    return null;
  }

  printSuccess(`Resuming swarm for task: ${checkpoint.task}`);
  const { swarmCommand } = await import('../commands/swarm.js');
  return swarmCommand(checkpoint.task, {
    ...(checkpoint.options || {}),
    resume: true,
  });
}
