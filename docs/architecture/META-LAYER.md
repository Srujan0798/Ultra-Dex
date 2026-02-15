# Ultra-Dex Meta-Layer Architecture

> **Note:** For the consolidated architecture specification, see: `CONSOLIDATED-ARCHITECTURE.md`

Ultra-Dex sits above coding tools and agents, orchestrating context, plans, and verification.

```
┌─────────────────────────────────────────┐
│  LAYER 3: ULTRA-DEX (META-ORCHESTRATION) │
└─────────────────────────────────────────┘
     │           │           │           │
 ┌───▼───┐  ┌───▼───┐  ┌───▼───┐  ┌───▼───┐
 │Claude │  │Cursor │  │Devin  │  │Gemini │
 └───────┘  └───────┘  └───────┘  └───────┘
```

## Principles

- Orchestrate, do not compete with IDEs or model vendors
- CONTEXT.md + IMPLEMENTATION-PLAN.md + verification enforce quality
- Memory makes tools with amnesia consistent across sessions

## Outcomes

- Consistent delivery across agents/tools
- Reusable templates and workflows
- Faster onboarding with predictable structure
