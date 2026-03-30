# CommonJS require() Usage Scan Report

**Generated:** 2026-03-27  
**Updated:** 2026-03-27 (All fixes applied)  
**Scope:** `src/` and `apps/` directories  
**Project Module Type:** `"type": "module"` (ES Modules)  
**Status:** ✅ **COMPLETE** - All violations fixed

---

## Executive Summary

| Metric | Value |
|--------|-------|
| Total Files with require() | 12 → **4** (acceptable only) |
| Total require() Statements | 23 → **4** (acceptable only) |
| Files Fixed | 8 |
| Files in `src/` | 0 |
| Files in `apps/` | 4 (all acceptable patterns) |
| **Migration Status** | ✅ **COMPLETE** |

**Key Finding:** Despite the project being configured as ES Modules (`"type": "module"`), 12 JavaScript files used CommonJS `require()` syntax. **All 8 violations have been fixed.** Remaining 4 files use acceptable patterns (createRequire for JSON, Docusaurus conventions, template generation).

---

## 1. Files Status (Updated)

### ✅ Fixed Files (8 files converted to ES modules)

| # | File | Fix Applied | Status |
|---|------|-------------|--------|
| 1 | `apps/cli/commands/learn.js` | `require()` → `import` | ✅ Fixed |
| 2 | `apps/cli/lib/commands/marketplace.js` | `require()` → `await import()` | ✅ Fixed |
| 3 | `apps/cli/lib/integration/langgraph-integration.js` | `require("fs")` → `import fs from "fs"` | ✅ Fixed |
| 4 | `apps/cli/lib/cicd/self-healing-ci.js` | `require("fs/path")` → `import` at top | ✅ Fixed |
| 5 | `apps/cli/lib/resilience/self-healing.js` | `require('v8')` → `import v8 from 'v8'` | ✅ Fixed |
| 6 | `apps/desktop/src/main.js` | `require()` → `import` + `__dirname` fix | ✅ Fixed |
| 7 | `apps/desktop/src/preload.js` | `require()` → `import` | ✅ Fixed |
| 8 | `apps/desktop/preload.js` | `require()` → `import` | ✅ Fixed |

### ✅ Acceptable (No Action Needed - 4 files)

| # | File | Pattern | Reason |
|---|------|---------|--------|
| 9 | `apps/cli/lib/utils/version.js` | createRequire | Correct ES module interop for JSON |
| 10 | `apps/cli/test/cli.test.js` | createRequire | Correct ES module interop for JSON |
| 11 | `apps/docs-site/src/components/HomepageFeatures.js` | Docusaurus pattern | Framework convention |
| 12 | `apps/cli/lib/templates/nextjs-saas.js` | Template generation | Generates code for other projects |

---

## 2. Categorization by Directory

### apps/cli/ (4 files fixed, 4 acceptable remaining)

| File | Status | Notes |
|------|--------|-------|
| `commands/learn.js` | ✅ **FIXED** | Converted to ES module import |
| `lib/commands/marketplace.js` | ✅ **FIXED** | Dynamic import for child_process |
| `lib/resilience/self-healing.js` | ✅ **FIXED** | Added v8 import at top |
| `lib/integration/langgraph-integration.js` | ✅ **FIXED** | Added fs import at top |
| `lib/cicd/self-healing-ci.js` | ✅ **FIXED** | Added fs/path imports at top |
| `lib/utils/version.js` | ✅ Acceptable | Uses createRequire correctly |
| `test/cli.test.js` | ✅ Acceptable | Uses createRequire correctly |
| `lib/templates/nextjs-saas.js` | ✅ Acceptable | Template generation code |

### apps/desktop/ (3 files fixed)

| File | Status | Notes |
|------|--------|-------|
| `src/main.js` | ✅ **FIXED** | Converted to ES modules with __dirname fix |
| `src/preload.js` | ✅ **FIXED** | Converted to ES modules |
| `preload.js` | ✅ **FIXED** | Converted to ES modules |

### apps/docs-site/ (1 file - acceptable)

| File | Status | Notes |
|------|--------|-------|
| `src/components/HomepageFeatures.js` | ✅ Acceptable | Docusaurus v2 pattern |

### src/ (0 files)

✅ No violations found in `src/` directory.

---

## 3. Migration Recommendations

### Priority 1: High (Should Fix)

**File:** `apps/cli/commands/learn.js`
```javascript
// Current (line 3)
const { runTutorial } = require('../lib/learn');

// Recommended
import { runTutorial } from '../lib/learn.js';
```

### Priority 2: Medium (Should Fix)

**Files:** 
- `apps/cli/lib/commands/marketplace.js`
- `apps/cli/lib/integration/langgraph-integration.js`
- `apps/cli/lib/cicd/self-healing-ci.js`

```javascript
// Current
const { exec } = require('child_process');
const fs = require("fs");
const path = require("path");

// Recommended
import { exec } from 'child_process';
import fs from "fs";
import path from "path";
```

### Priority 3: Low (Optional/Future)

**Files:**
- `apps/cli/lib/resilience/self-healing.js` - Dynamic require for v8 module
- `apps/desktop/*` - Electron main/preload scripts traditionally use CommonJS

```javascript
// Current (line 385)
const limit = require('v8').getHeapStatistics().heap_size_limit;

// If migration needed (but dynamic require may be intentional)
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const limit = require('v8').getHeapStatistics().heap_size_limit;
```

### Acceptable (No Action Needed)

| File | Reason |
|------|--------|
| `apps/cli/lib/utils/version.js` | Correctly uses `createRequire` for JSON import |
| `apps/cli/test/cli.test.js` | Correctly uses `createRequire` for JSON import |
| `apps/docs-site/src/components/HomepageFeatures.js` | Docusaurus v2 standard pattern for SVG imports |
| `apps/cli/lib/templates/nextjs-saas.js` | Template generates code for other projects |
| `apps/desktop/*` | Electron main process traditionally uses CommonJS; migration optional |

---

## 4. Impact Assessment

| Risk | Impact | Likelihood |
|------|--------|------------|
| Module resolution errors | Medium | Low (if migrated carefully) |
| Breaking existing functionality | Low | Low |
| Electron app compatibility | Low | Low (desktop apps can stay CommonJS) |
| Test failures | Low | Low (tests already use createRequire) |

---

## 5. Migration Checklist - ✅ COMPLETE

- [x] **High Priority:**
  - [x] Convert `apps/cli/commands/learn.js` to ES modules

- [x] **Medium Priority:**
  - [x] Convert `apps/cli/lib/commands/marketplace.js` to ES modules
  - [x] Convert `apps/cli/lib/integration/langgraph-integration.js` to ES modules
  - [x] Convert `apps/cli/lib/cicd/self-healing-ci.js` to ES modules

- [x] **Low Priority (Completed):**
  - [x] Convert `apps/cli/lib/resilience/self-healing.js` dynamic require to import
  - [x] Convert Electron apps to ES modules:
    - [x] `apps/desktop/src/main.js`
    - [x] `apps/desktop/src/preload.js`
    - [x] `apps/desktop/preload.js`

- [x] **No Action Required:**
  - [x] `apps/cli/lib/utils/version.js` - Already uses createRequire correctly
  - [x] `apps/cli/test/cli.test.js` - Already uses createRequire correctly
  - [x] `apps/docs-site/*` - Framework convention (Docusaurus)
  - [x] `apps/cli/lib/templates/*` - Template generation code

---

## 8. Final Verification

```bash
# Verification command - should only show acceptable patterns
grep -rn "require(" apps/ src/ --include="*.js" | grep -v node_modules | grep -v createRequire
```

**Result:** ✅ All 8 files successfully migrated to ES modules. Only 4 files remain with acceptable require() patterns (createRequire for JSON, Docusaurus, template generation).

---

## 6. Best Practices for Future Code

1. **Always use ES module syntax** in new code:
   ```javascript
   // ✅ Good
   import fs from 'fs';
   import { exec } from 'child_process';
   import { something } from './local-module.js';
   
   // ❌ Avoid
   const fs = require('fs');
   const { exec } = require('child_process');
   ```

2. **For JSON imports**, use `createRequire` or import assertions:
   ```javascript
   // Option 1: createRequire (Node.js 12.2+)
   import { createRequire } from 'module';
   const require = createRequire(import.meta.url);
   const pkg = require('./package.json');
   
   // Option 2: Import assertions (Node.js 17.1+)
   import pkg from './package.json' assert { type: 'json' };
   ```

3. **For Electron apps**, CommonJS is acceptable but ESM is supported in Electron 28+:
   ```javascript
   // If migrating Electron to ESM
   import { app, BrowserWindow } from 'electron';
   import path from 'path';
   import { fileURLToPath } from 'url';
   
   const __dirname = path.dirname(fileURLToPath(import.meta.url));
   ```

---

## 7. Validation

After migration, verify with:

```bash
# Search for remaining require() usage
grep -rn "require(" apps/ src/ --include="*.js" | grep -v node_modules | grep -v createRequire

# Verify module type in package.json
grep '"type"' */package.json */*/package.json
```

---

**Scan Complete.** 12 files identified, 4 high/medium priority fixes recommended.

## 8. FIX STATUS (March 30, 2026)

All identified require() violations have been converted to ES module imports:

| File | Status | Change |
|------|--------|--------|
| `apps/cli/commands/learn.js` | ✅ FIXED | `require()` → `import` |
| `apps/cli/lib/commands/marketplace.js` | ✅ FIXED | `require()` → `await import()` (dynamic) |
| `apps/cli/lib/integration/langgraph-integration.js` | ✅ FIXED | Added `import fs from "fs"` at top |
| `apps/cli/lib/cicd/self-healing-ci.js` | ✅ FIXED | Added `import path from "path"` at top |
| `apps/cli/lib/resilience/self-healing.js` | ✅ FIXED | Added `import v8 from 'v8'` at top |
| `apps/desktop/src/main.js` | ✅ FIXED | Added ESM imports + `__dirname` polyfill |
| `apps/desktop/src/preload.js` | ✅ FIXED | `require()` → `import` |
| `apps/desktop/preload.js` | ✅ FIXED | `require()` → `import` |

**Remaining (acceptable):**
- `apps/cli/lib/utils/version.js` - Uses `createRequire` correctly
- `apps/cli/test/cli.test.js` - Uses `createRequire` correctly
- `apps/docs-site/*` - Docusaurus framework convention
- `apps/cli/lib/templates/nextjs-saas.js` - Template generation code

---

**Report Complete. All fixes applied.**
