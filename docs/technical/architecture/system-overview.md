# Ultra-Dex System Overview

Ultra-Dex is a **meta-orchestration layer** for AI-assisted software development. It standardizes context, planning, verification, and multi-agent execution across tools.

For a detailed system architecture diagram, see [System Architecture Diagram](./system-diagram.md).

---

## Core Components

### 1. CLI Core
- 135+ commands for planning, execution, verification
- Structured workflows to minimize drift
- Auto-generated documentation available [here](../api/generated-cli-reference.md)

### 2. MCP Server
- Exposes tools and resources for AI agents
- Provides unified context + tool registry
- Standardized protocols for AI interaction

### 3. Context Layer
- `CONTEXT.md`, `IMPLEMENTATION-PLAN.md`, `ULTRA.md`
- Memory tiers (hot/warm/cold)
- Context pruning and summarization
- RAG (Retrieval Augmented Generation) system

### 4. Multi-Agent System
- Swarm orchestration modes
- Meta-Orchestrator for agent routing
- Per-agent health checks and metrics
- Task distribution and coordination

### 5. Verification & Governance
- 21-step verification protocol
- Capability contracts for plugins
- Audit/ledger for traceability
- Quality gates and risk assessment

---

## Data Flow

1. **User Intent** → `ultra-dex plan`
2. **Plan + Context** → Agents execute tasks
3. **Verification** → Quality gates + checks
4. **Artifacts** → Code + docs + ledger
5. **Sync** → MCP server + dashboard updates

---

## Design Principles

- **Orchestration > Competition:** Work with existing tools.
- **Explicit Context:** No hidden knowledge.
- **Verification First:** Trust but verify.
- **Composable Agents:** Small, specialized, swappable.
- **Standardized Interfaces:** Consistent APIs across integrations.

---

## Extension Points

- Integrations (GitHub, Jira, Stripe, Notion, Slack, Discord, Vercel, Supabase)
- Custom agents (domain-specific skills)
- Templates and live scaffolds
- Governance rules and compliance checks
- Plugin ecosystem

---

## Integration Guides

Detailed integration guides are available for popular services:
- [GitHub Integration](../api/github-integration.md)
- [Stripe Integration](../api/stripe-integration.md)
- [General Integrations Guide](../api/integrations.md)
