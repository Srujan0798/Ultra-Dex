# Phase 0: HARD RESET — Foundation Architecture (Day 0-2)

### OBJECTIVE

Establish the canonical DexGraph platform structure. Transform from experimental feature aggregation to production-grade control plane architecture. Create the foundation upon which all subsequent phases build.

### SUCCESS CRITERIA (Define "Done")

- [ ] 10 top-level directories exist with correct substructure
- [ ] All legacy code classified and archived (no accidental deletion)
- [ ] Memory system consolidated and operational in new structure
- [ ] TypeScript compiles with zero errors across all new modules
- [ ] Version reflects hard reset: 2.0.0-alpha.0
- [ ] Migration guide documents all breaking changes

### INVARIANTS (Non-Negotiable Constraints)

1. **History Preserved**: All code moves use `git mv` - no history loss
2. **Zero Deletion**: Nothing is deleted, only archived - recovery must always be possible
3. **No Cross-Contamination**: New directories must never import from old `src/`
4. **Standalone Memory**: Memory module must function independently without legacy dependencies
5. **Documented Decisions**: Every architectural decision captured in ADR format

### INTEGRATION CONTRACT

**Input** (from Current State):

- `src/` with 80+ experimental subdirectories
- Existing memory system (MUNI)
- An'tB architecture references
- Version 6.0.0 in package.json
- 49% passing test rate

**Output** (to Phase 1 - Parser):

```
core/           # Task planning and graph compilation
├── planner/    # Goal → task graph compiler
├── scheduler/  # Task ordering engine
└── task_graph/ # DAG engine interface

runtime/        # Execution environment
├── worker/     # Stateless agent workers
├── executor/   # Execution dispatch
└── execution_engine/ # Core execution logic

memory/         # Persistent memory (MUNI consolidation)
├── episodic/   # Session/event memory
├── semantic/   # Vector search and knowledge
└── state/      # State management store

dexgraph/       # Workflow DSL system
├── parser.ts   # YAML → Graph
├── graph.ts    # DAG builder
├── stateMachine.ts # State transitions
├── scheduler.ts # Execution ordering
├── dispatcher.ts # Adapter bridge
└── verifier.ts # Output validation

adapters/       # Execution adapters
├── executionAdapter.ts # Interface contract
governance/     # Policy engine
tools/          # Tool registry
observability/  # Event and logging
cli/            # Command line interface
sdk/            # Developer API surface
```

**Archive Output**:

- `archive/v1/` with complete legacy codebase
- `archive/v1/AUDIT.md` classifying every directory
- `docs/architecture/antb.md` with An'tB documentation

### SCOPE BOUNDARIES

**IN Scope:**

- Directory structure creation (10 top-level dirs)
- Code audit and classification
- Memory system migration
- TypeScript configuration
- Version reset and migration docs

**OUT of Scope:**

- Implementation of DexGraph modules (Phase 1+)
- Test migration (Phase 4)
- Performance optimization (Phase 6)
- Multi-region deployment (Phase 9)

### WINDOWS (High-Level Work Units)

#### W1: Canonical Structure

**Task ID:** V20-P0-W1-STRUCTURE  
**Objective:** Create the DexGraph directory hierarchy that will house all v2.0 modules.  
**Agent Power Tier:** HIGH (Claude Opus for precision)  
**Success Signal:** All 10 directories exist with placeholder index.ts files.

**Requirements:**

- Create 7 core directories: `core/`, `runtime/`, `memory/`, `dexgraph/`, `adapters/`, `governance/`, `tools/`
- Create 3 interface directories: `observability/`, `cli/`, `sdk/`
- Each directory gets appropriate substructure per architecture spec
- Placeholder files export empty objects (no implementation)
- Root tsconfig.json includes all new directories

**Constraints:**

- Existing `src/` must remain untouched
- No dependencies between new directories yet
- All paths must be relative for portability
- Directory names are canonical - no variation allowed

---

#### W2: Legacy Audit & Archive

**Task ID:** V20-P0-W2-AUDIT  
**Objective:** Classify every existing module and archive non-essential code.  
**Agent Power Tier:** HIGH (Claude Opus for judgment)  
**Success Signal:** AUDIT.md lists every directory with decision and rationale.

**Requirements:**

- Review all 80+ subdirectories in `src/core/`
- Classify each as: KEEP (maps to DexGraph), ARCHIVE (doesn't fit), MIGRATE (needs restructuring)
- Document rationale for each decision
- Map MIGRATE items to new locations
- Move ARCHIVE directories to `archive/v1/` using `git mv`
- Leave KEEP and MIGRATE in place for now

**Constraints:**

- Use `git mv` for all moves - preserve history
- Nothing deleted, only moved to archive
- Audit must be comprehensive - no directories missed
- Decisions must be defensible in ADR format

---

#### W3: Memory Consolidation

**Task ID:** V20-P0-W3-MEMORY  
**Objective:** Migrate MUNI memory system to new `memory/` structure, eliminate cross-references.  
**Agent Power Tier:** BALANCED (Claude Sonnet for speed)  
**Success Signal:** Memory module compiles standalone, zero MUNI references in new dirs.

**Requirements:**

- Map existing memory code to new structure:
  - Session/event tracking → `memory/episodic/`
  - Vector search/knowledge → `memory/semantic/`
  - State management → `memory/state/`
- Rewrite interfaces to match DexGraph types (Phase 1)
- Remove all imports from `src/`
- Consolidate An'tB references into documentation only
- Update all README references

**Constraints:**

- Memory module must be importable without legacy dependencies
- Original code stays in `src/` until migration verified
- All MUNI/An'tB references must be removed from new dirs
- Copy useful logic, rewrite interfaces

---

#### W4: Foundation Validation

**Task ID:** V20-P0-W4-VALIDATION  
**Objective:** Verify clean slate, compilation, version alignment, documentation.  
**Agent Power Tier:** HIGH (Codex o1 for thoroughness)  
**Success Signal:** TypeScript compiles, version is 2.0.0-alpha.0, migration guide exists.

**Requirements:**

- Verify all 10 directories match NOTION/v2.0.MD spec
- Confirm no imports from `src/core/` in new directories
- Confirm no old agent system references
- TypeScript compilation passes with zero errors
- Update package.json version to 2.0.0-alpha.0
- Create MIGRATION.md documenting:
  - What was archived and why
  - Old location → new location mappings
  - Breaking changes list
  - How to access archived code

**Constraints:**

- Compilation must be clean - no type errors
- Version must reflect hard reset
- Documentation must be complete for handoff
- No references to legacy systems in new code

---

### SEQUENCE

```
        ┌→ W1 (Structure)
        │       ↓
        │      W2 (Audit) ═══════╗
        │       ↓               ║
W1/W2 parallel          W3 (Memory)
                                ↓
                               W4 (Validation)
```

- W1 and W2 can proceed in parallel (no dependencies)
- W3 needs W1 for target structure
- W4 needs W2 (audit complete) and W3 (memory migrated)

### OUTPUT ARTIFACTS

| Artifact            | Location                  | Purpose                        |
| ------------------- | ------------------------- | ------------------------------ |
| Directory Structure | `core/`, `runtime/`, etc. | Foundation for all v2.0 work   |
| Audit Report        | `archive/v1/AUDIT.md`     | Decisions on legacy code       |
| Memory Module       | `memory/episodic/`, etc.  | Consolidated memory system     |
| Migration Guide     | `MIGRATION.md`            | Breaking changes documentation |
| TypeScript Config   | `tsconfig.json`           | Compilation settings           |
| Version Marker      | `package.json`            | 2.0.0-alpha.0                  |

### VALIDATION GATES

- [ ] All 10 directories exist with correct subdirs
- [ ] AUDIT.md classifies all 80+ src/ subdirectories
- [ ] Memory module has episodic/, semantic/, state/
- [ ] Zero MUNI/An'tB references in new directories
- [ ] `npx tsc --noEmit` passes
- [ ] package.json version === "2.0.0-alpha.0"
- [ ] MIGRATION.md documents all breaking changes

### RISK MITIGATION

| Risk                                  | Impact | Mitigation                                    |
| ------------------------------------- | ------ | --------------------------------------------- |
| Archive loses working code            | High   | `git mv` preserves history; nothing deleted   |
| Memory migration breaks functionality | Medium | Copy, don't move; verify before removing src/ |
| tsconfig conflicts with existing      | Low    | Separate tsconfig for new dirs initially      |
| Incomplete audit misses directories   | Medium | Automated directory listing; manual review    |
| Cross-contamination with old code     | Medium | Lint rule: no imports from src/               |

### COST TRACKING

| Window | Tier     | Agent         | Est. Tokens |
| ------ | -------- | ------------- | ----------- |
| W1     | HIGH     | Claude Opus   | ~8K         |
| W2     | HIGH     | Claude Opus   | ~15K        |
| W3     | BALANCED | Claude Sonnet | ~10K        |
| W4     | HIGH     | Codex o1      | ~12K        |

---

_Phase 0 dispatches | High-Level Orchestrator | v2.1_
