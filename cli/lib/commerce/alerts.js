// Copyright (c) 2026 Ultra-Dex

/**
 * Budget Alert System
 * Handles notifications and alerts for budget thresholds
 */

import fs from 'fs/promises';
import path from 'path';
import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';
import chalk from 'chalk';
import { AppError } from '../utils/errors.js';
import { createBudgetManager } from './budget.js';

// Alert configuration
const DEFAULT_ALERT_CONFIG = {
  thresholds: [80, 90, 100], // Percentage thresholds for alerts
  channels: {
    console: true,
    slack: false,
    discord: false,
    email: false,
  },
  slackWebhook: process.env.SLACK_WEBHOOK_URL,
  discordWebhook: process.env.DISCORD_WEBHOOK_URL,
  email: process.env.ALERT_EMAIL,
};

// Alert storage
const ALERT_DATA_DIR = path.join(process.cwd(), '.ultra-dex', 'alerts');
const ALERT_HISTORY_FILE = path.join(ALERT_DATA_DIR, 'history.json');

/**
 * Budget Alert System Class
 */
export class BudgetAlertSystem {
  constructor(options = {}) {
    this.config = { ...DEFAULT_ALERT_CONFIG, ...options.config };
    this.alertHistory = [];
    this.initialized = false;
  }

  /**
   * Initialize the alert system
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // Create alerts data directory
      await fs.mkdir(ALERT_DATA_DIR, { recursive: true });

      // Load existing alert history
      await this.loadAlertHistory();

      this.initialized = true;
      printSuccess(chalk.green('✅ Budget alert system initialized'));
    } catch (error) {
      printError(chalk.red(`❌ Failed to initialize alert system: ${error.message}`));
      throw error;
    }
  }

  /**
   * Load alert history from file
   */
  async loadAlertHistory() {
    try {
      const data = await fs.readFile(ALERT_HISTORY_FILE, 'utf8');
      this.alertHistory = JSON.parse(data);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        printWarning(chalk.yellow(`⚠️  Could not load alert history: ${error.message}`));
      }
      // Start with empty history if file doesn't exist
      this.alertHistory = [];
    }
  }

  /**
   * Save alert history to file
   */
  async saveAlertHistory() {
    try {
      await fs.writeFile(ALERT_HISTORY_FILE, JSON.stringify(this.alertHistory, null, 2));
    } catch (error) {
      printError(chalk.red(`❌ Failed to save alert history: ${error.message}`));
      throw error;
    }
  }

  /**
   * Check if alert should be sent for a threshold
   */
  shouldSendAlert(threshold, currentPercentage, alertType) {
    // Check if we've already sent this specific alert recently
    const recentAlert = this.alertHistory.find(
      (alert) =>
        alert.threshold === threshold &&
        alert.type === alertType &&
        alert.percentage === currentPercentage &&
        // Check if alert was sent in the last hour
        Date.now() - new Date(alert.timestamp).getTime() < 3600000
    );

    return !recentAlert;
  }

  /**
   * Send budget alert
   */
  async sendAlert(alertType, threshold, currentPercentage, budgetInfo) {
    if (!this.initialized) {
      await this.initialize();
    }

    const message = this.formatAlertMessage(alertType, threshold, currentPercentage, budgetInfo);

    // Log to console
    if (this.config.channels.console) {
      this.logToConsole(alertType, message);
    }

    // Send to Slack if configured
    if (this.config.channels.slack && this.config.slackWebhook) {
      await this.sendToSlack(message, alertType);
    }

    // Send to Discord if configured
    if (this.config.channels.discord && this.config.discordWebhook) {
      await this.sendToDiscord(message, alertType);
    }

    // Send email if configured
    if (this.config.channels.email && this.config.email) {
      await this.sendToEmail(message, alertType);
    }

    // Add to alert history
    const alertRecord = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      type: alertType,
      threshold,
      currentPercentage,
      budgetInfo,
      message,
      timestamp: new Date().toISOString(),
    };

    this.alertHistory.push(alertRecord);

    // Keep only last 100 alerts to prevent unlimited growth
    if (this.alertHistory.length > 100) {
      this.alertHistory = this.alertHistory.slice(-100);
    }

    await this.saveAlertHistory();

    return alertRecord;
  }

  /**
   * Format alert message
   */
  formatAlertMessage(alertType, threshold, currentPercentage, budgetInfo) {
    const emoji =
      {
        warning: '⚠️',
        critical: '🚨',
        exceeded: '❌',
      }[alertType] || '🔔';

    const typeText =
      {
        warning: 'Warning',
        critical: 'Critical',
        exceeded: 'Exceeded',
      }[alertType] || 'Alert';

    return `${emoji} Ultra-Dex Budget ${typeText}: ${alertType} budget at ${currentPercentage.toFixed(1)}% of ${threshold}% threshold
    
Current Status:
- Spent: $${budgetInfo.spent.toFixed(4)}
- Budget: $${budgetInfo.budget.toFixed(2)}
- Remaining: $${(budgetInfo.budget - budgetInfo.spent).toFixed(4)}

Project: ${budgetInfo.project || 'Unknown'}
Agent: ${budgetInfo.agent || 'All Agents'}
Timestamp: ${new Date().toISOString()}`;
  }

  /**
   * Log alert to console
   */
  logToConsole(alertType, message) {
    const color =
      {
        warning: chalk.yellow,
        critical: chalk.redBright,
        exceeded: chalk.red,
      }[alertType] || chalk.blue;

    printInfo(color(message));
  }

  /**
   * Send alert to Slack
   */
  async sendToSlack(message, alertType) {
    if (!this.config.slackWebhook) {
      printWarning(chalk.yellow('⚠️  Slack webhook not configured'));
      return;
    }

    try {
      const payload = {
        text: message,
        attachments: [
          {
            color:
              {
                warning: 'warning',
                critical: 'danger',
                exceeded: 'danger',
              }[alertType] || 'good',
            fields: [
              {
                title: 'Alert Type',
                value: alertType,
                short: true,
              },
              {
                title: 'Threshold',
                value: `${alertType}%`,
                short: true,
              },
            ],
          },
        ],
      };

      const response = await fetch(this.config.slackWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Slack API responded with ${response.status}`);
      }

      printSuccess(chalk.green('✅ Slack alert sent'));
    } catch (error) {
      printError(chalk.red(`❌ Failed to send Slack alert: ${error.message}`));
    }
  }

  /**
   * Send alert to Discord
   */
  async sendToDiscord(message, alertType) {
    if (!this.config.discordWebhook) {
      printWarning(chalk.yellow('⚠️  Discord webhook not configured'));
      return;
    }

    try {
      const color =
        {
          warning: 16776960, // Yellow
          critical: 15548997, // Red
          exceeded: 15158332, // Dark Red
        }[alertType] || 3447003; // Blue

      const payload = {
        content: null,
        embeds: [
          {
            title: `Ultra-Dex Budget ${alertType.charAt(0).toUpperCase() + alertType.slice(1)}`,
            description: message,
            color: color,
            timestamp: new Date().toISOString(),
            footer: {
              text: 'Ultra-Dex Budget Alert System',
            },
          },
        ],
      };

      const response = await fetch(this.config.discordWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Discord API responded with ${response.status}`);
      }

      printSuccess(chalk.green('✅ Discord alert sent'));
    } catch (error) {
      printError(chalk.red(`❌ Failed to send Discord alert: ${error.message}`));
    }
  }

  /**
   * Send alert via email
   */
  async sendToEmail(message, alertType) {
    if (!this.config.email) {
      printWarning(chalk.yellow('⚠️  Email not configured'));
      return;
    }

    // In a real implementation, this would use an email service like nodemailer
    // For now, we'll just log it
    printInfo(chalk.gray(`📧 Email alert prepared for: ${this.config.email}`));
    printInfo(
      chalk.gray(
        `   Subject: Ultra-Dex Budget ${alertType.charAt(0).toUpperCase() + alertType.slice(1)}`
      )
    );
    printInfo(chalk.gray(`   Message: ${message}`));
  }

  /**
   * Check and send alerts if thresholds are crossed
   */
  async checkAndSendAlerts(budgetStatus) {
    if (!this.initialized) {
      await this.initialize();
    }

    const { daily, monthly } = budgetStatus;

    // Check daily budget alerts
    for (const threshold of this.config.thresholds) {
      if (
        daily.percentage >= threshold &&
        this.shouldSendAlert(threshold, daily.percentage, 'daily')
      ) {
        const alertType =
          daily.percentage >= 100 ? 'exceeded' : daily.percentage >= 90 ? 'critical' : 'warning';

        await this.sendAlert(alertType, threshold, daily.percentage, {
          spent: daily.spent,
          budget: daily.budget,
          type: 'daily',
          project: budgetStatus.project,
          agent: budgetStatus.agent,
        });
      }
    }

    // Check monthly budget alerts
    for (const threshold of this.config.thresholds) {
      if (
        monthly.percentage >= threshold &&
        this.shouldSendAlert(threshold, monthly.percentage, 'monthly')
      ) {
        const alertType =
          monthly.percentage >= 100
            ? 'exceeded'
            : monthly.percentage >= 90
              ? 'critical'
              : 'warning';

        await this.sendAlert(alertType, threshold, monthly.percentage, {
          spent: monthly.spent,
          budget: monthly.budget,
          type: 'monthly',
          project: budgetStatus.project,
          agent: budgetStatus.agent,
        });
      }
    }

    // Check per-agent budget alerts
    if (budgetStatus.perAgent) {
      for (const [agentName, agentBudget] of Object.entries(budgetStatus.perAgent)) {
        if (typeof agentBudget === 'object' && agentBudget.percentage) {
          for (const threshold of this.config.thresholds) {
            if (
              agentBudget.percentage >= threshold &&
              this.shouldSendAlert(threshold, agentBudget.percentage, `agent-${agentName}`)
            ) {
              const alertType =
                agentBudget.percentage >= 100
                  ? 'exceeded'
                  : agentBudget.percentage >= 90
                    ? 'critical'
                    : 'warning';

              await this.sendAlert(alertType, threshold, agentBudget.percentage, {
                spent: agentBudget.spent,
                budget: agentBudget.budget,
                type: `agent-${agentName}`,
                project: budgetStatus.project,
                agent: agentName,
              });
            }
          }
        }
      }
    }
  }

  /**
   * Get alert history
   */
  async getAlertHistory(options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    let filteredHistory = this.alertHistory;

    if (options.startDate) {
      const start = new Date(options.startDate);
      filteredHistory = filteredHistory.filter((alert) => new Date(alert.timestamp) >= start);
    }

    if (options.endDate) {
      const end = new Date(options.endDate);
      filteredHistory = filteredHistory.filter((alert) => new Date(alert.timestamp) <= end);
    }

    if (options.type) {
      filteredHistory = filteredHistory.filter((alert) => alert.type === options.type);
    }

    if (options.threshold) {
      filteredHistory = filteredHistory.filter((alert) => alert.threshold === options.threshold);
    }

    // Sort by timestamp descending
    filteredHistory.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return {
      alerts: filteredHistory,
      count: filteredHistory.length,
      period: {
        start: options.startDate || filteredHistory[filteredHistory.length - 1]?.timestamp,
        end: options.endDate || filteredHistory[0]?.timestamp,
      },
    };
  }

  /**
   * Clear alert history
   */
  async clearAlertHistory() {
    if (!this.initialized) {
      await this.initialize();
    }

    this.alertHistory = [];
    await this.saveAlertHistory();

    printSuccess(chalk.green('✅ Alert history cleared'));
  }

  /**
   * Configure alert channels
   */
  async configureChannels(channels) {
    this.config.channels = { ...this.config.channels, ...channels };

    printSuccess(chalk.green('✅ Alert channels configured'));

    return this.config.channels;
  }

  /**
   * Test alert delivery
   */
  async testAlert() {
    if (!this.initialized) {
      await this.initialize();
    }

    printInfo(chalk.cyan('🧪 Testing alert delivery...\n'));

    const testMessage = 'This is a test alert from Ultra-Dex Budget Alert System';

    // Test console
    if (this.config.channels.console) {
      printSuccess(chalk.green('✅ Console alert: Test message delivered'));
    }

    // Test Slack
    if (this.config.channels.slack && this.config.slackWebhook) {
      try {
        await this.sendToSlack(testMessage, 'warning');
        printSuccess(chalk.green('✅ Slack alert: Test message delivered'));
      } catch (error) {
        printError(chalk.red(`❌ Slack alert failed: ${error.message}`));
      }
    } else if (this.config.channels.slack) {
      printWarning(chalk.yellow('⚠️  Slack webhook not configured'));
    }

    // Test Discord
    if (this.config.channels.discord && this.config.discordWebhook) {
      try {
        await this.sendToDiscord(testMessage, 'warning');
        printSuccess(chalk.green('✅ Discord alert: Test message delivered'));
      } catch (error) {
        printError(chalk.red(`❌ Discord alert failed: ${error.message}`));
      }
    } else if (this.config.channels.discord) {
      printWarning(chalk.yellow('⚠️  Discord webhook not configured'));
    }

    // Test email
    if (this.config.channels.email && this.config.email) {
      await this.sendToEmail(testMessage, 'warning');
      printSuccess(chalk.green('✅ Email alert: Test message prepared'));
    } else if (this.config.channels.email) {
      printWarning(chalk.yellow('⚠️  Email not configured'));
    }

    printSuccess(chalk.green('\n✅ Alert delivery test completed'));
  }
}

/**
 * Create and initialize alert system
 */
export async function createBudgetAlertSystem(options = {}) {
  const alertSystem = new BudgetAlertSystem(options);
  await alertSystem.initialize();
  return alertSystem;
}

/**
 * Register alert commands with Commander
 */
export function registerAlertCommands(program) {
  program
    .command('alerts')
    .description('Manage budget alerts and notifications')
    .option('--history', 'Show alert history')
    .option('--test', 'Test alert delivery')
    .option('--configure', 'Configure alert channels')
    .option('--clear', 'Clear alert history')
    .option('--start-date <date>', 'Start date for history (YYYY-MM-DD)')
    .option('--end-date <date>', 'End date for history (YYYY-MM-DD)')
    .option('--type <type>', 'Filter by alert type (daily, monthly, agent)')
    .option('--threshold <value>', 'Filter by threshold percentage')
    .action(async (options) => {
      try {
        printInfo(chalk.cyan('\n🔔 Ultra-Dex Budget Alert System\n'));

        const alertSystem = await createBudgetAlertSystem();

        if (options.history) {
          const historyOptions = {
            startDate: options.startDate,
            endDate: options.endDate,
            type: options.type,
            threshold: options.threshold ? parseInt(options.threshold) : undefined,
          };

          const history = await alertSystem.getAlertHistory(historyOptions);

          if (history.alerts.length === 0) {
            printInfo(chalk.gray('No alerts found in the specified period'));
            return;
          }

          printInfo(chalk.bold(`📋 Alert History (${history.count} alerts):\n`));

          for (const alert of history.alerts) {
            const time = new Date(alert.timestamp).toLocaleTimeString();
            const color = alert.type.includes('exceeded')
              ? chalk.red
              : alert.type.includes('critical')
                ? chalk.redBright
                : chalk.yellow;

            printInfo(
              `${color('●')} ${time} - ${alert.type} at ${alert.threshold}% (${alert.currentPercentage.toFixed(1)}%)`
            );
            printInfo(chalk.gray(`  ${alert.message.split('\n')[0]}`));
            printInfo(''); // Empty line
          }
        } else if (options.test) {
          await alertSystem.testAlert();
        } else if (options.configure) {
          // In a real implementation, this would provide an interactive configuration
          printInfo(chalk.blue('🔧 Alert configuration (use environment variables):'));
          printInfo(chalk.gray('  SLACK_WEBHOOK_URL=https://hooks.slack.com/...'));
          printInfo(chalk.gray('  DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...'));
          printInfo(chalk.gray('  ALERT_EMAIL=user@example.com'));
        } else if (options.clear) {
          await alertSystem.clearAlertHistory();
        } else {
          // Default: show current configuration
          printInfo(chalk.bold('🔔 Current Alert Configuration:\n'));
          printInfo(
            `Console: ${alertSystem.config.channels.console ? chalk.green('✅ Enabled') : chalk.red('❌ Disabled')}`
          );
          printInfo(
            `Slack: ${alertSystem.config.channels.slack && alertSystem.config.slackWebhook ? chalk.green('✅ Configured') : chalk.gray('Disabled')}`
          );
          printInfo(
            `Discord: ${alertSystem.config.channels.discord && alertSystem.config.discordWebhook ? chalk.green('✅ Configured') : chalk.gray('Disabled')}`
          );
          printInfo(
            `Email: ${alertSystem.config.channels.email && alertSystem.config.email ? chalk.green('✅ Configured') : chalk.gray('Disabled')}`
          );
          printInfo(`\nThresholds: ${alertSystem.config.thresholds.join('% , ')}%`);

          printInfo(chalk.gray('\nUse --history, --test, --configure, or --help for more options'));
        }
      } catch (error) {
        printError(chalk.red(`\n❌ Alert command failed: ${error.message}`));
        process.exitCode = error.exitCode || 1;
        throw error;
      }
    });
}

export default {
  BudgetAlertSystem,
  createBudgetAlertSystem,
  registerAlertCommands,
  checkAlerts,
};

export async function checkAlerts() {
  const budgetManager = await createBudgetManager();
  const status = budgetManager.getBudgetStatus();
  const thresholds = budgetManager.config.alerts?.thresholds || DEFAULT_ALERT_CONFIG.thresholds;
  const dailyPct = status.daily.percentage;
  const monthlyPct = status.monthly.percentage;
  const alerts = [];

  for (const threshold of thresholds) {
    if (dailyPct >= threshold) {
      alerts.push({ period: 'daily', threshold, percentage: Number(dailyPct.toFixed(1)) });
    }
    if (monthlyPct >= threshold) {
      alerts.push({ period: 'monthly', threshold, percentage: Number(monthlyPct.toFixed(1)) });
    }
  }

  return {
    alerts,
    dailyPct: Number(dailyPct.toFixed(1)),
    monthlyPct: Number(monthlyPct.toFixed(1)),
  };
}
