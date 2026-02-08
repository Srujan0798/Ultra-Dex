# 🎮 Ultra-Dex v4.0.0 - Complete Implementation Prompt

Execute ALL features in v4.0.0. No future versions - everything ships now.

---

## STEP 1: Capability Contracts (RFC-001)

### 1.1 Create Schema
File: `cli/lib/governance/capability-schema.js`

```javascript
export const CapabilitySchema = {
  sideEffects: ['filesystem', 'network', 'database', 'none'],
  rateLimit: { maxCalls: Number, windowMs: Number },
  riskScore: { min: 1, max: 10 },
  permissions: ['read', 'write', 'execute', 'admin']
};
```

### 1.2 Update Tool Definitions
File: `cli/lib/mcp/tools.js`

Add capability manifest to each tool:
```javascript
server.tool('tool_name', 'description', schema, handler, {
  capabilities: {
    sideEffects: ['filesystem'],
    rateLimit: { maxCalls: 10, windowMs: 60000 },
    riskScore: 3
  }
});
```

### 1.3 Create Capability Router
File: `cli/lib/mcp/capability-router.js`

```javascript
export function validateCapabilities(toolName, context) {
  // Check if tool capabilities match context permissions
  // Block if risk score too high for current user tier
}
```

---

## STEP 2: Governance Agent (RFC-002)

### 2.1 Create ADR Index Schema
File: `cli/lib/governance/adr-schema.js`

```javascript
export const ADRSchema = {
  id: String,        // e.g., "ADR-001"
  title: String,
  status: ['active', 'deprecated', 'superseded'],
  affectedPaths: [String],
  constraints: [String]
};
```

### 2.2 Create Governor Agent Prompt
File: `agents/5-quality/governor.md`

```markdown
# The Governor Agent

You are the Governance Engine. Your sole purpose is to enforce ADRs.

## Rules
1. Before ANY code change, check the ADR index
2. If a diff contradicts an active ADR, BLOCK it
3. Require a migration path for ADR violations
4. Log all governance decisions to the audit ledger
```

### 2.3 Integrate into verify_task
File: `cli/lib/mcp/tools.js` (update verify_task)

```javascript
// Add to verify_task checklist:
// - Check diff against ADR index
// - Block if ADR violation detected
// - Log governance decision
```

### 2.4 Create Pre-Commit Hook (Optional)
File: `scripts/pre-commit-governor.js`

```javascript
// Run governance check before commit
// Exit 1 if ADR violation found
```

---

## STEP 3: Final Integration

### 3.1 Update package.json
- Version: `4.0.0`
- Add governance scripts

### 3.2 Update README.md
- Add Governance section
- Add Capability Contracts section

### 3.3 Git Commit
```bash
git add .
git commit -m "release: Ultra-Dex v4.0.0 - Complete

Features:
- Gamified AI Kernel
- Context Pruning (Titans Memory)
- Capability Contracts (RFC-001)
- Governance Agent (RFC-002)
- MCP Integration"

git push origin main
git tag v4.0.0
git push origin v4.0.0
```

---

## SUCCESS CRITERIA

- [x] `cli/lib/governance/capability-schema.js` created
- [x] `cli/lib/governance/adr-schema.js` created
- [x] `cli/lib/mcp/capability-router.js` created
- [x] `agents/5-quality/governor.md` created
- [x] `verify_task` updated with governance check
- [ ] All tests passing
- [ ] v4.0.0 pushed with tag

---

**MISSION: SHIP EVERYTHING IN v4.0.0** 🚀
