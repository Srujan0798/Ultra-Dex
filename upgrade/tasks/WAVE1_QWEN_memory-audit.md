# TASK 9: Memory System Consolidation Audit

**Assigned to:** Qwen CLI  
**Priority:** Wave 1  
**Estimated time:** 15–20 minutes

---

## Objective

Audit every file in `src/core/memory/` (31 files). For each file, determine whether it is:
- **ACTIVE** — imported by other modules and functional
- **STUB** — exists but has minimal/placeholder implementation
- **DUPLICATE** — overlaps significantly with another file
- **DEAD** — never imported by anything in the codebase

## Instructions

1. List all 31 files in `src/core/memory/`
2. For each file:
   - Read the file contents
   - Search the entire `src/` and `apps/` directories for any imports of this file
   - Categorize as ACTIVE / STUB / DUPLICATE / DEAD
   - Note the line count and what the file claims to do
3. Identify groups of files that do the same thing (e.g., `hot-tier.js` + `warm-tier.js` + `cold-tier.js` vs `hot-warm-cold.js`)
4. Produce a dependency graph showing which memory files import which others
5. Recommend a consolidation plan that reduces 31 files to ≤5 clean modules

## Target Files

All files in: `src/core/memory/`

## Expected Output

Create the file: `upgrade/reports/memory-audit.md`

The report must contain:
1. **File Status Table** — every file, its category, line count, who imports it
2. **Duplicate Groups** — clusters of files doing the same thing
3. **Import Graph** — who depends on whom
4. **Consolidation Plan** — recommended 5-file target architecture:
   - `memory-manager.js` — main entry point
   - `memory-store.js` — unified persistence
   - `memory-cache.js` — hot/warm/cold tiers
   - `memory-search.js` — retrieval and search
   - `memory-schema.js` — data structures

## Commands to Run

```bash
# List all files
ls -la src/core/memory/

# For each file, search for imports across codebase
grep -r "from.*memory/FILENAME" src/ apps/ --include="*.js" --include="*.ts" --include="*.cjs"
grep -r "require.*memory/FILENAME" src/ apps/ --include="*.js" --include="*.ts" --include="*.cjs"

# Count lines per file
wc -l src/core/memory/*.js src/core/memory/*.cjs src/core/memory/*.ts
```

## Validation

- Every file in `src/core/memory/` must appear in the report
- Each file must be categorized
- Consolidation plan must be actionable (which files merge into which)
