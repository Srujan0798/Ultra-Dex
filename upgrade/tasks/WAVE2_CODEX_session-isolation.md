# TASK 1: Session-Isolated TaskGraph

**Assigned to:** Codex  
**Priority:** Wave 2 — CRITICAL  
**Estimated time:** 30–45 minutes

---

## Objective

Refactor `AgentOrchestrator` to use session-scoped TaskGraphs instead of a shared singleton. Each `executeNexus()` call must create an isolated `ExecutionContext` with its own TaskGraph to prevent cross-session contamination.

## Problem

Currently in `src/core/orchestration/index.js` line 62:
```javascript
this.tasks = new TaskGraph();
```

This single shared TaskGraph means concurrent `executeNexus()` calls can see each other's tasks via `getReadyTasks()`, causing unpredictable behavior.

## Implementation Plan

### Step 1: Create ExecutionContext class

Create `src/core/orchestration/execution-context.js`:

```javascript
export class ExecutionContext {
  constructor(sessionId, objective, options = {}) {
    this.sessionId = sessionId;
    this.objective = objective;
    this.options = options;
    this.tasks = new TaskGraph();  // Session-scoped
    this.startedAt = Date.now();
    this.status = 'running';
  }
  
  // Delegate task operations
  addTask(task) { return this.tasks.addTask({ ...task, sessionId: this.sessionId }); }
  getReadyTasks() { return this.tasks.getReadyTasks(); }
  markComplete(taskId, result) { return this.tasks.markComplete(taskId, result); }
}
```

### Step 2: Modify AgentOrchestrator

In `src/core/orchestration/index.js`:
- Keep `this.tasks` as a global registry for monitoring (optional)
- `executeNexus()` creates a new `ExecutionContext` and passes it to the Ralph Loop
- The context is passed as a parameter, NOT via `this`

### Step 3: Modify Ralph Loop

In `src/core/agents/ralph-loop.js`:
- Accept `ExecutionContext` as a parameter instead of reading `runtimeOrchestrator.tasks`
- All task operations go through the context
- The loop only sees its own session's tasks

### Step 4: Write test

Create `tests/core/session-isolation.test.js`:
```javascript
// Launch two concurrent executeNexus calls
// Verify tasks from session A never appear in session B's getReadyTasks()
// Verify both complete independently
```

## Target Files

- `src/core/orchestration/execution-context.js` [NEW]
- `src/core/orchestration/index.js` [MODIFY]
- `src/core/agents/ralph-loop.js` [MODIFY]
- `tests/core/session-isolation.test.js` [NEW]

## Validation Criteria

1. Create two concurrent `executeNexus()` calls with objectives "Task A" and "Task B"
2. Session A must never see tasks from Session B
3. Both must complete independently
4. Existing single-session behavior must still work
5. All existing tests must still pass
