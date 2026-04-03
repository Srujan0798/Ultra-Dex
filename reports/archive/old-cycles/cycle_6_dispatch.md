# Cycle 6 Dispatch: Testing & Documentation

**Generated:** 2026-04-02T21:12:00Z  
**Orchestrator:** MAYA (Claude Opus 4.5)  
**Status:** READY FOR EXECUTION

---

## WINDOW 1 (Codex)

**Objective:** Create end-to-end autonomous loop test

**File:** `tests/integration/autonomous-e2e.test.js` (CREATE)

**Prompt:**
```
Create end-to-end test for autonomous loop.

Test scenarios:
1. AutonomousAgent.run("Create hello.txt with 'Hello World'")
   - Verify plan generated
   - Verify tasks executed
   - Verify file created

2. Checkpoint save/resume:
   - agent.saveCheckpoint()
   - AutonomousAgent.resumeFromCheckpoint(id)
   - Verify state restored

3. Validation gates:
   - Test security gate blocks sensitive data
   - Test quality gate warnings

Use mock provider - no real API calls.
Mock file system operations.

Reference: tests/core/autonomous-loop.test.js for patterns
```

**Validation:**
```bash
npm run test:integration -- tests/integration/autonomous-e2e.test.js
```

**Cost Class:** High

---

## WINDOW 2 (Gemini)

**Objective:** Add CLI help improvements

**File:** `apps/cli/bin/ultra-dex.js` (MODIFY)

**Prompt:**
```
Improve CLI help for autonomous command.

Add:
1. Command aliases:
   - 'auto' → 'autonomous'
   - 'chk' → 'checkpoint'

2. Examples in help:
   ultra-dex autonomous run "Build REST API"
   ultra-dex autonomous run "Refactor auth" --dry-run
   ultra-dex autonomous checkpoint list
   ultra-dex autonomous checkpoint resume chk_123

3. Subcommands for checkpoint:
   - autonomous checkpoint list
   - autonomous checkpoint resume <id>
   - autonomous checkpoint delete <id>

Reference: apps/cli/lib/commands/autonomous.js
```

**Validation:**
```bash
node apps/cli/bin/ultra-dex.js autonomous --help
node apps/cli/bin/ultra-dex.js auto --help  # alias works
```

**Cost Class:** Medium

---

## WINDOW 3 (Gemini)

**Objective:** Create architecture diagram

**File:** `docs/architecture/autonomous-loop.md` (CREATE)

**Prompt:**
```
Create architecture documentation for autonomous loop.

Include:

1. Component Diagram (ASCII):
┌─────────────────────────────────────────────────┐
│              AutonomousAgent                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │ Planning │→│ Decompose│→│ ExecutionController│
│  │ Engine   │ │ Tasks    │ │                  │ │
│  └──────────┘ └──────────┘ └──────────────────┘ │
│       ↓            ↓              ↓              │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │Validation│ │ Memory   │ │ ApprovalGates    │ │
│  │ Layer    │ │ Bridge   │ │                  │ │
│  └──────────┘ └──────────┘ └──────────────────┘ │
└─────────────────────────────────────────────────┘

2. Data Flow:
   Goal → PlanningEngine → Tasks → ExecutionController → Results → ValidationLayer → MemoryBridge

3. Event System:
   - phase:start, phase:complete
   - task:start, task:complete, task:failed
   - validation:passed, validation:failed
   - checkpoint:saved

4. Circuit Breaker States:
   CLOSED → OPEN → HALF_OPEN → CLOSED
```

**Validation:** File exists with ASCII diagrams

**Cost Class:** Low

---

## WINDOW 4 (Qwen)

**Objective:** Add checkpoint unit tests

**File:** `tests/core/checkpoint.test.js` (CREATE)

**Prompt:**
```
Create unit tests for checkpoint feature.

Tests:
1. saveCheckpoint() creates file in .ultra/checkpoints/
2. saveCheckpoint() returns checkpoint ID starting with 'chk_'
3. listCheckpoints() returns array of checkpoints
4. listCheckpoints() returns empty array when no checkpoints
5. resumeFromCheckpoint() restores agent state
6. resumeFromCheckpoint() throws on invalid ID

Use temp directory for tests.
Clean up after each test.

Reference: tests/core/memory-bridge.test.js for patterns
```

**Validation:**
```bash
node --test tests/core/checkpoint.test.js
```

**Cost Class:** Low

---

## WINDOW 5 (Qwen)

**Objective:** Add rate limiter unit tests

**File:** `tests/core/rate-limiter.test.js` (CREATE)

**Prompt:**
```
Create unit tests for rate limiting in ExecutionController.

Tests:
1. Default maxRequestsPerMinute is 60
2. Tasks execute normally under limit
3. Tasks get throttled when exceeding limit
4. Burst limit allows short bursts
5. rateLimit:waiting event emitted when throttled
6. Tokens refill over time

Mock timing with fake timers if needed.

Reference: apps/cli/lib/autonomous/execution-controller.js
```

**Validation:**
```bash
node --test tests/core/rate-limiter.test.js
```

**Cost Class:** Low

---

## WINDOW 6 (Qwen)

**Objective:** Add CHANGELOG entry

**File:** `CHANGELOG.md` (CREATE or MODIFY)

**Prompt:**
```
Add CHANGELOG entry for Ultra-Dex v2.0.0.

Format:
# Changelog

## [2.0.0] - 2026-04-02

### Added
- Autonomous Agent Loop with AI-powered planning
- Checkpoint/Resume for interrupted loops
- Rate limiting with token bucket algorithm
- Health check endpoint (/health)
- Vector similarity search in MemoryBridge
- Telemetry and metrics export
- Interactive dashboard improvements

### Changed
- Migrated console.log to Logger class
- Improved test coverage for autonomous modules

### Fixed
- Race condition in MemoryBridge initialization
- Circuit breaker thread safety
- Path traversal vulnerability in task IDs
- Prompt injection in AI judge validation
```

**Validation:** CHANGELOG.md exists with v2.0.0 section

**Cost Class:** Low

---

## WINDOW 7 (Claude Sonnet) - OPTIONAL

**Objective:** Add OpenAPI spec for health endpoint

**File:** `docs/api/openapi.yaml` (CREATE)

**Prompt:**
```
Create OpenAPI 3.0 specification for Ultra-Dex health endpoint.

Endpoints:
GET /health
  - Summary: Health check endpoint
  - Response 200: System healthy
  - Response 503: System unhealthy

Schema:
HealthResponse:
  type: object
  properties:
    status: enum [healthy, degraded, unhealthy]
    uptime: integer (seconds)
    memory: object {used, total}
    providers: object
    sessions: object {active}
    timestamp: string (ISO8601)

Include examples.
```

**Validation:**
```bash
# Install validator if needed: npm install -g @apidevtools/swagger-cli
swagger-cli validate docs/api/openapi.yaml
```

**Cost Class:** Medium

---

## Execution Order

1. **Parallel:** Windows 4-6 (Qwen x3) - independent tests/docs
2. **Sequential:** Window 1 (Codex) - e2e test
3. **Sequential:** Windows 2-3 (Gemini) - CLI/docs
4. **Optional:** Window 7 (Claude) - OpenAPI

## Budget Summary

| Lane | Windows | Est. Tokens |
|------|---------|-------------|
| Codex | 1 | 50K |
| Gemini | 2 | 40K |
| Qwen | 3 | 45K |
| Claude Sonnet | 1 | 30K |
| **Total** | **7** | **165K** |

---

## Quick Validation Commands

```bash
# After Window 1
npm run test:integration

# After Window 2
node apps/cli/bin/ultra-dex.js auto --help

# After Window 3
cat docs/architecture/autonomous-loop.md

# After Windows 4-5
node --test tests/core/checkpoint.test.js tests/core/rate-limiter.test.js

# After Window 6
head -30 CHANGELOG.md

# After Window 7
cat docs/api/openapi.yaml
```
