# Consolidation Summary for Milestone 2 Planning

## 1. Current State

- **Total Source Files:** 2,072 files scanned
- **Total Lines of Code:** ~23,050 LOC
- **Total NPM Packages:** Declared in package.json (26 dead, rest active)
- **Active Code:** ~8,000 lines (35% of total)
- **Dead Code:** ~15,050 lines (65% of total)

## 2. Dead Code Inventory

- **Dead Files:** 77 files (~15,050 lines) - completely unimported non-entry points
- **Dead NPM Packages:** 26 packages declared but never imported
- **Largest Dead Files:**
  - SecurityAuditor.js (806 lines)
  - enterprise-security.js (790 lines)
  - referral-system.js (754 lines)
  - agent-autopsy.js (739 lines)
  - ultra-dex-core.js (703 lines)
  - unified-api.js (663 lines)
  - mcp/client.js (640 lines in apps/)
  - coordination.js (588 lines)
  - resilience/self-healing.js (595 lines)
  - server-manager.js (567 lines)

## 3. Memory System Consolidation (31 → 5 files)

**Current:** 31 files (4,573 LOC) in src/core/memory/
**Target:** 5 files (~2,200 LOC)

- **File Reduction:** 31 → 5 files (84% fewer files)
- **LOC Reduction:** 4,573 → ~2,200 lines (52% reduction)

**Target Architecture:**

- `memory-manager.js` - Unified management (manager.js, context-meta-manager.js, etc.)
- `memory-store.js` - Unified persistence (sqlite.js, persistent-store.js, etc.)
- `memory-cache.js` - Tiered caching (multi-tier.js, hot-warm-cold.js, etc.)
- `memory-search.js` - Search & retrieval (vector-store.js, memex.js, etc.)
- `memory-schema.js` - Data structures (schema.js, schema.ts, etc.)

## 4. Agent System Consolidation (31 → 8 files)

**Current:** 31 files (6,472 LOC) in src/core/agents/
**Target:** 8 files (~3,400 LOC)

- **File Reduction:** 31 → 8 files (74% fewer files)
- **LOC Reduction:** 6,472 → ~3,400 lines (47% reduction)

**Target Architecture:**

- `agent-registry.js` - Registration & lifecycle (from registry-enhanced.js)
- `agent-executor.js` - Task execution (extracted from ralph-loop.js)
- `agent-loop.js` - Ralph Loop (Plan→Act→Verify→Commit) - renamed ralph-loop.js
- `agent-coordinator.js` - Multi-agent coordination (from agent-meta-orchestrator.js + coordinator.js)
- `agent-session.js` - Session management (from session-manager.js)
- `agent-swarm.js` - Swarm execution (from swarm.js)
- `agent-vision.js` - Vision/computer-use (from vision.js + selected features)
- `agent-queue.js` - Task queuing (from queue.js if needed)

## 5. Top Consolidation Actions by LOC Reduction

| Rank | Action                            | Files Impacted                             | LOC Reduced |
| ---- | --------------------------------- | ------------------------------------------ | ----------- |
| 1    | Remove Dead Security Services     | SecurityAuditor.js, enterprise-security.js | 1,596       |
| 2    | Merge Vision/Computer-Use Agents  | vision-agent.js, computer-use-agent.js     | 1,938       |
| 3    | Remove Dead Marketing Subsystem   | referral-system.js                         | 754         |
| 4    | Remove Dead Reliability Subsystem | agent-autopsy.js                           | 739         |
| 5    | Remove Dead Core Orchestrator     | ultra-dex-core.js                          | 703         |
| 6    | Remove Dead Unified Memory API    | unified-api.js                             | 663         |
| 7    | Remove Dead Resilience Logic      | resilience/self-healing.js (apps/cli)      | 595         |
| 8    | Remove Dead Coordination Protocol | coordination.js                            | 588         |
| 9    | Remove Dead MCP Server Manager    | server-manager.js                          | 567         |
| 10   | Remove Dead Session/Checkpoint    | session-manager.js, checkpoint.js          | 979         |

## Priority Recommendations for Milestone 2:

1. **Immediate:** Remove 26 dead npm dependencies (reduce security surface & bundle size)
2. **High Priority:** Execute memory system consolidation (31→5 files, 52% LOC reduction)
3. **High Priority:** Execute agent system consolidation (31→8 files, 47% LOC reduction)
4. **Medium:** Remove largest dead files (>500 lines each)
5. **Lower:** Cleanup remaining dead files and stubs

**Total Potential:** ~15,050 lines dead code removal → Target ~8,000 active lines (65% overall reduction)
