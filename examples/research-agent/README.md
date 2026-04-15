# Ultra-Dex Research Agent Example

A complete working example that combines **@ultra-dex/sdk** (AI provider routing) with **@ultra-dex/dexgraph** (workflow orchestration) to build a multi-step research agent.

## What it does

```
research → analyze → summarize
```

1. **Research** — gather facts about a topic
2. **Analyze** — identify key trends from the research
3. **Summarize** — distill into actionable takeaways

Each step is automatically routed to the cheapest available AI provider by the SDK's SmartRouter.

## Run it

```bash
# Install dependencies
npm install

# Run the example
npm start
```

No API keys needed — this demo uses simulated providers.

## What you'll see

```
🚀 Ultra-Dex Research Agent Example

Workflow: research-agent
Description: Research a topic, analyze findings, and summarize into actionable insights
Execution order: research → analyze → summarize

Running with CHEAPEST routing strategy...

✅ Workflow Complete

Nodes succeeded: research, analyze, summarize
Nodes failed: none
Duration: 626 ms

📊 Provider Routing Breakdown
┌─────────┬─────────────┬─────────────────┬──────────────────┬────────────────┐
│ (index) │ Provider    │ Requests Routed │ Avg Latency (ms) │ Total Cost ($) │
├─────────┼─────────────┼─────────────────┼──────────────────┼────────────────┤
│ 0       │ 'openai'    │ 0               │ 0                │ '0.0000'       │
│ 1       │ 'anthropic' │ 0               │ 0                │ '0.0000'       │
│ 2       │ 'google'    │ 3               │ 200              │ '0.0450'       │
├─────────┴─────────────┴─────────────────┴──────────────────┴────────────────┤

💡 Cost Optimization
This workflow routed 3 requests and cost $0.0450.
Using OpenAI for all steps would have cost $0.2250.
Dynamic routing saved ~80% automatically.
```

## How it works

### 1. Define the workflow in YAML

```yaml
version: dexgraph/v1
name: research-agent

tasks:
  - id: research
    role: engineer
    instruction: Gather key facts about the topic

  - id: analyze
    role: architect
    instruction: Analyze the research findings
    depends_on: [research]

  - id: summarize
    role: reviewer
    instruction: Summarize into actionable takeaways
    depends_on: [analyze]
```

### 2. Configure the SDK router

```javascript
import { UltraDex } from '@ultra-dex/sdk';

const dex = new UltraDex();
dex.registerProvider('openai', openaiProvider);
dex.registerProvider('anthropic', anthropicProvider);
dex.enableRouter({ strategy: 'cheapest' });
```

### 3. Bridge DexGraph → SDK

```javascript
import { DexGraph, Scheduler, UltraDexAdapter } from '@ultra-dex/dexgraph';

const graph = new DexGraph(/* parsed workflow */);
const adapter = new UltraDexAdapter(dex);

const scheduler = new Scheduler(graph, {
  dispatch: (node) => adapter.run({ nodeId: node.id, input: { prompt: node.instruction } })
});

await scheduler.run();
```

## Use with real providers

Swap the `createMockProvider` calls for real provider wrappers. See the `real-providers-workflow.js` demo in the `@ultra-dex/dexgraph` package for OpenAI, Anthropic, and Google integrations.

## Next steps

- Read the [SDK docs](https://ultradex-docs.vercel.app/)
- Try the [Pro Dashboard](https://ultradex-dashboard.vercel.app/)
- Star the [repo](https://github.com/Srujan0798/Ultra-Dex)
