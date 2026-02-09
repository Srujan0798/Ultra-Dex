# Agents Guide

Ultra-Dex agents are specialized roles that operate under a shared orchestration layer.

---

## Agent Tiers

| Tier | Focus |
|------|------|
| 0 | Meta-Orchestration |
| 1 | Leadership |
| 2 | Core Development |
| 3 | Security |
| 4 | DevOps |
| 5 | Quality |
| 6 | Performance |

Agents are stored under `agents/` and indexed by the registry.

---

## Running Agents

```bash
ultra-dex agents
ultra-dex swarm start task.md --parallel 4
```

---

## Swarm Orchestration

Swarm supports:
- Parallel execution
- Sequential execution
- Waterfall chaining

Meta-Orchestrator selects agents based on task complexity and domain.

---

## Custom Agents

1. Add a new file under `agents/`
2. Update the registry
3. Provide example tasks

---

## Best Practices

- Keep agents narrowly scoped
- Use quality gates for execution
- Log decisions in the ledger
