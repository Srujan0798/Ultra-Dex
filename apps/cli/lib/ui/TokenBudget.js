// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview TokenBudget module
 * @module ui/TokenBudget
 */

import fs from 'fs/promises';
import path from 'path';
import os from 'os';

import boxen from '../utils/boxen.js';
import { theme } from './theme.js';

const CONFIG_DIR = path.join(os.homedir(), '.ultra-dex');
const BUDGET_FILE = path.join(CONFIG_DIR, 'token_budget.json');

const PRICING = {
  claude: { input: 3.0, output: 15.0 }, // Per 1M tokens
  openai: { input: 5.0, output: 15.0 },
  gemini: { input: 3.5, output: 10.5 },
  ollama: { input: 0, output: 0 },
};

export class TokenBudget {
  constructor() {
    this.usage = {
      totalCost: 0,
      monthlyCost: 0,
      lastReset: new Date().toISOString(),
      history: [],
      triggeredAlerts: [], // Track which alerts have been shown this month
    };
    this.budget = 50.0; // Monthly budget in USD
    this.alertThresholds = [50.0, 100.0, 200.0];
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;

    try {
      await fs.mkdir(CONFIG_DIR, { recursive: true });
      try {
        const data = await fs.readFile(BUDGET_FILE, 'utf8');
        this.usage = JSON.parse(data);

        // Check for monthly reset
        const lastReset = new Date(this.usage.lastReset);
        const now = new Date();
        if (
          lastReset.getMonth() !== now.getMonth() ||
          lastReset.getFullYear() !== now.getFullYear()
        ) {
          this.usage.monthlyCost = 0;
          this.usage.triggeredAlerts = [];
          this.usage.lastReset = now.toISOString();
          await this.save();
        }
      } catch (_e) {
        // No file, start fresh
        await this.save();
      }
      this.initialized = true;
    } catch (e) {
      console.error('Failed to init TokenBudget:', e);
    }
  }

  async save() {
    try {
      await fs.writeFile(BUDGET_FILE, JSON.stringify(this.usage, null, 2));
    } catch (e) {
      console.error('Failed to save TokenBudget:', e);
    }
  }

  calculateCost(provider, inputTokens, outputTokens) {
    // Normalize provider name
    let p = 'claude';
    if (provider) {
      const lower = provider.toLowerCase();
      if (lower.includes('openai') || lower.includes('gpt')) p = 'openai';
      else if (lower.includes('gemini') || lower.includes('google')) p = 'gemini';
      else if (lower.includes('ollama') || lower.includes('llama')) p = 'ollama';
    }

    const rates = PRICING[p] || PRICING.claude;
    const inputCost = (inputTokens / 1_000_000) * rates.input;
    const outputCost = (outputTokens / 1_000_000) * rates.output;
    return inputCost + outputCost;
  }

  async track(provider, inputTokens, outputTokens) {
    if (!this.initialized) await this.init();

    const cost = this.calculateCost(provider, inputTokens, outputTokens);

    this.usage.totalCost = (this.usage.totalCost || 0) + cost;
    this.usage.monthlyCost = (this.usage.monthlyCost || 0) + cost;

    // Add to history
    if (!this.usage.history) this.usage.history = [];
    this.usage.history.push({
      date: new Date().toISOString(),
      provider,
      inputTokens,
      outputTokens,
      cost,
    });

    // Trim history if too long (keep last 500)
    if (this.usage.history.length > 500) {
      this.usage.history = this.usage.history.slice(-500);
    }

    await this.checkAlerts();
    await this.save();
    return cost;
  }

  async checkAlerts() {
    const monthly = this.usage.monthlyCost || 0;
    if (!this.usage.triggeredAlerts) this.usage.triggeredAlerts = [];

    for (const threshold of this.alertThresholds) {
      if (monthly >= threshold && !this.usage.triggeredAlerts.includes(threshold)) {
        this.usage.triggeredAlerts.push(threshold);
        this.showAlert(threshold);
      }
    }
  }

  showAlert(threshold) {
    const content = [
      `${theme.error.bold('⚠️  BUDGET ALERT')}`,
      `${theme.dim('────────────────────────────────')}`,
      `Monthly cost has exceeded ${theme.title('$' + threshold.toFixed(2))}`,
      `${theme.dim('Current Usage:')}  $${this.usage.monthlyCost.toFixed(4)}`,
      `${theme.dim('Time:')}           ${new Date().toLocaleString()}`,
    ].join('\n');

    console.log(
      '\n' +
        boxen(content, {
          padding: 1,
          margin: 1,
          borderStyle: 'double',
          borderColor: 'red',
          title: 'WARNING',
          titleAlignment: 'center',
        }) +
        '\n'
    );
  }

  forecast(provider, estimatedInputTokens, estimatedOutputTokens = 1000) {
    const cost = this.calculateCost(provider, estimatedInputTokens, estimatedOutputTokens);
    return {
      cost,
      inputTokens: estimatedInputTokens,
      outputTokens: estimatedOutputTokens,
    };
  }

  renderWidget() {
    if (!this.initialized) return '';

    const percent = Math.min(100, (this.usage.monthlyCost / this.budget) * 100);
    const color = percent > 90 ? theme.error : percent > 75 ? theme.warning : theme.success;

    // Create a simple progress bar
    const barWidth = 20;
    const filled = Math.round((percent / 100) * barWidth);
    const bar = '█'.repeat(filled) + theme.dim('░'.repeat(barWidth - filled));

    const content = [
      `${theme.title('TOKEN BUDGET')}  ${theme.dim('Month: ' + new Date().toLocaleString('default', { month: 'long' }))}`,
      `${theme.dim('────────────────────────────────')}`,
      `${theme.dim('Usage:')}   $${this.usage.monthlyCost.toFixed(4)} / $${this.budget.toFixed(2)}`,
      `${theme.dim('Status:')}  ${color(bar)} ${Math.round(percent)}%`,
    ].join('\n');

    return boxen(content, {
      padding: 0,
      margin: 0,
      borderStyle: 'round',
      borderColor: percent > 90 ? 'red' : 'green',
      dimBorder: true,
    });
  }

  getStatusBarData() {
    // Sync API for status bar integration, returns default if not init
    const cost = this.usage.monthlyCost || 0;
    return {
      label: 'COST (MO)',
      value: `$${cost.toFixed(2)}`,
    };
  }
}

export const tokenBudget = new TokenBudget();
