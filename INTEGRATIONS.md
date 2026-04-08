# Integrations Overview

This file is the concise integration summary for root-level navigation.

## Core integration areas

| Area | Purpose | Primary docs |
| --- | --- | --- |
| AI Providers | Multi-provider model access and routing | `docs/API.md`, `src/services/ai-providers/` |
| Auth | User identity and access control | `docs/security/SECURITY-GUIDE.md`, `src/core/auth/` |
| Billing | Plans, usage metering, Stripe events | `src/core/billing/`, `docs/DEPLOYMENT.md` |
| Observability | Logs, errors, usage telemetry | `docs/OPERATIONS.md`, `src/core/monitoring/` |
| Plugins / MCP | Tool and protocol integration | `docs/specs/MCP-PLUGIN-SPEC.md`, `src/core/mcp/` |

## Integration status

- Billing metering + Stripe webhooks: active
- Redis-backed caching and usage persistence: active when `REDIS_URL` is configured
- Dashboard + API integration: active
- Plugin/MCP framework: active

## Canonical integration docs

- `docs/INTEGRATION-LOG.md`
- `docs/AGENT_INTEGRATION_GUIDE.md`
- `docs/specs/PROVIDER-SPEC.md`

## Historical integration documents

Older completion/handoff integration files are archived in:

`docs/internal/archive/root-status/`
