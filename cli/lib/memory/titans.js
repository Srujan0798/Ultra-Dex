import { loadTieredMemory, saveTieredMemory, promoteEntry, demoteEntry } from './hot-warm-cold.js';
import { summarizeMemory } from './compression.js';

export class TitansMemory {
  async add(content, tier = 'hot') {
    const state = await loadTieredMemory();
    const entry = {
      id: `mem-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      content,
      createdAt: new Date().toISOString()
    };
    state[tier] = state[tier] || [];
    state[tier].unshift(entry);
    await saveTieredMemory(state);
    return entry;
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
      state.cold.unshift({ id: `cold-${Date.now()}`, summary, createdAt: new Date().toISOString() });
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
      updatedAt: state.updatedAt
    };
  }
}

export const titansMemory = new TitansMemory();
export default titansMemory;
