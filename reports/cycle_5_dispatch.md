# Cycle 5 Dispatch: Production Hardening

**Generated:** 2026-04-02T17:48:00Z  
**Orchestrator:** MAYA (Claude Opus 4.5)  
**Status:** READY FOR EXECUTION

## Prior Cycles Complete

| Cycle | Focus | Status |
|-------|-------|--------|
| 1 | Autonomous Agent Loop | ✅ |
| 2 | Performance Optimization | ✅ |
| 3 | Developer Experience | ✅ |
| 4 | Console.log + Vector Search | ✅ |

---

## WINDOW 1: Health Check Endpoint (Codex)

**Objective:** Add health check endpoint for monitoring

**File:** `apps/cli/lib/commands/health.js` (CREATE)

**Prompt:**
```
Create health check endpoint for Ultra-Dex.

Requirements:
1. GET /health endpoint returning JSON:
   {
     "status": "healthy|degraded|unhealthy",
     "uptime": <seconds>,
     "memory": { "used": <MB>, "total": <MB> },
     "providers": { "<name>": "connected|error" },
     "sessions": { "active": <count> },
     "timestamp": "<ISO8601>"
   }

2. Register in CLI: ultra-dex health [--json] [--port 3002]

3. Return appropriate HTTP status codes:
   - 200 for healthy
   - 503 for unhealthy

Reference: apps/cli/lib/commands/status.js for structure
```

**Validation:**
```bash
node apps/cli/bin/ultra-dex.js health --json
curl localhost:3002/health
```

**Cost Class:** Medium

---

## WINDOW 2: Rate Limiting (Gemini)

**Objective:** Add rate limiting to execution controller

**File:** `apps/cli/lib/autonomous/execution-controller.js` (MODIFY)

**Prompt:**
```
Add rate limiting to ExecutionController.

Add to constructor options:
- maxRequestsPerMinute: 60 (default)
- burstLimit: 10 (default)

Implement token bucket algorithm:
1. Add _rateLimiter object with tokens, lastRefill
2. Add _checkRateLimit() method
3. Call before each task execution
4. Emit 'rateLimit:waiting' event when throttled

Do NOT block indefinitely - queue with timeout.
```

**Validation:**
```javascript
const controller = new ExecutionController({ maxRequestsPerMinute: 5 });
// Execute 10 tasks rapidly - should see throttling
```

**Cost Class:** Low

---

## WINDOW 3: Telemetry Export (Gemini)

**Objective:** Add Prometheus-compatible metrics

**File:** `apps/cli/lib/utils/telemetry.js` (CREATE)

**Prompt:**
```
Create telemetry module for Ultra-Dex metrics.

Export class Telemetry with:
1. Counters:
   - autonomous_tasks_total{status="success|failure"}
   - autonomous_loops_total
   - validation_checks_total{result="pass|fail"}

2. Histograms:
   - task_execution_duration_seconds
   - planning_duration_seconds

3. Gauges:
   - active_sessions
   - cache_size

Methods:
- increment(name, labels)
- observe(name, value, labels)
- set(name, value)
- export() -> Prometheus text format

Integration point: Add to autonomous agent event handlers
```

**Validation:**
```bash
node -e "import('./apps/cli/lib/utils/telemetry.js').then(m => console.log(new m.Telemetry().export()))"
```

**Cost Class:** Medium

---

## WINDOW 4: JSDoc - agent.js (Qwen)

**Objective:** Add JSDoc to autonomous agent

**File:** `apps/cli/lib/autonomous/agent.js`

**Prompt:**
```
Add complete JSDoc documentation to agent.js.

For each public method add:
- @param with type and description
- @returns with type and description
- @throws if applicable
- @example with usage

Focus on: constructor, run(), plan(), execute(), validate()

Format:
/**
 * Brief description
 * @param {Type} name - Description
 * @returns {Promise<Type>} Description
 * @throws {Error} When condition
 * @example
 * const agent = new AutonomousAgent();
 * const result = await agent.run('Build API');
 */
```

**Validation:** No JSDoc warnings on build

**Cost Class:** Low

---

## WINDOW 5: JSDoc - planning-engine.js (Qwen)

**Objective:** Add JSDoc to planning engine

**File:** `apps/cli/lib/autonomous/planning-engine.js`

**Prompt:** Same as Window 4, focus on: constructor, generatePlan(), _buildPrompt(), _parseResponse()

**Cost Class:** Low

---

## WINDOW 6: JSDoc - execution-controller.js (Qwen)

**Objective:** Add JSDoc to execution controller

**File:** `apps/cli/lib/autonomous/execution-controller.js`

**Prompt:** Same as Window 4, focus on: constructor, execute(), _executeTask(), _checkCircuit()

**Cost Class:** Low

---

## WINDOW 7: Checkpoint/Resume (Claude Sonnet) - OPTIONAL

**Objective:** Add state persistence for interrupted loops

**File:** `apps/cli/lib/autonomous/agent.js` (MODIFY)

**Prompt:**
```
Add checkpoint/resume capability to AutonomousAgent.

Add methods:
1. async saveCheckpoint()
   - Save current state to .ultra/checkpoints/<sessionId>.json
   - Include: goal, plan, completedTasks, pendingTasks, learnings

2. static async resumeFromCheckpoint(checkpointId)
   - Load checkpoint and create new agent with state
   - Resume from last completed task

3. static async listCheckpoints()
   - Return array of available checkpoints with metadata

Storage format:
{
  "id": "chk_<timestamp>",
  "sessionId": "...",
  "goal": "...",
  "progress": { "completed": N, "total": M },
  "state": { ... },
  "createdAt": "..."
}
```

**Validation:**
```javascript
const agent = new AutonomousAgent();
await agent.run('Long task');
// Ctrl+C during execution
await agent.saveCheckpoint();

// Later:
const resumed = await AutonomousAgent.resumeFromCheckpoint('chk_123');
await resumed.run(); // Continues from where it stopped
```

**Cost Class:** High

---

## Execution Order

1. **Parallel:** Windows 4-6 (JSDoc) - no dependencies
2. **Sequential:** Window 1 (health) → Window 3 (telemetry)
3. **Sequential:** Window 2 (rate limiting)
4. **Optional:** Window 7 (checkpoint) - enhancement

## Budget Summary

| Lane | Windows | Est. Tokens |
|------|---------|-------------|
| Codex | 1 | 40K |
| Gemini | 2 | 50K |
| Qwen | 3 | 45K |
| Claude Sonnet | 1 | 60K |
| **Total** | **7** | **195K** |

---

## Quick Validation Commands

```bash
# After Window 1
node apps/cli/bin/ultra-dex.js health --json

# After Window 2
node -e "import('./apps/cli/lib/autonomous/execution-controller.js').then(m => console.log('maxRequestsPerMinute' in new m.ExecutionController().options))"

# After Window 3
node -e "import('./apps/cli/lib/utils/telemetry.js').then(m => console.log(m.Telemetry ? '✅' : '❌'))"

# After Windows 4-6
npm run docs 2>&1 | grep -c "warning"

# After Window 7
node -e "import('./apps/cli/lib/autonomous/agent.js').then(m => console.log('saveCheckpoint' in m.AutonomousAgent.prototype))"
```
