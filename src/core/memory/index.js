// Copyright (c) 2026 Ultra-Dex
// src/core/memory/index.js

/**
 * Memory System Index
 * Centralized export for all memory-related functionality
 */

// Core memory managers
export { MemoryManager, ppmManager } from './manager.js';
export { ContextManager } from './context-manager.js';
export { PersistentMemoryStore } from './persistent-store.js';

// Enhanced memory system
export { EnhancedMemorySystem, enhancedMemorySystem } from './enhanced-memory-system.js';

// Tier-specific managers
export { HotTierMemory } from './hot-tier.js';
export { WarmTierMemory } from './warm-tier.js';
export { ColdTierMemory } from './cold-tier.js';
export { HotWarmColdManager } from './hot-warm-cold.js';
export { MultiTierMemory } from './multi-tier.js';

// Vector and semantic search
export { VectorDB } from './vector-db.js';
export { VectorStore } from './vector-store.js';
export { EmbeddingsManager } from './embeddings.js';

// Advanced memory features
export { Memex } from './memex.js';
export { ProjectMind } from './project-mind.js';
export { TitansMemory } from './titans.js';
export { GraphEngine } from './graph-engine.js';

// Utilities
export { Serializer } from './serializer.js';
export { Compactor } from './compactor.js';
export { CompressionManager } from './compression.js';

// Schema and types
export { MemorySchema } from './schema.js';

// Export default for convenience
export { ppmManager as default } from './manager.js';