// Copyright (c) 2026 Ultra-Dex

/**
 * ultra-dex memory command
 * Context pruning and visual status
 */

import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import inquirer from 'inquirer';
import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';
import { configManager } from '../utils/config-manager.js';
import { loadTieredMemory } from '../memory/hot-warm-cold.js';
import { memex } from '../memory/memex.js';

const execAsync = promisify(exec);

export async function showMemoryStatus(options = {}) {
  printInfo(chalk.cyan('\n🧠 Ultra-Dex Memory Status\n'));

  // Load configuration
  if (!configManager.loaded) {
    await configManager.load();
  }

  const maxTokens = configManager.get('contextPruning.maxContextTokens') || configManager.get('memory.maxContextTokens') || 8192;
  const autoPrune = configManager.get('contextPruning.autoPrune') || configManager.get('memory.autoPrune') || true;
  const pruneThreshold = configManager.get('contextPruning.pruneThreshold') || configManager.get('memory.pruneThreshold') || 0.8;

  // Calculate current memory usage
  const state = await loadTieredMemory();
  const hotItems = state.hot || [];
  const warmItems = state.warm || [];
  const coldItems = state.cold || [];

  let hotTokens = 0;
  for (const item of hotItems) {
    hotTokens += item.tokens || Math.ceil(item.content.length / 4);
  }

  let warmTokens = 0;
  for (const item of warmItems) {
    warmTokens += item.tokens || Math.ceil(item.content.length / 4);
  }

  let coldTokens = 0;
  for (const item of coldItems) {
    coldTokens += item.tokens || Math.ceil(item.content.length / 4);
  }

  const totalTokens = hotTokens + warmTokens + coldTokens;
  const hotPercentage = (hotTokens / maxTokens) * 100;
  const totalPercentage = (totalTokens / maxTokens) * 100;

  // Show memory status
  printSuccess(chalk.green(`📊 Memory Usage Summary:`));
  printInfo(chalk.gray(`Max Context Tokens: ${maxTokens}`));
  printInfo(chalk.gray(`Auto Prune: ${autoPrune ? chalk.green('ENABLED') : chalk.red('DISABLED')}`));
  printInfo(chalk.gray(`Prune Threshold: ${(pruneThreshold * 100).toFixed(0)}%\n`));

  // Show visual token usage bar if requested
  if (options.visual) {
    printInfo(chalk.cyan('Token Usage Visualization:\n'));
    
    // Create visual bars
    const hotBar = createTokenBar(hotTokens, maxTokens, 'HOT');
    const totalBar = createTokenBar(totalTokens, maxTokens, 'TOTAL');
    
    printInfo(`Hot Memory: ${hotBar}`);
    printInfo(`Total Mem:  ${totalBar}`);
    
    printInfo(chalk.gray(`\nHot Tokens: ${hotTokens}/${maxTokens} (${hotPercentage.toFixed(1)}%)`));
    printInfo(chalk.gray(`Total Tokens: ${totalTokens}/${maxTokens} (${totalPercentage.toFixed(1)}%)`));
    
    // Show pruning status
    if (hotPercentage > pruneThreshold * 100) {
      printWarning(chalk.yellow(`⚠️  Hot memory usage (${hotPercentage.toFixed(1)}%) exceeds prune threshold (${(pruneThreshold * 100).toFixed(0)}%)`));
      printInfo(chalk.gray('Auto-consolidation will trigger soon'));
    } else {
      const remaining = (pruneThreshold * maxTokens) - hotTokens;
      printSuccess(chalk.green(`✅ ${Math.round(remaining)} tokens remaining before auto-prune threshold`));
    }
  } else {
    // Show simple status
    printInfo(chalk.gray(`Hot Memory: ${hotTokens} tokens (${hotPercentage.toFixed(1)}% of limit)`));
    printInfo(chalk.gray(`Warm Memory: ${warmTokens} tokens`));
    printInfo(chalk.gray(`Cold Memory: ${coldTokens} tokens`));
    printInfo(chalk.gray(`Total Memory: ${totalTokens} tokens (${totalPercentage.toFixed(1)}% of limit)`));
    
    if (hotPercentage > pruneThreshold * 100) {
      printWarning(chalk.yellow(`⚠️  Hot memory usage exceeds threshold. Auto-prune recommended.`));
    } else {
      printSuccess(chalk.green('✅ Memory usage within safe limits'));
    }
  }

  // Show memory tier statistics
  printInfo(chalk.cyan('\nMemory Tiers:'));
  printInfo(chalk.gray(`  Hot: ${hotItems.length} items (${hotTokens} tokens)`));
  printInfo(chalk.gray(`  Warm: ${warmItems.length} items (${warmTokens} tokens)`));
  printInfo(chalk.gray(`  Cold: ${coldItems.length} items (${coldTokens} tokens)`));
}

/**
 * Create a visual token usage bar
 */
function createTokenBar(usedTokens, maxTokens, label) {
  const percentage = Math.min(100, (usedTokens / maxTokens) * 100);
  const barWidth = 50;
  const filledBlocks = Math.floor((percentage / 100) * barWidth);
  const emptyBlocks = barWidth - filledBlocks;
  
  let bar = '';
  
  // Create filled portion
  for (let i = 0; i < filledBlocks; i++) {
    if (percentage > 90) {
      bar += chalk.red('█');
    } else if (percentage > 75) {
      bar += chalk.yellow('█');
    } else {
      bar += chalk.green('█');
    }
  }
  
  // Create empty portion
  for (let i = 0; i < emptyBlocks; i++) {
    bar += chalk.gray('░');
  }
  
  const percentStr = `${percentage.toFixed(1)}%`;
  return `${bar} ${percentStr}`;
}

/**
 * Prune memory by consolidating older entries
 */
export async function pruneMemory(options = {}) {
  printInfo(chalk.yellow('\n✂️  Initiating memory pruning...\n'));

  const state = await loadTieredMemory();
  
  if (!state.hot || state.hot.length === 0) {
    printInfo(chalk.gray('No hot memory entries to prune.'));
    return;
  }

  // Load configuration
  if (!configManager.loaded) {
    await configManager.load();
  }

  const maxTokens = configManager.get('contextPruning.maxContextTokens') || configManager.get('memory.maxContextTokens') || 8192;
  const pruneThreshold = configManager.get('contextPruning.pruneThreshold') || configManager.get('memory.pruneThreshold') || 0.8;

  let currentTokens = 0;
  for (const item of state.hot) {
    currentTokens += item.tokens || Math.ceil(item.content.length / 4);
  }

  if (currentTokens <= maxTokens * pruneThreshold && !options.force) {
    printInfo(chalk.gray('Memory usage is within limits. Use --force to prune anyway.'));
    return;
  }

  // Calculate how many tokens need to be pruned
  const targetTokens = maxTokens * pruneThreshold * 0.8; // Target 80% of threshold
  const excessTokens = currentTokens - targetTokens;

  printInfo(chalk.gray(`Current tokens: ${currentTokens}, Target: ${Math.round(targetTokens)}`));
  printInfo(chalk.gray(`Need to prune ~${Math.round(excessTokens)} tokens`));

  // Sort hot items by age (oldest first) and move to warm
  const sortedHot = [...state.hot].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  
  let prunedTokens = 0;
  const itemsToMove = [];
  
  for (const item of sortedHot) {
    const itemTokens = item.tokens || Math.ceil(item.content.length / 4);
    
    if (prunedTokens < excessTokens) {
      itemsToMove.push(item);
      prunedTokens += itemTokens;
    } else {
      break;
    }
  }

  if (itemsToMove.length === 0) {
    printInfo(chalk.gray('No items to prune.'));
    return;
  }

  // Confirm with user before pruning
  if (!options.force) {
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: chalk.cyan(`Prune ${itemsToMove.length} items (~${Math.round(prunedTokens)} tokens)?`),
        default: true
      }
    ]);

    if (!confirm) {
      printInfo(chalk.gray('Pruning cancelled by user.'));
      return;
    }
  }

  // Move items from hot to warm
  state.warm = state.warm || [];
  state.hot = state.hot.filter(item => !itemsToMove.some(moveItem => moveItem.id === item.id));
  state.warm.push(...itemsToMove);

  await saveTieredMemory(state);

  printSuccess(chalk.green(`✅ Pruned ${itemsToMove.length} items (~${Math.round(prunedTokens)} tokens)`));
  printInfo(chalk.gray('Moved to warm memory tier'));
}

export function registerMemoryCommand(program) {
  const memoryCmd = program
    .command('memory')
    .alias('mem')
    .description('Memory management and context pruning');

  memoryCmd
    .command('status')
    .alias('stats')
    .description('Show memory usage and token status')
    .option('-v, --visual', 'Show visual token usage bar')
    .action(async (options) => {
      try {
        await showMemoryStatus(options);
      } catch (error) {
        printError(chalk.red(`Memory status failed: ${error.message}`));
        process.exit(1);
      }
    });

  memoryCmd
    .command('prune')
    .description('Prune memory to stay within token limits')
    .option('-f, --force', 'Force pruning even if within limits')
    .action(async (options) => {
      try {
        await pruneMemory(options);
      } catch (error) {
        printError(chalk.red(`Memory pruning failed: ${error.message}`));
        process.exit(1);
      }
    });

  memoryCmd
    .command('search <query>')
    .description('Semantic search across persistent memory')
    .option('-l, --limit <n>', 'Max results', '5')
    .option('--json', 'Output JSON')
    .action(async (query, options) => {
      try {
        const limit = Math.max(parseInt(options.limit, 10) || 5, 1);
        const results = await memex.search(query, limit);

        if (options.json) {
          console.log(JSON.stringify(results, null, 2));
          return;
        }

        if (!results.length) {
          printWarning(chalk.yellow('No memory hits found.'));
          return;
        }

        printInfo(chalk.cyan(`\n🔎 Memory results for "${query}":\n`));
        results.forEach((hit, index) => {
          const preview =
            typeof hit.text === 'string' ? hit.text.slice(0, 180).replace(/\s+/g, ' ') : '';
          printInfo(
            chalk.gray(`${index + 1}.`) +
              ' ' +
              chalk.white(preview || '[no content]')
          );
          if (hit.metadata) {
            printInfo(chalk.dim(`   • metadata: ${JSON.stringify(hit.metadata)}`));
          }
        });
      } catch (error) {
        printError(chalk.red(`Memory search failed: ${error.message}`));
        process.exit(1);
      }
    });

  memoryCmd._examples = [
    { command: 'ultra-dex memory status', description: 'Show current memory usage' },
    { command: 'ultra-dex memory status --visual', description: 'Show visual token usage bar' },
    { command: 'ultra-dex memory prune', description: 'Prune memory if exceeding limits' },
    { command: 'ultra-dex memory prune --force', description: 'Force memory pruning' },
    { command: 'ultra-dex memory search "auth decisions"', description: 'Search persistent memory' }
  ];
}

export default {
  showMemoryStatus,
  pruneMemory,
  registerMemoryCommand
};
