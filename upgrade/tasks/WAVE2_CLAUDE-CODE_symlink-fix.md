# TASK 3: Fix Symlink Bypass & Destructive Command Regex

**Assigned to:** Claude Code  
**Priority:** Wave 2 — HIGH  
**Estimated time:** 15–20 minutes

---

## Objective

Fix two security vulnerabilities in the governance system:
1. Path traversal via symlinks
2. Destructive command regex too narrow

## Problem 1: Symlink Bypass

In `src/platform/cli/governance/index.js`:
- `isSensitivePath` and `isPathSafe` use `path.resolve()` which does NOT resolve symlinks
- Attacker creates: `ln -s .env safe-config.json`
- Governance approves access to `safe-config.json` but the actual file read accesses `.env`

## Fix 1

Replace `path.resolve(targetPath)` with:
```javascript
import { realpathSync } from 'fs';

function resolveRealPath(targetPath) {
  try {
    return realpathSync(targetPath);
  } catch {
    // File doesn't exist yet — resolve normally
    return path.resolve(targetPath);
  }
}
```

Use `resolveRealPath()` in both `isSensitivePath` and `isPathSafe`.

## Problem 2: Destructive Command Regex

In `src/platform/cli/governance/rules.js`:
- Current regex: `/\brm\s+-rf\b/i` — only matches `rm -rf`
- Bypasses: `rm -fr`, `rm -r -f`, `rm --recursive --force`, `rm -rf /`

## Fix 2

Replace with comprehensive patterns:
```javascript
const DESTRUCTIVE_COMMAND_PATTERNS = [
  /\brm\s+.*-[a-z]*r[a-z]*f/i,     // rm -rf, rm -rf /, rm -rfi
  /\brm\s+.*-[a-z]*f[a-z]*r/i,     // rm -fr, rm -fr /
  /\brm\s+.*--recursive/i,          // rm --recursive
  /\brm\s+.*--force/i,              // rm --force
  /\brm\s+-r\s+-f/i,               // rm -r -f
  /\brm\s+-f\s+-r/i,               // rm -f -r
  /\bmkfs\b/i,                      // format filesystem
  /\bdd\s+if=/i,                    // dd (disk destroyer)
  /\b:\(\)\{.*\|.*&\s*\}\s*;/,     // fork bomb
  /\bchmod\s+-R\s+777/i,           // open permissions
  /\bchown\s+-R/i,                 // recursive ownership change on sensitive paths
];
```

## Target Files

- `src/platform/cli/governance/index.js` [MODIFY]
- `src/platform/cli/governance/rules.js` [MODIFY]

## Validation Criteria

1. Create symlink: `ln -s .env test-safe.json`
2. `governance.authorize('agent', 'read', 'test-safe.json')` → must be DENIED
3. `governance.authorize('agent', 'execute', 'rm -fr /')` → must be DENIED
4. `governance.authorize('agent', 'execute', 'rm --recursive --force /')` → must be DENIED
5. `governance.authorize('agent', 'execute', 'ls -la')` → must be ALLOWED
6. `governance.authorize('agent', 'read', 'README.md')` → must be ALLOWED
