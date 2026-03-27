# TASK 8: CJS→ESM Migration for Core Subsystems

**Assigned to:** Codex  
**Priority:** Wave 3 (after Wave 2 validated)  
**Estimated time:** 30–45 minutes

---

## Objective

Convert all 8 `.cjs` files to ESM `.js` format to match the project's `"type": "module"` setting in package.json. Create a backward-compatible `.cjs` wrapper for the public SDK.

## Files to Convert

| Current File | New File |
|-------------|----------|
| `src/core/orchestration/ultra-dex-core.cjs` | `src/core/orchestration/ultra-dex-core.js` |
| `src/core/memory/unified-api.cjs` | `src/core/memory/unified-api.js` |
| `src/core/agents/registry-enhanced.cjs` | `src/core/agents/registry-enhanced.js` |
| `src/core/protocols/coordination.cjs` | `src/core/protocols/coordination.js` |
| `src/core/mcp/server-manager.cjs` | `src/core/mcp/server-manager.js` |
| `src/core/reliability/agent-autopsy.cjs` | `src/core/reliability/agent-autopsy.js` |
| `src/services/ai-providers/router.cjs` | `src/services/ai-providers/router.js` |
| `sdk.cjs` | `sdk.js` + `sdk.cjs` (wrapper) |

## Implementation

### For each internal file:

1. Replace `module.exports = { ... }` with `export { ... }` or `export default`
2. Replace `const X = require('...')` with `import X from '...'`
3. Replace `require('path')` etc. with `import { join } from 'path'`
4. Rename the file from `.cjs` to `.js`
5. Update all imports in other files that reference the old `.cjs` name

### For `sdk.cjs` specifically:

1. Create new `sdk.js` with ESM exports
2. Keep `sdk.cjs` as a backward-compat wrapper:
   ```javascript
   // sdk.cjs - Backward compatibility wrapper
   const sdk = import('./sdk.js');
   module.exports = sdk;
   ```
   Or better: use `createRequire`:
   ```javascript
   // sdk.cjs
   const { createRequire } = require('module');
   const require = createRequire(import.meta.url);
   // ... re-export from sdk.js
   ```

### Search for all references to update:

```bash
grep -r "ultra-dex-core.cjs" src/ apps/ tests/ --include="*.js" --include="*.ts"
grep -r "unified-api.cjs" src/ apps/ tests/ --include="*.js" --include="*.ts"
grep -r "registry-enhanced.cjs" src/ apps/ tests/ --include="*.js" --include="*.ts"
grep -r "coordination.cjs" src/ apps/ tests/ --include="*.js" --include="*.ts"
grep -r "server-manager.cjs" src/ apps/ tests/ --include="*.js" --include="*.ts"
grep -r "agent-autopsy.cjs" src/ apps/ tests/ --include="*.js" --include="*.ts"
grep -r "router.cjs" src/ apps/ tests/ --include="*.js" --include="*.ts"
grep -r "sdk.cjs" . --include="*.js" --include="*.ts"
```

## Target Files

- All 8 `.cjs` files [RENAME + MODIFY]
- All files that import them [MODIFY]
- `sdk.cjs` [KEEP as compatibility wrapper]

## Validation Criteria

1. `node src/core/index.js` — must load without module resolution errors
2. `node test-validation.cjs` — all 25 tests must still pass (this file uses require)
3. No `require()` calls in any `src/` `.js` file (except the sdk.cjs wrapper)
4. `node sdk.cjs` — backward compat wrapper must work
5. `import { UltraDex } from './sdk.js'` — ESM import must work
