# Cycle 4 Dispatch: Advanced Intelligence & CLI Integration

**Generated:** 2026-04-02T12:40:00Z  
**Orchestrator:** MAYA (Claude Opus 4.5)  
**Status:** READY FOR EXECUTION

## Executive Summary

Cycle 4 focuses on CLI integration and console.log migration to complete production readiness.

**Prior Cycles Complete:**
- ✅ Cycle 1: Autonomous Agent Loop (100%)
- ✅ Cycle 2: Performance Optimization (100%)
- ✅ Cycle 3: Developer Experience (100%)

## Cycle 4 Objectives

| Priority | Task | Agent Lane | Cost Class |
|----------|------|------------|------------|
| P0 | Autonomous CLI Command | Codex | Medium |
| P1 | Console.log Migration (Priority Files) | Qwen x4 | Low |
| P2 | Test File Timeout Fix | Gemini | Low |
| P3 | Vector Memory Enhancement | Claude Sonnet | High |

---

## Window 1: Autonomous CLI Command (Codex)

**Objective:** Create `ultra-dex autonomous run "goal"` CLI command

**Files:**
- `apps/cli/lib/commands/autonomous.js` (CREATE)
- `apps/cli/bin/ultra-dex.js` (MODIFY - add command)

**Prompt:**
```
Create CLI command for Ultra-Dex autonomous loop.

Requirements:
1. Command: `ultra-dex autonomous run "Build REST API for users"`
2. Options: --dry-run, --max-iterations=N, --approval-mode=(auto|manual|prompt)
3. Wire to apps/cli/lib/autonomous/agent.js AutonomousAgent class
4. Show progress with spinner, emit events to console
5. Handle Ctrl+C gracefully with state save
6. Use existing Logger from apps/cli/lib/utils/logger.js

Reference:
- apps/cli/lib/autonomous/agent.js (AutonomousAgent.run(goal, options))
- apps/cli/lib/utils/logger.js (Logger class)
- apps/cli/lib/commands/analyze.js (example command structure)

Output JSON schema for dry-run mode.
```

**Command:**
```bash
# After implementation, test:
node apps/cli/bin/ultra-dex.js autonomous --help
node apps/cli/bin/ultra-dex.js autonomous run "Test goal" --dry-run
```

**Validation:**
- Command registered in CLI
- --help shows all options
- --dry-run returns plan without execution

**Fallback #1:** Simplify to basic run command without options
**Fallback #2:** Export function only, defer CLI wiring

---

## Window 2-5: Console.log Migration (Qwen x4)

Split across 4 Qwen windows by directory.

### Window 2: apps/cli/lib/autonomous/
**Objective:** Migrate console.log to Logger in autonomous module

**Files:**
```
apps/cli/lib/autonomous/planning-engine.js
apps/cli/lib/autonomous/execution-controller.js
apps/cli/lib/autonomous/validation-layer.js
apps/cli/lib/autonomous/memory-bridge.js
apps/cli/lib/autonomous/agent.js
```

**Prompt:**
```
Migrate all console.log/warn/error to Logger class.

Import: import { Logger } from '../utils/logger.js';
Create instance: const logger = new Logger({ prefix: 'AutonomousLoop' });

Mapping:
- console.log() → logger.info()
- console.warn() → logger.warn()
- console.error() → logger.error()
- console.debug() → logger.debug()

Do NOT change:
- Test files
- Logic/behavior
- Error messages content

Keep debug/verbose logs but use logger.debug()
```

**Command:**
```bash
grep -c "console\." apps/cli/lib/autonomous/*.js
# Should show 0 after migration
```

**Validation:** `grep "console\." apps/cli/lib/autonomous/*.js` returns empty

---

### Window 3: apps/cli/lib/core/
**Objective:** Migrate console.log in core modules

**Files:**
```
apps/cli/lib/core/orchestrator.js
apps/cli/lib/core/config.js
apps/cli/lib/core/session.js
```

**Prompt:** Same as Window 2, prefix: 'Core'

---

### Window 4: apps/cli/lib/providers/
**Objective:** Migrate console.log in provider modules

**Files:**
```
apps/cli/lib/providers/base.js
apps/cli/lib/providers/unified.js
apps/cli/lib/providers/openai.js
apps/cli/lib/providers/anthropic.js
```

**Prompt:** Same as Window 2, prefix: 'Provider'

---

### Window 5: apps/cli/lib/mcp/
**Objective:** Migrate console.log in MCP modules

**Files:**
```
apps/cli/lib/mcp/client.js
apps/cli/lib/mcp/server.js
apps/cli/lib/mcp/protocol-handler.js
```

**Prompt:** Same as Window 2, prefix: 'MCP'

---

## Window 6: Test Timeout Fix (Gemini)

**Objective:** Fix Node.js test runner file-level timeout issue

**Files:**
- `tests/core/autonomous-loop.test.js`

**Prompt:**
```
Fix the test file timeout issue in tests/core/autonomous-loop.test.js.

Problem: Node.js test runner times out at file level (20s) even though all 
individual tests pass within milliseconds. 49 tests, 30 pass, 18 fail due 
to file timeout.

Solutions to try:
1. Add explicit test.only() or run suites separately
2. Add afterEach cleanup to ensure no hanging promises
3. Split into multiple test files by component
4. Check for EventEmitter listeners not being removed

Current structure has 7 describe blocks. Each individual test completes 
in <100ms but file never exits.

Reference: https://nodejs.org/api/test.html
```

**Command:**
```bash
node --test --test-timeout=30000 tests/core/autonomous-loop.test.js
```

**Validation:** 49/49 tests pass, no timeout

**Fallback #1:** Split into 7 separate test files
**Fallback #2:** Mark problematic tests as skip with TODO

---

## Window 7: Vector Memory Enhancement (Claude Sonnet)

**Objective:** Add vector similarity search to MemoryBridge

**Files:**
- `apps/cli/lib/autonomous/memory-bridge.js` (MODIFY)

**Prompt:**
```
Enhance MemoryBridge with vector similarity search for context retrieval.

Add to MemoryBridge class:
1. _generateEmbedding(text) - Use AI provider to generate embedding
2. _cosineSimilarity(a, b) - Calculate similarity between vectors
3. searchSemantic(query, options) - Find similar contexts by embedding

Options for searchSemantic:
- threshold: 0.7 (minimum similarity)
- limit: 10 (max results)
- types: ['goal', 'learning'] (filter by type)

Storage:
- Save embeddings alongside context in session files
- Cache embeddings in memory to avoid regeneration

Graceful degradation:
- If no provider available, fall back to existing keyword search
- If embedding fails, log warning and use keyword search

Keep existing searchRelevant() for keyword search.
```

**Validation:**
```javascript
const results = await bridge.searchSemantic('authentication patterns');
assert(results.length > 0);
assert(results[0].similarity > 0.5);
```

**Fallback #1:** Implement without AI, use TF-IDF instead
**Fallback #2:** Skip, keep keyword search only

---

## Execution Order

1. **Parallel:** Windows 2-5 (console.log migration) - independent
2. **Sequential:** Window 1 (CLI command) - needs stable base
3. **Sequential:** Window 6 (test fix) - validation step
4. **Optional:** Window 7 (vector search) - enhancement only

## Budget Summary

| Lane | Windows | Est. Tokens |
|------|---------|-------------|
| Codex | 1 | 50K |
| Qwen | 4 | 80K |
| Gemini | 1 | 30K |
| Claude Sonnet | 1 | 60K |
| **Total** | **7** | **220K** |

---

## Quick Copy-Paste Commands

### After Window 1 (Codex):
```bash
node apps/cli/bin/ultra-dex.js autonomous --help
```

### After Windows 2-5 (Qwen):
```bash
grep -r "console\." apps/cli/lib/autonomous/ apps/cli/lib/core/ apps/cli/lib/providers/ apps/cli/lib/mcp/ | grep -v node_modules | wc -l
```

### After Window 6 (Gemini):
```bash
node --test tests/core/autonomous-loop.test.js
```

### After Window 7 (Claude):
```bash
node -e "import('./apps/cli/lib/autonomous/memory-bridge.js').then(m => console.log('searchSemantic' in m.MemoryBridge.prototype ? '✅' : '❌'))"
```

---

**Next Cycle Preview:** Cycle 5 - Production Deployment & Monitoring
