# 📜 Capability Contracts Prompt

Implement declarative capability contracts for plugins.

---

## STEP 1: Capability Schema
File: `cli/lib/governance/capability-schema.js`

```javascript
export const CapabilitySchema = {
  sideEffects: ['filesystem', 'network', 'database', 'none'],
  rateLimit: { maxCalls: Number, windowMs: Number },
  riskScore: { min: 1, max: 10 },
  permissions: ['read', 'write', 'execute', 'admin']
};
```

---

## STEP 2: Update Tool Definitions
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

---

## STEP 3: Capability Router
File: `cli/lib/mcp/capability-router.js`

```javascript
export function validateCapabilities(toolName, context) {
  // Check capabilities match permissions
  // Block if risk score too high
}
```

---

## SUCCESS CRITERIA
- [x] Capability schema created
- [x] Tools have capability manifests
- [x] Router validates before execution
