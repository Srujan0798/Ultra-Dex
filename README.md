# Ultra-Dex

**Route AI tasks across providers. Orchestrate multi-agent workflows. Persist everything.**

[![npm](https://img.shields.io/npm/v/@ultra-dex/sdk?label=%40ultra-dex%2Fsdk)](https://www.npmjs.com/package/@ultra-dex/sdk)
[![npm](https://img.shields.io/npm/v/@ultra-dex/dexgraph?label=%40ultra-dex%2Fdexgraph)](https://www.npmjs.com/package/@ultra-dex/dexgraph)
[![CI](https://github.com/Srujan0798/Ultra-Dex/actions/workflows/ci.yml/badge.svg)](https://github.com/Srujan0798/Ultra-Dex/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

Ultra-Dex is an AI orchestration layer that routes tasks across providers (OpenAI, Anthropic, Google, NVIDIA, Mistral, Groq, and 7 more), coordinates multi-agent workflows as DAGs, and persists memory and execution state automatically.

**[Website](https://ultradex.vercel.app)** | **[Docs](https://ultradex-docs.vercel.app)** | **[Dashboard](https://ultradex-dashboard.vercel.app)**

---

## Install

```bash
npm install @ultra-dex/sdk        # Provider routing + smart selection
npm install @ultra-dex/dexgraph   # Workflow orchestration engine
```

## Quick Example

### Route to the cheapest provider automatically

```javascript
import { UltraDex } from '@ultra-dex/sdk';

const dex = new UltraDex();
dex.registerProvider('openai', openaiProvider);
dex.registerProvider('anthropic', anthropicProvider);
dex.registerProvider('google', googleProvider);

// SDK picks the cheapest provider for each call
dex.enableRouter({ strategy: 'cheapest' });

const result = await dex.chat('Explain quantum computing');
// Routed to google (cheapest) — saved 80% vs OpenAI
```

### Orchestrate a multi-step workflow

```yaml
# workflow.yaml
version: dexgraph/v1
name: research-agent

tasks:
  - id: research
    role: engineer
    instruction: Gather key facts about the topic

  - id: analyze
    role: architect
    instruction: Identify the most important trends
    depends_on: [research]

  - id: summarize
    role: reviewer
    instruction: Distill into actionable takeaways
    depends_on: [analyze]
```

```bash
npx @ultra-dex/dexgraph run workflow.yaml
# Execution order: research -> analyze -> summarize
# All 3 nodes succeeded in 330ms
```

## Architecture

```
@ultra-dex/sdk                        @ultra-dex/dexgraph
+-----------------------+             +------------------------+
| SmartRouter           |             | YAML Parser            |
|   cheapest / fastest  |   bridge    | DAG Builder (DexGraph) |
|   quality / fallback  | <--------+ | Scheduler              |
| Provider Registry     |             | State Machine          |
| Middleware Pipeline   |             | UltraDexAdapter        |
+-----------------------+             +------------------------+
         |                                       |
    13+ AI Providers                    Workflow Orchestration
    (OpenAI, Anthropic,                 (parallel, sequential,
     Google, NVIDIA, ...)                retry, halt-on-fail)
```

## Supported Providers

| Provider   | ID          | Model examples                         |
| ---------- | ----------- | -------------------------------------- |
| OpenAI     | `openai`    | GPT-4o, GPT-4, GPT-3.5                |
| Anthropic  | `anthropic` | Claude Opus, Sonnet, Haiku             |
| Google     | `google`    | Gemini Pro, Gemini Flash               |
| NVIDIA     | `nvidia`    | Nemotron, Llama 3.1 via NVIDIA API     |
| Mistral    | `mistral`   | Mistral Large, Medium, Small           |
| Groq       | `groq`      | Llama, Mixtral via Groq inference      |
| DeepSeek   | `deepseek`  | DeepSeek V3, DeepSeek Coder           |
| Cohere     | `cohere`    | Command R, Command R+                  |
| Together   | `together`  | Open-source models via Together AI     |
| Fireworks  | `fireworks` | Fast open-source inference             |
| Perplexity | `perplexity`| Sonar models with web search           |
| Grok       | `grok`      | Grok-2                                 |
| Llama      | `llama`     | Llama 4 via Meta API                   |

## CLI

The full CLI provides agent-based task execution, swarm workflows, and diagnostics:

```bash
git clone https://github.com/Srujan0798/Ultra-Dex.git && cd Ultra-Dex && npm install

# Run with mock provider (no API keys needed)
MOCK_AI=true npm start -- run planner -t "design a REST API"

# Multi-agent swarm
MOCK_AI=true npm start -- swarm "build a landing page"

# Start local server + MCP endpoint
npm start -- serve
```

## Key Features

- **Smart Routing** — 4 strategies: cheapest, fastest, quality-weighted, fallback chain
- **DAG Orchestration** — Define workflows in YAML, execute as dependency graphs
- **13+ Providers** — One interface for all major AI providers
- **Persistent Memory** — SQLite-backed storage with vector search and graph queries
- **Multi-Agent Swarms** — Named agent roles (planner, backend, frontend, reviewer, debugger)
- **Governance** — Policy enforcement, audit logging, execution traces
- **MCP Server** — Model Context Protocol integration for tool registries

## Project Structure

```
packages/sdk/         @ultra-dex/sdk — provider routing and smart selection
packages/dexgraph/    @ultra-dex/dexgraph — workflow DAG engine
apps/cli/             CLI with 55+ commands
apps/website/         Marketing site (Next.js)
apps/dashboard/       SaaS dashboard (Next.js)
apps/docs-site/       Documentation (Docusaurus)
src/core/             Core engine (orchestration, memory, governance, agents)
examples/             Working examples
tests/                526 tests (unit + integration + CLI)
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, testing, and guidelines.

## License

MIT. See [LICENSE](LICENSE).
