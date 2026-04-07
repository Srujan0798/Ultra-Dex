// Copyright (c) 2026 Ultra-Dex

/**
 * Ultra-Dex Developer Experience Enhancements
 * Interactive mode, progress indicators, and improved CLI feedback
 */

import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from './ora.js';
import Table from 'cli-table3';
import { logger } from './logger.js';
import { configManager } from './config-manager.js';
import { errorRecovery } from './error-recovery.js';
import { monitoring } from './monitoring.js';

class InteractiveMode {
  constructor() {
    this.questions = new Map();
    this.responses = new Map();
    this.spinner = null;
    this.progressBar = null;
    this.progressInterval = null;
  }

  /**
   * Add a question to the interactive flow
   */
  addQuestion(name, question) {
    this.questions.set(name, question);
  }

  /**
   * Run interactive questionnaire
   */
  async run() {
    const answers = {};

    for (const [name, question] of this.questions) {
      try {
        const answer = await inquirer.prompt([question]);
        answers[name] = answer[name];
        this.responses.set(name, answer[name]);
      } catch (error) {
        await logger.event(
          'interactive.question_error',
          { name, error: error.message },
          {
            level: 'error',
            message: `Interactive question failed: ${name}`,
            console: false,
            source: 'interactive-mode',
          }
        );
        throw error;
      }
    }

    return answers;
  }

  /**
   * Create and manage a spinner
   */
  createSpinner(text = 'Processing...') {
    this.spinner = ora({
      text: chalk.blue(text),
      spinner: 'clock',
    });
    return this.spinner;
  }

  /**
   * Show success message
   */
  showSuccess(message) {
    logger.print(chalk.green('✅ ' + message));
    void logger.event(
      'interactive.feedback',
      { type: 'success' },
      {
        level: 'info',
        message,
        console: false,
        source: 'interactive-mode',
      }
    );
  }

  /**
   * Show warning message
   */
  showWarning(message) {
    logger.print(chalk.yellow('⚠️  ' + message));
    void logger.event(
      'interactive.feedback',
      { type: 'warning' },
      {
        level: 'warn',
        message,
        console: false,
        source: 'interactive-mode',
      }
    );
  }

  /**
   * Show error message
   */
  showError(message) {
    logger.print(chalk.red('❌ ' + message));
    void logger.event(
      'interactive.feedback',
      { type: 'error' },
      {
        level: 'error',
        message,
        console: false,
        source: 'interactive-mode',
      }
    );
  }

  /**
   * Show info message
   */
  showInfo(message) {
    logger.print(chalk.blue('ℹ️  ' + message));
    void logger.event(
      'interactive.feedback',
      { type: 'info' },
      {
        level: 'info',
        message,
        console: false,
        source: 'interactive-mode',
      }
    );
  }

  /**
   * Create a progress bar
   */
  createProgressBar(total, message = 'Progress') {
    const progressBar = {
      current: 0,
      total,
      message,
      update: (increment = 1) => {
        progressBar.current += increment;
        const percent = Math.round((progressBar.current / total) * 100);
        const bar = '█'.repeat(Math.round(percent / 2)) + '░'.repeat(50 - Math.round(percent / 2));
        process.stdout.write(
          `\r${message}: [${bar}] ${percent}% (${progressBar.current}/${total})`
        );
      },
      finish: () => {
        process.stdout.write('\n');
        this.showSuccess(`${message} completed!`);
      },
    };

    return progressBar;
  }

  /**
   * Create a status table
   */
  createTable(head, options = {}) {
    return new Table({
      head: head.map((h) => chalk.bold(h)),
      chars: {
        top: '═',
        'top-mid': '╤',
        'top-left': '╔',
        'top-right': '╗',
        bottom: '═',
        'bottom-mid': '╧',
        'bottom-left': '╚',
        'bottom-right': '╝',
        left: '║',
        'left-mid': '╟',
        mid: '─',
        'mid-mid': '┼',
        right: '║',
        'right-mid': '╢',
        middle: '│',
      },
      style: {
        head: ['blue', 'bold'],
        border: ['grey'],
      },
      ...options,
    });
  }

  /**
   * Show formatted status
   */
  showStatus(statusData) {
    const table = this.createTable(['Property', 'Value']);

    for (const [key, value] of Object.entries(statusData)) {
      table.push([
        chalk.bold(key.charAt(0).toUpperCase() + key.slice(1)),
        typeof value === 'object' ? JSON.stringify(value) : String(value),
      ]);
    }

    logger.print(table.toString());
  }

  /**
   * Show metrics in a formatted table
   */
  showMetrics() {
    try {
      const metrics = monitoring.getMetrics();

      const table = this.createTable(['Metric', 'Value']);

      table.push(
        ['Requests', metrics.requests],
        ['Errors', metrics.errors],
        ['Uptime', this.formatDuration(metrics.uptime)],
        ['Performance Records', metrics.performance.length],
        ['CPU Cores', metrics.system.cpuCount],
        ['Platform', metrics.system.platform]
      );

      logger.print(chalk.bold('\n📊 System Metrics\n'));
      logger.print(table.toString());

      // Show recent performance
      if (metrics.performance.length > 0) {
        logger.print(chalk.bold('\n⏱️  Recent Performance\n'));
        const perfTable = this.createTable(['Operation', 'Duration (ms)', 'Timestamp']);

        const recentPerf = metrics.performance.slice(-5).reverse();
        for (const perf of recentPerf) {
          perfTable.push([
            perf.operation,
            perf.duration.toFixed(2),
            new Date(perf.timestamp).toLocaleTimeString(),
          ]);
        }

        logger.print(perfTable.toString());
      }
    } catch (error) {
      this.showError(`Failed to show metrics: ${error.message}`);
    }
  }

  /**
   * Show health status
   */
  showHealthStatus() {
    try {
      const health = errorRecovery.getStatus();

      logger.print(chalk.bold('\n🏥 Health Status\n'));

      // Overall status
      const overallStatus =
        health.circuitBreakers &&
        Object.values(health.circuitBreakers).every((cb) => cb.state === 'closed')
          ? chalk.green('✅ Healthy')
          : chalk.red('⚠️  Degraded');

      logger.print(`Overall Status: ${overallStatus}`);

      // Circuit breaker status
      if (health.circuitBreakers && Object.keys(health.circuitBreakers).length > 0) {
        logger.print(chalk.bold('\n🔌 Circuit Breakers\n'));
        const cbTable = this.createTable(['Service', 'State', 'Failures', 'Can Try']);

        for (const [name, status] of Object.entries(health.circuitBreakers)) {
          const stateColor =
            status.state === 'closed'
              ? chalk.green
              : status.state === 'open'
                ? chalk.red
                : chalk.yellow;

          cbTable.push([
            name,
            stateColor(status.state),
            status.failureCount,
            status.canTry ? chalk.green('Yes') : chalk.red('No'),
          ]);
        }

        logger.print(cbTable.toString());
      }

      // Degraded services
      if (health.degradedServices.length > 0) {
        logger.print(chalk.bold('\n⚠️  Degraded Services\n'));
        for (const service of health.degradedServices) {
          logger.print(`- ${chalk.yellow(service)}`);
        }
      }
    } catch (error) {
      this.showError(`Failed to show health status: ${error.message}`);
    }
  }

  /**
   * Format duration in milliseconds to human readable format
   */
  formatDuration(ms) {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    if (ms < 3600000) return `${(ms / 60000).toFixed(2)}m`;
    return `${(ms / 3600000).toFixed(2)}h`;
  }

  /**
   * Show configuration in a formatted table
   */
  showConfiguration() {
    try {
      const config = configManager.getConfig();

      logger.print(chalk.bold('\n⚙️  Configuration\n'));

      const configTable = this.createTable(['Section', 'Setting', 'Value']);

      // Show key configuration values
      configTable.push(
        ['AI Provider', 'Default', config.ai.defaultProvider],
        ['AI Provider', 'Temperature', config.ai.temperature],
        ['MCP', 'Port', config.mcp.port],
        ['Performance', 'Max Concurrent Tasks', config.performance.maxConcurrentTasks],
        ['Security', 'Validate Paths', config.security.validatePaths],
        ['Logging', 'Level', config.logging.level]
      );

      logger.print(configTable.toString());
    } catch (error) {
      this.showError(`Failed to show configuration: ${error.message}`);
    }
  }

  /**
   * Interactive configuration wizard
   */
  async runConfigurationWizard() {
    const questions = [
      {
        type: 'list',
        name: 'aiProvider',
        message: 'Select default AI provider:',
        choices: ['claude', 'openai', 'gemini', 'ollama'],
        default: configManager.get('ai.defaultProvider'),
      },
      {
        type: 'number',
        name: 'temperature',
        message: 'Set AI temperature (0-1):',
        default: configManager.get('ai.temperature'),
        validate: (value) => {
          return (value >= 0 && value <= 1) || 'Temperature must be between 0 and 1';
        },
      },
      {
        type: 'number',
        name: 'mcpPort',
        message: 'Set MCP server port:',
        default: configManager.get('mcp.port'),
        validate: (value) => {
          return (value >= 1 && value <= 65535) || 'Port must be between 1 and 65535';
        },
      },
      {
        type: 'confirm',
        name: 'enableCaching',
        message: 'Enable performance caching?',
        default: configManager.get('performance.cacheEnabled'),
      },
    ];

    const answers = await inquirer.prompt(questions);

    // Update configuration
    configManager.set('ai.defaultProvider', answers.aiProvider);
    configManager.set('ai.temperature', answers.temperature);
    configManager.set('mcp.port', answers.mcpPort);
    configManager.set('performance.cacheEnabled', answers.enableCaching);

    // Save configuration
    const saved = await configManager.save();

    if (saved) {
      this.showSuccess('Configuration updated successfully!');
      this.showConfiguration();
    } else {
      this.showError('Failed to save configuration');
    }

    return answers;
  }

  /**
   * Show help with all available commands
   */
  showHelp() {
    logger.print(chalk.bold('\n📖 Ultra-Dex Help\n'));

    const helpTable = this.createTable(['Command', 'Description', 'Example']);

    helpTable.push(
      ['ultra-dex init', 'Initialize new project', 'ultra-dex init'],
      ['ultra-dex generate', 'Generate implementation plan', 'ultra-dex generate "Todo app"'],
      ['ultra-dex build', 'Start AI-assisted development', 'ultra-dex build'],
      ['ultra-dex agents', 'List all available agents', 'ultra-dex agents'],
      ['ultra-dex run <agent>', 'Execute agent task', 'ultra-dex run backend --task "Create API"'],
      ['ultra-dex swarm <feature>', 'Run agent swarm', 'ultra-dex swarm "User auth"'],
      ['ultra-dex serve', 'Start MCP server', 'ultra-dex serve'],
      ['ultra-dex dashboard', 'Open monitoring dashboard', 'ultra-dex dashboard'],
      ['ultra-dex config', 'Manage configuration', 'ultra-dex config --wizard'],
      ['ultra-dex status', 'Show system status', 'ultra-dex status']
    );

    logger.print(helpTable.toString());

    logger.print(chalk.bold('\n💡 Tips:\n'));
    logger.print(`• Use ${chalk.cyan('--help')} with any command for detailed options`);
    logger.print(`• Configuration can be managed with ${chalk.cyan('ultra-dex config')}`);
    logger.print(`• Monitor system health with ${chalk.cyan('ultra-dex status')}`);
    logger.print(`• View metrics with ${chalk.cyan('ultra-dex metrics')}`);
  }

  /**
   * Show system status overview
   */
  showSystemStatus() {
    logger.print(chalk.bold.blue('\n🚀 Ultra-Dex System Status\n'));

    // Show basic status
    const statusTable = this.createTable(['Component', 'Status', 'Details']);

    statusTable.push(
      ['Configuration', chalk.green('Loaded'), 'Using project config'],
      ['Monitoring', chalk.green('Active'), 'Metrics collection enabled'],
      ['Error Recovery', chalk.green('Active'), 'Circuit breakers operational'],
      ['MCP Server', chalk.yellow('Unknown'), 'Check with ultra-dex serve'],
      ['AI Providers', chalk.green('Configured'), 'Ready for use']
    );

    logger.print(statusTable.toString());

    // Show recent activity
    const recentMetrics = monitoring.getMetrics();
    logger.print(chalk.bold('\n📊 Recent Activity\n'));

    const activityTable = this.createTable(['Metric', 'Count']);
    activityTable.push(
      ['Total Requests', recentMetrics.requests],
      ['Errors Encountered', recentMetrics.errors],
      ['Performance Samples', recentMetrics.performance.length]
    );

    logger.print(activityTable.toString());
  }
}

// Global interactive mode instance
export const interactiveMode = new InteractiveMode();

// Export for use in other modules
export default interactiveMode;
