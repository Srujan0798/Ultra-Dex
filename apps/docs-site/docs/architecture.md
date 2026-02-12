---
sidebar_position: 2
---

# Architecture

Ultra-Dex is an **AI Orchestration Meta-Layer** — a cognitive operating system for agent swarms.

## System Overview

```
User Request
    ↓
CLI / API / Dashboard
    ↓
Smart Router (cost / latency / quality)
    ├── 16+ AI Providers
    └── Fallback Chains
    ↓
Agent Orchestrator (Nexus)
    ├── Architect Agent
    ├── Coder Agent
    ├── Reviewer Agent
    ├── Tester Agent
    └── DevOps Agent
    ↓
Memory System (Hot / Warm / Cold)
    ├── Vector Search (Embeddings)
    ├── Graph RAG (Relationships)
    └── Keyword (Inverted Index)
    ↓
Result → User
```

## Core Components

| Component | Location | Purpose |
|---|---|---|
| Nexus Orchestrator | `src/core/orchestration/` | Task decomposition, agent coordination |
| Smart Router | `src/core/ai/router.js` | Provider selection (1,090 lines) |
| Memory System | `src/core/memory/` | 3-tier memory (3,576 lines, 28 files) |
| Agent Pool | `src/core/agents/` | 16 specialized agents |
| MCP Server | `src/core/mcp/` | Model Context Protocol hub |
| Provider Registry | `src/core/ai/provider-registry.js` | Auto-discovery (162 lines) |

## Deployment

- **Local**: CLI + SQLite + remote AI APIs
- **Docker**: `docker-compose up -d` (Postgres, Redis, Prometheus, Grafana)
- **Kubernetes**: Horizontal scaling via service mesh

## Extension Points

- **Providers**: Implement `chat()`, `stream()`, `embed()` — see [Provider Guide](/docs/providers)
- **Agents**: Extend the `Agent` base class — see [SDK](/docs/sdk)
- **Plugins**: Add `manifest.json` + `index.js` — see [Extensions](/docs/extensions)
