# Ultra-Dex

Route any AI task to any provider with persistent memory.

[![Version](https://img.shields.io/badge/version-3.1.0-blue.svg)](package.json) [![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE) [![Node >=18](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](package.json) [![CI](https://github.com/Srujan0798/Ultra-Dex/actions/workflows/ci.yml/badge.svg)](https://github.com/Srujan0798/Ultra-Dex/actions/workflows/ci.yml)

## What Is Ultra-Dex?

Ultra-Dex is a CLI-first orchestration layer for running AI tasks through a consistent command surface. It can route work across multiple providers, run agent-style workflows, and persist project state and run artifacts on disk. The repo is active and usable today, but the most reliable workflow right now is running from source rather than treating it as a polished published product.

## Quick Start

The package name is `@ultra-dex/cli`, but the source workflow below is the safest path today.

```bash
git clone https://github.com/Srujan0798/Ultra-Dex.git && cd Ultra-Dex && npm install

# Option 1: With Docker (Redis + Postgres)
docker compose up  # Start with full database layer

# Option 2: Without Docker (file-based memory)
npm run ultra-dex -- config --set providers.default=nvidia
MOCK_AI=true npm run ultra-dex -- run planner -t "hello"
MOCK_AI=true npm run ultra-dex -- swarm "draft a launch checklist"
npm run ultra-dex -- serve
```

Notes:

- `docker compose up` starts Ultra-Dex with Redis and Postgres for production-grade persistence
- `MEMORY_BACKEND=file` can be used without Docker for file-based memory
- `MOCK_AI=true` lets you verify the CLI without any provider keys.
- `serve` starts the local server on port `3001` by default.
- Once you add a real provider key, drop `MOCK_AI=true` and choose a provider with `-p`.

## Why Ultra-Dex?

| Tool              | Best at                                | Multi-provider CLI | Persistent local state | Agent workflow | Honest tradeoff                                           |
| ----------------- | -------------------------------------- | ------------------ | ---------------------- | -------------- | --------------------------------------------------------- |
| Ultra-Dex         | CLI-driven orchestration from one repo | Yes                | Yes                    | Yes            | Powerful, but still rough around packaging and onboarding |
| LangChain         | Building library-level app logic       | Not the focus      | You assemble it        | Partial        | Mature ecosystem, less opinionated CLI workflow           |
| CrewAI            | Multi-agent Python workflows           | Partial            | You assemble it        | Yes            | Good agent abstractions, but Python-first                 |
| Raw provider APIs | Maximum control                        | No                 | No                     | No             | Lowest abstraction, highest setup cost                    |

Ultra-Dex is worth using if you want one command surface for routing, execution, diagnostics, and project-local artifacts. It is not yet the cleanest choice if your priority is a minimal install story or a tiny dependency footprint.

## Supported Providers

These are the provider IDs exposed by the current CLI factory:

| Provider ID | Backing service  | Configuration                                                      |
| ----------- | ---------------- | ------------------------------------------------------------------ |
| `claude`    | Anthropic Claude | `ANTHROPIC_API_KEY`                                                |
| `openai`    | OpenAI           | `OPENAI_API_KEY`                                                   |
| `gemini`    | Google Gemini    | `GOOGLE_AI_KEY`                                                    |
| `nvidia`    | NVIDIA Nemotron  | `NVIDIA_API_KEY`                                                   |
| `ollama`    | Local Ollama     | `ULTRA_DEX_ENABLE_LOCAL_PROVIDERS=1` and a running Ollama instance |
| `router`    | Hybrid router    | Uses whichever configured providers are available                  |
| `mock`      | Test provider    | Set `MOCK_AI=true`                                                 |

## Core Concepts

### Routing

`ultra-dex run` selects an execution path for a named agent and can either use the provider you specify or fall back to the default/provider router logic already in the CLI. In practice, the safest workflow today is to be explicit about the agent and provider when you care about repeatability.

### Agents

Ultra-Dex ships with named roles such as `planner`, `cto`, `backend`, `frontend`, `reviewer`, and `debugger`. `run` executes a single agent loop, while `swarm` chains a broader workflow together and stores artifacts for later inspection.

### Memory

Today the most dependable memory story is local persistence: config files, run artifacts, and project state stored under `.ultra-dex/` and related project files. Redis and Postgres support exist in the repo, but file-backed local usage is still the path to trust first.

### Governance

The CLI already applies governance checks around execution and records traces/artifacts for debugging. That makes it more structured than a shell script wrapper, even if some enterprise-facing claims in older docs were ahead of the implementation.

## CLI Reference

| Command                     | What it does                        | Example                                                 |
| --------------------------- | ----------------------------------- | ------------------------------------------------------- |
| `ultra-dex run <agent>`     | Run one agent task                  | `npm run ultra-dex -- run planner -t "hello"`           |
| `ultra-dex swarm <feature>` | Run a multi-agent workflow          | `npm run ultra-dex -- swarm "draft a launch checklist"` |
| `ultra-dex config`          | Show or update project config       | `npm run ultra-dex -- config --show`                    |
| `ultra-dex doctor`          | Check local environment health      | `npm run ultra-dex -- doctor`                           |
| `ultra-dex serve`           | Start the local server/MCP endpoint | `npm run ultra-dex -- serve --port 3001`                |
| `ultra-dex --help`          | Show top-level command help         | `npm run ultra-dex -- --help`                           |
| `ultra-dex --version`       | Print the CLI version               | `npm run ultra-dex -- --version`                        |

If you have a global install later, replace `npm run ultra-dex --` with `ultra-dex`.

## Configuration

Start from the checked-in template:

```bash
cp .env.example .env
```

Minimal example:

```bash
# Pick one provider
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
GOOGLE_AI_KEY=
NVIDIA_API_KEY=

# Optional defaults
ULTRA_DEX_DEFAULT_PROVIDER=nvidia

# Optional local infrastructure
REDIS_URL=redis://localhost:6379
DATABASE_URL=postgresql://ultradex:password@localhost:5432/ultradex
MEMORY_BACKEND=file
```

You can set a project-local default with:

```bash
npm run ultra-dex -- config --set providers.default=nvidia
```

If you prefer prompts, the interactive wizard still exists:

```bash
npm run ultra-dex -- config --wizard
```

## Docker

The repo includes `docker-compose.yml` and `Dockerfile` for local infrastructure and app startup.

```bash
cp .env.example .env
docker compose up
```

If you do not want Redis or Postgres locally, keep using the source workflow and set:

```bash
MEMORY_BACKEND=file
```

## Contributing

Contributions are welcome. Start with [CONTRIBUTING.md](CONTRIBUTING.md) and [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for setup, testing, and repo layout.

## License

MIT. See [LICENSE](LICENSE).
