# Phase 1: DexGraph Core — Workflow DSL Parser (Week 1)

### OBJECTIVE
Implement dexgraph/parser.ts — parse YAML workflow definitions into GraphNode[] internal representation. This is the entry point of DexGraph: human-readable workflow → machine-executable graph.

### SKILLS REFERENCED
- /engineering:architecture → Parser interface ADR
- /engineering:system-design → DSL schema design
- /product-management:write-spec → Parser requirements spec

### WINDOWS

#### W1: YAML Loader + Schema Types
- Task ID: V20-P1-W1-YAML-TYPES
- Objective: Define DexGraph workflow DSL types and YAML loader
- Target Files: dexgraph/types.ts (NEW), dexgraph/parser.ts (START)
- Why this lane: Type definitions are the contract for everything downstream. Opus for precision.
- Power Tier: HIGH
- Command:
```bash
claude --model opus --effort max -p \
  "Define DexGraph workflow DSL types and YAML loader.

   CREATE dexgraph/types.ts:
   interface WorkflowDefinition {
     version: 'dexgraph/v1';
     name: string;
     description: string;
     context: Record<string, string>;
     tasks: TaskDefinition[];
     on_failure: { retry: number; rollback: boolean };
   }

   interface TaskDefinition {
     id: string;
     role: 'architect' | 'engineer' | 'tester' | 'reviewer';
     instruction: string;
     depends_on?: string[];
     context?: Record<string, string>;
     output?: string;
     verify?: VerificationRule;
     parallel?: boolean;
   }

   interface VerificationRule {
     type: 'unit_test' | 'llm_check' | 'file_exists' | 'custom';
     command?: string;
     policy?: string;
   }

   interface GraphNode {
     id: string;
     role: TaskDefinition['role'];
     instruction: string;
     dependencies: string[];
     context: Record<string, string>;
     output?: string;
     verification?: VerificationRule;
     parallel: boolean;
     state: NodeState;
   }

   type NodeState = 'CREATED' | 'READY' | 'RUNNING' | 'VERIFYING' | 'SUCCESS' | 'FAILED' | 'RETRY' | 'BLOCKED' | 'ROLLBACK';

   interface GraphEdge { from: string; to: string; }

   interface DexGraphResult {
     nodes: GraphNode[];
     edges: GraphEdge[];
     metadata: { name: string; description: string; context: Record<string, string> };
   }

   START dexgraph/parser.ts:
   import yaml from 'yaml';
   export function loadYAML(filepath: string): WorkflowDefinition"
```
- Expected Output: Complete type definitions + YAML loader function
- Validation:
```bash
npx tsc --noEmit dexgraph/types.ts dexgraph/parser.ts
```
- Fallback #1: `claude --model claude-sonnet-4-20250514 --effort high -p "Define DexGraph types..."`
- Fallback #2: `gemini -y -p "Create TypeScript types for workflow DSL..."`
- Fallback #3: `opencode run -m opencode/qwen3-coder-480b-a35b-instruct -p "Define workflow DSL types..."`
- Cost Class: SUBSCRIPTION-INCLUDED
- Dependencies: Phase 0 W1

#### W2: Dependency Extraction Logic
- Task ID: V20-P1-W2-DEPENDENCY-EXTRACT
- Objective: Parse depends_on fields, resolve {{task.output}} template refs, build edge list
- Target Files: dexgraph/parser.ts (CONTINUE), dexgraph/errors.ts (NEW)
- Why this lane: Dependency resolution has subtle edge cases. Codex o1 for reasoning.
- Power Tier: HIGH
- Command:
```bash
codex --full-auto -m o1 exec \
  "Implement dependency extraction in dexgraph/parser.ts.

   ADD: extractDependencies(tasks: TaskDefinition[]): GraphEdge[]
   - For each task with depends_on: create edge from dependency → task
   - For context containing {{taskId.output}}: create implicit edge
   - Throw ParseError on: unknown dependency, self-dependency, missing template ref

   ADD: resolveTemplates(tasks: TaskDefinition[]): TaskDefinition[]
   - Replace {{taskId.output}} with placeholder markers
   - Actual values injected at runtime (Phase 8)

   CREATE dexgraph/errors.ts:
   export class ParseError extends Error {}
   export class GraphError extends Error {}
   export class StateError extends Error {}"
```
- Expected Output: Dependency extraction + template resolution + error types
- Validation:
```bash
npx tsc --noEmit dexgraph/parser.ts dexgraph/errors.ts
```
- Fallback #1: `codex --full-auto -m gpt-4o exec "Implement dependency extraction..."`
- Fallback #2: `claude --model claude-sonnet-4-20250514 --effort high -p "Build dependency resolver..."`
- Fallback #3: `opencode run -m opencode/deepseek-r1-0528 -p "Implement dependency extraction for DAG..."`
- Cost Class: SUBSCRIPTION-INCLUDED
- Dependencies: W1

#### W3: Schema Validation Rules
- Task ID: V20-P1-W3-VALIDATION
- Objective: Validate YAML against DexGraph schema — required fields, valid roles, valid verify types
- Target Files: dexgraph/schema.ts (NEW)
- Why this lane: Validation logic. Gemini for structured rule generation at free tier.
- Power Tier: BALANCED
- Command:
```bash
gemini -y -p \
  "Implement DexGraph YAML schema validation.

   CREATE dexgraph/schema.ts:
   export function validateWorkflow(def: WorkflowDefinition): ValidationResult
   - Check version === 'dexgraph/v1'
   - Check name, tasks exist
   - Validate each task: id, role (architect|engineer|tester|reviewer), instruction
   - Validate verify types: unit_test|llm_check|file_exists|custom
   - Check duplicate task IDs
   - Return { valid: boolean, errors: string[] }"
```
- Expected Output: Schema validator catching all invalid workflow definitions
- Validation:
```bash
npx tsc --noEmit dexgraph/schema.ts
```
- Fallback #1: `gemini -y --model gemini-2.5-flash -p "Create YAML schema validator..."`
- Fallback #2: `claude --model claude-sonnet-4-20250514 --effort high -p "Build workflow validator..."`
- Fallback #3: `opencode run -m opencode/devstral-2-123b-instruct-2512 -p "Implement schema validation..."`
- Cost Class: FREE
- Dependencies: W1

#### W4: Parser Tests + Integration
- Task ID: V20-P1-W4-PARSER-TESTS
- Objective: Complete parse() function, write comprehensive tests, verify with sample .dex file
- Target Files: dexgraph/parser.ts (COMPLETE), tests/dexgraph/parser.test.ts (NEW), examples/simple.dex (NEW)
- Why this lane: Test correctness for the foundation module. Codex o1.
- Power Tier: HIGH
- Command:
```bash
codex --full-auto -m o1 exec \
  "Complete DexGraph parser and write tests.

   COMPLETE dexgraph/parser.ts — parse(filepath): DexGraphResult
   CREATE examples/simple.dex (build-saas-backend from NOTION/v2.0.MD)
   CREATE tests/dexgraph/parser.test.ts:
   - valid workflow parses, missing name throws, invalid role throws,
     duplicate IDs throws, unknown dep throws, self-dep throws,
     template creates edge, empty tasks throws, parallel defaults false

   Use Node's built-in test runner."
```
- Expected Output: Working parser with 9+ tests
- Validation:
```bash
node --test tests/dexgraph/parser.test.ts
```
- Fallback #1: `codex --full-auto -m gpt-4o exec "Complete parser and tests..."`
- Fallback #2: `claude --model opus --effort max -p "Finish parser with tests..."`
- Fallback #3: `opencode run -m opencode/qwen3-coder-480b-a35b-instruct -p "Complete parser and tests..."`
- Cost Class: SUBSCRIPTION-INCLUDED
- Dependencies: W1, W2, W3

### SEQUENCE
W1 → W2 ║ W3 → W4

### VALIDATION CRITERIA
- [ ] dexgraph/types.ts compiles with all interfaces
- [ ] parse() returns DexGraphResult from YAML
- [ ] Schema validates all required fields
- [ ] examples/simple.dex parses successfully
- [ ] 9+ parser tests pass
- [ ] Invalid YAML throws ParseError with clear message

### COST TRACKING
| Window | Tier | Agent | Est. Tokens |
|--------|------|-------|-------------|
| W1 | HIGH | Claude Opus | ~10K |
| W2 | HIGH | Codex o1 | ~8K |
| W3 | BALANCED | Gemini Pro | ~6K |
| W4 | HIGH | Codex o1 | ~12K |

### RISKS
| Risk | Mitigation |
|------|------------|
| YAML lib version | Pin yaml@2.x, test on Node 18+ |
| Template syntax conflicts | {{ }} is safe in YAML strings |
| Parser too strict | Version field allows schema evolution |

---

*Phase 1 dispatches generated 2026-04-12 | DexGraph Parser | 4 windows | Week 1*
