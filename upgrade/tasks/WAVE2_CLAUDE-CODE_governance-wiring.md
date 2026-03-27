# TASK 2: Wire Governance into Execution Pipeline

**Assigned to:** Claude Code  
**Priority:** Wave 2 — CRITICAL  
**Estimated time:** 20–30 minutes

---

## Objective

Connect `GovernanceManager` to `executeTool()` and `executeTask()` so ALL operations pass through policy checks before execution. Currently, governance is completely disconnected — tools execute immediately with zero checks.

## Problem

`src/core/orchestration/index.js` line 247: `executeTool()` calls `tool.handler(args)` directly without any governance check. The `GovernanceManager` at `src/core/governance/governance-manager.js` exists but is never imported or used by the orchestrator.

## Implementation

### In `src/core/orchestration/index.js`:

1. Import `GovernanceManager` at the top
2. Initialize it in the constructor
3. Before `tool.handler(args)` in `executeTool()`:
   ```javascript
   const authResult = await this.governance.authorize(
     context.agentId || 'system',
     'execute',
     name,
     { args, toolId: name }
   );
   
   if (!authResult.allowed) {
     throw new GovernanceDeniedException(name, authResult.reason);
   }
   ```
4. After execution, log to audit:
   ```javascript
   await this.governance.audit({
     action: 'tool_execution',
     tool: name,
     args,
     result: 'success',
     agentId: context.agentId
   });
   ```
5. In the catch block, audit the failure too.

### Create GovernanceDeniedException

```javascript
export class GovernanceDeniedException extends Error {
  constructor(operation, reason) {
    super(`Governance denied: ${operation} — ${reason}`);
    this.name = 'GovernanceDeniedException';
    this.operation = operation;
    this.reason = reason;
  }
}
```

### Also wire `executeTask()`:
Same pattern — check governance before AI call, audit after.

## Target Files

- `src/core/orchestration/index.js` [MODIFY]
- `src/core/governance/governance-manager.js` [READ — understand its API]

## Validation Criteria

1. Define a blocklist policy that blocks tool "delete_database"
2. Call `executeTool('delete_database', {})` 
3. Must throw `GovernanceDeniedException`
4. Audit log must contain the denial record
5. Call `executeTool('read_file', {})` with a policy that allows it
6. Must execute successfully
7. Audit log must contain the success record
