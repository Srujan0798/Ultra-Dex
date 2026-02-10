# Ultra-Dex Features

This document separates current capabilities from roadmap work.

## Current State (Implemented)

### Core CLI
- Multi-command CLI with planning, generation, execution, review, and verification flows
- Agent orchestration commands (`swarm`, `agents`, `workflow`)
- Memory commands (`memory`, `rag`, `graph`) with tiered context support
- Governance and quality commands (`governance`, `gate`, `risk`, `audit`, `ledger`)

### Integrations
- Tool integrations for Jira, Notion, Trello, Slack, Discord, GitHub, Stripe, Vercel, Supabase, Linear, and Segment
- MCP server and context bus for cross-tool synchronization

### Templates
- SaaS and workflow templates, including multi-tenant and domain-oriented starters
- Enterprise-oriented patterns and operational runbooks

### DevOps + Ops
- Docker and Kubernetes manifest generators
- CI/CD templates and verification workflows
- Monitoring and risk register utilities

### Dashboard + Ecosystem
- React dashboard with overview, memory, agent, task, integrations, and settings pages
- VS Code extension scaffold and desktop app scaffold

## Planned / In Progress

- v4.3 ecosystem polish and documentation hardening
- v5 moonshots: advanced voice workflows, computer-use agent, WASM plugin runtime, 3D context view

## Truth Policy

If a feature is not runnable in the repository, it must be labeled as planned or in progress.
