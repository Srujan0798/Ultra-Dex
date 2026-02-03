/**
 * Command history tracking and replay
 * Track executed commands for easy replay and audit
 */

import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import chalk from 'chalk';
import Table from 'cli-table3';

const HISTORY_FILE = path.join(os.homedir(), '.ultra-dex', 'history.json');
const MAX_HISTORY = 1000;

class CommandHistory {
  constructor() {
    this.history = [];
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;
    
    try {
      const data = await fs.readFile(HISTORY_FILE, 'utf8');
      this.history = JSON.parse(data);
    } catch {
      this.history = [];
    }
    
    this.initialized = true;
  }

  async save() {
    const dir = path.dirname(HISTORY_FILE);
    try {
      await fs.mkdir(dir, { recursive: true });
      
      // Keep only last MAX_HISTORY entries
      if (this.history.length > MAX_HISTORY) {
        this.history = this.history.slice(-MAX_HISTORY);
      }
      
      await fs.writeFile(HISTORY_FILE, JSON.stringify(this.history, null, 2));
    } catch (error) {
      console.error('Failed to save history:', error.message);
    }
  }

  async add(command, args = [], options = {}, result = 'success', duration = 0) {
    await this.init();
    
    const entry = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      timestamp: new Date().toISOString(),
      command,
      args: args.filter(a => !a.startsWith('--')), // Filter out flags
      options,
      result, // 'success', 'error', 'cancelled'
      duration, // milliseconds
      cwd: process.cwd()
    };
    
    this.history.push(entry);
    await this.save();
    
    return entry.id;
  }

  async list(limit = 20, filter = {}) {
    await this.init();
    
    let filtered = this.history;
    
    if (filter.command) {
      filtered = filtered.filter(h => h.command === filter.command);
    }
    
    if (filter.result) {
      filtered = filtered.filter(h => h.result === filter.result);
    }
    
    if (filter.since) {
      const since = new Date(filter.since);
      filtered = filtered.filter(h => new Date(h.timestamp) >= since);
    }
    
    return filtered.slice(-limit).reverse();
  }

  async get(id) {
    await this.init();
    return this.history.find(h => h.id === id);
  }

  async replay(id, dryRun = false) {
    const entry = await this.get(id);
    
    if (!entry) {
      throw new Error(`History entry ${id} not found`);
    }
    
    const commandLine = `ultra-dex ${entry.command} ${entry.args.join(' ')}`;
    
    if (dryRun) {
      console.log(chalk.cyan('Would replay:'));
      console.log(chalk.white(commandLine));
      console.log(chalk.gray(`  From: ${entry.timestamp}`));
      console.log(chalk.gray(`  In: ${entry.cwd}`));
      return;
    }
    
    console.log(chalk.cyan('Replaying:'), commandLine);
    console.log(chalk.gray(`  Original: ${entry.timestamp}`));
    
    // Change to original directory if different
    if (entry.cwd !== process.cwd()) {
      console.log(chalk.yellow(`  Changing to: ${entry.cwd}`));
      process.chdir(entry.cwd);
    }
    
    // Reconstruct command
    const { spawn } = await import('child_process');
    return new Promise((resolve, reject) => {
      const child = spawn('npx', ['ultra-dex', entry.command, ...entry.args], {
        stdio: 'inherit',
        shell: true
      });
      
      child.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Command exited with code ${code}`));
        }
      });
    });
  }

  async search(query) {
    await this.init();
    
    const lowerQuery = query.toLowerCase();
    return this.history.filter(h => 
      h.command.toLowerCase().includes(lowerQuery) ||
      h.args.some(a => a.toLowerCase().includes(lowerQuery)) ||
      h.cwd.toLowerCase().includes(lowerQuery)
    ).reverse();
  }

  async clear() {
    this.history = [];
    await this.save();
  }

  async stats() {
    await this.init();
    
    const stats = {
      total: this.history.length,
      successful: this.history.filter(h => h.result === 'success').length,
      failed: this.history.filter(h => h.result === 'error').length,
      byCommand: {}
    };
    
    this.history.forEach(h => {
      stats.byCommand[h.command] = (stats.byCommand[h.command] || 0) + 1;
    });
    
    return stats;
  }
}

// Singleton instance
const history = new CommandHistory();

export { history, CommandHistory };

// CLI integration
export async function registerHistoryCommand(program) {
  const historyCmd = program
    .command('history')
    .description('View and replay command history');

  historyCmd
    .command('list')
    .alias('ls')
    .description('Show recent commands')
    .option('-n, --limit <num>', 'Number of entries', '20')
    .option('-c, --command <cmd>', 'Filter by command')
    .option('--success', 'Show only successful')
    .option('--failed', 'Show only failed')
    .action(async (options) => {
      const filter = {};
      if (options.command) filter.command = options.command;
      if (options.success) filter.result = 'success';
      if (options.failed) filter.result = 'error';
      
      const entries = await history.list(parseInt(options.limit), filter);
      
      if (entries.length === 0) {
        console.log(chalk.yellow('No history entries found'));
        return;
      }
      
      const table = new Table({
        head: ['ID', 'Time', 'Command', 'Args', 'Result', 'Duration'],
        style: { head: ['cyan'] }
      });
      
      entries.forEach(e => {
        const time = new Date(e.timestamp).toLocaleTimeString();
        const result = e.result === 'success' 
          ? chalk.green('✓') 
          : e.result === 'error' 
            ? chalk.red('✗') 
            : chalk.yellow('○');
        const duration = e.duration > 0 
          ? `${(e.duration / 1000).toFixed(1)}s` 
          : '-';
        
        table.push([
          e.id.substring(0, 8),
          time,
          e.command,
          e.args.join(' ').substring(0, 30),
          result,
          duration
        ]);
      });
      
      console.log(table.toString());
      console.log(chalk.gray(`\nTotal: ${entries.length} entries`));
    });

  historyCmd
    .command('replay <id>')
    .description('Replay a command from history')
    .option('--dry-run', 'Show what would be executed')
    .action(async (id, options) => {
      try {
        await history.replay(id, options.dryRun);
      } catch (error) {
        console.error(chalk.red('Replay failed:'), error.message);
      }
    });

  historyCmd
    .command('search <query>')
    .description('Search command history')
    .action(async (query) => {
      const results = await history.search(query);
      
      if (results.length === 0) {
        console.log(chalk.yellow(`No results for "${query}"`));
        return;
      }
      
      console.log(chalk.cyan(`\nFound ${results.length} results:\n`));
      
      results.forEach(e => {
        console.log(chalk.white(`${e.id.substring(0, 8)} [${new Date(e.timestamp).toLocaleString()}]`));
        console.log(chalk.gray(`  ultra-dex ${e.command} ${e.args.join(' ')}`));
      });
    });

  historyCmd
    .command('stats')
    .description('Show command statistics')
    .action(async () => {
      const stats = await history.stats();
      
      console.log(chalk.cyan.bold('\n📊 Command History Statistics\n'));
      console.log(`Total commands: ${chalk.white(stats.total)}`);
      console.log(`Successful: ${chalk.green(stats.successful)}`);
      console.log(`Failed: ${chalk.red(stats.failed)}`);
      
      if (Object.keys(stats.byCommand).length > 0) {
        console.log(chalk.cyan('\nCommands by frequency:'));
        const sorted = Object.entries(stats.byCommand)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10);
        
        sorted.forEach(([cmd, count]) => {
          console.log(`  ${chalk.white(cmd.padEnd(15))} ${chalk.gray(count)}`);
        });
      }
      
      console.log();
    });

  historyCmd
    .command('clear')
    .description('Clear command history')
    .option('--force', 'Skip confirmation')
    .action(async (options) => {
      if (!options.force) {
        console.log(chalk.yellow('⚠️  This will clear all history'));
        console.log(chalk.gray('Use --force to confirm\n'));
        return;
      }
      
      await history.clear();
      console.log(chalk.green('✅ History cleared'));
    });
}
