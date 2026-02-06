// Copyright (c) 2026 Ultra-Dex

import { loadTieredMemory, saveTieredMemory, promoteEntry, demoteEntry } from './hot-warm-cold.js';
import { summarizeMemory } from './compression.js';

export class TitansMemory {
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

    // Auto-prune if enabled (v4.0.1)
    if (tier === 'hot') {
      await this.checkAndPrune();
    }

    return entry;
  }

  // v4.0.1: Auto-Pruning Logic
  async checkAndPrune() {
    // Dynamic import to avoid circular dependency
    const { configManager } = await import('../utils/config-manager.js');
    try {
      await configManager.load();
    } catch {
      // ignore
    }

    let config = {};
    try {
      config = configManager.getConfig();
    } catch {
      config = {};
    }

    if (!config.memory?.autoPrune) return false;

    const state = await loadTieredMemory();
    const hotMem = state.hot || [];

    // Default limit: 20 items or configured token limit
    // Here we use a simple item count threshold for safety if tokens aren't tracked
    const maxItems = 20;

    if (hotMem.length > maxItems) {
      await this.consolidate();
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
