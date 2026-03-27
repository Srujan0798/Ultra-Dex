# TASK 6: TaskGraph Pruning & Bounded State History

**Assigned to:** Claude Code  
**Priority:** Wave 2 — HIGH  
**Estimated time:** 15–20 minutes

---

## Objective

Add lifecycle management to prevent memory leaks:
1. TaskGraph: prune completed tasks after configurable age
2. AgentStateMachine: cap history to ring buffer

## Problem

- `TaskGraph` at `src/core/orchestration/index.js` line 29: `addTask` adds to Map, `markComplete` updates status but never removes from Map. Tasks accumulate forever → OOM.
- `AgentStateMachine` at `src/core/orchestration/agent-state.js` line 37: `stateHistory.push(...)` grows infinitely.

## Implementation

### TaskGraph Pruning

Add to the TaskGraph class (defined inline in `src/core/orchestration/index.js`):

```javascript
prune(maxAgeMs = 300000) { // 5 minutes default
  const cutoff = Date.now() - maxAgeMs;
  for (const [id, task] of this.tasks) {
    if (task.status === 'completed' && task.completedAt < cutoff) {
      this.tasks.delete(id);
    }
  }
}
```

Add `completedAt: Date.now()` in `markComplete()`.

Call `this.tasks.prune()` at the start of each `executeNexus()` call.

### Bounded State History (Ring Buffer)

In `src/core/orchestration/agent-state.js`:

```javascript
const MAX_HISTORY = 1000;

// In the transition recording:
const history = this.stateHistory.get(agentId);
history.push({ from: oldState, to: newState, timestamp: Date.now() });

// Trim to ring buffer size
if (history.length > MAX_HISTORY) {
  history.splice(0, history.length - MAX_HISTORY);
}
```

## Target Files

- `src/core/orchestration/index.js` [MODIFY — TaskGraph class]
- `src/core/orchestration/agent-state.js` [MODIFY — history ring buffer]

## Validation Criteria

1. Add 10,000 tasks to TaskGraph. Mark all complete. Call `prune(0)`. Map size must be 0.
2. Default prune (5 min): recently completed tasks must survive, old ones must be removed.
3. Record 2,000 state transitions for one agent. History length must be ≤ 1,000 (oldest entries dropped).
