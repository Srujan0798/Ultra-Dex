# RFC 001: Capability Contracts for Plugins

## Summary
Capability contracts define what a plugin can do, not just what inputs it accepts. Each plugin must ship a `capability_manifest.json` describing side effects, rate limits, and approval requirements. This protects users from unsafe execution and limits cost/performance risks.

## Goals
- Declare side effects and required permissions.
- Enforce rate limits per tool.
- Surface risk level before execution.
- Support consistent policy enforcement across tools.

## Manifest Format
```json
{
  "name": "ultra-fs-writer",
  "version": "1.0.0",
  "tools": [
    {
      "name": "write_code",
      "type": "mutation",
      "sideEffects": ["filesystem:write"],
      "rateLimit": {"max": 10, "window": "1m"},
      "riskScore": "high",
      "requiresApproval": true
    }
  ]
}
```

## Enforcement
- `cli/lib/mcp/router.js` intercepts tool calls.
- High-risk tools require explicit user approval.
- Rate limits are enforced per tool, per session.

## Status
- Drafted for v4.0.1
- Planned for v4.1
