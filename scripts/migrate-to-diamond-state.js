#!/usr/bin/env node
/**
 * Diamond State Migration Script
 * Tracks and executes the migration from JavaScript to TypeScript
 */

import { promises as fs } from 'fs';
import { glob } from 'glob';
import path from 'path';

const MIGRATION_STATUS_FILE = '.migration-status.json';

// Priority order for migration (most foundational first)
const MIGRATION_PHASES = [
  {
    name: 'Core Infrastructure',
    files: [
      'src/core/memory/manager.js',
      'src/core/memory/unified-api.js',
      'src/core/memory/vector-store.js',
      'src/core/memory/graph-engine.js',
    ]
  },
  {
    name: 'Orchestration',
    files: [
      'src/core/orchestration/orchestrator.js',
      'src/core/orchestration/execution-engine.js',
      'src/core/orchestration/ultra-dex-core.js',
      'src/core/orchestration/capability-router.js',
    ]
  },
  {
    name: 'AI Layer',
    files: [
      'src/core/ai/ai-meta-layer.js',
      'src/core/ai/model-router.js',
      'src/core/ai/router.js',
      'src/core/ai/provider-registry.js',
    ]
  },
  {
    name: 'Agents',
    files: [
      'src/core/agents/base-agent.js',
      'src/core/agents/unified-registry.js',
      'src/core/agents/registry.js',
    ]
  },
  {
    name: 'Infrastructure',
    files: [
      'src/core/infrastructure/rate-limiter.js',
      'src/core/infrastructure/provider-fallback.js',
      'src/core/infrastructure/queue-processor.js',
      'src/core/infrastructure/webhook-manager.js',
    ]
  },
];

class MigrationTracker {
  constructor() {
    this.status = { phases: {}, completed: [], inProgress: null };
  }

  async load() {
    try {
      const data = await fs.readFile(MIGRATION_STATUS_FILE, 'utf-8');
      this.status = JSON.parse(data);
    } catch {
      // Initialize fresh
      this.status = { phases: {}, completed: [], inProgress: null };
    }
  }

  async save() {
    await fs.writeFile(MIGRATION_STATUS_FILE, JSON.stringify(this.status, null, 2));
  }

  markCompleted(file) {
    if (!this.status.completed.includes(file)) {
      this.status.completed.push(file);
    }
  }

  setInProgress(file) {
    this.status.inProgress = file;
  }

  getProgress() {
    const total = MIGRATION_PHASES.reduce((sum, p) => sum + p.files.length, 0);
    const completed = this.status.completed.length;
    return { total, completed, percent: Math.round((completed / total) * 100) };
  }

  getNextFile() {
    for (const phase of MIGRATION_PHASES) {
      for (const file of phase.files) {
        if (!this.status.completed.includes(file)) {
          return { phase: phase.name, file };
        }
      }
    }
    return null;
  }
}

async function countRemainingJSFiles() {
  const files = await glob('src/core/**/*.js');
  return files.length;
}

async function generateReport(tracker) {
  const progress = tracker.getProgress();
  const remainingJS = await countRemainingJSFiles();
  const totalTS = (await glob('src/core/**/*.ts')).length;

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║                 DIAMOND STATE MIGRATION REPORT               ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log(`║  Progress: ${progress.completed}/${progress.total} files (${progress.percent}%)                              ║`);
  console.log(`║  TypeScript Files: ${totalTS}                                       ║`);
  console.log(`║  JavaScript Files: ${remainingJS}                                      ║`);
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // Phase breakdown
  for (const phase of MIGRATION_PHASES) {
    const completed = phase.files.filter(f => tracker.status.completed.includes(f));
    const percent = Math.round((completed.length / phase.files.length) * 100);
    console.log(`${phase.name}: ${completed.length}/${phase.files.length} (${percent}%)`);
  }
}

async function main() {
  const tracker = new MigrationTracker();
  await tracker.load();

  const command = process.argv[2];

  switch (command) {
    case 'status':
      await generateReport(tracker);
      break;

    case 'next':
      const next = tracker.getNextFile();
      if (next) {
        console.log(`Next file to migrate: ${next.file} (${next.phase})`);
      } else {
        console.log('✅ All files migrated!');
      }
      break;

    case 'complete':
      const file = process.argv[3];
      if (file) {
        tracker.markCompleted(file);
        await tracker.save();
        console.log(`✅ Marked ${file} as completed`);
      }
      break;

    default:
      console.log('Usage: node migrate-to-diamond-state.js [status|next|complete <file>]');
  }
}

main().catch(console.error);
