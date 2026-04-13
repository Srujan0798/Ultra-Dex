# Phase 2: DexGraph Core — Graph Builder (Week 1)

### OBJECTIVE

Construct the validated DAG execution graph from parsed workflow definitions. This is the single source of truth for workflow execution — the bridge between declarative workflows and actual task ordering.

### SUCCESS CRITERIA (Define "Done")

- [ ] Graph correctly stores nodes and edges from parser output
- [ ] Cycle detection finds and reports all circular dependencies
- [ ] Topological sort produces valid execution order respecting dependencies
- [ ] Graph supports querying executable nodes based on state
- [ ] 95%+ test coverage on graph operations
- [ ] Graph handles 10,000+ nodes without performance degradation

### INVARIANTS (Non-Negotiable Constraints)

1. **Graph is immutable**: Once built, graph structure cannot be modified
2. **No cycles allowed**: Any cycle detection invalidates the entire graph
3. **Deterministic ordering**: Same graph always produces same topological sort
4. **Thread-safe queries**: Concurrent reads must be safe (graph is read-only after build)
5. **Fail fast on invalid input**: Invalid nodes/edges throw immediately, not silently

### INTEGRATION CONTRACT

**Input** (from Phase 1 - Parser):

```typescript
// Parsed workflow representation:
// - Node collection with metadata
// - Edge collection with dependency relationships
// - Validation status (ok / error)
```

**Output** (to Phase 3 - Scheduler):

```typescript
// Validated execution graph:
// - Nodes indexed by ID for O(1) lookup
// - Adjacency lists for dependency traversal
// - Topological ordering for execution sequence
// - Query methods: getExecutableNodes(), getDependencies(), etc.
// - Immutable - no structural changes after construction
```

**Error Output** (to CLI / User):

```typescript
// Graph construction errors:
// - Duplicate node IDs
// - Edges referencing non-existent nodes
// - Circular dependency detected (with cycle path)
// - Invalid state transitions attempted
```

### SCOPE BOUNDARIES

**IN Scope:**

- Node registry (store, lookup, query by state)
- Edge management (add, validate, build adjacency)
- Graph construction from parser output
- Cycle detection (DFS-based or similar)
- Topological sorting (Kahn's or DFS-based)
- Executable node queries (ready + deps satisfied)
- Graph validation and error reporting

**OUT of Scope (handled by other phases):**

- State machine transitions (Phase 3)
- Task execution (Phase 4)
- Parallel execution decisions (Phase 4)
- Persistence/saving graphs (Phase 7)
- Distributed graph partitioning (Phase 9)

### WINDOWS (High-Level Work Units)

#### W1: Node Registry

**Task ID:** V20-P2-W1-NODES  
**Objective:** Build the node storage and indexing system for efficient lookup and queries.  
**Agent Power Tier:** HIGH (Claude Opus for data structure correctness)  
**Success Signal:** O(1) node lookup, supports querying by state, enforces ID uniqueness.

**Requirements:**

- Store nodes by ID with fast lookup
- Enforce uniqueness - duplicate IDs throw
- Support retrieval: by ID, all nodes, by state
- Support existence checks
- Support node count queries
- Thread-safe for concurrent reads

**Constraints:**

- Must handle 10,000+ nodes efficiently
- Must integrate with Phase 1 types
- Must be immutable after construction
- Must support state-based filtering

---

#### W2: Edge Management

**Task ID:** V20-P2-W2-EDGES  
**Objective:** Build edge storage and adjacency structures for dependency traversal.  
**Agent Power Tier:** BALANCED (Claude Sonnet for speed)  
**Success Signal:** Forward and reverse adjacency built, dependency queries work.

**Requirements:**

- Store edges with validation (both nodes must exist)
- Build adjacency list: node → dependents
- Build reverse adjacency: node → dependencies
- Support edge retrieval
- Support dependency queries: what does this node depend on
- Support dependent queries: what depends on this node
- Support root/leaf node identification

**Constraints:**

- Must handle dense graphs efficiently
- Must validate edge endpoints exist
- Must support cycle detection algorithms
- Must be immutable after construction

---

#### W3: Cycle Detection

**Task ID:** V20-P2-W3-CYCLES  
**Objective:** Implement algorithm to detect and report circular dependencies.  
**Agent Power Tier:** HIGH (Codex o1 for algorithm correctness)  
**Success Signal:** All cycles detected with exact path reported.

**Requirements:**

- Detect any cycles in the graph
- Report exact cycle path (node A → B → C → A)
- Support multiple independent cycle detection
- Use efficient algorithm (DFS 3-color or similar)
- Throw descriptive error with cycle path
- Handle self-cycles (node depends on itself)

**Constraints:**

- Must handle large graphs (10,000+ nodes)
- Must complete in O(V+E) time
- Must report all cycles, not just first found
- Must handle disconnected graph components

---

#### W4: Execution Ordering & Tests

**Task ID:** V20-P2-W4-ORDERING  
**Objective:** Build topological sort and executable node queries, with comprehensive tests.  
**Agent Power Tier:** BALANCED (Gemini for comprehensive test generation)  
**Success Signal:** Correct execution order, proper executable node detection, 95%+ coverage.

**Requirements:**

- Implement topological sort producing valid execution order
- Respect all dependency constraints
- Detect cycles defensively (should be pre-validated)
- Query executable nodes: READY state + all deps SUCCESS
- Factory method to build graph from Phase 1 output
- Comprehensive test suite covering:
  - Linear chains
  - Diamond patterns
  - Complex branching
  - Cycle detection
  - Self-cycles
  - Executable node queries
  - Error conditions

**Constraints:**

- Must use efficient algorithm (Kahn's BFS or DFS)
- Must handle disconnected graphs
- Must be deterministic (same output for same input)
- Tests must cover edge cases and error paths

---

### SEQUENCE

```
W1 (Nodes) → W2 (Edges) → W3 (Cycles) → W4 (Ordering + Tests)
```

- Strictly sequential - each window builds on previous
- W4 integrates all components

### OUTPUT ARTIFACTS

| Artifact     | Location                       | Purpose                        |
| ------------ | ------------------------------ | ------------------------------ |
| Graph Class  | `dexgraph/graph.ts`            | Core DAG implementation        |
| Graph Types  | `dexgraph/types.ts`            | Graph-specific type extensions |
| Graph Errors | `dexgraph/errors.ts`           | Graph-specific error classes   |
| Graph Tests  | `tests/dexgraph/graph.test.ts` | Comprehensive test coverage    |

### VALIDATION GATES

- [ ] Graph stores nodes and edges correctly
- [ ] Cycle detection finds all circular dependencies
- [ ] Topological sort produces valid execution order
- [ ] getExecutableNodes respects dependency states
- [ ] 95%+ graph tests pass
- [ ] Factory builds graph from Phase 1 output
- [ ] No memory leaks with 10,000+ nodes

### RISK MITIGATION

| Risk                                  | Impact | Mitigation                                        |
| ------------------------------------- | ------ | ------------------------------------------------- |
| Cycle detection misses partial cycles | High   | Multiple algorithm verification, thorough tests   |
| Topological sort non-deterministic    | Medium | Fixed tie-breaking rules, seeded random if needed |
| Large graph performance degradation   | Medium | O(V+E) algorithms, benchmark with 10K+ nodes      |
| State + dependency race conditions    | Medium | Immutable graph, snapshot-based queries           |

### COST TRACKING

| Window | Tier     | Agent         | Est. Tokens |
| ------ | -------- | ------------- | ----------- |
| W1     | HIGH     | Claude Opus   | ~8K         |
| W2     | BALANCED | Claude Sonnet | ~6K         |
| W3     | HIGH     | Codex o1      | ~8K         |
| W4     | BALANCED | Gemini Pro    | ~10K        |

---

_Phase 2 dispatches | High-Level Orchestrator | v2.1_
