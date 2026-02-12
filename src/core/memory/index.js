// Copyright (c) 2026 Ultra-Dex
// src/core/memory/index.js

/**
 * Memory System Index
 * Centralized export for memory modules with backward-compatible aliases.
 */

import { promoteEntry, demoteEntry, tieredMemoryPath } from './hot-warm-cold.js';

// Core managers
export { MemoryManager, ppmManager } from './manager.js';
export { ContextManager } from './context-manager.js';
export { PersistentMemoryStore } from './persistent-store.js';

// Enhanced system (lazy to avoid hard dependency loading during basic memory usage/tests)
export async function loadEnhancedMemorySystemModule() {
  return import('./enhanced-memory-system.js');
}

export async function getEnhancedMemorySystem() {
  const mod = await loadEnhancedMemorySystemModule();
  return mod.enhancedMemorySystem;
}

// Tier managers
export { HotTier, hotTier, HotTier as HotTierMemory } from './hot-tier.js';
export { WarmTier, warmTier, WarmTier as WarmTierMemory } from './warm-tier.js';
export { ColdTier, coldTier, ColdTier as ColdTierMemory } from './cold-tier.js';

export { promoteEntry, demoteEntry, tieredMemoryPath } from './hot-warm-cold.js';
export const HotWarmColdManager = {
  promoteEntry,
  demoteEntry,
  tieredMemoryPath,
};

export { multiTierMemory, multiTierMemory as MultiTierMemory } from './multi-tier.js';

// Vector and semantic utilities
export { VectorStore } from './vector-store.js';
export { embedText } from './embeddings.js';
export * as VectorDB from './vector-db.js';

// Advanced memory modules
export { Memex, memex } from './memex.js';
export { default as ProjectMind } from './project-mind.js';
export { TitansMemory, titansMemory } from './titans.js';
export { GraphEngine, memoryGraph } from './graph-engine.js';

// Serialization / compaction utilities
export { serializeMemory, deserializeMemory } from './serializer.js';
export { compactHistory, summarizeOutput } from './compactor.js';
export { summarizeMemory, compressEntries } from './compression.js';

// Schema
export { default as MemorySchema } from './schema.js';

// Default export for convenience
export { ppmManager as default } from './manager.js';
