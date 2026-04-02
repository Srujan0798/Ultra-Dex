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

*None currently*

---

## Rules

1. **Always include recovery command** - receiving agent verifies state
2. **Max 5 bullet points** - no essays
3. **List files explicitly** - no "various files"
4. **Test status required** - always know health

---

*Handoffs complete what sessions cannot.*
