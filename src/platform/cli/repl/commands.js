// Copyright (c) 2026 Ultra-Dex

/**
 * REPL Commands Module
 * Defines additional commands for the Ultra-Dex REPL
 */

import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';
import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';

export class REPLCommands {
  constructor(replContext) {
    this.repl = replContext;
    this.commands = new Map();
    this.setupCommands();
  }

  setupCommands() {
    // Register all REPL commands
    this.commands.set('help', this.help.bind(this));
    this.commands.set('clear', this.clear.bind(this));
    this.commands.set('save', this.save.bind(this));
    this.commands.set('load', this.load.bind(this));
    this.commands.set('history', this.history.bind(this));
    this.commands.set('context', this.context.bind(this));
    this.commands.set('vars', this.vars.bind(this));
    this.commands.set('set', this.set.bind(this));
    this.commands.set('get', this.get.bind(this));
    this.commands.set('list', this.list.bind(this));
    this.commands.set('search', this.search.bind(this));
    this.commands.set('agents', this.agents.bind(this));
    this.commands.set('plan', this.plan.bind(this));
    this.commands.set('swarm', this.swarm.bind(this));
    this.commands.set('brain', this.brain.bind(this));
    this.commands.set('state', this.state.bind(this));
    this.commands.set('export', this.export.bind(this));
    this.commands.set('import', this.import.bind(this));
  }

  /**
   * Show help for REPL commands
   */
  help() {
    printInfo(chalk.bold.cyan('\n📚 Ultra-Dex REPL Commands:\n'));

    const categories = {
      System: ['help', 'clear', 'history', 'exit', 'quit'],
      Sessions: ['save', 'load', 'list'],
      Context: ['context', 'vars', 'set', 'get'],
      'Ultra-Dex': ['agents', 'plan', 'swarm', 'brain', 'state', 'export', 'import'],
      Project: ['generate', 'run', 'search'],
    };

    for (const [category, cmds] of Object.entries(categories)) {
      printInfo(chalk.bold.magenta(`${category} Commands:`));
      for (const cmd of cmds) {
        const handler = this.commands.get(cmd) || this.repl[cmd];
        if (handler) {
          const desc = this.getCommandDescription(cmd);
          printInfo(`  ${chalk.blue(`/${cmd}`)} - ${desc}`);
        }
      }
      printInfo(''); // Empty line after each category
    }
  }

  getCommandDescription(cmd) {
    const descriptions = {
      help: 'Show this help message',
      clear: 'Clear the REPL screen',
      save: 'Save current session',
      load: 'Load a saved session',
      history: 'Show command history',
      context: 'Show current context',
      vars: 'Show defined variables',
      set: 'Set a variable',
      get: 'Get a variable value',
      list: 'List saved sessions',
      search: 'Search in project files',
      agents: 'List available agents',
      plan: 'Create an implementation plan',
      swarm: 'Run multi-agent swarm',
      brain: 'Query project knowledge base',
      state: 'Get project state',
      export: 'Export current session',
      import: 'Import a session',
      generate: 'Generate code from description',
      run: 'Run a specific agent',
      exit: 'Exit the REPL',
      quit: 'Exit the REPL',
    };

    return descriptions[cmd] || 'No description available';
  }

  /**
   * Clear the REPL screen
   */
  clear() {
    process.stdout.write('\u001B[2J\u001B[0;0f');
    printInfo(chalk.cyan('Screen cleared'));
  }

  /**
   * Save current session
   */
  async save(args) {
    const name = args[0] || `session_${Date.now()}`;
    const sessionPath = path.join(this.repl.sessionDir, `${name}.json`);

    const sessionData = {
      timestamp: new Date().toISOString(),
      history: this.repl.history,
      context: this.repl.context,
      variables: Object.fromEntries(this.repl.context.variables || new Map()),
    };

    try {
      await fs.writeFile(sessionPath, JSON.stringify(sessionData, null, 2));
      printSuccess(chalk.green(`✅ Session saved as: ${name}`));
    } catch (error) {
      printError(chalk.red(`❌ Failed to save session: ${error.message}`));
    }
  }

  /**
   * Load a saved session
   */
  async load(args) {
    const name = args[0];
    if (!name) {
      printError(chalk.red('❌ Please specify a session name to load'));
      return;
    }

    const sessionPath = path.join(this.repl.sessionDir, `${name}.json`);

    try {
      const sessionData = JSON.parse(await fs.readFile(sessionPath, 'utf8'));

      this.repl.history = sessionData.history || [];
      this.repl.context = sessionData.context || {};
      this.repl.context.variables = new Map(Object.entries(sessionData.variables || {}));

      printSuccess(chalk.green(`✅ Session loaded: ${name}`));
      printInfo(chalk.gray(`   Timestamp: ${sessionData.timestamp}`));
    } catch (error) {
      if (error.code === 'ENOENT') {
        printError(chalk.red(`❌ Session not found: ${name}`));
      } else {
        printError(chalk.red(`❌ Failed to load session: ${error.message}`));
      }
    }
  }

  /**
   * Show command history
   */
  history() {
    if (this.repl.history.length === 0) {
      printInfo(chalk.gray('No command history'));
      return;
    }

    printInfo(chalk.cyan.bold('\n📜 Command History:\n'));
    const recent = this.repl.history.slice(-10).reverse(); // Show last 10, most recent first
    recent.forEach((cmd, i) => {
      printInfo(chalk.gray(`${this.repl.history.length - i - recent.length + 1 + i}. ${cmd}`));
    });

    if (this.repl.history.length > 10) {
      printInfo(chalk.gray(`\n... and ${this.repl.history.length - 10} more`));
    }
  }

  /**
   * Show current context
   */
  context() {
    printInfo(chalk.cyan.bold('\n🧩 Current Context:\n'));
    printInfo(chalk.blue('Project:') + chalk.gray(` ${this.repl.context.project || 'None'}`));
    printInfo(chalk.blue('Working Directory:') + chalk.gray(` ${process.cwd()}`));
    printInfo(
      chalk.blue('Last Result:') +
        chalk.gray(` ${this.repl.context.lastResult ? 'Available' : 'None'}`)
    );
    printInfo(chalk.blue('Variables:') + chalk.gray(` ${this.repl.context.variables?.size || 0}`));
    printInfo(chalk.blue('History Length:') + chalk.gray(` ${this.repl.history.length}`));
  }

  /**
   * Show defined variables
   */
  vars() {
    const variables = this.repl.context.variables;
    if (!variables || variables.size === 0) {
      printInfo(chalk.gray('No variables defined'));
      return;
    }

    printInfo(chalk.cyan.bold('\n:variables\n'));
    for (const [name, value] of variables) {
      const valueType = typeof value;
      let displayValue = value;

      if (typeof value === 'object') {
        displayValue = JSON.stringify(value, null, 2);
      } else if (typeof value === 'string' && value.length > 50) {
        displayValue = value.substring(0, 50) + '...';
      }

      printInfo(chalk.blue(`${name} (${valueType}):`) + chalk.gray(` ${displayValue}`));
    }
  }

  /**
   * Set a variable
   */
  set(args) {
    if (args.length < 2) {
      printError(chalk.red('❌ Usage: /set <name> <value>'));
      return;
    }

    const [name, ...valueParts] = args;
    const valueStr = valueParts.join(' ');

    // Try to parse as JSON, otherwise store as string
    let value;
    try {
      value = JSON.parse(valueStr);
    } catch {
      // If not valid JSON, store as string
      value = valueStr;
    }

    if (!this.repl.context.variables) {
      this.repl.context.variables = new Map();
    }

    this.repl.context.variables.set(name, value);
    printSuccess(
      chalk.green(`✅ Variable ${chalk.bold(name)} set to: ${chalk.gray(JSON.stringify(value))}`)
    );
  }

  /**
   * Get a variable value
   */
  get(args) {
    const name = args[0];
    if (!name) {
      printError(chalk.red('❌ Usage: /get <name>'));
      return;
    }

    if (!this.repl.context.variables || !this.repl.context.variables.has(name)) {
      printError(chalk.red(`❌ Variable ${chalk.bold(name)} not found`));
      return;
    }

    const value = this.repl.context.variables.get(name);
    printInfo(chalk.blue(`${name}:`) + chalk.gray(` ${JSON.stringify(value)}`));
  }

  /**
   * List saved sessions
   */
  async list() {
    try {
      const files = await fs.readdir(this.repl.sessionDir);
      const sessions = files.filter((f) => f.endsWith('.json'));

      if (sessions.length === 0) {
        printInfo(chalk.gray('No saved sessions'));
        return;
      }

      printInfo(chalk.cyan.bold('\n💾 Saved Sessions:\n'));
      for (const session of sessions) {
        const sessionPath = path.join(this.repl.sessionDir, session);
        const stats = await fs.stat(sessionPath);
        const name = path.basename(session, '.json');
        printInfo(chalk.blue(`${name}`) + chalk.gray(` - ${stats.mtime.toLocaleDateString()}`));
      }
    } catch (error) {
      printError(chalk.red(`❌ Failed to list sessions: ${error.message}`));
    }
  }

  /**
   * Search in project files
   */
  async search(args) {
    const query = args.join(' ');
    if (!query) {
      printError(chalk.red('❌ Usage: /search <query>'));
      return;
    }

    printInfo(chalk.blue(`🔍 Searching for: "${query}"`));

    // This would typically use the actual search functionality
    // For now, we'll simulate the search
    printInfo(chalk.gray('Searching files...'));
    printSuccess(chalk.green('✅ Search completed (simulated)'));
  }

  /**
   * List available agents
   */
  async agents() {
    printInfo(chalk.cyan.bold('\n🤖 Available Agents:\n'));

    // This would typically fetch from the actual agents system
    // For now, we'll show a simulated list
    const agents = [
      { name: '@planner', role: 'Project planning and task breakdown' },
      { name: '@backend', role: 'Backend development' },
      { name: '@frontend', role: 'Frontend development' },
      { name: '@database', role: 'Database design and queries' },
      { name: '@security', role: 'Security implementation' },
      { name: '@testing', role: 'Testing and QA' },
    ];

    for (const agent of agents) {
      printInfo(`${chalk.blue(agent.name)} - ${chalk.gray(agent.role)}`);
    }

    printInfo(chalk.gray(`\nTotal: ${agents.length} agents`));
  }

  /**
   * Create an implementation plan
   */
  async plan(args) {
    const goal = args.join(' ');
    if (!goal) {
      printError(chalk.red('❌ Usage: /plan <goal>'));
      return;
    }

    printInfo(chalk.blue(`📋 Creating plan for: ${goal}`));

    // This would typically call the actual plan command
    // For now, we'll simulate
    printSuccess(chalk.green('✅ Plan created (simulated)'));
  }

  /**
   * Run a multi-agent swarm
   */
  async swarm(args) {
    const objective = args.join(' ');
    if (!objective) {
      printError(chalk.red('❌ Usage: /swarm <objective>'));
      return;
    }

    printInfo(chalk.blue(`🐝 Starting swarm for: ${objective}`));

    // This would typically call the actual swarm command
    // For now, we'll simulate
    printSuccess(chalk.green('✅ Swarm completed (simulated)'));
  }

  /**
   * Query project knowledge base
   */
  async brain(args) {
    const query = args.join(' ');
    if (!query) {
      printError(chalk.red('❌ Usage: /brain <query>'));
      return;
    }

    printInfo(chalk.blue(`🧠 Querying brain: ${query}`));

    // This would typically call the actual brain command
    // For now, we'll simulate
    printSuccess(chalk.green('✅ Brain query completed (simulated)'));
  }

  /**
   * Get project state
   */
  async state() {
    printInfo(chalk.blue('📊 Getting project state...'));

    // This would typically call the actual state command
    // For now, we'll simulate
    const state = {
      score: 85,
      project: { name: 'Current Project', mode: 'dev' },
      agents: { active: [], registry: [] },
    };

    printSuccess(chalk.green('✅ State retrieved (simulated)'));
    printInfo(chalk.gray(JSON.stringify(state, null, 2)));
  }

  /**
   * Export current session
   */
  async export(args) {
    const format = args[0] || 'json';
    const filename = args[1] || `ultra-dex-session-${Date.now()}.${format}`;

    printInfo(chalk.blue(`📤 Exporting session in ${format} format to: ${filename}`));

    // This would typically call the actual export functionality
    // For now, we'll simulate
    printSuccess(chalk.green(`✅ Session exported to ${filename} (simulated)`));
  }

  /**
   * Import a session
   */
  async import(args) {
    const filename = args[0];
    if (!filename) {
      printError(chalk.red('❌ Usage: /import <filename>'));
      return;
    }

    printInfo(chalk.blue(`📥 Importing session from: ${filename}`));

    // This would typically call the actual import functionality
    // For now, we'll simulate
    printSuccess(chalk.green(`✅ Session imported from ${filename} (simulated)`));
  }
}

export default REPLCommands;
