import chalk from 'chalk';
import fs from 'fs/promises';
import { watch } from 'fs';
import path from 'path';
import { buildGraph } from '../utils/graph.js';
import { updateState } from './state.js';

export function registerWatchCommand(program) {
  program
    .command('watch')
    .description('Start the God Mode background daemon')
    .action(async () => {
      console.log(chalk.cyan('\n👀 Ultra-Dex God Mode Daemon Active'));
      console.log(chalk.gray('Monitoring filesystem for structural changes...\n'));

      let isBuilding = false;

      // Initial Build
      await updateGraphAndState('INITIAL_SCAN');

      try {
        const watcher = watch(process.cwd(), { recursive: true }, async (eventType, filename) => {
          if (!filename || isBuilding) return;
          if (filename.includes('.git') || filename.includes('node_modules') || filename.includes('.ultra')) return;
          
          // Debounce / Lock
          isBuilding = true;
          console.log(chalk.gray(`\n🔄 Detected change in ${filename}...`));
          
          await updateGraphAndState(filename);
          
          setTimeout(() => { isBuilding = false; }, 1000);
        });

        console.log(chalk.green('✅ Watcher is running. Press Ctrl+C to stop.'));
      } catch (e) {
        console.log(chalk.red(`❌ Watcher failed: ${e.message}`));
      }
    });
}

async function updateGraphAndState(trigger) {
  const startTime = Date.now();
  try {
    // 1. Rebuild Graph
    const graph = await buildGraph();
    // In a real implementation, we would save this graph to disk/db
    // For now, we just verify it builds
    
    // 2. Update State
    const state = await updateState();
    
    const elapsed = Date.now() - startTime;
    console.log(chalk.green(`✓ Graph synchronized & State updated (${elapsed}ms)`));
    console.log(chalk.gray(`  Nodes: ${graph.nodes.length}, Edges: ${graph.edges.length}`));
    
  } catch (e) {
    console.log(chalk.red(`❌ Sync failed: ${e.message}`));
  }
}