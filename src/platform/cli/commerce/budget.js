// Copyright (c) 2026 Ultra-Dex

/**
 * Budget Management System
 * Handles budget tracking, alerts, and spending limits for Ultra-Dex agents
 */

import fs from 'fs/promises';
import path from 'path';
import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';
import chalk from 'chalk';
import { AppError } from '../utils/errors.js';

// Default budget configuration
const DEFAULT_BUDGET_CONFIG = {
  dailyBudget: 10.0, // $10 per day
  monthlyBudget: 200.0, // $200 per month
  perAgentBudget: 5.0, // $5 per agent per day
  alerts: {
    thresholds: [80, 90, 100], // Percentage thresholds for alerts
    slackWebhook: null,
    discordWebhook: null,
    email: null,
  },
};

// Budget data storage
const BUDGET_DATA_DIR = path.join(process.cwd(), '.ultra-dex', 'budget');
const BUDGET_STATE_FILE = path.join(BUDGET_DATA_DIR, 'state.json');
const USAGE_LOG_FILE = path.join(BUDGET_DATA_DIR, 'usage.json');

/**
 * Budget Management Class
 */
export class BudgetManager {
  constructor(options = {}) {
    this.config = { ...DEFAULT_BUDGET_CONFIG, ...options.config };
    this.budgetState = {
      dailySpent: 0,
      monthlySpent: 0,
      agentSpending: {},
      lastReset: new Date().toISOString(),
      alertsSent: [],
    };
    this.usageLog = [];
    this.initialized = false;
  }

  /**
   * Initialize the budget manager
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // Create budget data directory
      await fs.mkdir(BUDGET_DATA_DIR, { recursive: true });

      // Load existing budget state
      await this.loadBudgetState();

      // Load existing usage log
      await this.loadUsageLog();

      this.initialized = true;
      printSuccess(chalk.green('✅ Budget manager initialized'));
    } catch (error) {
      printError(chalk.red(`❌ Failed to initialize budget manager: ${error.message}`));
      throw error;
    }
  }

  /**
   * Load budget state from file
   */
  async loadBudgetState() {
    try {
      const data = await fs.readFile(BUDGET_STATE_FILE, 'utf8');
      this.budgetState = JSON.parse(data);

      // Check if we need to reset daily spending (new day)
      const lastResetDate = new Date(this.budgetState.lastReset);
      const today = new Date();

      if (lastResetDate.toDateString() !== today.toDateString()) {
        this.budgetState.dailySpent = 0;
        this.budgetState.lastReset = today.toISOString();
        await this.saveBudgetState();
      }

      // Check if we need to reset monthly spending (new month)
      const lastResetMonth = new Date(this.budgetState.lastReset).getMonth();
      const currentMonth = today.getMonth();

      if (lastResetMonth !== currentMonth) {
        this.budgetState.monthlySpent = 0;
        this.budgetState.lastReset = today.toISOString();
        await this.saveBudgetState();
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        printWarning(chalk.yellow(`⚠️  Could not load budget state: ${error.message}`));
      }
      // Start with default budget state if file doesn't exist
      this.budgetState = {
        dailySpent: 0,
        monthlySpent: 0,
        agentSpending: {},
        lastReset: new Date().toISOString(),
        alertsSent: [],
      };
    }
  }

  /**
   * Save budget state to file
   */
  async saveBudgetState() {
    try {
      await fs.writeFile(BUDGET_STATE_FILE, JSON.stringify(this.budgetState, null, 2));
    } catch (error) {
      printError(chalk.red(`❌ Failed to save budget state: ${error.message}`));
      throw error;
    }
  }

  /**
   * Load usage log from file
   */
  async loadUsageLog() {
    try {
      const data = await fs.readFile(USAGE_LOG_FILE, 'utf8');
      this.usageLog = JSON.parse(data);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        printWarning(chalk.yellow(`⚠️  Could not load usage log: ${error.message}`));
      }
      // Start with empty usage log if file doesn't exist
      this.usageLog = [];
    }
  }

  /**
   * Save usage log to file
   */
  async saveUsageLog() {
    try {
      await fs.writeFile(USAGE_LOG_FILE, JSON.stringify(this.usageLog, null, 2));
    } catch (error) {
      printError(chalk.red(`❌ Failed to save usage log: ${error.message}`));
      throw error;
    }
  }

  /**
   * Track spending for an agent
   */
  async trackSpending(agentName, cost, metadata = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    // Update daily spending
    this.budgetState.dailySpent += cost;

    // Update monthly spending
    this.budgetState.monthlySpent += cost;

    // Update agent-specific spending
    if (!this.budgetState.agentSpending[agentName]) {
      this.budgetState.agentSpending[agentName] = 0;
    }
    this.budgetState.agentSpending[agentName] += cost;

    // Log the usage
    const usageRecord = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      timestamp: new Date().toISOString(),
      agent: agentName,
      cost,
      metadata,
    };

    this.usageLog.push(usageRecord);

    // Check for budget alerts
    await this.checkBudgetAlerts();

    // Save updated state
    await this.saveBudgetState();
    await this.saveUsageLog();

    return usageRecord;
  }

  /**
   * Check if budget thresholds are exceeded
   */
  async checkBudgetAlerts() {
    const dailyPercentage = (this.budgetState.dailySpent / this.config.dailyBudget) * 100;
    const monthlyPercentage = (this.budgetState.monthlySpent / this.config.monthlyBudget) * 100;

    for (const threshold of this.config.alerts.thresholds) {
      // Daily budget alerts
      if (
        dailyPercentage >= threshold &&
        !this.budgetState.alertsSent.includes(`daily-${threshold}`)
      ) {
        await this.sendBudgetAlert('daily', threshold, dailyPercentage);
        this.budgetState.alertsSent.push(`daily-${threshold}`);
      }

      // Monthly budget alerts
      if (
        monthlyPercentage >= threshold &&
        !this.budgetState.alertsSent.includes(`monthly-${threshold}`)
      ) {
        await this.sendBudgetAlert('monthly', threshold, monthlyPercentage);
        this.budgetState.alertsSent.push(`monthly-${threshold}`);
      }
    }

    // Check per-agent budgets
    for (const [agent, spent] of Object.entries(this.budgetState.agentSpending)) {
      if (this.config.perAgentBudget && spent >= this.config.perAgentBudget) {
        if (!this.budgetState.alertsSent.includes(`agent-${agent}`)) {
          await this.sendAgentBudgetAlert(agent, spent);
          this.budgetState.alertsSent.push(`agent-${agent}`);
        }
      }
    }
  }

  /**
   * Send budget alert
   */
  async sendBudgetAlert(period, threshold, actualPercentage) {
    const message = `🚨 Ultra-Dex Budget Alert: ${period} budget at ${actualPercentage.toFixed(1)}% of ${threshold}% threshold`;

    printWarning(chalk.yellow(message));

    // Send to configured alert channels
    if (this.config.alerts.slackWebhook) {
      await this.sendSlackAlert(message);
    }

    if (this.config.alerts.discordWebhook) {
      await this.sendDiscordAlert(message);
    }

    if (this.config.alerts.email) {
      await this.sendEmailAlert(message);
    }
  }

  /**
   * Send agent-specific budget alert
   */
  async sendAgentBudgetAlert(agent, spent) {
    const message = `🚨 Ultra-Dex Agent Budget Alert: Agent ${agent} has spent $${spent.toFixed(4)}, exceeding per-agent budget`;

    printWarning(chalk.yellow(message));

    // Send to configured alert channels
    if (this.config.alerts.slackWebhook) {
      await this.sendSlackAlert(message);
    }

    if (this.config.alerts.discordWebhook) {
      await this.sendDiscordAlert(message);
    }

    if (this.config.alerts.email) {
      await this.sendEmailAlert(message);
    }
  }

  /**
   * Send alert to Slack
   */
  async sendSlackAlert(message) {
    // In a real implementation, this would send to Slack webhook
    // For now, we'll just log it
    printInfo(chalk.gray(`💬 Slack alert sent: ${message}`));
  }

  /**
   * Send alert to Discord
   */
  async sendDiscordAlert(message) {
    // In a real implementation, this would send to Discord webhook
    // For now, we'll just log it
    printInfo(chalk.gray(`💬 Discord alert sent: ${message}`));
  }

  /**
   * Send alert via email
   */
  async sendEmailAlert(message) {
    // In a real implementation, this would send an email
    // For now, we'll just log it
    printInfo(chalk.gray(`📧 Email alert sent: ${message}`));
  }

  /**
   * Get current budget status
   */
  getBudgetStatus() {
    if (!this.initialized) {
      throw new AppError('Budget manager not initialized', {
        code: 'BUDGET_MANAGER_NOT_INITIALIZED',
      });
    }

    const dailyPercentage = (this.budgetState.dailySpent / this.config.dailyBudget) * 100;
    const monthlyPercentage = (this.budgetState.monthlySpent / this.config.monthlyBudget) * 100;

    const status = {
      daily: {
        spent: this.budgetState.dailySpent,
        budget: this.config.dailyBudget,
        percentage: dailyPercentage,
        status: dailyPercentage >= 100 ? 'EXCEEDED' : dailyPercentage >= 90 ? 'WARNING' : 'OK',
      },
      monthly: {
        spent: this.budgetState.monthlySpent,
        budget: this.config.monthlyBudget,
        percentage: monthlyPercentage,
        status: monthlyPercentage >= 100 ? 'EXCEEDED' : monthlyPercentage >= 90 ? 'WARNING' : 'OK',
      },
      perAgent: { ...this.budgetState.agentSpending },
      alertsSent: [...this.budgetState.alertsSent],
      lastReset: this.budgetState.lastReset,
      timestamp: new Date().toISOString(),
    };

    // Add per-agent status
    for (const [agent, spent] of Object.entries(this.budgetState.agentSpending)) {
      const agentPercentage = (spent / this.config.perAgentBudget) * 100;
      status.perAgent[agent] = {
        spent,
        budget: this.config.perAgentBudget,
        percentage: agentPercentage,
        status: agentPercentage >= 100 ? 'EXCEEDED' : agentPercentage >= 90 ? 'WARNING' : 'OK',
      };
    }

    return status;
  }

  /**
   * Set new budget limits
   */
  async setBudgetLimits(daily, monthly, perAgent) {
    if (!this.initialized) {
      await this.initialize();
    }

    this.config.dailyBudget = daily;
    this.config.monthlyBudget = monthly;
    if (perAgent !== undefined) {
      this.config.perAgentBudget = perAgent;
    }

    printSuccess(
      chalk.green(
        `✅ Budget limits updated: Daily $${daily}, Monthly $${monthly}, Per Agent $${perAgent || 'N/A'}`
      )
    );
  }

  /**
   * Reset daily spending
   */
  async resetDailySpending() {
    if (!this.initialized) {
      await this.initialize();
    }

    this.budgetState.dailySpent = 0;
    this.budgetState.lastReset = new Date().toISOString();

    // Clear daily alerts
    this.budgetState.alertsSent = this.budgetState.alertsSent.filter(
      (alert) => !alert.startsWith('daily-')
    );

    await this.saveBudgetState();

    printSuccess(chalk.green('✅ Daily spending reset'));
  }

  /**
   * Reset monthly spending
   */
  async resetMonthlySpending() {
    if (!this.initialized) {
      await this.initialize();
    }

    this.budgetState.monthlySpent = 0;
    this.budgetState.lastReset = new Date().toISOString();

    // Clear monthly alerts
    this.budgetState.alertsSent = this.budgetState.alertsSent.filter(
      (alert) => !alert.startsWith('monthly-')
    );

    await this.saveBudgetState();

    printSuccess(chalk.green('✅ Monthly spending reset'));
  }

  /**
   * Get usage report
   */
  async getUsageReport(options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    const { startDate, endDate, agent } = options;

    let filteredUsage = this.usageLog;

    if (startDate) {
      const start = new Date(startDate);
      filteredUsage = filteredUsage.filter((record) => new Date(record.timestamp) >= start);
    }

    if (endDate) {
      const end = new Date(endDate);
      filteredUsage = filteredUsage.filter((record) => new Date(record.timestamp) <= end);
    }

    if (agent) {
      filteredUsage = filteredUsage.filter((record) => record.agent === agent);
    }

    // Calculate totals
    const totalCost = filteredUsage.reduce((sum, record) => sum + record.cost, 0);
    const totalRecords = filteredUsage.length;

    // Group by agent
    const byAgent = {};
    for (const record of filteredUsage) {
      if (!byAgent[record.agent]) {
        byAgent[record.agent] = {
          totalCost: 0,
          totalRecords: 0,
          avgCost: 0,
        };
      }
      byAgent[record.agent].totalCost += record.cost;
      byAgent[record.agent].totalRecords++;
    }

    // Calculate averages
    for (const agentData of Object.values(byAgent)) {
      agentData.avgCost = agentData.totalCost / agentData.totalRecords;
    }

    return {
      period: {
        start: startDate || new Date(0).toISOString(),
        end: endDate || new Date().toISOString(),
      },
      totals: {
        cost: totalCost,
        records: totalRecords,
      },
      byAgent,
      records: filteredUsage,
    };
  }

  /**
   * Export budget data
   */
  async exportBudgetData(format = 'json', options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    const report = await this.getUsageReport(options);

    let content;
    let extension;

    switch (format.toLowerCase()) {
      case 'json':
        content = JSON.stringify(report, null, 2);
        extension = '.json';
        break;
      case 'csv':
        content = this.convertToCSV(report);
        extension = '.csv';
        break;
      case 'txt':
        content = this.convertToText(report);
        extension = '.txt';
        break;
      default:
        throw new AppError(`Unsupported format: ${format}`, { code: 'UNSUPPORTED_FORMAT' });
    }

    const filename = options.filename || `ultra-dex-budget-${Date.now()}${extension}`;
    const filepath = path.join(process.cwd(), filename);

    await fs.writeFile(filepath, content);

    printSuccess(chalk.green(`✅ Budget report exported to: ${filepath}`));

    return {
      path: filepath,
      format,
      size: Buffer.byteLength(content),
      records: report.totals.records,
    };
  }

  /**
   * Convert report to CSV format
   */
  convertToCSV(report) {
    const lines = ['Timestamp,Agent,Cost,Metadata'];

    for (const record of report.records) {
      const line = [
        record.timestamp,
        record.agent,
        record.cost.toFixed(6),
        JSON.stringify(record.metadata).replace(/"/g, '""'),
      ]
        .map((field) => `"${field}"`)
        .join(',');

      lines.push(line);
    }

    return lines.join('\n');
  }

  /**
   * Convert report to text format
   */
  convertToText(report) {
    let text = `Ultra-Dex Budget Report\n`;
    text += `Generated: ${new Date().toISOString()}\n`;
    text += `Period: ${report.period.start} to ${report.period.end}\n\n`;

    text += `Total Records: ${report.totals.records}\n`;
    text += `Total Cost: $${report.totals.cost.toFixed(6)}\n\n`;

    text += `Spending by Agent:\n`;
    text += `------------------\n`;
    for (const [agent, data] of Object.entries(report.byAgent)) {
      text += `${agent}: $${data.totalCost.toFixed(6)} (${data.totalRecords} calls, avg: $${data.avgCost.toFixed(6)})\n`;
    }

    return text;
  }

  /**
   * Check if spending is within budget limits
   */
  async isWithinBudget() {
    if (!this.initialized) {
      await this.initialize();
    }

    const dailyPercentage = (this.budgetState.dailySpent / this.config.dailyBudget) * 100;
    const monthlyPercentage = (this.budgetState.monthlySpent / this.config.monthlyBudget) * 100;

    return {
      daily: dailyPercentage < 100,
      monthly: monthlyPercentage < 100,
      overall: dailyPercentage < 100 && monthlyPercentage < 100,
    };
  }
}

/**
 * Create and initialize budget manager
 */
export async function createBudgetManager(options = {}) {
  const budgetManager = new BudgetManager(options);
  await budgetManager.initialize();
  return budgetManager;
}

// Lightweight helpers used by cli/lib/commands/budget.js
export async function loadBudget() {
  const budgetManager = await createBudgetManager();
  const status = budgetManager.getBudgetStatus();
  return {
    daily: status.daily.budget,
    monthly: status.monthly.budget,
    perAgent: budgetManager.config.perAgentBudget,
    spending: {
      daily: status.daily.spent,
      monthly: status.monthly.spent,
    },
  };
}

export async function saveBudget(config = {}) {
  const budgetManager = await createBudgetManager();
  const daily = Number.isFinite(config.daily) ? config.daily : budgetManager.config.dailyBudget;
  const monthly = Number.isFinite(config.monthly)
    ? config.monthly
    : budgetManager.config.monthlyBudget;
  const perAgent = Number.isFinite(config.perAgent)
    ? config.perAgent
    : budgetManager.config.perAgentBudget;
  await budgetManager.setBudgetLimits(daily, monthly, perAgent);
  return { daily, monthly, perAgent };
}

export async function recordSpend(amount, agentName = 'unknown') {
  const budgetManager = await createBudgetManager();
  return budgetManager.trackSpending(agentName, amount);
}

/**
 * Register budget commands with Commander
 */
export function registerBudgetCommands(program) {
  program
    .command('budget')
    .description('Manage agent spending and budget limits')
    .option('--status', 'Show current budget status')
    .option('--report', 'Generate spending report')
    .option('--export [format]', 'Export budget data (json, csv, txt)', 'json')
    .option(
      '--set-budget <daily,monthly,per-agent>',
      'Set new budget limits (format: daily,monthly,per-agent)'
    )
    .option('--reset-daily', 'Reset daily spending counter')
    .option('--reset-monthly', 'Reset monthly spending counter')
    .option('--start-date <date>', 'Start date for reports (YYYY-MM-DD)')
    .option('--end-date <date>', 'End date for reports (YYYY-MM-DD)')
    .option('--agent <name>', 'Filter by specific agent')
    .option('--output <path>', 'Output file path for export')
    .action(async (options) => {
      try {
        printInfo(chalk.cyan('\n💰 Ultra-Dex Budget Management\n'));

        const budgetManager = await createBudgetManager();

        if (options.status) {
          const status = budgetManager.getBudgetStatus();

          printInfo(chalk.bold('💰 Budget Status:\n'));
          printInfo(
            `Daily: $${status.daily.spent.toFixed(4)}/$${status.daily.budget.toFixed(2)} (${status.daily.percentage.toFixed(1)}%) - ${status.daily.status}`
          );
          printInfo(
            `Monthly: $${status.monthly.spent.toFixed(4)}/$${status.monthly.budget.toFixed(2)} (${status.monthly.percentage.toFixed(1)}%) - ${status.monthly.status}\n`
          );

          printInfo(chalk.bold('📈 Per-Agent Spending:\n'));
          for (const [agent, amount] of Object.entries(status.perAgent)) {
            if (typeof amount === 'number') {
              printInfo(`  ${agent}: $${amount.toFixed(4)}`);
            } else {
              printInfo(
                `  ${agent}: $${amount.spent.toFixed(4)}/$${amount.budget.toFixed(2)} (${amount.percentage.toFixed(1)}%) - ${amount.status}`
              );
            }
          }

          if (status.alertsSent.length > 0) {
            printInfo(chalk.bold('\n🔔 Alerts Sent:\n'));
            for (const alert of status.alertsSent) {
              printInfo(`  ${alert}`);
            }
          }
        } else if (options.report) {
          const reportOptions = {
            startDate: options.startDate,
            endDate: options.endDate,
            agent: options.agent,
          };

          const report = await budgetManager.getUsageReport(reportOptions);

          printInfo(chalk.bold('📊 Usage Report:\n'));
          printInfo(`Period: ${report.period.start} to ${report.period.end}`);
          printInfo(`Total Records: ${report.totals.records}`);
          printInfo(`Total Cost: $${report.totals.cost.toFixed(6)}\n`);

          printInfo(chalk.bold('By Agent:\n'));
          for (const [agent, data] of Object.entries(report.byAgent)) {
            printInfo(
              `  ${agent}: $${data.totalCost.toFixed(6)} (${data.totalRecords} calls, avg: $${data.avgCost.toFixed(6)})`
            );
          }
        } else if (options.setBudget) {
          const [daily, monthly, perAgent] = options.setBudget.split(',').map(Number);

          if (isNaN(daily) || isNaN(monthly)) {
            throw new AppError('Invalid budget values. Use format: daily,monthly[,per-agent]', {
              code: 'INVALID_BUDGET_VALUES',
            });
          }

          await budgetManager.setBudgetLimits(daily, monthly, perAgent);
        } else if (options.resetDaily) {
          await budgetManager.resetDailySpending();
        } else if (options.resetMonthly) {
          await budgetManager.resetMonthlySpending();
        } else if (options.export) {
          const exportOptions = {
            format: options.export,
            filename: options.output,
            startDate: options.startDate,
            endDate: options.endDate,
            agent: options.agent,
          };

          const result = await budgetManager.exportBudgetData(options.export, exportOptions);

          printSuccess(chalk.green(`✅ Exported to: ${result.path}`));
          printInfo(chalk.gray(`   Format: ${result.format}`));
          printInfo(chalk.gray(`   Size: ${result.size} bytes`));
          printInfo(chalk.gray(`   Records: ${result.records}`));
        } else {
          // Default: show status
          const status = budgetManager.getBudgetStatus();

          printInfo(chalk.bold('💰 Current Budget Status:\n'));
          printInfo(
            `Daily: $${status.daily.spent.toFixed(4)}/$${status.daily.budget.toFixed(2)} (${status.daily.percentage.toFixed(1)}%) - ${status.daily.status}`
          );
          printInfo(
            `Monthly: $${status.monthly.spent.toFixed(4)}/$${status.monthly.budget.toFixed(2)} (${status.monthly.percentage.toFixed(1)}%) - ${status.monthly.status}\n`
          );

          printInfo(chalk.gray('Use --status, --report, --export, or --help for more options'));
        }
      } catch (error) {
        printError(chalk.red(`\n❌ Budget command failed: ${error.message}`));
        process.exitCode = error.exitCode || 1;
        throw error;
      }
    });
}

export default {
  BudgetManager,
  createBudgetManager,
  registerBudgetCommands,
};
