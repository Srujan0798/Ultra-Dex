# 🔄 Handoff Protocol

> Clean agent-to-agent transfers. Zero context loss.

---

## Quick Handoff Template

Copy this when transferring work between agents:

```markdown
## HANDOFF: [Task Name]

**FROM:** [Agent] → **TO:** [Agent]
**DATE:** [YYYY-MM-DD]

### Context

[2-3 sentences: what was being done]

### Current State

- Files modified: [list]
- Tests status: [pass/fail count]
- Blockers: [any issues]

### Next Steps

1. [Immediate next action]
2. [Following action]

### Recovery Command

[Single command to verify state, e.g., `npm test`]
```

---

## Active Handoffs

_None currently_

---

## Rules

1. **Always include recovery command** - receiving agent verifies state
2. **Max 5 bullet points** - no essays
3. **List files explicitly** - no "various files"
4. **Test status required** - always know health

---

## Weekly 15-Min Review Ritual

Use this every week to prevent drift and bloat.

### Minute 0-3: Health Snapshot

- Tests pass/fail summary
- Lint/build status
- Any new blockers

### Minute 4-7: Dispatch Reality Check

- What is still in progress officially?
- Which shadow-watch items are now truly orphaned?
- Remove stale or duplicate tasks

### Minute 8-11: Single-Intervention Decision

- Pick at most one high-impact gap
- Define verification command first
- Define done criteria in one sentence

### Minute 12-15: Closure Update

- Update `shadow-state.json`
- Update `shadow-dispatches.md`
- Record one lesson learned (short)

Rule: If no measurable high-impact gap exists, do **no intervention**.

---

_Handoffs complete what sessions cannot._
