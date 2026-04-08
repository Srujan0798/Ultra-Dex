# Ultra-Dex Documentation Hub

Use this page to navigate docs by goal, not by folder guessing.

## Start here (recommended path)

1. `ARCHITECTURE.md` — understand system shape.
2. `API.md` — understand exposed interfaces.
3. `DEPLOYMENT.md` — understand deployment/runtime requirements.
4. `OPERATIONS.md` — understand production operations.
5. `PROJECT_STRUCTURE.md` — map code to responsibility.

## Quick navigation by intent

| I need to... | Read |
| --- | --- |
| Understand system design | `ARCHITECTURE.md`, `core/ARCHITECTURE.md` |
| Use API endpoints | `API.md`, `api/` |
| Deploy and run in production | `DEPLOYMENT.md`, `ops/`, `enterprise/DEPLOYMENT_GUIDE.md` |
| Operate and monitor | `OPERATIONS.md`, `quality/`, `verification-logs/` |
| Integrate external tools/providers | `specs/`, `api/specs/`, `AGENT_INTEGRATION_GUIDE.md` |
| Review security posture | `security/`, root `SECURITY.md` |
| Review roadmap/planning | `planning/`, `core/ROADMAP.md`, `strategy/` |

## Documentation domains

| Domain | Directory | What it contains |
| --- | --- | --- |
| API and contracts | `api/`, `specs/`, `schemas/`, `udcf/` | Interfaces, protocols, schema definitions |
| Product and architecture | `core/`, `architecture/`, `project/` | Design, implementation model, structure |
| Operations and quality | `ops/`, `quality/`, `testing/`, `verification-logs/` | Runtime operations, quality checks, testing practices |
| Security and compliance | `security/`, `compliance/`, `governance/` | Security guides, controls, policy artifacts |
| Enterprise and business | `enterprise/`, `investors/`, `strategy/`, `marketing/` | Enterprise rollout, strategy, messaging |
| Internal execution | `internal/`, `reports/`, `analysis/` | Internal planning and completion artifacts |

## Root vs docs policy

- Root docs are concise operational entrypoints.
- `docs/` contains full-depth technical and operational documentation.
- Historical or milestone-heavy documents are archived under `docs/internal/archive/`.

## Historical archives

- Archived root milestone/handoff docs: `internal/archive/root-status/`
- Legacy planning snapshots: `archive-planning/`
