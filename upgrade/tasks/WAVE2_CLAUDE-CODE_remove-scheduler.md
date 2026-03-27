# TASK 7: Remove Zombie AgentScheduler

**Assigned to:** Claude Code  
**Priority:** Wave 2 — MEDIUM  
**Estimated time:** 10 minutes

---

## Objective

Remove the `AgentScheduler` instantiation from `AgentOrchestrator` since it is never started or used. Clean up all references.

## Problem

`src/core/orchestration/index.js` line 74:
```javascript
this.scheduler = new AgentScheduler(this.options);
```

`scheduler.start()` is never called. `executeTask` bypasses the scheduler entirely and calls `this.ai.call` directly. This is dead code consuming memory.

## Decision

**REMOVE** — not integrate. The scheduler concept will be properly re-designed in a future milestone if needed.

## Implementation

1. In `src/core/orchestration/index.js`:
   - Remove `import` of `AgentScheduler` (or `scheduler.js`)
   - Remove `this.scheduler = new AgentScheduler(this.options);`
   - Remove any references to `this.scheduler` (check shutdown/cleanup methods too)
   
2. Do NOT delete `src/core/orchestration/scheduler.js` yet — archive it in case we need the logic later. Just disconnect it from the orchestrator.

3. Add a comment where the scheduler was:
   ```javascript
   // NOTE: AgentScheduler removed in Milestone 1 (dead code).
   // Re-design scheduling in Milestone 4 if priority-based task routing is needed.
   ```

## Target Files

- `src/core/orchestration/index.js` [MODIFY]

## Validation Criteria

1. `AgentOrchestrator` instantiates without errors (no scheduler dependency)
2. `executeTask()` still works (it never used scheduler anyway)
3. No references to `this.scheduler` remain in the orchestrator
4. `scheduler.js` still exists on disk (just disconnected)
