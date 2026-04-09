import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import chalk from 'chalk';
import Table from 'cli-table3';
import { logger } from './logging.js';
const HISTORY_FILE = path.join(os.homedir(), '.ultra-dex', 'history.json');
const MAX_HISTORY = 1e3;
class CommandHistory {
  history;
  initialized;
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
      if (this.history.length > MAX_HISTORY) {
        this.history = this.history.slice(-MAX_HISTORY);
      }
      await fs.writeFile(HISTORY_FILE, JSON.stringify(this.history, null, 2));
    } catch (error) {
      logger.error(
        'Failed to save history:',
        error instanceof Error ? error.message : String(error)
      );
    }
  }
  async add(command, args = [], options = {}, result = 'success', duration = 0) {
    await this.init();
    const entry = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      timestamp: /* @__PURE__ */ new Date().toISOString(),
      command,
      args: args.filter((a) => !a.startsWith('--')),
      options,
      result,
      duration,
      cwd: process.cwd(),
    };
    this.history.push(entry);
    await this.save();
    return entry.id;
  }
  async list(limit = 20, filter = {}) {
    await this.init();
    let filtered = this.history;
    if (filter.command) {
      filtered = filtered.filter((h) => h.command === filter.command);
    }
    if (filter.result) {
      filtered = filtered.filter((h) => h.result === filter.result);
    }
    if (filter.since) {
      const since = new Date(filter.since);
      filtered = filtered.filter((h) => new Date(h.timestamp) >= since);
    }
    return filtered.slice(-limit).reverse();
  }
  async get(id) {
    await this.init();
    return this.history.find((h) => h.id === id);
  }
  async replay(id, dryRun = false) {
    const entry = await this.get(id);
    if (!entry) {
      throw new Error(`History entry ${id} not found`);
    }
    const commandLine = `ultra-dex ${entry.command} ${entry.args.join(' ')}`;
    if (dryRun) {
      logger.log(chalk.cyan('Would replay:'));
      logger.log(chalk.white(commandLine));
      logger.log(chalk.gray(`  From: ${entry.timestamp}`));
      logger.log(chalk.gray(`  In: ${entry.cwd}`));
      return;
    }
    logger.log(chalk.cyan('Replaying:'), commandLine);
    logger.log(chalk.gray(`  Original: ${entry.timestamp}`));
    if (entry.cwd !== process.cwd()) {
      logger.log(chalk.yellow(`  Changing to: ${entry.cwd}`));
      process.chdir(entry.cwd);
    }
    const { spawn } = await import('child_process');
    return new Promise((resolve, reject) => {
      const child = spawn('npx', ['ultra-dex', entry.command, ...entry.args], {
        stdio: 'inherit',
        shell: true,
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
    return this.history
      .filter(
        (h) =>
          h.command.toLowerCase().includes(lowerQuery) ||
          h.args.some((a) => a.toLowerCase().includes(lowerQuery)) ||
          h.cwd.toLowerCase().includes(lowerQuery)
      )
      .reverse();
  }
  async clear() {
    this.history = [];
    await this.save();
  }
  async stats() {
    await this.init();
    const stats = {
      total: this.history.length,
      successful: this.history.filter((h) => h.result === 'success').length,
      failed: this.history.filter((h) => h.result === 'error').length,
      byCommand: {},
    };
    this.history.forEach((h) => {
      stats.byCommand[h.command] = (stats.byCommand[h.command] || 0) + 1;
    });
    return stats;
  }
}
const history = new CommandHistory();
async function registerHistoryCommand(program) {
  const historyCmd = program.command('history').description('View and replay command history');
  const listCmd = historyCmd
    .command('list')
    .alias('ls')
    .description('Show recent commands')
    .option('-n, --limit <num>', 'Number of entries', '20')
    .option('-c, --command <cmd>', 'Filter by command')
    .option('--success', 'Show only successful')
    .option('--failed', 'Show only failed');
  listCmd.action(async (options) => {
    const filter = {};
    if (options.command) filter.command = options.command;
    if (options.success) filter.result = 'success';
    if (options.failed) filter.result = 'error';
    const entries = await history.list(parseInt(options.limit || '20'), filter);
    if (entries.length === 0) {
      logger.log(chalk.yellow('No history entries found'));
      return;
    }
    const table = new Table({
      head: ['ID', 'Time', 'Command', 'Args', 'Result', 'Duration'],
      style: { head: ['cyan'] },
    });
    entries.forEach((e) => {
      const time = new Date(e.timestamp).toLocaleTimeString();
      const result =
        e.result === 'success'
          ? chalk.green('\u2713')
          : e.result === 'error'
            ? chalk.red('\u2717')
            : chalk.yellow('\u25CB');
      const duration = e.duration > 0 ? `${(e.duration / 1e3).toFixed(1)}s` : '-';
      table.push([
        e.id.substring(0, 8),
        time,
        e.command,
        e.args.join(' ').substring(0, 30),
        result,
        duration,
      ]);
    });
    logger.log(table.toString());
    logger.log(
      chalk.gray(`
Total: ${entries.length} entries`)
    );
  });
  const replayCmd = historyCmd
    .command('replay <id>')
    .description('Replay a command from history')
    .option('--dry-run', 'Show what would be executed');
  replayCmd.action(async (id, options) => {
    try {
      await history.replay(id, options.dryRun);
    } catch (error) {
      logger.error(
        chalk.red('Replay failed:'),
        error instanceof Error ? error.message : String(error)
      );
    }
  });
  const searchCmd = historyCmd.command('search <query>').description('Search command history');
  searchCmd.action(async (query) => {
    const results = await history.search(query);
    if (results.length === 0) {
      logger.log(chalk.yellow(`No results for "${query}"`));
      return;
    }
    logger.log(
      chalk.cyan(`
Found ${results.length} results:
`)
    );
    results.forEach((e) => {
      logger.log(
        chalk.white(`${e.id.substring(0, 8)} [${new Date(e.timestamp).toLocaleString()}]`)
      );
      logger.log(chalk.gray(`  ultra-dex ${e.command} ${e.args.join(' ')}`));
    });
  });
  const statsCmd = historyCmd.command('stats').description('Show command statistics');
  statsCmd.action(async () => {
    const stats = await history.stats();
    logger.log(chalk.cyan.bold('\n\u{1F4CA} Command History Statistics\n'));
    logger.log(`Total commands: ${chalk.white(stats.total)}`);
    logger.log(`Successful: ${chalk.green(stats.successful)}`);
    logger.log(`Failed: ${chalk.red(stats.failed)}`);
    if (Object.keys(stats.byCommand).length > 0) {
      logger.log(chalk.cyan('\nCommands by frequency:'));
      const sorted = Object.entries(stats.byCommand)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
      sorted.forEach(([cmd, count]) => {
        logger.log(`  ${chalk.white(cmd.padEnd(15))} ${chalk.gray(String(count))}`);
      });
    }
    logger.log();
  });
  const clearCmd = historyCmd
    .command('clear')
    .description('Clear command history')
    .option('--force', 'Skip confirmation');
  clearCmd.action(async (options) => {
    if (!options.force) {
      logger.log(chalk.yellow('\u26A0\uFE0F  This will clear all history'));
      logger.log(chalk.gray('Use --force to confirm\n'));
      return;
    }
    await history.clear();
    logger.log(chalk.green('\u2705 History cleared'));
  });
}
export { CommandHistory, history, registerHistoryCommand };
