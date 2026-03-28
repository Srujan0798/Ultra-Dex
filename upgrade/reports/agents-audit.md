# Agent System Consolidation Audit Report

**Generated:** March 27, 2026  
**Scope:** `src/core/agents/` (31 files)  
**Auditor:** Qwen CLI

---

## Executive Summary

The agent system audit reveals significant fragmentation and dead code across 31 files totaling 6,472 lines. Key findings:

- **7 ACTIVE files** — Imported by other modules, functional
- **2 STUB files** — Minimal implementations or re-export hubs
- **2 DUPLICATE files** — Overlapping functionality (registry vs registry-enhanced)
- **20 DEAD files** — Never imported by anything in the codebase

**Recommendation:** Consolidate 31 files into 8 clean modules as specified in the target architecture.

---

## 1. File Status Table

| # | File | Category | Lines | Imported By |
|---|------|----------|-------|-------------|
| 1 | `agent-meta-orchestrator.js` | ACTIVE | 416 | `src/index.js` |
| 2 | `AGENT-PROTOCOL.md` | N/A | — | Documentation |
| 3 | `architect-graph.js` | DEAD | 41 | None |
| 4 | `base-agent.js` | DEAD | 67 | None |
| 5 | `checkpoint.js` | DEAD | 395 | None |
| 6 | `computer-use-agent.js` | DEAD | 1000 | None |
| 7 | `coordinator.js` | DEAD | 24 | None |
| 8 | `daemon.js` | DEAD | 405 | None |
| 9 | `debugger-graph.js` | DEAD | 41 | None |
| 10 | `executor-graph.js` | DEAD | 41 | None |
| 11 | `executor.js` | DEAD | 14 | None |
| 12 | `graph-utils.js` | DEAD | 70 | None |
| 13 | `handshake.js` | DEAD | 50 | None |
| 14 | `index.js` | STUB | 44 | None (central export hub) |
| 15 | `meta-orchestrator.js` | DEAD | 98 | None |
| 16 | `negotiation.js` | DEAD | 58 | None |
| 17 | `persona.js` | DEAD | 60 | None |
| 18 | `planner-graph.js` | DEAD | 41 | None |
| 19 | `planner.js` | DEAD | 43 | None |
| 20 | `protocol.js` | DEAD | 82 | None |
| 21 | `queue.js` | DEAD | 559 | None |
| 22 | `ralph-loop.js` | ACTIVE | 307 | `src/core/cicd/self-healing.js` |
| 23 | `registry-enhanced.js` | ACTIVE | 543 | `src/core/orchestration/ultra-dex-core.js` |
| 24 | `registry.js` | DUPLICATE | 50 | `registry-enhanced.js` only |
| 25 | `reviewer-graph.js` | DEAD | 41 | None |
| 26 | `session-manager.js` | ACTIVE | 544 | CLI commands (session.js) |
| 27 | `swarm-engine.js` | DEAD | 20 | None |
| 28 | `swarm.js` | ACTIVE | 124 | CLI daemon (autonomous-daemon.js) |
| 29 | `vision-agent.js` | DEAD | 938 | None |
| 30 | `vision.js` | ACTIVE | 297 | CLI multimodal (agent.js) |
| 31 | `workflow-rules.js` | DEAD | 59 | None |

### Category Legend

| Category | Description | Count |
|----------|-------------|-------|
| **ACTIVE** | Imported by multiple modules, functional | 7 |
| **STUB** | Minimal implementation or re-export hub | 2 |
| **DUPLICATE** | Overlaps significantly with another file | 1 |
| **DEAD** | Never imported by anything | 20 |
| **N/A** | Documentation file | 1 |

---

## 2. Duplicate Groups

### Group 1: Agent Registry

| File | Lines | Purpose | Overlap |
|------|-------|---------|---------|
| `registry.js` | 50 | Basic agent registry with list/get functions | Imports from `../commands/agents.js` |
| `registry-enhanced.js` | 543 | Full-featured registry with lifecycle management | **Supersedes registry.js** |

**Analysis:** `registry.js` is a thin 50-line wrapper that imports `AGENTS` from `../commands/agents.js` and provides basic lookup functions. `registry-enhanced.js` is a comprehensive 543-line implementation with full agent lifecycle management, registration, discovery, and coordination features.

**Recommendation:** Remove `registry.js`. Keep `registry-enhanced.js` as the canonical registry implementation.

---

### Group 2: Graph-Based Agents (*-graph.js pattern)

| File | Lines | Purpose | Status |
|------|-------|---------|--------|
| `architect-graph.js` | 41 | Architect agent graph | DEAD |
| `debugger-graph.js` | 41 | Debugger agent graph | DEAD |
| `executor-graph.js` | 41 | Executor agent graph | DEAD |
| `planner-graph.js` | 41 | Planner agent graph | DEAD |
| `reviewer-graph.js` | 41 | Reviewer agent graph | DEAD |

**Analysis:** All five `*-graph.js` files are exactly 41 lines each and follow an identical pattern. They appear to be template-generated graph definitions that are never imported or used.

**Recommendation:** Remove all five `*-graph.js` files. If graph-based agents are needed in the future, implement a single reusable graph agent factory.

---

### Group 3: Vision/Computer Use

| File | Lines | Purpose | Overlap |
|------|-------|---------|---------|
| `vision.js` | 297 | Vision agent for image analysis | ACTIVE (imported by CLI) |
| `vision-agent.js` | 938 | Extended vision agent with more features | DEAD |
| `computer-use-agent.js` | 1000 | Computer use agent (Anthropic-style) | DEAD |

**Analysis:** Three files implement vision/computer use capabilities. `vision.js` (297 lines) is actively used by the CLI multimodal agent. `vision-agent.js` (938 lines) and `computer-use-agent.js` (1000 lines) are never imported despite being larger and more feature-rich.

**Recommendation:** Keep `vision.js` as the active vision module. Review `vision-agent.js` and `computer-use-agent.js` for features that should be merged into `vision.js`, then remove them.

---

### Group 4: Orchestration

| File | Lines | Purpose | Overlap |
|------|-------|---------|---------|
| `agent-meta-orchestrator.js` | 416 | Meta-orchestration for agents | ACTIVE (imported by src/index.js) |
| `meta-orchestrator.js` | 98 | Simpler meta-orchestrator | DEAD |

**Analysis:** Two files implement meta-orchestration. `agent-meta-orchestrator.js` (416 lines) is imported by `src/index.js`. `meta-orchestrator.js` (98 lines) is never imported.

**Recommendation:** Remove `meta-orchestrator.js`. Keep `agent-meta-orchestrator.js`.

---

### Group 5: Planning & Execution

| File | Lines | Purpose | Status |
|------|-------|---------|--------|
| `planner.js` | 43 | Basic planning logic | DEAD |
| `executor.js` | 14 | Simple executor wrapper | DEAD |
| `coordinator.js` | 24 | Coordination logic | DEAD |
| `ralph-loop.js` | 307 | Full Plan→Act→Verify→Commit loop | ACTIVE |

**Analysis:** `ralph-loop.js` (307 lines) implements a complete agent loop with planning, execution, verification, and commit phases. The smaller `planner.js`, `executor.js`, and `coordinator.js` files are redundant.

**Recommendation:** Keep `ralph-loop.js`. Remove `planner.js`, `executor.js`, and `coordinator.js`.

---

## 3. Import Graph

### External Imports (from outside src/core/agents/)

```
src/index.js
└── agent-meta-orchestrator.js

src/core/orchestration/ultra-dex-core.js
└── registry-enhanced.js

src/core/cicd/self-healing.js
└── ralph-loop.js

src/platform/cli/commands/session.js
apps/cli/lib/commands/session.js
└── session-manager.js

src/platform/cli/daemon/autonomous-daemon.js
apps/cli/lib/daemon/autonomous-daemon.js
└── swarm.js

src/platform/cli/multimodal/agent.js
apps/cli/lib/multimodal/agent.js
└── vision.js
```

### Internal Dependencies (within src/core/agents/)

```
registry.js
└── ../commands/agents.js (external)

index.js (export hub)
└── exports all other agent modules
```

**Note:** Most agent files have no internal dependencies on each other. They are standalone modules.

---

## 4. Consolidation Plan

### Target Architecture (8 Files)

```
src/core/agents/
├── agent-registry.js      — Registration, discovery, lifecycle (from registry-enhanced.js)
├── agent-executor.js      — Task execution engine (from ralph-loop.js)
├── agent-loop.js          — Ralph Loop (Plan→Act→Verify→Commit) — keep ralph-loop.js
├── agent-coordinator.js   — Multi-agent coordination (merge coordinator.js + swarm.js)
├── agent-session.js       — Session management (from session-manager.js)
├── agent-swarm.js         — Swarm execution (from swarm.js)
├── agent-vision.js        — Computer-use / vision capabilities (merge vision.js + features from vision-agent.js)
└── agent-queue.js         — Task queuing and priority (from queue.js if revived)
```

### Migration Mapping

| Current Files | Target File | Action |
|---------------|-------------|--------|
| `registry-enhanced.js` | `agent-registry.js` | **Rename** - Primary registry |
| `registry.js` | — | **Remove** - Redundant |
| `ralph-loop.js` | `agent-loop.js` | **Rename** - Keep as-is |
| `planner.js` | — | **Remove** - Covered by ralph-loop |
| `executor.js` | — | **Remove** - Covered by ralph-loop |
| `coordinator.js` | `agent-coordinator.js` | **Merge** - Add swarm coordination |
| `swarm.js` | `agent-swarm.js` | **Rename** - Keep swarm logic |
| `session-manager.js` | `agent-session.js` | **Rename** - Keep as-is |
| `vision.js` | `agent-vision.js` | **Rename** - Primary vision |
| `vision-agent.js` | — | **Merge/Discard** - Extract features if needed |
| `computer-use-agent.js` | — | **Merge/Discard** - Extract features if needed |
| `queue.js` | `agent-queue.js` | **Rename** - Revive if needed |
| `agent-meta-orchestrator.js` | `agent-coordinator.js` | **Merge** - Meta-orchestration features |
| `meta-orchestrator.js` | — | **Remove** - Redundant |
| `architect-graph.js` | — | **Remove** - Dead |
| `debugger-graph.js` | — | **Remove** - Dead |
| `executor-graph.js` | — | **Remove** - Dead |
| `planner-graph.js` | — | **Remove** - Dead |
| `reviewer-graph.js` | — | **Remove** - Dead |
| `base-agent.js` | — | **Remove** - Never used |
| `checkpoint.js` | — | **Remove** - Never used |
| `daemon.js` | — | **Remove** - Never used |
| `graph-utils.js` | — | **Remove** - Never used |
| `handshake.js` | — | **Remove** - Never used |
| `negotiation.js` | — | **Remove** - Never used |
| `persona.js` | — | **Remove** - Never used |
| `protocol.js` | — | **Remove** - Never used |
| `swarm-engine.js` | — | **Remove** - Dead |
| `workflow-rules.js` | — | **Remove** - Never used |
| `index.js` | `index.js` | **Replace** - Simplified exports |

---

### Consolidation Summary

| Target File | Source Files | Lines (Total → Target) |
|-------------|--------------|------------------------|
| `agent-registry.js` | registry-enhanced.js | 543 → ~550 |
| `agent-loop.js` | ralph-loop.js | 307 → ~300 |
| `agent-executor.js` | (extracted from ralph-loop.js) | — → ~150 |
| `agent-coordinator.js` | agent-meta-orchestrator.js, coordinator.js, meta-orchestrator.js | 538 → ~400 |
| `agent-session.js` | session-manager.js | 544 → ~550 |
| `agent-swarm.js` | swarm.js, swarm-engine.js | 144 → ~150 |
| `agent-vision.js` | vision.js, (features from vision-agent.js, computer-use-agent.js) | 1235 → ~800 |
| `agent-queue.js` | queue.js | 559 → ~500 |
| **Total** | **31 files** | **6,472 → ~3,400** |

**Reduction:** 31 files → 8 files (74% reduction)  
**Lines:** 6,472 → ~3,400 (47% reduction)

---

## 5. Implementation Steps

### Phase 1: Create Target Files (Wave 1)

1. **Create `agent-registry.js`** with:
   - Full `AgentRegistry` class from `registry-enhanced.js`
   - Export all public APIs

2. **Create `agent-loop.js`** with:
   - `runRalphLoop` function from `ralph-loop.js`
   - Plan→Act→Verify→Commit cycle

3. **Create `agent-executor.js`** with:
   - Extract execution logic from `ralph-loop.js`
   - Task execution primitives

4. **Create `agent-coordinator.js`** with:
   - Meta-orchestration from `agent-meta-orchestrator.js`
   - Multi-agent coordination from `coordinator.js`

5. **Create `agent-session.js`** with:
   - `sessionManager` from `session-manager.js`

6. **Create `agent-swarm.js`** with:
   - `AgentSwarm` class from `swarm.js`

7. **Create `agent-vision.js`** with:
   - `VisionAgent` from `vision.js`
   - Review `vision-agent.js` for additional features

8. **Create `agent-queue.js`** with:
   - Task queue from `queue.js` (if needed)

### Phase 2: Update Importers (Wave 2)

Update all files importing old modules:

```javascript
// Before
import { AgentRegistry } from '../agents/registry-enhanced.js';
import { runRalphLoop } from '../agents/ralph-loop.js';
import { sessionManager } from '../agents/session-manager.js';
import { AgentSwarm } from '../agents/swarm.js';
import { VisionAgent } from '../agents/vision.js';
import { agentMetaOrchestrator } from '../agents/agent-meta-orchestrator.js';

// After
import { AgentRegistry } from '../agents/agent-registry.js';
import { runRalphLoop } from '../agents/agent-loop.js';
import { sessionManager } from '../agents/agent-session.js';
import { AgentSwarm } from '../agents/agent-swarm.js';
import { VisionAgent } from '../agents/agent-vision.js';
import { agentMetaOrchestrator } from '../agents/agent-coordinator.js';
```

### Phase 3: Remove Old Files (Wave 3)

Delete all consolidated files:
- `registry.js`, `registry-enhanced.js`
- `ralph-loop.js`
- `planner.js`, `executor.js`, `coordinator.js`
- `session-manager.js`
- `swarm.js`, `swarm-engine.js`
- `vision.js`, `vision-agent.js`, `computer-use-agent.js`
- `agent-meta-orchestrator.js`, `meta-orchestrator.js`
- `queue.js`
- All `*-graph.js` files
- All other DEAD files

---

## 6. Validation Checklist

- [ ] All 31 files categorized
- [ ] Duplicate groups identified
- [ ] Import graph documented
- [ ] Target architecture defined (8 files)
- [ ] Migration mapping complete
- [ ] Implementation steps outlined
- [ ] All importers identified for update
- [ ] Backward compatibility plan (if needed)

---

## Appendix: File Details

### ACTIVE Files (7)

| File | Lines | Import Count | Primary Use |
|------|-------|--------------|-------------|
| `agent-meta-orchestrator.js` | 416 | 1 | Meta-orchestration (src/index.js) |
| `ralph-loop.js` | 307 | 1 | Agent loop (self-healing) |
| `registry-enhanced.js` | 543 | 1 | Agent registry (ultra-dex-core.js) |
| `session-manager.js` | 544 | 2 | Session management (CLI) |
| `swarm.js` | 124 | 2 | Swarm execution (CLI daemon) |
| `vision.js` | 297 | 2 | Vision agent (CLI multimodal) |
| `queue.js` | 559 | 0 | Task queue (standalone utility) |

### STUB Files (2)

| File | Lines | Purpose |
|------|-------|---------|
| `index.js` | 44 | Central export hub for all agents |
| `registry.js` | 50 | Thin wrapper around `../commands/agents.js` |

### DUPLICATE Files (1)

| File | Lines | Duplicates |
|------|-------|------------|
| `registry.js` | 50 | Covered by registry-enhanced.js |

### DEAD Files (20)

| File | Lines | Reason |
|------|-------|--------|
| `architect-graph.js` | 41 | Never imported |
| `base-agent.js` | 67 | Never imported |
| `checkpoint.js` | 395 | Never imported |
| `computer-use-agent.js` | 1000 | Never imported |
| `coordinator.js` | 24 | Never imported |
| `daemon.js` | 405 | Never imported |
| `debugger-graph.js` | 41 | Never imported |
| `executor-graph.js` | 41 | Never imported |
| `executor.js` | 14 | Never imported |
| `graph-utils.js` | 70 | Never imported |
| `handshake.js` | 50 | Never imported |
| `meta-orchestrator.js` | 98 | Never imported |
| `negotiation.js` | 58 | Never imported |
| `persona.js` | 60 | Never imported |
| `planner-graph.js` | 41 | Never imported |
| `planner.js` | 43 | Never imported |
| `protocol.js` | 82 | Never imported |
| `reviewer-graph.js` | 41 | Never imported |
| `swarm-engine.js` | 20 | Never imported |
| `workflow-rules.js` | 59 | Never imported |
| `vision-agent.js` | 938 | Never imported |

---

**End of Report**
