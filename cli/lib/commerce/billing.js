// Copyright (c) 2026 Ultra-Dex

/**
 * Agent Commerce & Billing System
 * Tracks usage, costs, and implements budget management for AI agents
 */

import fs from 'fs/promises';
import path from 'path';
import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';
import chalk from 'chalk';
import { AppError } from '../utils/errors.js';

// Default billing configuration
const DEFAULT_BILLING_CONFIG = {
  dailyBudget: 10.0, // $10 per day
  monthlyBudget: 200.0, // $200 per month
  perAgentBudget: 5.0, // $5 per agent per day
  alerts: {
    thresholds: [80, 90, 100], // Percentage thresholds for alerts
    slackWebhook: null,
    discordWebhook: null,
    email: null,
  },
  providers: {
    anthropic: {
      modelCosts: {
        'claude-3-5-sonnet-20241022': { input: 3.0, output: 15.0 }, // $3/$15 per 1M tokens
        'claude-3-opus-20240229': { input: 15.0, output: 75.0 },
        'claude-3-sonnet-20240229': { input: 3.0, output: 15.0 },
        'claude-3-haiku-20240307': { input: 0.25, output: 1.25 },
      },
    },
    openai: {
      modelCosts: {
        'gpt-4o': { input: 5.0, output: 15.0 }, // $5/$15 per 1M tokens
        'gpt-4o-mini': { input: 0.15, output: 0.6 }, // $0.15/$0.60 per 1M tokens
        'gpt-4-turbo': { input: 10.0, output: 30.0 },
      },
    },
    google: {
      modelCosts: {
        'gemini-1.5-pro': { input: 3.5, output: 10.5 }, // $3.50/$10.50 per 1M tokens
        'gemini-1.5-flash': { input: 0.35, output: 1.05 }, // $0.35/$1.05 per 1M tokens
      },
    },
  },
};

// Billing data storage
const BILLING_DATA_DIR = path.join(process.cwd(), '.ultra-dex', 'billing');
const USAGE_LOG_FILE = path.join(BILLING_DATA_DIR, 'usage.json');
const BUDGET_STATE_FILE = path.join(BILLING_DATA_DIR, 'budget-state.json');

/**
 * Billing System Class
 */
export class BillingSystem {
  constructor(options = {}) {
    this.config = { ...DEFAULT_BILLING_CONFIG, ...options.config };
    this.usageLog = [];
    this.budgetState = {
      dailySpent: 0,
      monthlySpent: 0,
      agentSpending: {},
      lastReset: new Date().toISOString(),
      alertsSent: [],
    };
    this.initialized = false;
  }

  /**
   * Initialize the billing system
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // Create billing data directory
      await fs.mkdir(BILLING_DATA_DIR, { recursive: true });

      // Load existing usage data
      await this.loadUsageData();

      // Load existing budget state
      await this.loadBudgetState();

      this.initialized = true;
      printSuccess(chalk.green('✅ Billing system initialized'));
    } catch (error) {
      printError(chalk.red(`❌ Failed to initialize billing system: ${error.message}`));
      throw error;
    }
  }

  /**
   * Load usage data from file
   */
  async loadUsageData() {
    try {
      const data = await fs.readFile(USAGE_LOG_FILE, 'utf8');
      this.usageLog = JSON.parse(data);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        printWarning(chalk.yellow(`⚠️  Could not load usage data: ${error.message}`));
      }
      // Start with empty usage log if file doesn't exist
      this.usageLog = [];
    }
  }

  /**
   * Save usage data to file
   */
  async saveUsageData() {
    try {
      await fs.writeFile(USAGE_LOG_FILE, JSON.stringify(this.usageLog, null, 2));
    } catch (error) {
      printError(chalk.red(`❌ Failed to save usage data: ${error.message}`));
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
   * Calculate cost for token usage
   */
  calculateCost(provider, model, inputTokens, outputTokens) {
    const providerConfig = this.config.providers[provider];
    if (!providerConfig) {
      throw new AppError(`Unknown provider: ${provider}`, { code: 'UNKNOWN_PROVIDER' });
    }

    const modelCosts = providerConfig.modelCosts[model];
    if (!modelCosts) {
      throw new AppError(`Unknown model: ${model}`, { code: 'UNKNOWN_MODEL' });
    }

    const inputCost = (inputTokens / 1000000) * modelCosts.input;
    const outputCost = (outputTokens / 1000000) * modelCosts.output;

    return {
      inputCost,
      outputCost,
      totalCost: inputCost + outputCost,
      breakdown: {
        inputTokens,
        outputTokens,
        inputCost,
        outputCost,
      },
    };
  }

  /**
   * Log usage for an agent
   */
  async logUsage(agentName, provider, model, usage, metadata = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    const costInfo = this.calculateCost(
      provider,
      model,
      usage.inputTokens || 0,
      usage.outputTokens || 0
    );

    const usageRecord = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      timestamp: new Date().toISOString(),
      agent: agentName,
      provider,
      model,
      usage,
      cost: costInfo.totalCost,
      costBreakdown: costInfo.breakdown,
      metadata,
    };

    this.usageLog.push(usageRecord);

    // Update budget state
    this.budgetState.dailySpent += costInfo.totalCost;
    this.budgetState.monthlySpent += costInfo.totalCost;

    if (!this.budgetState.agentSpending[agentName]) {
      this.budgetState.agentSpending[agentName] = 0;
    }
    this.budgetState.agentSpending[agentName] += costInfo.totalCost;

    // Check for budget alerts
    await this.checkBudgetAlerts();

    // Save data
    await this.saveUsageData();
    await this.saveBudgetState();

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
      throw new AppError('Billing system not initialized', { code: 'BILLING_NOT_INITIALIZED' });
    }

    const dailyPercentage = (this.budgetState.dailySpent / this.config.dailyBudget) * 100;
    const monthlyPercentage = (this.budgetState.monthlySpent / this.config.monthlyBudget) * 100;

    return {
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
      perAgent: this.budgetState.agentSpending,
      alertsSent: this.budgetState.alertsSent,
      lastReset: this.budgetState.lastReset,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get usage report
   */
  async getUsageReport(options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    const { startDate, endDate, agent, provider } = options;

    let filteredUsage = this.usageLog;

    if (startDate) {
      filteredUsage = filteredUsage.filter(
        (record) => new Date(record.timestamp) >= new Date(startDate)
      );
    }

    if (endDate) {
      filteredUsage = filteredUsage.filter(
        (record) => new Date(record.timestamp) <= new Date(endDate)
      );
    }

    if (agent) {
      filteredUsage = filteredUsage.filter((record) => record.agent === agent);
    }

    if (provider) {
      filteredUsage = filteredUsage.filter((record) => record.provider === provider);
    }

    // Calculate totals
    const totalCost = filteredUsage.reduce((sum, record) => sum + record.cost, 0);
    const totalInputTokens = filteredUsage.reduce(
      (sum, record) => sum + (record.usage.inputTokens || 0),
      0
    );
    const totalOutputTokens = filteredUsage.reduce(
      (sum, record) => sum + (record.usage.outputTokens || 0),
      0
    );

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
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
        records: filteredUsage.length,
      },
      byAgent,
      records: filteredUsage,
    };
  }

  /**
   * Reset daily spending
   */
  async resetDailySpending() {
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
   * Export billing data
   */
  async exportBillingData(format = 'json', options = {}) {
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

    const filename = options.filename || `ultra-dex-billing-${Date.now()}${extension}`;
    const filepath = path.join(process.cwd(), filename);

    await fs.writeFile(filepath, content);

    printSuccess(chalk.green(`✅ Billing report exported to: ${filepath}`));

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
    const lines = ['Timestamp,Agent,Provider,Model,InputTokens,OutputTokens,Cost,Metadata'];

    for (const record of report.records) {
      const line = [
        record.timestamp,
        record.agent,
        record.provider,
        record.model,
        record.usage.inputTokens || 0,
        record.usage.outputTokens || 0,
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
    let text = `Ultra-Dex Billing Report\n`;
    text += `Generated: ${new Date().toISOString()}\n`;
    text += `Period: ${report.period.start} to ${report.period.end}\n\n`;

    text += `Total Records: ${report.totals.records}\n`;
    text += `Total Cost: $${report.totals.cost.toFixed(6)}\n`;
    text += `Total Input Tokens: ${report.totals.inputTokens}\n`;
    text += `Total Output Tokens: ${report.totals.outputTokens}\n\n`;

    text += `Spending by Agent:\n`;
    text += `------------------\n`;
    for (const [agent, data] of Object.entries(report.byAgent)) {
      text += `${agent}: $${data.totalCost.toFixed(6)} (${data.totalRecords} calls, avg: $${data.avgCost.toFixed(6)})\n`;
    }

    return text;
  }

  /**
   * Check if spending exceeds budget limits
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

  /**
   * Set new budget limits
   */
  async setBudgetLimits(daily, monthly, perAgent) {
    this.config.dailyBudget = daily;
    this.config.monthlyBudget = monthly;
    if (perAgent !== undefined) {
      this.config.perAgentBudget = perAgent;
    }

    printSuccess(chalk.green(`✅ Budget limits updated: Daily $${daily}, Monthly $${monthly}`));
  }
}

/**
 * Create and initialize billing system
 */
export async function createBillingSystem(options = {}) {
  const billingSystem = new BillingSystem(options);
  await billingSystem.initialize();
  return billingSystem;
}

/**
 * Register billing commands with Commander
 */
export function registerBillingCommands(program) {
  program
    .command('billing')
    .description('Manage agent usage and billing')
    .option('--status', 'Show current budget status')
    .option('--report', 'Generate usage report')
    .option('--export [format]', 'Export billing data (json, csv, txt)', 'json')
    .option('--reset-daily', 'Reset daily spending counter')
    .option('--reset-monthly', 'Reset monthly spending counter')
    .option('--set-budget <daily,monthly,per-agent>', 'Set new budget limits')
    .option('--start-date <date>', 'Start date for reports (YYYY-MM-DD)')
    .option('--end-date <date>', 'End date for reports (YYYY-MM-DD)')
    .option('--agent <name>', 'Filter by specific agent')
    .option('--provider <name>', 'Filter by specific provider')
    .option('--output <path>', 'Output file path for export')
    .action(async (options) => {
      try {
        printInfo(chalk.cyan('\n💳 Ultra-Dex Billing & Usage Tracking\n'));

        const billingSystem = await createBillingSystem();

        if (options.status) {
          const status = billingSystem.getBudgetStatus();

          printInfo(chalk.bold('💰 Budget Status:\n'));
          printInfo(
            `Daily: $${status.daily.spent.toFixed(4)}/$${status.daily.budget.toFixed(2)} (${status.daily.percentage.toFixed(1)}%) - ${status.daily.status}`
          );
          printInfo(
            `Monthly: $${status.monthly.spent.toFixed(4)}/$${status.monthly.budget.toFixed(2)} (${status.monthly.percentage.toFixed(1)}%) - ${status.monthly.status}\n`
          );

          printInfo(chalk.bold('📈 Per-Agent Spending:\n'));
          for (const [agent, amount] of Object.entries(status.perAgent)) {
            printInfo(`  ${agent}: $${amount.toFixed(4)}`);
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
            provider: options.provider,
          };

          const report = await billingSystem.getUsageReport(reportOptions);

          printInfo(chalk.bold('📊 Usage Report:\n'));
          printInfo(`Period: ${report.period.start} to ${report.period.end}`);
          printInfo(`Total Records: ${report.totals.records}`);
          printInfo(`Total Cost: $${report.totals.cost.toFixed(6)}`);
          printInfo(`Total Tokens: ${report.totals.inputTokens + report.totals.outputTokens}\n`);

          printInfo(chalk.bold('By Agent:\n'));
          for (const [agent, data] of Object.entries(report.byAgent)) {
            printInfo(`  ${agent}: $${data.totalCost.toFixed(6)} (${data.totalRecords} calls)`);
          }
        } else if (options.setBudget) {
          const [daily, monthly, perAgent] = options.setBudget.split(',').map(Number);

          if (isNaN(daily) || isNaN(monthly)) {
            throw new AppError('Invalid budget values. Use format: daily,monthly[,per-agent]', {
              code: 'INVALID_BUDGET_VALUES',
            });
          }

          await billingSystem.setBudgetLimits(daily, monthly, perAgent);
        } else if (options.resetDaily) {
          await billingSystem.resetDailySpending();
        } else if (options.resetMonthly) {
          await billingSystem.resetMonthlySpending();
        } else if (options.export) {
          const exportOptions = {
            format: options.export,
            filename: options.output,
            startDate: options.startDate,
            endDate: options.endDate,
            agent: options.agent,
            provider: options.provider,
          };

          const result = await billingSystem.exportBillingData(options.export, exportOptions);

          printSuccess(chalk.green(`✅ Exported to: ${result.path}`));
          printInfo(chalk.gray(`   Format: ${result.format}`));
          printInfo(chalk.gray(`   Size: ${result.size} bytes`));
          printInfo(chalk.gray(`   Records: ${result.records}`));
        } else {
          // Default: show status
          const status = billingSystem.getBudgetStatus();

          printInfo(chalk.bold('💰 Current Budget Status:\n'));
          printInfo(
            `Daily: $${status.daily.spent.toFixed(4)}/$${status.daily.budget.toFixed(2)} (${status.daily.percentage.toFixed(1)}%)`
          );
          printInfo(
            `Monthly: $${status.monthly.spent.toFixed(4)}/$${status.monthly.budget.toFixed(2)} (${status.monthly.percentage.toFixed(1)}%)`
          );
          printInfo(chalk.gray('\nUse --status, --report, --export, or --help for more options'));
        }
      } catch (error) {
        printError(chalk.red(`\n❌ Billing command failed: ${error.message}`));
        process.exitCode = error.exitCode || 1;
        throw error;
      }
    });
}

export default {
  BillingSystem,
  createBillingSystem,
  registerBillingCommands,
  exportBilling,
};

export async function exportBilling(format = 'json', options = {}) {
  const billingSystem = await createBillingSystem();
  const report = await billingSystem.getUsageReport(options);
  switch (format.toLowerCase()) {
    case 'json':
      return JSON.stringify(report, null, 2);
    case 'csv':
      return billingSystem.convertToCSV(report);
    case 'txt':
      return billingSystem.convertToText(report);
    default:
      throw new AppError(`Unsupported format: ${format}`, { code: 'UNSUPPORTED_FORMAT' });
  }
}
