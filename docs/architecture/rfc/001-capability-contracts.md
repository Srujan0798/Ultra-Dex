# RFC 001: Capability Contracts for Plugins

## Summary
To prevent "Plugin Chaos" in the orchestration layer, we will enforce **Capability Contracts** for every plugin. This moves beyond simple input schemas (Zod) to declaring side effects, rate limits, and permission scopes.

## The Problem
Currently, a plugin like `write_code` declares *what input it needs* (filePath, content) but not *what damage it can do* (Write Access, Infinite Loops, High Token Costs).

## The Spec
Every plugin in v4.1 must export a `capability_manifest.json`:

```json
{
  "name": "ultra-fs-writer",
  "version": "1.0.0",
  "tools": [
    {
      "name": "write_code",
      "type": "mutation",
      "sideEffects": ["filesystem:write"],
      "rateLimit": {
        "max": 10,
        "window": "1m"
      },
      "riskScore": "high",
      "requiresApproval": true
    }
  ]
}
```

## Implementation Strategy
1.  **Middleware:** A central `CapabilitiesRouter` in `cli/lib/mcp/router.js` will intercept tool calls.
2.  **Enforcement:** Check `riskScore`. If high, pause and ask User for permission via `notify_user` (or CLI prompt).
3.  **Throttling:** Use Redis/In-Memory store to track rate limits per tool.

## Status
- [x] Drafted (v4.0.1)
- [x] Planned for v4.1
- [ ] Fully enforced across all plugins (in progress)
