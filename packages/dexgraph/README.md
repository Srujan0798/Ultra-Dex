# @ultra-dex/dexgraph

> Define AI workflows in YAML. DexGraph compiles them into DAGs, schedules tasks in parallel where possible, dispatches to providers via `@ultra-dex/sdk`, verifies outputs, and handles failures automatically.

## Install

```bash
npm install @ultra-dex/dexgraph
```

## Quickstart

```yaml
# workflow.dex
version: dexgraph/v1
name: research-and-summarize

tasks:
  - id: search
    role: engineer
    instruction: Search the web

  - id: analyze
    role: engineer
    instruction: Analyze results
    depends_on: [search]

  - id: summarize
    role: engineer
    instruction: Summarize findings
    depends_on: [analyze]
```

```typescript
import { parse, DexGraph, Scheduler, StateMachine } from '@ultra-dex/dexgraph';

const result = parse('./workflow.dex');
const graph = new DexGraph(result);
const scheduler = new Scheduler(graph);

console.log(graph.getExecutionOrder());
// → ['search', 'analyze', 'summarize']
```

## API

- `parse(filepath)` — Parse YAML workflow into `DexGraphResult`
- `DexGraph` — DAG builder + cycle detection
- `Scheduler` — Topological sort + parallel batching
- `StateMachine` — Node state transitions (`CREATED → READY → RUNNING → SUCCESS`)
- `Dispatcher` — Task dispatch with context injection
- `createVerifier()` — Output verification against rules
- `ContextInjector` — Inter-task data passing

## License

MIT
