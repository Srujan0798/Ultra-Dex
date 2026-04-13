# Phase 1: DexGraph Core — Workflow DSL Parser (Week 1)

### OBJECTIVE

Establish the DSL-to-Graph translation layer: human-readable workflow definitions become machine-executable task graphs. This is the entry point of DexGraph.

### SUCCESS CRITERIA (Define "Done")

- [ ] A valid `.dex` workflow file parses without errors
- [ ] Parser output is a structured graph representation consumable by Phase 2 (Graph Builder)
- [ ] Invalid workflows produce meaningful errors with file location context
- [ ] 90%+ test coverage on parser logic
- [ ] Parser handles workflows up to 1000 tasks without performance degradation

### INVARIANTS (Non-Negotiable Constraints)

1. **Parser must be pure**: No side effects, no network calls, no file writes
2. **Output must be immutable**: Once parsed, the graph representation cannot be modified in-place
3. **Errors must be actionable**: Every parse error includes line number, column, and human-readable message
4. **Schema must be versioned**: All workflows declare their schema version; parser rejects unknown versions

### INTEGRATION CONTRACT

**Input** (from human or version control):

```yaml
# Any .dex workflow file
version: dexgraph/v1
name: example-workflow
tasks: [...]
```

**Output** (to Phase 2 - Graph Builder):

```typescript
// Graph representation with:
// - Node collection (task definitions with metadata)
// - Edge collection (dependency relationships)
// - Metadata (workflow name, context, configuration)
// - Validation state (ok / error with details)
```

**Error Output** (to CLI / User):

```typescript
// Structured error with:
// - File path
// - Line/column position
// - Error category: SYNTAX | SCHEMA | DEPENDENCY | CIRCULAR
// - Human message
// - Suggested fix (where possible)
```

### SCOPE BOUNDARIES

**IN Scope:**

- YAML parsing and validation
- Schema version recognition and dispatch
- Dependency extraction (explicit `depends_on` and implicit template references)
- Cycle detection (report circular dependencies before execution)
- Structured error reporting

**OUT of Scope (handled by other phases):**

- Task execution (Phase 3+)
- State machine transitions (Phase 2)
- Template value resolution at runtime (Phase 8)
- Parallel execution decisions (Phase 4)

### WINDOWS (High-Level Work Units)

#### W1: Type Foundation

**Task ID:** V20-P1-W1-TYPES  
**Objective:** Define the domain model - the types that represent workflows, tasks, and graph structures.  
**Agent Power Tier:** HIGH (Claude Opus for precision)  
**Success Signal:** `npx tsc --noEmit` passes on type definitions.

**Requirements (WHAT, not HOW):**

- Define TypeScript types for: Workflow, Task, Graph, Dependencies, Errors
- Support these task roles: architect, engineer, tester, reviewer
- Support these verification types: unit_test, llm_check, file_exists, custom
- Support these node states: CREATED → READY → RUNNING → VERIFYING → SUCCESS | FAILED | RETRY | BLOCKED | ROLLBACK
- Design error types: ParseError, SchemaError, DependencyError, CycleError

**Constraints:**

- Types must enable immutable graph construction
- Types must support cycle detection algorithms
- Types must be serializable for debugging

---

#### W2: Dependency Resolution Engine

**Task ID:** V20-P1-W2-DEPENDENCIES  
**Objective:** Build the system that understands task relationships and detects cycles.  
**Agent Power Tier:** HIGH (Codex o1 for graph algorithms)  
**Success Signal:** Can detect cycles in complex dependency graphs; produces edges list.

**Requirements:**

- Extract explicit dependencies from `depends_on` fields
- Extract implicit dependencies from template syntax (e.g., `{{taskId.output}}`)
- Build adjacency representations for efficient traversal
- Implement cycle detection (DFS or Kahn's algorithm)
- Report exact cycle path when found

**Constraints:**

- Algorithm must handle 1000+ nodes efficiently
- Self-dependencies must be caught as errors
- Unknown dependency references must be caught as errors

---

#### W3: Schema Validation Layer

**Task ID:** V20-P1-W3-VALIDATION  
**Objective:** Ensure workflow files conform to DexGraph schema rules.  
**Agent Power Tier:** BALANCED (Gemini for structured rules)  
**Success Signal:** Invalid workflows are rejected with clear error messages.

**Requirements:**

- Validate required fields presence (name, tasks, version)
- Validate field types and formats
- Validate task ID uniqueness
- Validate role values are from allowed set
- Validate verification types are from allowed set
- Return structured validation result (ok / errors[])

**Constraints:**

- Must support schema versioning for future evolution
- Must produce actionable error messages with line numbers
- Validation should be streamable for large files

---

#### W4: Integration & Test Coverage

**Task ID:** V20-P1-W4-INTEGRATION  
**Objective:** Complete the parser module with comprehensive tests and documentation.  
**Agent Power Tier:** HIGH (Codex o1 for test completeness)  
**Success Signal:** 90%+ coverage, all edge cases tested, example workflows provided.

**Requirements:**

- Assemble complete `parse()` function from W1-W3 components
- Create example workflow files demonstrating features
- Write unit tests covering:
  - Valid workflows (happy path)
  - Missing required fields
  - Invalid field types
  - Duplicate task IDs
  - Unknown dependencies
  - Circular dependencies
  - Self-dependencies
  - Template-based implicit dependencies
- Ensure Node.js built-in test runner compatibility

**Constraints:**

- Tests must run in isolation (no external dependencies)
- Tests must complete in < 5 seconds total
- Example files serve as documentation

---

### SEQUENCE

```
W1 (Types) → W2 (Dependencies) ║ W3 (Validation) → W4 (Integration)
```

- W1 is foundation for W2 and W3
- W2 and W3 can proceed in parallel after W1
- W4 integrates all previous work

### OUTPUT ARTIFACTS

| Artifact          | Location                        | Purpose                                 |
| ----------------- | ------------------------------- | --------------------------------------- |
| Type Definitions  | `dexgraph/types.ts`             | Domain model for entire DexGraph system |
| Parser Module     | `dexgraph/parser.ts`            | Entry point: file → graph               |
| Schema Validator  | `dexgraph/validator.ts`         | YAML schema enforcement                 |
| Error Types       | `dexgraph/errors.ts`            | Structured error handling               |
| Parser Tests      | `tests/dexgraph/parser.test.ts` | Coverage and regression prevention      |
| Example Workflows | `examples/*.dex`                | Documentation and manual testing        |

### VALIDATION GATES (Before marking Phase 1 complete)

- [ ] All TypeScript compiles without errors
- [ ] All tests pass (`node --test tests/dexgraph/parser.test.ts`)
- [ ] Example workflows parse successfully
- [ ] Invalid inputs produce helpful error messages
- [ ] No dependencies on other phases (standalone module)

### RISK MITIGATION

| Risk                           | Impact | Mitigation                                     |
| ------------------------------ | ------ | ---------------------------------------------- |
| YAML library changes           | Medium | Pin `yaml@2.x`, lock in package-lock           |
| Template syntax conflicts      | Low    | `{{ }}` is safe in YAML strings per spec       |
| Schema evolution               | Low    | Version field allows future breaking changes   |
| Performance on large workflows | Medium | Design for O(N) parsing, test with 1000+ tasks |

### COST TRACKING

| Window | Tier     | Agent       | Est. Tokens |
| ------ | -------- | ----------- | ----------- |
| W1     | HIGH     | Claude Opus | ~8K         |
| W2     | HIGH     | Codex o1    | ~8K         |
| W3     | BALANCED | Gemini Pro  | ~6K         |
| W4     | HIGH     | Codex o1    | ~10K        |

---

_Phase 1 dispatches | High-Level Orchestrator | v2.1_
