# Ultra-Dex Protocol

> **"Can users ship with Ultra-Dex after this action?"**

This is the unified orchestration and execution protocol for Ultra-Dex.

## The One Rule

Before any action, ask: **"Can users ship?"**
- YES → Act
- NO → Don't

## Structure

```
.protocol/
├── README.md           # This file
├── orchestration.md    # How to assign and coordinate work
├── execution.md        # How to execute and deliver outcomes
├── agent-capabilities/ # What each AI tool can do
│   ├── claude-code.md
│   ├── codex.md
│   ├── gemini-cli.md
│   ├── qwen-cli.md
│   ├── copilot-cli.md
│   ├── nvidia.md
│   └── open-code.md
└── state/              # Runtime tracking
    ├── current-cycle.json
    └── dispatches.md
```

## Philosophy

**Orchestration (What to do):**
1. Parse goals into atomic tasks
2. Assign by capability (Claude=premium, Gemini=parallel, Qwen=labor)
3. Execute → Validate → Integrate → Report

**Execution (How to do it):**
1. Don't break what works
2. Verify before done
3. One blocker at a time
4. Outcome over process

## Quick Start

1. Read `orchestration.md` to understand task assignment
2. Read `execution.md` to understand delivery standards
3. Check `agent-capabilities/` for tool capabilities
4. Track progress in `state/`

---

*The protocol exists to ship. If it doesn't help users ship, change it.*
