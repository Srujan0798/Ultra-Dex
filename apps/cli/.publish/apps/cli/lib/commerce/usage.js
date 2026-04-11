// Copyright (c) 2026 Ultra-Dex

/**
 * Usage Tracking System
 * Tracks agent usage, token consumption, and API costs
 */

import fs from 'fs/promises';
import path from 'path';
import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';
import chalk from 'chalk';
import { AppError } from '../utils/errors.js';

// Usage data storage
const USAGE_DATA_DIR = path.join(process.cwd(), '.ultra-dex', 'usage');
const USAGE_LOG_FILE = path.join(USAGE_DATA_DIR, 'usage.json');
const TOKEN_USAGE_FILE = path.join(USAGE_DATA_DIR, 'tokens.json');

// Default usage tracking configuration
const DEFAULT_USAGE_CONFIG = {
  retentionDays: 30, // Keep usage data for 30 days
  logLevel: 'info', // 'debug', 'info', 'warning', 'error'
  enableDetailedLogging: true,
  costCalculation: {
    enabled: true,
    providerRates: {
      anthropic: {
        'claude-3-5-sonnet-20241022': { input: 3.0, output: 15.0 }, // $3/$15 per 1M tokens
        'claude-3-opus-20240229': { input: 15.0, output: 75.0 },
        'claude-3-sonnet-20240229': { input: 3.0, output: 15.0 },
        'claude-3-haiku-20240307': { input: 0.25, output: 1.25 },
      },
      openai: {
        'gpt-4o': { input: 5.0, output: 15.0 }, // $5/$15 per 1M tokens
        'gpt-4o-mini': { input: 0.15, output: 0.6 }, // $0.15/$0.60 per 1M tokens
        'gpt-4-turbo': { input: 10.0, output: 30.0 },
      },
      google: {
        'gemini-1.5-pro': { input: 3.5, output: 10.5 }, // $3.50/$10.50 per 1M tokens
        'gemini-1.5-flash': { input: 0.35, output: 1.05 }, // $0.35/$1.05 per 1M tokens
      },
    },
  },
};

/**
 * Usage Tracker Class
 */
export class UsageTracker {
  constructor(options = {}) {
    this.config = { ...DEFAULT_USAGE_CONFIG, ...options.config };
    this.usageLog = [];
    this.tokenUsage = {
      totalInput: 0,
      totalOutput: 0,
      byProvider: {},
      byAgent: {},
      byDate: {},
    };
    this.initialized = false;
  }

  /**
   * Initialize the usage tracker
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // Create usage data directory
      await fs.mkdir(USAGE_DATA_DIR, { recursive: true });

      // Load existing usage data
      await this.loadUsageData();

      this.initialized = true;
      printSuccess(chalk.green('✅ Usage tracker initialized'));
    } catch (error) {
      printError(chalk.red(`❌ Failed to initialize usage tracker: ${error.message}`));
      throw error;
    }
  }

  /**
   * Load usage data from files
   */
  async loadUsageData() {
    // Load usage log
    try {
      const usageData = await fs.readFile(USAGE_LOG_FILE, 'utf8');
      this.usageLog = JSON.parse(usageData);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        printWarning(chalk.yellow(`⚠️  Could not load usage log: ${error.message}`));
      }
      this.usageLog = []; // Start with empty log if file doesn't exist
    }

    // Load token usage
    try {
      const tokenData = await fs.readFile(TOKEN_USAGE_FILE, 'utf8');
      this.tokenUsage = JSON.parse(tokenData);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        printWarning(chalk.yellow(`⚠️  Could not load token usage: ${error.message}`));
      }
      // Initialize with default structure
      this.tokenUsage = {
        totalInput: 0,
        totalOutput: 0,
        byProvider: {},
        byAgent: {},
        byDate: {},
      };
    }
  }

  /**
   * Save usage data to files
   */
  async saveUsageData() {
    // Save usage log
    try {
      await fs.writeFile(USAGE_LOG_FILE, JSON.stringify(this.usageLog, null, 2));
    } catch (error) {
      printError(chalk.red(`❌ Failed to save usage log: ${error.message}`));
      throw error;
    }

    // Save token usage
    try {
      await fs.writeFile(TOKEN_USAGE_FILE, JSON.stringify(this.tokenUsage, null, 2));
    } catch (error) {
      printError(chalk.red(`❌ Failed to save token usage: ${error.message}`));
      throw error;
    }
  }

  /**
   * Log usage for an agent interaction
   */
  async logUsage(agentName, provider, model, usage, metadata = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    const timestamp = new Date().toISOString();
    const dateKey = timestamp.split('T')[0]; // YYYY-MM-DD

    // Calculate cost if cost calculation is enabled
    let cost = 0;
    if (this.config.costCalculation.enabled) {
      const providerRates = this.config.costCalculation.providerRates[provider];
      if (providerRates && providerRates[model]) {
        const rates = providerRates[model];
        const inputCost = (usage.inputTokens || 0) * (rates.input / 1000000);
        const outputCost = (usage.outputTokens || 0) * (rates.output / 1000000);
        cost = inputCost + outputCost;
      }
    }

    // Create usage record
    const usageRecord = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      timestamp,
      agent: agentName,
      provider,
      model,
      usage: {
        inputTokens: usage.inputTokens || 0,
        outputTokens: usage.outputTokens || 0,
        cacheCreationInputTokens: usage.cacheCreationInputTokens || 0,
        cacheReadInputTokens: usage.cacheReadInputTokens || 0,
      },
      cost,
      metadata,
    };

    // Add to usage log
    this.usageLog.push(usageRecord);

    // Update token usage statistics
    this.tokenUsage.totalInput += usage.inputTokens || 0;
    this.tokenUsage.totalOutput += usage.outputTokens || 0;

    // Update by provider
    if (!this.tokenUsage.byProvider[provider]) {
      this.tokenUsage.byProvider[provider] = { input: 0, output: 0, cost: 0 };
    }
    this.tokenUsage.byProvider[provider].input += usage.inputTokens || 0;
    this.tokenUsage.byProvider[provider].output += usage.outputTokens || 0;
    this.tokenUsage.byProvider[provider].cost += cost;

    // Update by agent
    if (!this.tokenUsage.byAgent[agentName]) {
      this.tokenUsage.byAgent[agentName] = { input: 0, output: 0, cost: 0, calls: 0 };
    }
    this.tokenUsage.byAgent[agentName].input += usage.inputTokens || 0;
    this.tokenUsage.byAgent[agentName].output += usage.outputTokens || 0;
    this.tokenUsage.byAgent[agentName].cost += cost;
    this.tokenUsage.byAgent[agentName].calls += 1;

    // Update by date
    if (!this.tokenUsage.byDate[dateKey]) {
      this.tokenUsage.byDate[dateKey] = { input: 0, output: 0, cost: 0, calls: 0 };
    }
    this.tokenUsage.byDate[dateKey].input += usage.inputTokens || 0;
    this.tokenUsage.byDate[dateKey].output += usage.outputTokens || 0;
    this.tokenUsage.byDate[dateKey].cost += cost;
    this.tokenUsage.byDate[dateKey].calls += 1;

    // Save updated data
    await this.saveUsageData();

    // Log detailed information if enabled
    if (this.config.enableDetailedLogging) {
      printInfo(
        chalk.gray(
          `📊 Usage logged: ${agentName} (${provider}/${model}) - ${usage.inputTokens || 0} input, ${usage.outputTokens || 0} output, $${cost.toFixed(6)}`
        )
      );
    }

    return usageRecord;
  }

  /**
   * Get usage statistics
   */
  getUsageStats(options = {}) {
    if (!this.initialized) {
      throw new AppError('Usage tracker not initialized', {
        code: 'USAGE_TRACKER_NOT_INITIALIZED',
      });
    }

    const { startDate, endDate, agent, provider } = options;

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

    if (provider) {
      filteredUsage = filteredUsage.filter((record) => record.provider === provider);
    }

    // Calculate totals
    const totalCalls = filteredUsage.length;
    const totalInputTokens = filteredUsage.reduce(
      (sum, record) => sum + (record.usage.inputTokens || 0),
      0
    );
    const totalOutputTokens = filteredUsage.reduce(
      (sum, record) => sum + (record.usage.outputTokens || 0),
      0
    );
    const totalCost = filteredUsage.reduce((sum, record) => sum + record.cost, 0);

    // Group by agent
    const byAgent = {};
    for (const record of filteredUsage) {
      const agentName = record.agent;
      if (!byAgent[agentName]) {
        byAgent[agentName] = {
          calls: 0,
          inputTokens: 0,
          outputTokens: 0,
          cost: 0,
        };
      }

      byAgent[agentName].calls++;
      byAgent[agentName].inputTokens += record.usage.inputTokens || 0;
      byAgent[agentName].outputTokens += record.usage.outputTokens || 0;
      byAgent[agentName].cost += record.cost;
    }

    // Group by provider
    const byProvider = {};
    for (const record of filteredUsage) {
      const prov = record.provider;
      if (!byProvider[prov]) {
        byProvider[prov] = {
          calls: 0,
          inputTokens: 0,
          outputTokens: 0,
          cost: 0,
        };
      }

      byProvider[prov].calls++;
      byProvider[prov].inputTokens += record.usage.inputTokens || 0;
      byProvider[prov].outputTokens += record.usage.outputTokens || 0;
      byProvider[prov].cost += record.cost;
    }

    return {
      period: {
        start:
          startDate ||
          new Date(Math.min(...this.usageLog.map((r) => new Date(r.timestamp)))).toISOString(),
        end:
          endDate ||
          new Date(Math.max(...this.usageLog.map((r) => new Date(r.timestamp)))).toISOString(),
      },
      totals: {
        calls: totalCalls,
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
        totalTokens: totalInputTokens + totalOutputTokens,
        cost: totalCost,
      },
      byAgent,
      byProvider,
      records: filteredUsage,
    };
  }

  /**
   * Get agent-specific usage
   */
  getAgentUsage(agentName) {
    if (!this.initialized) {
      throw new AppError('Usage tracker not initialized', {
        code: 'USAGE_TRACKER_NOT_INITIALIZED',
      });
    }

    const _agentRecords = this.usageLog.filter((record) => record.agent === agentName);

    return this.getUsageStats({ agent: agentName });
  }

  /**
   * Get provider-specific usage
   */
  getProviderUsage(provider) {
    if (!this.initialized) {
      throw new AppError('Usage tracker not initialized', {
        code: 'USAGE_TRACKER_NOT_INITIALIZED',
      });
    }

    return this.getUsageStats({ provider });
  }

  /**
   * Clean old usage data based on retention policy
   */
  async cleanOldData() {
    if (!this.initialized) {
      await this.initialize();
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);

    const oldCount = this.usageLog.length;
    this.usageLog = this.usageLog.filter((record) => new Date(record.timestamp) >= cutoffDate);
    const removedCount = oldCount - this.usageLog.length;

    if (removedCount > 0) {
      await this.saveUsageData();
      printInfo(chalk.gray(`🧹 Cleaned up ${removedCount} old usage records`));
    }

    return { removed: removedCount, remaining: this.usageLog.length };
  }

  /**
   * Export usage data in various formats
   */
  async exportUsageData(format = 'json', options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    const stats = this.getUsageStats(options);

    let content;
    let extension;

    switch (format.toLowerCase()) {
      case 'json':
        content = JSON.stringify(stats, null, 2);
        extension = '.json';
        break;
      case 'csv':
        content = this.convertToCSV(stats);
        extension = '.csv';
        break;
      case 'txt':
        content = this.convertToText(stats);
        extension = '.txt';
        break;
      default:
        throw new AppError(`Unsupported format: ${format}`, { code: 'UNSUPPORTED_FORMAT' });
    }

    const filename = options.filename || `ultra-dex-usage-${Date.now()}${extension}`;
    const filepath = path.join(process.cwd(), filename);

    await fs.writeFile(filepath, content);

    printSuccess(chalk.green(`✅ Usage report exported to: ${filepath}`));

    return {
      path: filepath,
      format,
      size: Buffer.byteLength(content),
      records: stats.totals.calls,
    };
  }

  /**
   * Convert usage stats to CSV format
   */
  convertToCSV(stats) {
    const lines = ['Timestamp,Agent,Provider,Model,InputTokens,OutputTokens,Cost,Metadata'];

    for (const record of stats.records) {
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
   * Convert usage stats to text format
   */
  convertToText(stats) {
    let text = `Ultra-Dex Usage Report\n`;
    text += `Generated: ${new Date().toISOString()}\n`;
    text += `Period: ${stats.period.start} to ${stats.period.end}\n\n`;

    text += `Total Calls: ${stats.totals.calls}\n`;
    text += `Total Input Tokens: ${stats.totals.inputTokens}\n`;
    text += `Total Output Tokens: ${stats.totals.outputTokens}\n`;
    text += `Total Tokens: ${stats.totals.totalTokens}\n`;
    text += `Total Cost: $${stats.totals.cost.toFixed(6)}\n\n`;

    text += `Usage by Agent:\n`;
    text += `---------------\n`;
    for (const [agent, data] of Object.entries(stats.byAgent)) {
      text += `${agent}: ${data.calls} calls, ${data.inputTokens} input, ${data.outputTokens} output, $${data.cost.toFixed(6)}\n`;
    }

    text += `\nUsage by Provider:\n`;
    text += `------------------\n`;
    for (const [provider, data] of Object.entries(stats.byProvider)) {
      text += `${provider}: ${data.calls} calls, ${data.inputTokens} input, ${data.outputTokens} output, $${data.cost.toFixed(6)}\n`;
    }

    return text;
  }

  /**
   * Get token usage summary
   */
  getTokenUsageSummary() {
    if (!this.initialized) {
      throw new AppError('Usage tracker not initialized', {
        code: 'USAGE_TRACKER_NOT_INITIALIZED',
      });
    }

    return {
      total: {
        input: this.tokenUsage.totalInput,
        output: this.tokenUsage.totalOutput,
        combined: this.tokenUsage.totalInput + this.tokenUsage.totalOutput,
      },
      byProvider: this.tokenUsage.byProvider,
      byAgent: this.tokenUsage.byAgent,
      byDate: this.tokenUsage.byDate,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Reset usage tracking (for testing purposes)
   */
  async resetUsage() {
    if (!this.initialized) {
      await this.initialize();
    }

    this.usageLog = [];
    this.tokenUsage = {
      totalInput: 0,
      totalOutput: 0,
      byProvider: {},
      byAgent: {},
      byDate: {},
    };

    await this.saveUsageData();

    printSuccess(chalk.green('✅ Usage tracking reset'));
  }
}

/**
 * Create and initialize usage tracker
 */
export async function createUsageTracker(options = {}) {
  const usageTracker = new UsageTracker(options);
  await usageTracker.initialize();
  return usageTracker;
}

/**
 * Register usage tracking commands with Commander
 */
export function registerUsageCommands(program) {
  program
    .command('usage')
    .description('Track and analyze agent usage statistics')
    .option('--stats', 'Show usage statistics')
    .option('--export [format]', 'Export usage data (json, csv, txt)', 'json')
    .option('--agent <name>', 'Filter by specific agent')
    .option('--provider <name>', 'Filter by specific provider')
    .option('--start-date <date>', 'Start date for reports (YYYY-MM-DD)')
    .option('--end-date <date>', 'End date for reports (YYYY-MM-DD)')
    .option('--reset', 'Reset usage tracking (use with caution)')
    .option('--clean', 'Clean old usage data based on retention policy')
    .option('--output <path>', 'Output file path for export')
    .option('--detailed', 'Show detailed usage information')
    .action(async (options) => {
      try {
        printInfo(chalk.cyan('\n📊 Ultra-Dex Usage Tracking\n'));

        const usageTracker = await createUsageTracker();

        if (options.stats) {
          const filterOptions = {
            startDate: options.startDate,
            endDate: options.endDate,
            agent: options.agent,
            provider: options.provider,
          };

          const stats = usageTracker.getUsageStats(filterOptions);

          printInfo(chalk.bold('📈 Usage Statistics:\n'));
          printInfo(`Period: ${stats.period.start} to ${stats.period.end}`);
          printInfo(`Total Calls: ${stats.totals.calls}`);
          printInfo(`Input Tokens: ${stats.totals.inputTokens.toLocaleString()}`);
          printInfo(`Output Tokens: ${stats.totals.outputTokens.toLocaleString()}`);
          printInfo(`Combined Tokens: ${stats.totals.totalTokens.toLocaleString()}`);
          printInfo(`Total Cost: $${stats.totals.cost.toFixed(6)}\n`);

          printInfo(chalk.bold('By Agent:\n'));
          for (const [agent, data] of Object.entries(stats.byAgent)) {
            printInfo(`  ${agent}: ${data.calls} calls, $${data.cost.toFixed(6)}`);
          }

          printInfo(chalk.bold('\nBy Provider:\n'));
          for (const [provider, data] of Object.entries(stats.byProvider)) {
            printInfo(`  ${provider}: ${data.calls} calls, $${data.cost.toFixed(6)}`);
          }
        } else if (options.export) {
          const exportOptions = {
            format: options.export,
            filename: options.output,
            startDate: options.startDate,
            endDate: options.endDate,
            agent: options.agent,
            provider: options.provider,
          };

          const result = await usageTracker.exportUsageData(options.export, exportOptions);

          printSuccess(chalk.green(`✅ Exported to: ${result.path}`));
          printInfo(chalk.gray(`   Format: ${result.format}`));
          printInfo(chalk.gray(`   Size: ${result.size} bytes`));
          printInfo(chalk.gray(`   Records: ${result.records}`));
        } else if (options.reset) {
          await usageTracker.resetUsage();
        } else if (options.clean) {
          const result = await usageTracker.cleanOldData();
          printSuccess(
            chalk.green(`✅ Cleaned ${result.removed} old records, ${result.remaining} remaining`)
          );
        } else if (options.agent) {
          const agentStats = usageTracker.getAgentUsage(options.agent);

          printInfo(chalk.bold(`📈 Usage for agent: ${options.agent}\n`));
          printInfo(`Total Calls: ${agentStats.totals.calls}`);
          printInfo(`Input Tokens: ${agentStats.totals.inputTokens.toLocaleString()}`);
          printInfo(`Output Tokens: ${agentStats.totals.outputTokens.toLocaleString()}`);
          printInfo(`Total Cost: $${agentStats.totals.cost.toFixed(6)}\n`);

          if (options.detailed && agentStats.records.length > 0) {
            printInfo(chalk.bold('Recent Usage:\n'));
            const recentRecords = agentStats.records.slice(-5); // Last 5 records
            for (const record of recentRecords) {
              printInfo(
                `  ${record.timestamp}: ${record.provider}/${record.model} - $${record.cost.toFixed(6)}`
              );
            }
          }
        } else {
          // Default: show overall stats
          const stats = usageTracker.getUsageStats();

          printInfo(chalk.bold('📊 Current Usage Summary:\n'));
          printInfo(`Total Calls: ${stats.totals.calls}`);
          printInfo(`Total Tokens: ${stats.totals.totalTokens.toLocaleString()}`);
          printInfo(`Total Cost: $${stats.totals.cost.toFixed(6)}\n`);

          printInfo(chalk.gray('Use --stats, --export, --agent, or --help for more options'));
        }
      } catch (error) {
        printError(chalk.red(`\n❌ Usage command failed: ${error.message}`));
        process.exitCode = error.exitCode || 1;
        throw error;
      }
    });
}

export default {
  UsageTracker,
  createUsageTracker,
  registerUsageCommands,
};
