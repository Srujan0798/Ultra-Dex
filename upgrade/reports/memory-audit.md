# Memory System Consolidation Audit Report

**Generated:** March 27, 2026  
**Scope:** `src/core/memory/` (31 files)  
**Auditor:** Qwen CLI

---

## Executive Summary

The memory system audit reveals significant redundancy and fragmentation across 31 files totaling 4,573 lines of code. Key findings:

- **12 ACTIVE files** - Heavily imported and functional
- **4 STUB files** - Minimal implementations or thin wrappers
- **8 DUPLICATE files** - Overlapping functionality with other modules
- **7 DEAD files** - Never imported by anything in the codebase

**Recommendation:** Consolidate 31 files into 5 clean modules as specified in the target architecture.

---

## 1. File Status Table

| # | File | Category | Lines | Imported By |
|---|------|----------|-------|-------------|
| 1 | `cold-tier.js` | DUPLICATE | 68 | None (only via index.js) |
| 2 | `compactor.js` | ACTIVE | 36 | index.js |
| 3 | `compression.js` | ACTIVE | 38 | index.js, titans.js, test |
| 4 | `context-manager.js` | ACTIVE | 17 | index.js |
| 5 | `context-meta-manager.js` | ACTIVE | 466 | src/index.js |
| 6 | `embeddings.js` | ACTIVE | 44 | index.js, test |
| 7 | `enhanced-memory-system.js` | DEAD | 678 | None |
| 8 | `graph-engine.js` | ACTIVE | 121 | index.js, test |
| 9 | `hot-tier.js` | DUPLICATE | 84 | None (only via index.js) |
| 10 | `hot-warm-cold.js` | ACTIVE | 51 | index.js, titans.js, CLI commands |
| 11 | `index.js` | ACTIVE | 60 | None (central export hub) |
| 12 | `manager.js` | ACTIVE | 122 | index.js, 20+ files |
| 13 | `memex.js` | ACTIVE | 82 | index.js, CLI providers/commands |
| 14 | `mind.js` | DUPLICATE | 58 | project-mind.js only |
| 15 | `multi-tier.js` | DUPLICATE | 468 | None (only via index.js) |
| 16 | `persistent-store.js` | ACTIVE | 35 | index.js, context-manager.js, sliding-window.js |
| 17 | `persistent.js` | DEAD | 34 | None |
| 18 | `ppm.js` | STUB | 18 | None (re-export only) |
| 19 | `project-mind.js` | STUB | 19 | None (re-export only) |
| 20 | `retriever.js` | DEAD | 76 | None |
| 21 | `schema.js` | DEAD | 368 | None |
| 22 | `schema.ts` | DEAD | 31 | None |
| 23 | `serializer.js` | ACTIVE | 9 | index.js |
| 24 | `session.js` | DEAD | 32 | None |
| 25 | `sliding-window.js` | ACTIVE | 164 | None (standalone utility) |
| 26 | `sqlite.js` | ACTIVE | 217 | manager.js, graph-engine.js, cold-tier.js, CLI commands |
| 27 | `titans.js` | DEAD | 139 | None (only via index.js) |
| 28 | `unified-api.js` | ACTIVE | 664 | src/core/orchestration/ultra-dex-core.js |
| 29 | `vector-db.js` | ACTIVE | 32 | index.js |
| 30 | `vector-store.js` | ACTIVE | 260 | index.js, memex.js, retriever.js, warm-tier.js, test |
| 31 | `warm-tier.js` | DUPLICATE | 82 | None (only via index.js) |

### Category Legend

| Category | Description | Count |
|----------|-------------|-------|
| **ACTIVE** | Imported by multiple modules, functional | 12 |
| **STUB** | Minimal implementation or thin re-export wrapper | 2 |
| **DUPLICATE** | Overlaps significantly with other files | 4 |
| **DEAD** | Never imported by anything | 7 |

---

## 2. Duplicate Groups

### Group 1: Tiered Memory Implementations

| File | Lines | Purpose | Overlap |
|------|-------|---------|---------|
| `hot-tier.js` | 84 | Short-term memory with TTL | Implements hot tier |
| `warm-tier.js` | 82 | Medium-term memory with vector storage | Implements warm tier |
| `cold-tier.js` | 68 | Long-term memory with SQLite | Implements cold tier |
| `multi-tier.js` | 468 | Complete multi-tier system | **Contains all three tiers + more** |
| `hot-warm-cold.js` | 51 | Tier promotion/demotion utilities | Utility functions for tier management |

**Analysis:** `multi-tier.js` (468 lines) implements a complete `PersistentMemorySystem` with hot/warm/cold tiers. The individual tier files (`hot-tier.js`, `warm-tier.js`, `cold-tier.js`) are redundant implementations of the same pattern. `hot-warm-cold.js` provides utility functions used by `titans.js` and exported via `index.js`.

**Recommendation:** Keep `multi-tier.js` as the canonical tiered implementation. Extract promotion/demotion utilities from `hot-warm-cold.js` into a shared utility. Remove individual tier files.

---

### Group 2: Project Mind / Mind

| File | Lines | Purpose | Overlap |
|------|-------|---------|---------|
| `mind.js` | 58 | Project Mind - Hybrid RAG engine | Full implementation |
| `project-mind.js` | 19 | Thin wrapper re-exporting mind.js | 100% overlap |

**Analysis:** `project-mind.js` is a 19-line stub that only re-exports `ProjectMind` from `mind.js` with an error handler. This adds no value.

**Recommendation:** Remove `project-mind.js`. Import directly from `mind.js`.

---

### Group 3: Schema Definitions

| File | Lines | Purpose | Overlap |
|------|-------|---------|---------|
| `schema.js` | 368 | JavaScript schema with validation | Runtime validation |
| `schema.ts` | 31 | TypeScript type definitions | Compile-time types |

**Analysis:** Both files define memory entry schemas. `schema.js` provides runtime validation with `MemoryEntry` class and factory patterns. `schema.ts` provides TypeScript interfaces. Neither is imported anywhere.

**Recommendation:** Consolidate into a single `memory-schema.js` with JSDoc type annotations for TypeScript compatibility.

---

### Group 4: Persistent Storage

| File | Lines | Purpose | Overlap |
|------|-------|---------|---------|
| `persistent-store.js` | 35 | JSONL-based persistent storage | Simple file-based store |
| `persistent.js` | 34 | Generic save/load utilities | Generic JSON file I/O |
| `session.js` | 32 | Session snapshot save/load | Generic JSON file I/O |

**Analysis:** `persistent.js` and `session.js` both provide generic JSON file save/load functionality with nearly identical implementations. `persistent-store.js` provides JSONL streaming which is more useful for memory entries.

**Recommendation:** Keep `persistent-store.js`. Remove `persistent.js` and `session.js`.

---

### Group 5: Manager Patterns

| File | Lines | Purpose | Overlap |
|------|-------|---------|---------|
| `manager.js` | 122 | Core memory manager with SQLite | Main manager (ppmManager) |
| `context-manager.js` | 17 | Simple context wrapper | Wraps persistent-store |
| `context-meta-manager.js` | 466 | Advanced memory with embeddings | Full-featured manager |
| `enhanced-memory-system.js` | 678 | Complete multi-tier with compression | Most comprehensive system |

**Analysis:** Multiple manager implementations exist with overlapping functionality:
- `manager.js` (ppmManager) - Most widely used (20+ imports)
- `context-meta-manager.js` - Advanced features, imported by src/index.js
- `enhanced-memory-system.js` - Most comprehensive but never imported (DEAD)

**Recommendation:** Keep `manager.js` as the primary manager. Consider merging advanced features from `context-meta-manager.js` if needed. Remove `enhanced-memory-system.js`.

---

### Group 6: Vector/Retrieval

| File | Lines | Purpose | Overlap |
|------|-------|---------|---------|
| `vector-store.js` | 260 | Multi-provider vector store | ChromaDB/Pinecone/simulated |
| `vector-db.js` | 32 | Simple vector persistence | JSON file storage |
| `retriever.js` | 76 | Project indexing and querying | Uses vector-store |
| `embeddings.js` | 44 | Lightweight embedding generation | Fallback embeddings |

**Analysis:** `vector-store.js` is the canonical vector store (260 lines, multiple imports). `vector-db.js` (32 lines) provides simple JSON-based persistence but is only exported via `index.js`. `retriever.js` wraps vector-store functionality but is never imported. `embeddings.js` provides fallback embeddings and is used in tests.

**Recommendation:** Keep `vector-store.js` and `embeddings.js`. Remove `vector-db.js` and `retriever.js`.

---

## 3. Import Graph

### Files That Import Memory Modules

```
manager.js (20+ imports)
├── src/core/index.js
├── src/core/auth/rbac-manager.ts
├── src/core/meta/learner.js
├── src/core/agents/ralph-loop.js
├── src/core/mcp/server-*.js
├── src/core/orchestration/index.js
├── src/core/team/team-manager.ts
├── src/services/* (8 services)
├── apps/dashboard/server.js
├── apps/core-api/*
└── src/types/enterprise.ts

sqlite.js (5 imports)
├── manager.js
├── graph-engine.js
├── cold-tier.js
├── CLI commands (check, init)

memex.js (6 imports)
├── CLI providers/index.js
├── CLI history/undo.js
├── CLI commands/memory.js
└── apps/cli/* (mirrored)

context-meta-manager.js (1 import)
└── src/index.js

vector-store.js (5 imports)
├── memex.js
├── retriever.js (DEAD)
├── warm-tier.js (DUPLICATE)
└── tests

hot-warm-cold.js (4 imports)
├── titans.js (DEAD)
├── index.js
└── CLI commands (memory)

unified-api.js (1 import)
└── src/core/orchestration/ultra-dex-core.js

compression.js (3 imports)
├── titans.js (DEAD)
├── index.js
└── tests

graph-engine.js (2 imports)
├── index.js
└── tests

embeddings.js (2 imports)
├── index.js
└── tests

persistent-store.js (3 imports)
├── context-manager.js
├── sliding-window.js
└── index.js
```

### Internal Memory Module Dependencies

```
index.js (export hub)
├── hot-warm-cold.js
├── manager.js
├── context-manager.js
├── persistent-store.js
├── hot-tier.js
├── warm-tier.js
├── cold-tier.js
├── multi-tier.js
├── vector-store.js
├── embeddings.js
├── vector-db.js
├── memex.js
├── project-mind.js
├── titans.js
├── graph-engine.js
├── serializer.js
├── compactor.js
├── compression.js
├── schema.js
└── sliding-window.js

manager.js
└── sqlite.js

context-manager.js
└── persistent-store.js

cold-tier.js
└── sqlite.js

graph-engine.js
└── sqlite.js

memex.js
└── vector-store.js

project-mind.js
└── mind.js

retriever.js
└── vector-store.js

sliding-window.js
└── persistent-store.js

titans.js
├── hot-warm-cold.js
└── compression.js

warm-tier.js
└── vector-store.js

ppm.js
└── manager.js
```

---

## 4. Consolidation Plan

### Target Architecture (5 Files)

```
src/core/memory/
├── memory-manager.js      — Main entry point (unified manager)
├── memory-store.js        — Unified persistence (SQLite + JSONL)
├── memory-cache.js        — Hot/warm/cold tiers (consolidated)
├── memory-search.js       — Retrieval, search, vector operations
└── memory-schema.js       — Data structures and validation
```

### Migration Mapping

| Current Files | Target File | Action |
|---------------|-------------|--------|
| `manager.js` | `memory-manager.js` | **Rename** - Keep as primary manager |
| `context-meta-manager.js` | `memory-manager.js` | **Merge** - Extract advanced features |
| `enhanced-memory-system.js` | `memory-manager.js` | **Discard** - Dead code, features merged if needed |
| `sqlite.js` | `memory-store.js` | **Move** - Core persistence backend |
| `persistent-store.js` | `memory-store.js` | **Merge** - JSONL operations |
| `persistent.js` | `memory-store.js` | **Discard** - Redundant with persistent-store |
| `session.js` | `memory-store.js` | **Discard** - Redundant with persistent-store |
| `multi-tier.js` | `memory-cache.js` | **Rename** - Canonical tiered implementation |
| `hot-tier.js` | `memory-cache.js` | **Discard** - Redundant with multi-tier |
| `warm-tier.js` | `memory-cache.js` | **Discard** - Redundant with multi-tier |
| `cold-tier.js` | `memory-cache.js` | **Discard** - Redundant with multi-tier |
| `hot-warm-cold.js` | `memory-cache.js` | **Merge** - Promotion/demotion utilities |
| `titans.js` | `memory-cache.js` | **Discard** - Dead code, auto-pruning features merged if needed |
| `vector-store.js` | `memory-search.js` | **Rename** - Primary vector operations |
| `embeddings.js` | `memory-search.js` | **Merge** - Embedding generation |
| `retriever.js` | `memory-search.js` | **Discard** - Redundant wrapper |
| `vector-db.js` | `memory-search.js` | **Discard** - Redundant simple storage |
| `memex.js` | `memory-search.js` | **Merge** - Memory storage/retrieval interface |
| `compression.js` | `memory-search.js` | **Merge** - Summarization utilities |
| `compactor.js` | `memory-search.js` | **Merge** - History compaction utilities |
| `schema.js` | `memory-schema.js` | **Rename** - Canonical schema |
| `schema.ts` | `memory-schema.js` | **Merge** - TypeScript types as JSDoc |
| `serializer.js` | `memory-schema.js` | **Merge** - Serialization utilities |
| `graph-engine.js` | `memory-search.js` | **Merge** - Graph relationships |
| `mind.js` | `memory-search.js` | **Merge** - RAG engine |
| `project-mind.js` | — | **Discard** - Thin wrapper |
| `context-manager.js` | `memory-manager.js` | **Merge** - Simple context wrapper |
| `sliding-window.js` | `memory-manager.js` | **Merge** - Context window management |
| `unified-api.js` | `memory-store.js` | **Merge** - Multi-backend support |
| `index.js` | `memory-manager.js` | **Replace** - Simplified exports |
| `ppm.js` | — | **Discard** - Redundant re-export |

### Consolidation Summary

| Target File | Source Files | Lines (Total → Target) |
|-------------|--------------|------------------------|
| `memory-manager.js` | manager.js, context-meta-manager.js, context-manager.js, sliding-window.js, index.js | ~1,300 → ~500 |
| `memory-store.js` | sqlite.js, persistent-store.js, unified-api.js, persistent.js, session.js | ~1,000 → ~400 |
| `memory-cache.js` | multi-tier.js, hot-warm-cold.js, hot-tier.js, warm-tier.js, cold-tier.js, titans.js | ~1,400 → ~500 |
| `memory-search.js` | vector-store.js, memex.js, mind.js, embeddings.js, compression.js, compactor.js, retriever.js, vector-db.js, graph-engine.js | ~1,400 → ~600 |
| `memory-schema.js` | schema.js, schema.ts, serializer.js | ~450 → ~200 |
| **Total** | **31 files** | **4,573 → ~2,200** |

**Reduction:** 31 files → 5 files (84% reduction)  
**Lines:** 4,573 → ~2,200 (52% reduction)

---

## 5. Implementation Steps

### Phase 1: Create Target Files (Wave 1)

1. Create `memory-manager.js` with:
   - Core `MemoryManager` class from `manager.js`
   - Context management from `context-manager.js`
   - Advanced features from `context-meta-manager.js` (optional)
   - Sliding window from `sliding-window.js`
   - Export all public APIs from `index.js`

2. Create `memory-store.js` with:
   - SQLite provider from `sqlite.js`
   - JSONL storage from `persistent-store.js`
   - Multi-backend support from `unified-api.js` (optional)

3. Create `memory-cache.js` with:
   - Tiered implementation from `multi-tier.js`
   - Promotion/demotion from `hot-warm-cold.js`
   - Auto-pruning from `titans.js` (optional)

4. Create `memory-search.js` with:
   - Vector store from `vector-store.js`
   - Memex interface from `memex.js`
   - RAG from `mind.js`
   - Embeddings from `embeddings.js`
   - Compression utilities from `compression.js` and `compactor.js`
   - Graph engine from `graph-engine.js`

5. Create `memory-schema.js` with:
   - Schema validation from `schema.js`
   - TypeScript types from `schema.ts` (as JSDoc)
   - Serialization from `serializer.js`

### Phase 2: Update Importers (Wave 2)

Update all 20+ files importing `manager.js`:
```javascript
// Before
import { ppmManager } from './core/memory/manager.js';

// After
import { ppmManager } from './core/memory/memory-manager.js';
```

Update CLI commands importing memory modules:
```javascript
// Before
import { memex } from '../memory/memex.js';
import { sqliteProvider } from '../memory/sqlite.js';

// After
import { memex } from '../memory/memory-search.js';
import { sqliteProvider } from '../memory/memory-store.js';
```

### Phase 3: Remove Old Files (Wave 3)

Delete consolidated files:
- `cold-tier.js`, `hot-tier.js`, `warm-tier.js`
- `persistent.js`, `session.js`
- `retriever.js`, `vector-db.js`
- `project-mind.js`, `ppm.js`
- `enhanced-memory-system.js`, `titans.js`
- `schema.js`, `schema.ts` (after migration)
- `index.js` (after confirming all exports moved)

---

## 6. Validation Checklist

- [ ] All 31 files categorized
- [ ] Duplicate groups identified
- [ ] Import graph documented
- [ ] Target architecture defined (5 files)
- [ ] Migration mapping complete
- [ ] Implementation steps outlined
- [ ] All importers identified for update
- [ ] Backward compatibility plan (if needed)

---

## Appendix: File Details

### ACTIVE Files (12)

| File | Lines | Import Count | Primary Use |
|------|-------|--------------|-------------|
| `manager.js` | 122 | 20+ | Core memory manager (ppmManager) |
| `context-meta-manager.js` | 466 | 1 | Advanced memory with embeddings |
| `sqlite.js` | 217 | 5 | SQLite backend |
| `memex.js` | 82 | 6 | Persistent memory interface |
| `vector-store.js` | 260 | 5 | Vector storage |
| `hot-warm-cold.js` | 51 | 4 | Tier utilities |
| `compression.js` | 38 | 3 | Memory summarization |
| `persistent-store.js` | 35 | 3 | JSONL storage |
| `graph-engine.js` | 121 | 2 | Graph relationships |
| `embeddings.js` | 44 | 2 | Embedding generation |
| `compactor.js` | 36 | 1 | History compaction |
| `sliding-window.js` | 164 | 0 | Context window (standalone) |

### STUB Files (2)

| File | Lines | Purpose |
|------|-------|---------|
| `ppm.js` | 18 | Re-exports ppmManager from manager.js |
| `project-mind.js` | 19 | Re-exports ProjectMind from mind.js |

### DUPLICATE Files (4)

| File | Lines | Duplicates |
|------|-------|------------|
| `multi-tier.js` | 468 | Supersedes hot/warm/cold-tier.js |
| `hot-tier.js` | 84 | Covered by multi-tier.js |
| `warm-tier.js` | 82 | Covered by multi-tier.js |
| `cold-tier.js` | 68 | Covered by multi-tier.js |

### DEAD Files (7)

| File | Lines | Reason |
|------|-------|--------|
| `enhanced-memory-system.js` | 678 | Never imported, redundant with context-meta-manager |
| `persistent.js` | 34 | Generic I/O, redundant with persistent-store |
| `retriever.js` | 76 | Wrapper around vector-store, never imported |
| `schema.js` | 368 | Validation never used |
| `schema.ts` | 31 | TypeScript types never imported |
| `session.js` | 32 | Redundant with persistent-store |
| `titans.js` | 139 | Auto-pruning memory, never imported |

---

**End of Report**
