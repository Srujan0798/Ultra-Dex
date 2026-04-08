# Ultra-Dex v3.1.0

AI orchestration meta-layer for multi-provider model routing, autonomous agent execution, persistent memory, and enterprise governance.

[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D22.12.0-brightgreen.svg)](https://nodejs.org/)

## Product summary

Ultra-Dex gives one control plane for AI-heavy engineering workflows:

- Selects the best provider/model per request (cost, latency, capability).
- Runs single-agent and multi-agent execution patterns.
- Tracks context with tiered memory (instant, session, persistent).
- Enforces governance, auditability, and production controls.
- Exposes CLI + API + dashboard surfaces for operators and builders.

## Core capabilities

| Capability | What you get | Primary implementation |
| --- | --- | --- |
| AI routing | Provider/model selection with fallback and caching | `src/core/ai/`, `src/services/ai-providers/` |
| Agent orchestration | Task decomposition, role execution, autonomous loops | `src/core/orchestration/`, `src/core/agents/` |
| Memory system | Persistent context and retrieval across workflows | `src/core/memory/` |
| Governance | Policy checks, constraints, audit events | `src/core/governance/` |
| Billing/metering | Usage tracking + Stripe webhook lifecycle | `src/core/billing/` |

## Quick start (local)

### Prerequisites

- Node.js `22.12+` (or `20.19+`)
- npm `10+`

### Setup

```bash
npm install
cp .env.example .env
npm run build
npm run start:server
```

Server default: `http://localhost:3000`

## Essential commands

| Command | Purpose |
| --- | --- |
| `npm start` | Run CLI from built output |
| `npm run dev` | Dev/watch mode |
| `npm run build` | Build core + CLI + dashboard |
| `npm run lint` | Lint checks |
| `npm run typecheck` | Type checks |
| `npm test` | Full tests (core + integration + CLI) |
| `npm run start:server` | Start production Express server entrypoint |

## Minimal environment configuration

At least one provider key is required:

```bash
OPENAI_API_KEY=...
# or ANTHROPIC_API_KEY / GOOGLE_API_KEY / etc.
```

Common production values:

```bash
NODE_ENV=production
PORT=3000
REDIS_URL=redis://127.0.0.1:6379
```

Billing/auth stack (optional unless enabled):

```bash
CLERK_SECRET_KEY=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
```

## Documentation map

| If you need | Read |
| --- | --- |
| Full docs index | `docs/README.md` |
| Architecture overview | `docs/ARCHITECTURE.md` |
| API reference | `docs/API.md` |
| Deployment details | `docs/DEPLOYMENT.md` |
| Operations and runbook | `docs/OPERATIONS.md` |
| Security policy | `SECURITY.md` |
| Contribution workflow | `CONTRIBUTING.md` |

## Repository structure

| Path | Responsibility |
| --- | --- |
| `apps/` | CLI and dashboard applications |
| `src/core/` | Orchestration, memory, governance, billing, server |
| `src/services/` | Provider and service integrations |
| `tests/` | Unit, integration, and CLI tests |
| `docs/` | Product, operator, and internal documentation |

## Notes on archived docs

Historical milestone/handoff root documents are preserved in:

`docs/internal/archive/root-status/`

## License

MIT — see [LICENSE](LICENSE).
