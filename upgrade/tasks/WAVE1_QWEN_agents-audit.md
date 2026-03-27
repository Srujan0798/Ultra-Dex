# TASK 10: Agent System Consolidation Audit

**Assigned to:** Qwen CLI  
**Priority:** Wave 1  
**Estimated time:** 15–20 minutes

---

## Objective

Audit every file in `src/core/agents/` (31 files). For each file, determine whether it is:
- **ACTIVE** — imported by other modules and functional
- **STUB** — exists but has minimal/placeholder implementation
- **DUPLICATE** — overlaps significantly with another file
- **DEAD** — never imported by anything in the codebase

## Instructions

1. List all 31 files in `src/core/agents/`
2. For each file:
   - Read the file contents
   - Search the entire `src/` and `apps/` directories for any imports of this file
   - Categorize as ACTIVE / STUB / DUPLICATE / DEAD
   - Note the line count and what the file claims to do
3. Identify groups of files that do the same thing (e.g., `registry.js` vs `registry-enhanced.cjs`)
4. Produce a dependency graph
5. Recommend a consolidation plan that reduces to ≤8 clean modules

## Target Files

All files in: `src/core/agents/`

## Expected Output

Create the file: `upgrade/reports/agents-audit.md`

The report must contain:
1. **File Status Table** — every file, its category, line count, who imports it
2. **Duplicate Groups** — clusters of files doing the same thing
3. **Import Graph** — who depends on whom
4. **Consolidation Plan** — recommended target architecture:
   - `agent-registry.js` — registration, discovery, lifecycle
   - `agent-executor.js` — task execution engine
   - `agent-loop.js` — Ralph Loop (Plan→Act→Verify→Commit)
   - `agent-coordinator.js` — multi-agent coordination
   - `agent-session.js` — session management
   - `agent-swarm.js` — swarm execution
   - `agent-vision.js` — computer-use / vision capabilities
   - `agent-queue.js` — task queuing and priority

## Commands to Run

```bash
# List all files
ls -la src/core/agents/

# For each file, search for imports across codebase
grep -r "from.*agents/FILENAME" src/ apps/ --include="*.js" --include="*.ts" --include="*.cjs"
grep -r "require.*agents/FILENAME" src/ apps/ --include="*.js" --include="*.ts" --include="*.cjs"

# Count lines per file
wc -l src/core/agents/*.js src/core/agents/*.cjs
```

## Validation

- Every file in `src/core/agents/` must appear in the report
- Each file must be categorized
- Consolidation plan must be actionable
