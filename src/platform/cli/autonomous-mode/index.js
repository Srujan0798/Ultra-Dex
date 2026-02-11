// Copyright (c) 2026 Ultra-Dex

/**
 * Autonomous Agent Mode
 * Overnight execution, morning summary, auto-PR creation, human review queue.
 */

import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { swarmCommand } from '../commands/swarm.js';

const execAsync = promisify(exec);
const STATE_DIR = path.resolve(process.cwd(), '.ultra-dex', 'autonomous');
const SUMMARY_PATH = path.join(STATE_DIR, 'morning-summary.md');
const QUEUE_PATH = path.join(STATE_DIR, 'review-queue.json');

async function ensureStateDir() {
  await fs.mkdir(STATE_DIR, { recursive: true });
}

export async function runOvernight(tasks = []) {
  await ensureStateDir();
  const results = [];

  for (const task of tasks) {
    const output = await swarmCommand(task, { parallel: true });
    results.push({ task, output, completedAt: new Date().toISOString() });
  }

  await generateMorningSummary(results);
  return results;
}

export async function generateMorningSummary(results = []) {
  const summary = [
    '# Morning Summary',
    `Generated: ${new Date().toISOString()}`,
    '',
    ...results.map((r) => `- ${r.task}: ${r.completedAt}`),
  ].join('\n');

  await fs.writeFile(SUMMARY_PATH, summary, 'utf8');
  return summary;
}

export async function createPullRequest(branch = 'auto/overnight') {
  await execAsync(`git checkout -b ${branch}`);
  await execAsync('git add .');
  await execAsync('git commit -m "chore: overnight autonomous updates"');
  return { ok: true, branch };
}

export async function enqueueForReview(prInfo) {
  await ensureStateDir();
  let queue = [];
  try {
    queue = JSON.parse(await fs.readFile(QUEUE_PATH, 'utf8'));
  } catch {
    queue = [];
  }
  queue.push({ ...prInfo, queuedAt: new Date().toISOString() });
  await fs.writeFile(QUEUE_PATH, JSON.stringify(queue, null, 2));
  return queue;
}

export default {
  runOvernight,
  generateMorningSummary,
  createPullRequest,
  enqueueForReview,
};
