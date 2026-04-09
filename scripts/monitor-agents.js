#!/usr/bin/env node
/**
 * Agent Monitoring Dashboard
 * Real-time view of migration progress
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

function clearScreen() {
  console.clear();
}

function countFiles(dir, ext) {
  let count = 0;
  try {
    const items = readdirSync(dir, { recursive: true });
    for (const item of items) {
      const fullPath = join(dir, item);
      try {
        if (statSync(fullPath).isFile() && item.endsWith(ext)) {
          count++;
        }
      } catch {}
    }
  } catch {}
  return count;
}

function getAgentStatus() {
  // Check for agent progress markers
  const geminiFiles =
    countFiles(join(rootDir, 'src/core/memory'), '.ts') +
    countFiles(join(rootDir, 'src/core/orchestration'), '.ts');
  const qwenFiles = countFiles(join(rootDir, 'src/core/ai'), '.ts');
  const cliFiles =
    countFiles(join(rootDir, 'src/core/agents'), '.ts') +
    countFiles(join(rootDir, 'src/core/infrastructure'), '.ts');

  return {
    gemini: { done: geminiFiles, total: 15, status: geminiFiles >= 15 ? '✅ DONE' : '⏳ WORKING' },
    qwen: { done: qwenFiles, total: 20, status: qwenFiles >= 20 ? '✅ DONE' : '⏳ WORKING' },
    cli: { done: cliFiles, total: 50, status: cliFiles >= 50 ? '✅ DONE' : '⏳ WORKING' },
  };
}

function drawProgressBar(percent, width = 30) {
  const filled = Math.round((percent / 100) * width);
  const empty = width - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

function showDashboard() {
  clearScreen();

  const tsFiles = countFiles(join(rootDir, 'src/core'), '.ts');
  const jsFiles = countFiles(join(rootDir, 'src/core'), '.js');
  const total = tsFiles + jsFiles;
  const percent = Math.round((tsFiles / total) * 100);

  const agents = getAgentStatus();

  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║           🤖 AGENT MONITORING DASHBOARD                      ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log();

  // Overall progress
  console.log('📊 OVERALL PROGRESS');
  console.log('─────────────────────────────────────────────────────────────');
  console.log(`TypeScript: ${tsFiles} files`);
  console.log(`JavaScript: ${jsFiles} files`);
  console.log(`Complete:   ${percent}%`);
  console.log();
  console.log(`[${drawProgressBar(percent)}] ${percent}%`);
  console.log();

  // Agent status
  console.log('🤖 AGENT STATUS');
  console.log('─────────────────────────────────────────────────────────────');

  for (const [name, data] of Object.entries(agents)) {
    const pct = Math.round((data.done / data.total) * 100);
    console.log(
      `${data.status} ${name.toUpperCase().padEnd(10)} ${data.done}/${data.total} (${pct}%)`
    );
    console.log(`         [${drawProgressBar(pct, 20)}]`);
    console.log();
  }

  // Recent activity
  console.log('📋 RECENT ACTIVITY (Last 24h)');
  console.log('─────────────────────────────────────────────────────────────');

  try {
    const statusFile = join(rootDir, '.migration-status.json');
    if (existsSync(statusFile)) {
      const status = JSON.parse(readFileSync(statusFile, 'utf-8'));
      const completed = status.completed?.slice(-5) || [];
      if (completed.length > 0) {
        completed.forEach((file) => console.log(`  ✅ ${file}`));
      } else {
        console.log('  (No recent activity)');
      }
    } else {
      console.log('  (Status file not created yet)');
    }
  } catch {
    console.log('  (Unable to read status)');
  }

  console.log();
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  Commands:                                                   ║');
  console.log('║  • node scripts/migration-status.js    (Full status)         ║');
  console.log('║  • node scripts/validate-migration.js  (Validation)          ║');
  console.log('║  • npm run typecheck                   (Type checking)       ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
}

// Run once immediately
showDashboard();

// Then refresh every 30 seconds if --watch flag
if (process.argv.includes('--watch')) {
  console.log('\n👀 Watching for changes (refresh every 30s)...');
  console.log('Press Ctrl+C to exit\n');

  setInterval(() => {
    showDashboard();
  }, 30000);
}
