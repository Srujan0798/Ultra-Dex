// Copyright (c) 2026 Ultra-Dex
/**
 * Ultra-Dex Meta-Layer (v6.0.0)
 * The unified entry point for autonomous AI orchestration.
 */

import { aiMetaLayer } from './ai/ai-meta-layer.js';
import { agentOrchestrator } from './orchestration/index.js';
import { ppmManager } from './memory/manager.js';
import { configManager } from '../../apps/cli/lib/utils/config-manager.js';

class UltraDexMetaLayer {
  constructor() {
    this.brain = agentOrchestrator;
    this.memory = ppmManager;
    this.ai = aiMetaLayer;
    this.version = '6.0.0';
  }

  async initialize() {
    console.log('🌌 Initializing Ultra-Dex Meta-Layer v6.0.0...');
    await this.memory.init();
    await this.brain.initialize();
    return this;
  }

  async process(objective, options = {}) {
    return await this.brain.executeNexus(objective, options);
  }

  getStatus() {
    return {
      version: this.version,
      memory: this.memory.stats(),
      orchestrator: this.brain.getMetrics(),
      timestamp: new Date().toISOString()
    };
  }
}

export const ultraDex = new UltraDexMetaLayer();
export default ultraDex;

export { aiMetaLayer, agentOrchestrator, ppmManager };
