// Copyright (c) 2026 Ultra-Dex

import { loadTieredMemory, saveTieredMemory, promoteEntry, demoteEntry } from './hot-warm-cold.js';
import { summarizeMemory } from './compression.js';
import { configManager } from '../utils/config-manager.js';
import chalk from 'chalk';
import { printInfo, printSuccess } from '../utils/output.js';

export class TitansMemory {
  constructor() {
    this.tiers = {
      hot: [],
      warm: [],
      cold: []
    };
  }

  async add(content, tier = 'hot') {
    const state = await loadTieredMemory();
    const entry = {
      id: `mem-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      content,
      createdAt: new Date().toISOString(),
      tokens: Math.ceil(content.length / 4), // Simple estimate
    };
    state[tier] = state[tier] || [];
    state[tier].unshift(entry);
    await saveTieredMemory(state);

    // Auto-prune if enabled (v4.0.2)
    if (tier === 'hot') {
      await this.checkAndPrune();
    }

    return entry;
  }

  /**
   * Check if pruning is needed based on token threshold
   */
  async checkAndPrune() {
    // Load configuration
    if (!configManager.loaded) {
      await configManager.load();
    }

    const maxTokens = configManager.get('contextPruning.maxContextTokens') || configManager.get('memory.maxContextTokens') || 8192;
    const autoPrune = configManager.get('contextPruning.autoPrune') || configManager.get('memory.autoPrune') || true;
    const pruneThreshold = configManager.get('contextPruning.pruneThreshold') || configManager.get('memory.pruneThreshold') || 0.8;

    if (!autoPrune) {
      return false;
    }

    const state = await loadTieredMemory();
    const hotItems = state.hot || [];

    // Calculate current token usage
    let currentTokens = 0;
    for (const item of hotItems) {
      currentTokens += item.tokens || Math.ceil(item.content.length / 4);
    }

    const thresholdTokens = maxTokens * pruneThreshold;

    if (currentTokens > thresholdTokens) {
      printInfo(chalk.yellow(`⚠️  Context token usage (${currentTokens}/${maxTokens}) exceeds threshold. Initiating consolidation...`));
      await this.consolidate();
      printSuccess(chalk.green('✅ Context consolidated to reduce token usage'));
      return true;
    }

    return false;
  }

  async getTier(tier) {
    const state = await loadTieredMemory();
    return state[tier] || [];
  }

  async consolidate() {
    const state = await loadTieredMemory();
    const summary = summarizeMemory(state.warm || []);
    if (summary) {
      state.cold = state.cold || [];
      state.cold.unshift({
        id: `cold-${Date.now()}`,
        summary,
        createdAt: new Date().toISOString(),
      });
      state.warm = [];
    }
    await saveTieredMemory(state);
    return state;
  }

  async promote(entryId) {
    const state = await loadTieredMemory();
    promoteEntry(state, entryId);
    await saveTieredMemory(state);
    return state;
  }

  async demote(entryId) {
    const state = await loadTieredMemory();
    demoteEntry(state, entryId);
    await saveTieredMemory(state);
    return state;
  }

  async stats() {
    const state = await loadTieredMemory();
    return {
      hot: state.hot?.length || 0,
      warm: state.warm?.length || 0,
      cold: state.cold?.length || 0,
      updatedAt: state.updatedAt,
    };
  }
}

export const titansMemory = new TitansMemory();
export default titansMemory;

/**
 * Safe execution wrapper with error handling for titans
 * @param {Function} fn - Async function to execute
 * @param {string} [context='titans'] - Error context
 * @returns {Promise<*>} Result or null on error
 */
async function safeExecute(fn, context = 'titans') {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
    return null;
  }
}
