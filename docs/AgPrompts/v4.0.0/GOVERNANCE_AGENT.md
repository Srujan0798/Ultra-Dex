# 🏛️ Governance Agent Prompt

Implement ADR enforcement via a Governance Agent.

---

## STEP 1: ADR Schema
File: `cli/lib/governance/adr-schema.js`

```javascript
export const ADRSchema = {
  id: String,
  title: String,
  status: ['active', 'deprecated', 'superseded'],
  affectedPaths: [String],
  constraints: [String]
};
```

---

## STEP 2: Governor Agent
File: `agents/5-quality/governor.md`

```markdown
# The Governor Agent

You are the Governance Engine. Enforce ADRs.

## Rules
1. Check ADR index before code changes
2. BLOCK diffs that contradict active ADRs
3. Require migration path for violations
4. Log decisions to audit ledger
```

---

## STEP 3: Integration
File: `cli/lib/mcp/tools.js`

Update `verify_task` to include governance check:
- Diff against ADR index
- Block on violation
- Log decision

---

## SUCCESS CRITERIA
- [x] ADR schema created
- [x] Governor agent prompt exists
- [x] verify_task includes governance check
