# Phase 2: DexGraph Core — Graph Builder (Week 1)

### OBJECTIVE
Implement dexgraph/graph.ts — build a validated DAG from parser output. Node registry, edge creation, cycle detection, topological sort. The graph is the single source of truth for workflow execution.

### SKILLS REFERENCED
- /engineering:system-design → DAG structure design
- /engineering:architecture → Graph pattern ADR

### WINDOWS

#### W1: Node Registry + Types
- Task ID: V20-P2-W1-NODE-REGISTRY
- Objective: Build node registry — stores nodes by ID, enforces uniqueness, supports lookup
- Target Files: dexgraph/graph.ts (START)
- Why this lane: Core data structure. Opus for correctness.
- Power Tier: HIGH
- Command:
```bash
claude --model opus --effort max -p \
  "Build DexGraph node registry.

   CREATE dexgraph/graph.ts:
   export class DexGraph {
     private nodes: Map<string, GraphNode>;
     private edges: GraphEdge[];
     private adjacency: Map<string, string[]>;  // node → dependents

     addNode(node: GraphNode): void  // throws if duplicate ID
     getNode(id: string): GraphNode  // throws if not found
     getAllNodes(): GraphNode[]
     getNodesByState(state: NodeState): GraphNode[]
     hasNode(id: string): boolean
     get size(): number
   }

   Import types from dexgraph/types.ts."
```
- Expected Output: DexGraph class with node registry CRUD
- Validation: `npx tsc --noEmit dexgraph/graph.ts`
- Fallback #1: `claude --model claude-sonnet-4-20250514 --effort high -p "Build node registry..."`
- Fallback #2: `codex --full-auto -m o1 exec "Create DexGraph node registry..."`
- Fallback #3: `opencode run -m opencode/qwen3-coder-480b-a35b-instruct -p "Build graph node registry..."`
- Cost Class: SUBSCRIPTION-INCLUDED
- Dependencies: Phase 1 W1 (types)

#### W2: Edge Creation + Graph Structure
- Task ID: V20-P2-W2-EDGES
- Objective: Build edge management — add edges, build adjacency list, reverse adjacency (for dependency lookup)
- Target Files: dexgraph/graph.ts (CONTINUE)
- Why this lane: Graph wiring. Sonnet for balanced speed.
- Power Tier: BALANCED
- Command:
```bash
claude --model claude-sonnet-4-20250514 --effort high -p \
  "Add edge management to DexGraph.

   ADD to dexgraph/graph.ts DexGraph class:
   addEdge(edge: GraphEdge): void
   - Validate both nodes exist
   - Add to edges array
   - Update adjacency: from → [...dependents, to]
   - Update reverse adjacency: to → [...dependencies, from]

   getEdges(): GraphEdge[]
   getDependencies(nodeId: string): string[]     // what this node depends on
   getDependents(nodeId: string): string[]        // what depends on this node
   getRootNodes(): GraphNode[]                     // nodes with 0 dependencies
   getLeafNodes(): GraphNode[]                     // nodes with 0 dependents

   static fromParseResult(result: DexGraphResult): DexGraph
   - Convenience: build graph from parser output in one call"
```
- Expected Output: Edge management + adjacency lists + fromParseResult factory
- Validation: `npx tsc --noEmit dexgraph/graph.ts`
- Fallback #1: `gemini -y -p "Add edge management to DexGraph class..."`
- Fallback #2: `codex --full-auto -m gpt-4o exec "Build graph edge system..."`
- Fallback #3: `opencode run -m opencode/deepseek-v3.2 -p "Implement graph edges and adjacency..."`
- Cost Class: SUBSCRIPTION-INCLUDED
- Dependencies: W1

#### W3: Cycle Detection Algorithm
- Task ID: V20-P2-W3-CYCLE-DETECT
- Objective: Implement DFS-based cycle detection. A workflow with circular deps is invalid and must be rejected.
- Target Files: dexgraph/graph.ts (ADD)
- Why this lane: Algorithm correctness is critical. Codex o1 for reasoning about graph traversal.
- Power Tier: HIGH
- Command:
```bash
codex --full-auto -m o1 exec \
  "Implement cycle detection for DexGraph.

   ADD to DexGraph class:
   detectCycles(): string[][] | null
   - DFS-based cycle detection
   - Returns null if no cycles (DAG is valid)
   - Returns array of cycles if found: [[nodeA, nodeB, nodeC, nodeA], ...]
   - Uses 3-color marking: white (unvisited), gray (in progress), black (done)
   - When gray node encountered from gray → cycle found
   - Track path to report exact cycle

   validateDAG(): void
   - Calls detectCycles()
   - If cycles found: throw GraphError('Circular dependency: ' + cycle.join(' → '))"
```
- Expected Output: Cycle detection with exact cycle path reporting
- Validation: `npx tsc --noEmit dexgraph/graph.ts`
- Fallback #1: `codex --full-auto -m gpt-4o exec "Implement cycle detection..."`
- Fallback #2: `claude --model opus --effort max -p "Write DFS cycle detection for DAG..."`
- Fallback #3: `opencode run -m opencode/deepseek-r1-0528 -p "Implement cycle detection in directed graph..."`
- Cost Class: SUBSCRIPTION-INCLUDED
- Dependencies: W2

#### W4: Topological Sort + Validation + Tests
- Task ID: V20-P2-W4-TOPO-SORT
- Objective: Implement topological sort for execution ordering, complete graph validation, write tests
- Target Files: dexgraph/graph.ts (COMPLETE), tests/dexgraph/graph.test.ts (NEW)
- Why this lane: Algorithm + test coverage. Gemini for comprehensive test generation.
- Power Tier: BALANCED
- Command:
```bash
gemini -y -p \
  "Complete DexGraph with topological sort and tests.

   ADD to DexGraph:
   topologicalSort(): string[]
   - Kahn's algorithm (BFS-based)
   - Returns node IDs in valid execution order
   - Respects dependency ordering
   - Throws GraphError if graph has cycles (defensive, should already be validated)

   getExecutableNodes(): GraphNode[]
   - Return nodes in READY state whose ALL dependencies are in SUCCESS state
   - This is the key function the scheduler calls

   CREATE tests/dexgraph/graph.test.ts:
   - Test: linear chain A→B→C sorts correctly
   - Test: diamond A→B,A→C,B→D,C→D sorts correctly
   - Test: cycle A→B→A detected
   - Test: self-cycle A→A detected
   - Test: getExecutableNodes returns only ready+deps-satisfied
   - Test: getRootNodes returns nodes with 0 deps
   - Test: fromParseResult builds graph correctly
   - Test: duplicate node ID throws
   - Test: edge to nonexistent node throws

   Use Node's built-in test runner."
```
- Expected Output: Topological sort + getExecutableNodes + 9 tests
- Validation:
```bash
node --test tests/dexgraph/graph.test.ts
```
- Fallback #1: `gemini -y --model gemini-2.5-flash -p "Complete DexGraph with tests..."`
- Fallback #2: `codex --full-auto -m o1 exec "Implement topo sort and graph tests..."`
- Fallback #3: `opencode run -m opencode/devstral-2-123b-instruct-2512 -p "Complete graph with sort and tests..."`
- Cost Class: FREE
- Dependencies: W1, W2, W3

### SEQUENCE
W1 → W2 → W3 → W4

### VALIDATION CRITERIA
- [ ] DexGraph class stores nodes and edges
- [ ] Cycle detection finds circular dependencies
- [ ] Topological sort produces valid execution order
- [ ] getExecutableNodes respects dependency states
- [ ] 9+ graph tests pass
- [ ] fromParseResult builds graph from parser output

### COST TRACKING
| Window | Tier | Agent | Est. Tokens |
|--------|------|-------|-------------|
| W1 | HIGH | Claude Opus | ~8K |
| W2 | BALANCED | Claude Sonnet | ~6K |
| W3 | HIGH | Codex o1 | ~8K |
| W4 | BALANCED | Gemini Pro | ~10K |

### RISKS
| Risk | Mitigation |
|------|------------|
| Large graphs slow topo sort | Kahn's is O(V+E), fine for 100s of nodes |
| Partial cycles missed | 3-color DFS catches all cycles |
| State + dependency race | getExecutableNodes is point-in-time snapshot |

---

*Phase 2 dispatches generated 2026-04-12 | DexGraph Graph Builder | 4 windows | Week 1*
