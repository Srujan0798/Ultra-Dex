# Agents Guide

Ultra-Dex agents are specialized roles that operate under a shared orchestration layer. Agents are stored under `agents/` and registered in the agent index.

---

## Agent Tiers

| Tier | Focus |
| --- | --- |
| 0 | Meta-Orchestration |
| 1 | Leadership |
| 2 | Core Development |
| 3 | Security |
| 4 | DevOps |
| 5 | Quality |
| 6 | Performance |

---

## Running Agents

```bash
ultra-dex agents
ultra-dex run backend --task "Create auth endpoints"
ultra-dex swarm "Build payment system" --parallel
```

---

## Swarm Orchestration

Swarm supports three execution modes:
- Parallel: Agents run concurrently.
- Sequential: Agents run in order, stopping on failure.
- Waterfall: Output of one agent is input for the next.

The Meta-Orchestrator selects agents based on task complexity and domain.

---

## Meta-Orchestrator

Responsibilities:
- Choose agent set based on task classification.
- Manage dependencies between agent outputs.
- Enforce quality gates and verification steps.

---

## Custom Agents

To add a custom agent:
1. Create a new agent file under `agents/`.
2. Update the registry or agent index.
3. Provide a short usage example in the agent file.

---

## Best Practices

- Keep agents narrowly scoped to one responsibility.
- Use quality gates before merges or releases.
- Log decisions in the ledger for traceability.
- Avoid placeholder output in agent responses.

For detailed agent system prompts, see `docs/api/reference/AGENT-INSTRUCTIONS-UPDATED.md`.
