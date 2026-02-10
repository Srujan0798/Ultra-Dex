# Agents Guide

Ultra‑Dex uses a tiered, multi‑agent architecture. Agents are specialized prompts + tooling with clear responsibilities. Swarm orchestration coordinates them in parallel or sequential modes.

---

## Agent Tiers (Default)

| Tier | Focus | Examples |
|------|------|----------|
| 0 | Orchestration | Meta‑Orchestrator, Orchestrator |
| 1 | Leadership | CTO, Planner, Research |
| 2 | Core Dev | Backend, Frontend, Database |
| 3 | Security | Security Auditor, Auth |
| 4 | Ops | DevOps, Cloud |
| 5 | Quality | Tester, Reviewer, Debugger, Docs |
| 6 | Performance | Performance, Refactoring |

Agents live in `agents/` and are registered in the agent index.

---

## Running Agents

```bash
ultra-dex agents
ultra-dex agents --tier leadership
ultra-dex swarm start task.md --parallel 4
```

---

## Swarm Orchestration

The `AgentSwarm` supports:
- `runParallel(task)` — all agents in parallel
- `runSequential(task)` — ordered execution
- `runWaterfall(context)` — output from one becomes input to next

The Meta‑Orchestrator selects the right mix of agents based on:
- Task complexity
- Domain classification
- Required quality gate

---

## Health Checks & Metrics

Each agent exposes:
- `healthCheck()` — returns status and last check
- `getMetrics()` — calls, errors, avg time

---

## Creating Custom Agents

1. Add a new agent file under `agents/`  
2. Register it in the agent registry  
3. Add documentation (purpose, examples)

Example:
```md
# @BillingAgent
## Responsibilities
- Stripe subscriptions
- Webhook validation
- Pricing page updates
```

---

## Best Practices

- Keep agent scope small and well‑defined
- Avoid cross‑agent responsibilities
- Use the 21‑step verification before merging
- Record decisions in the ledger for traceability
