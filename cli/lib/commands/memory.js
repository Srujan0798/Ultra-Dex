/**
 * ultra-dex memory command
 * Manage persistent memory for AI agents
 */

import chalk from 'chalk';
import { ultraMemory } from '../mcp/memory.js';

export function registerMemoryCommand(program) {
  const memory = program
    .command('memory')
    .description('Manage persistent agent memory');

  memory
    .command('list')
    .description('List all remembered facts')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      const items = await ultraMemory.getAll();
      
      if (options.json) {
        console.log(JSON.stringify(items, null, 2));
        return;
      }

      console.log(chalk.cyan.bold('\n🧠 Ultra-Dex Persistent Memory\n'));
      
      if (items.length === 0) {
        console.log(chalk.gray('  Memory is empty.'));
        return;
      }

      items.forEach((item, i) => {
        console.log(chalk.white(`${i + 1}. [${new Date(item.timestamp).toLocaleDateString()}] (${item.source})`));
        console.log(chalk.gray(`   ${item.text}`));
        if (item.tags && item.tags.length > 0) {
          console.log(chalk.blue(`   Tags: ${item.tags.join(', ')}`));
        }
        console.log();
      });
    });

  memory
    .command('add <text>')
    .description('Add a fact to memory')
    .option('-t, --tags <tags>', 'Comma-separated tags')
    .action(async (text, options) => {
      const tags = options.tags ? options.tags.split(',').map(t => t.trim()) : [];
      await ultraMemory.remember(text, tags, 'manual');
      console.log(chalk.green('✅ Fact remembered.'));
    });

  memory
    .command('search <query>')
    .description('Search memory')
    .action(async (query) => {
      const results = await ultraMemory.search(query);
      console.log(chalk.cyan.bold(`\n🔍 Search Results for "${query}":\n`));
      
      if (results.length === 0) {
        console.log(chalk.gray('  No matches found.'));
        return;
      }

      results.forEach((item, i) => {
        console.log(chalk.white(`${i + 1}. [${new Date(item.timestamp).toLocaleDateString()}]`));
        console.log(chalk.gray(`   ${item.text}`));
        console.log();
      });
    });

  memory
    .command('clear')
    .description('Clear all memory')
    .option('--before <date>', 'Clear before date (ISO)')
    .action(async (options) => {
      await ultraMemory.clear(options.before);
      console.log(chalk.green('✅ Memory cleared.'));
    });
}
