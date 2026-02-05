import HotTier from './hot-tier.js';
import WarmTier from './warm-tier.js';
import ColdTier from './cold-tier.js';

export class MemoryManager {
  constructor(options = {}) {
    this.hot = new HotTier(options.hot || {});
    this.warm = new WarmTier(options.warm || {});
    this.cold = new ColdTier(options.cold || {});
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;
    await this.hot.init();
    await this.warm.init();
    await this.cold.init();
    await this.warm.indexProjectDocs();
    this.initialized = true;
  }

  async add(entry) {
    await this.init();
    const record = {
      id: entry.id,
      content: entry.content,
      type: entry.type,
      timestamp: entry.timestamp,
      source: entry.source,
      relations: entry.relations || []
    };

    const hotRecord = await this.hot.add(record);
    const warmRecord = await this.warm.add(record);

    if (record.type === 'decision' || record.type === 'constraint' || record.type === 'error') {
      await this.cold.add(record);
    }

    return { hot: hotRecord, warm: warmRecord };
  }

  async search(query, limit = 5) {
    await this.init();
    const warmHits = await this.warm.search(query, limit);
    if (warmHits.length) return warmHits;
    const hotHits = await this.hot.search(query);
    if (hotHits.length) return hotHits;
    return await this.cold.search(query);
  }

  async why(query) {
    await this.init();
    return await this.cold.why(query);
  }

  async getTier(tier) {
    await this.init();
    if (tier === 'hot') return await this.hot.list();
    if (tier === 'warm') return await this.warm.list();
    if (tier === 'cold') return await this.cold.list();
    return [];
  }

  async stats() {
    await this.init();
    const hot = await this.hot.list();
    const warm = await this.warm.list();
    const cold = await this.cold.list();
    return { hot: hot.length, warm: warm.length, cold: cold.length };
  }
}

export const ppmManager = new MemoryManager();
