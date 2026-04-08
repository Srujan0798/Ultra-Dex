# Ultra-Dex v3.1.0

AI orchestration meta-layer for routing model calls, coordinating multi-agent execution, and preserving long-term memory.

[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D22.12.0-brightgreen.svg)](https://nodejs.org/)

## What it does

- Routes requests across multiple AI providers using cost/latency/capability signals.
- Coordinates autonomous and role-based agent execution workflows.
- Persists memory across instant, session, and long-term storage layers.
- Enforces governance, auditing, and enterprise security controls.

## Quick start

```bash
npm install
npm run build
npm run start:server
```

## Common commands

| Command | Purpose |
| --- | --- |
| `npm start` | Run CLI from `dist/ultra-dex.js` |
| `npm run dev` | Run in watch mode |
| `npm run build` | Build core + CLI + dashboard |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript checks |
| `npm test` | Run unit + integration + CLI tests |

## Documentation map

### Start here

- `docs/README.md` - documentation index
- `docs/ARCHITECTURE.md` - architecture overview
- `docs/API.md` - API reference
- `docs/DEPLOYMENT.md` - deployment guide
- `docs/OPERATIONS.md` - operations runbook

### Root-level docs (concise)

- `DEPLOYMENT.md` - deployment quick guide
- `INTEGRATIONS.md` - integration overview
- `IMPLEMENTATION-PLAN.md` - current implementation roadmap
- `SECURITY.md` - security policy
- `CONTRIBUTING.md` - contribution workflow
- `CHANGELOG.md` - release history

### Archived historical root docs

Legacy milestone and handoff documents were moved to:

`docs/internal/archive/root-status/`

## Repository layout

| Path | Purpose |
| --- | --- |
| `apps/` | CLI and dashboard applications |
| `src/core/` | orchestration, memory, governance, billing, server |
| `src/services/` | provider integrations and service adapters |
| `tests/` | unit, integration, and CLI tests |
| `docs/` | user, operator, and internal documentation |

## License

MIT — see [LICENSE](LICENSE).
