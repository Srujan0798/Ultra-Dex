# CLAUDE.md

> **PROJECT STATUS: v2.1.0 - ETERNAL STATE ACHIEVED** | All tests passing (306 unit, 44 integration) | All 6 NoopSubsystems replaced

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development

```bash
npm start                    # Run the CLI
npm run dev                  # Run CLI with file watch (hot reload)
npm run demo                 # Run a demo with MOCK_AI=true (no real API calls)
```

### Build

```bash
npm run build                # Build all (core + dashboard)
npm run build:core           # Core modules only
npm run build:cli            # Bundle CLI via esbuild → dist/ultra-dex.js
npm run build:dashboard      # Dashboard app
```

### Testing

```bash
npm test                     # All tests (unit + integration + CLI), 30s timeout
npm run test:unit            # tests/core/*.test.js
npm run test:integration     # tests/integration/*.test.js, 60s timeout
npm run test:cli             # tests/cli/*.test.js
npm test -- tests/core/some.test.js   # Single test file
npm run test:watch           # Watch mode for core unit tests
npm run test:coverage        # With spec reporter
```

Tests use Node's built-in `node --test` runner (not Jest/Vitest). `NODE_ENV=test` is set automatically.

### Lint & Format

```bash
npm run lint                 # ESLint on apps/cli/lib (JS/TS)
npm run lint:fix             # Auto-fix ESLint issues
npm run format               # Prettier on all files
npm run format:check         # Prettier check (CI-safe)
npm run typecheck            # TypeScript noEmit check
```

### Pre-commit gates (run before committing)

```bash
npm run governance           # Pre-commit governance checks
npm run gate:local           # Full local enterprise gate
```

## Architecture

Ultra-Dex is an **AI orchestration meta-layer** — it routes tasks across AI providers, coordinates multi-agent swarms, and maintains persistent memory. It is an ES Module monorepo (`"type": "module"`), Node >=18.

### Core execution flow

```
CLI (apps/cli/bin/ultra-dex.js)
  └─ Command (apps/cli/lib/commands/*.js)
       └─ AgentOrchestrator.executeNexus() / executeTask()
            ├─ Governance check (src/core/governance/)
            ├─ Memory search (src/core/memory/)
            ├─ Agent selection (src/core/agents/)
            └─ AIMetaLayer.call() → Provider (src/services/ai-providers/)
```

### Key modules

| Path                                        | Role                                                                                                 |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `apps/cli/bin/ultra-dex.js`                 | CLI entry point; Commander.js, lazy command loading                                                  |
| `apps/cli/lib/commands/run.js`              | `run`, `swarm`, `distributed` commands                                                               |
| `src/core/orchestration/index.js`           | `AgentOrchestrator` (also exported as `nexus`) — multi-agent coordination, task graphs, self-healing |
| `src/core/ai/ai-meta-layer.js`              | `AIMetaLayer` — provider abstraction, cost/latency/quality routing, caching, token tracking          |
| `src/core/memory/unified-api.js`            | `ppmManager` — tiered persistent memory, semantic/vector search                                      |
| `src/core/governance/governance-manager.js` | Policy enforcement; throws `DeniedException` on violations                                           |
| `src/core/mcp/`                             | Model Context Protocol server and tool registry                                                      |
| `src/services/ai-providers/router.js`       | Routes requests to the right provider with fallback chains                                           |
| `src/index.js`                              | Top-level export of the whole platform                                                               |

### AI providers

Providers live in `src/services/ai-providers/` and implement a common interface. Supported: OpenAI, Anthropic, Google Gemini, NVIDIA Nemotron, Mistral, Groq, DeepSeek, Cohere, Together AI, Fireworks, Perplexity, Grok, Llama 4. The router selects by cost / latency / quality or explicit override. Set `MOCK_AI=true` to use the mock provider (no API calls).

### Agent system

Predefined roles in `src/core/agents/`: Planner, Backend, Frontend, CTO, Reviewer, Database, Auth, DevOps, Debugger. Selection is capability-based. The **Ralph Loop** pattern drives autonomous multi-step execution.

### Memory system (`ppmManager`)

Three tiers: instant (in-process), session, persistent. Supports vector-based semantic search and graph-based knowledge storage. All task results are stored back into memory automatically.

### Governance

Every task and tool execution passes through `GovernanceManager` before running. Violations throw `DeniedException`. Audit logs are written for all actions.

## Code style

- **TypeScript**: strict mode, interfaces over types, explicit param/return types, `unknown` not `any`
- **Naming**: `camelCase` vars/functions, `PascalCase` classes, `UPPER_SNAKE_CASE` constants, filenames match class name
- **Imports**: use `src/` alias (not relative `../../`), e.g. `import { Service } from 'src/services/service'`
- **Async**: async/await with try/catch; no floating promises
- **Errors**: custom classes extending `Error`; log via `winston`; never swallow
- **Commits**: conventional commits (`feat:`, `fix:`, `chore:`, etc.)
