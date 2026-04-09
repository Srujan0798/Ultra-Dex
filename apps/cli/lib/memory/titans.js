// Copyright (c) 2026 Ultra-Dex

import { memoryManager } from '../../../../src/core/agents/memory-manager.js';
import { summarizeMemory } from './compression.js';

export class TitansMemory {
  async initialize() {
    await memoryManager.initialize();
  }

  async add(content, tier = 'hot') {
    return await memoryManager.store(tier, `mem-${Date.now()}`, content);
  }

  /**
   * Check if pruning is needed based on token threshold
   */
  async checkAndPrune() {
    return await memoryManager.checkAndPrune();
  }

  async getTier(tier) {
    const results = await memoryManager.retrieve('', { tags: [tier], limit: 1000 });
    return results.items.map((item) => ({
      id: item.id,
      content: item.content.text,
      tokens: item.content.tokens,
      createdAt: item.createdAt,
      ...item.content.metadata,
    }));
  }

  async consolidate() {
    const warmItems = await this.getTier('warm');
    const summary = summarizeMemory(warmItems);
    if (summary) {
      await memoryManager.store('cold', `cold-${Date.now()}`, summary);
    }
  }

  async promote(entryId) {
    return await memoryManager.promote(entryId, 'hot');
  }

  async demote(entryId) {
    return await memoryManager.demote(entryId, 'warm');
  }

  async stats() {
    const stats = await memoryManager.getTierStats();
    return {
      hot: stats.hot.count,
      warm: stats.warm.count,
      cold: stats.cold.count,
      updatedAt: new Date().toISOString(),
    };
  }
}

export const titansMemory = new TitansMemory();
titansMemory.initialize().catch(console.error);

export default titansMemory;
