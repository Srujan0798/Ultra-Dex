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

## DexGraph + UltraDex SDK Integration

Connect DexGraph to the `@ultra-dex/sdk` SmartRouter so each workflow step is automatically routed to the cheapest/fastest AI provider.

```typescript
import { UltraDex } from '@ultra-dex/sdk';
import { DexGraph, Scheduler, UltraDexAdapter } from '@ultra-dex/dexgraph';

// 1. Set up SDK with providers and SmartRouter
const dex = new UltraDex();
dex.registerProvider('openai', openaiProvider);
dex.registerProvider('anthropic', anthropicProvider);
dex.enableRouter({ strategy: 'cheapest' });

// 2. Create DexGraph workflow
const graph = new DexGraph(parsedWorkflow);

// 3. Bridge DexGraph → SDK via UltraDexAdapter
const adapter = new UltraDexAdapter(dex);
const scheduler = new Scheduler(graph, {
  dispatch: (node) => adapter.run({
    nodeId: node.id,
    taskType: node.role,
    input: { prompt: node.instruction },
    timeout: 30000,
  }),
});

// 4. Run — each step routes to the best provider automatically
const result = await scheduler.run();
```

### Why this matters

- **Workflow layer (DexGraph)** handles DAG scheduling, retries, verification, and inter-task context
- **Routing layer (SDK)** handles provider selection, failover, and cost tracking
- Together they form an end-to-end agentic orchestration stack

## Demo

A full working demo is included in the package:

```bash
# From the repo root:
node packages/dexgraph/demo/research-workflow.js
```

This runs a 3-step `research → analyze → summarize` workflow across simulated providers and shows exactly how much dynamic routing saves vs single-provider.

## API

- `parse(filepath)` — Parse YAML workflow into `DexGraphResult`
- `DexGraph` — DAG builder + cycle detection
- `Scheduler` — Topological sort + parallel batching
- `StateMachine` — Node state transitions (`CREATED → READY → RUNNING → SUCCESS`)
- `Dispatcher` — Task dispatch with context injection
- `createVerifier()` — Output verification against rules
- `ContextInjector` — Inter-task data passing
- `UltraDexAdapter` — Bridges DexGraph to `@ultra-dex/sdk` for dynamic provider routing

## License

MIT
