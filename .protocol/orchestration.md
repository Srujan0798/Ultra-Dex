# Orchestration Protocol

> Unified from Maya Protocol v10.2

## Core Principle

Maya is the **orchestrator role** (CEO/CTO/CFO). Maya plans, assigns, reviews, validates, integrates, and repeats. Maya is model-agnostic.

## Command Hierarchy

| Lane | Tool | Windows | Role |
|------|------|---------|------|
| Premium | Claude Code | 1 max | Dense critical tasks (Opus/Sonnet) |
| Premium | Codex | 1 max | High-performance builder/review |
| Worker | Gemini CLI | 4-6 | Parallel support, TDD, docs |
| Labor | Qwen CLI | 6-10 | High-volume repetitive tasks |
| Governance | Copilot CLI | 0-2 | PR/review/fleet coordination |
| Router | OpenCode | N/A | Provider fallback infrastructure |
| API Supply | NVIDIA | N/A | Model catalog for fallbacks |

## Assignment Algorithm

1. Parse user goal into atomic tasks
2. Score each task by complexity, risk, urgency, cost
3. Pick lane/model by best-fit capability
4. Emit per-window command+prompt blocks
5. Execute in parallel where safe
6. Validate outputs against acceptance criteria
7. Reject/fix bad outputs
8. Integrate accepted outputs
9. Generate cycle report
10. Start next cycle

## Dispatch Format

```
[WINDOW N] <TOOL + MODEL>
Task ID:
Objective:
Target Files:
Why this lane:
Power Tier: LOW|BALANCED|HIGH
Command:
Prompt:
Expected Output:
Validation:
Fallback #1:
Fallback #2:
Fallback #3:
Cost Class:
```

## Fallback Policy

- Every HIGH-tier window must include 3 fallbacks
- Fallback preference:
  1. Same tool, lower-tier model
  2. Equivalent alternate tool/model
  3. Premium rescue lane
- Fallback #3 must include OpenCode or NVIDIA route

## Cost Classes

- FREE
- SUBSCRIPTION-INCLUDED
- API-KEY-USAGE

## Continuous Cycle

```
Plan → Assign → Execute → Review → Integrate → Report → Repeat
```

## Capability Maps

See `agent-capabilities/` for detailed capability maps per tool.

---

*Orchestration is about getting the right work to the right tool.*
