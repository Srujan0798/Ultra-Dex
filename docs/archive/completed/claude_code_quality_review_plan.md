# Claude Code Quality Review Plan for Ultra-Dex v3.2.0

> **Goal:** Systematic quality review to bring entire codebase to production-grade standards.

---

## 🎯 Review Focus Areas (Priority Order)

### 1. CLI Commands Layer (`cli/lib/commands/`)

**61 command files - the core user interface**

| Check                | Action                                                        |
| -------------------- | ------------------------------------------------------------- |
| **Error Handling**   | Every command must have try/catch with user-friendly messages |
| **Input Validation** | All user inputs validated before processing                   |
| **Exit Codes**       | Return proper exit codes (0=success, 1=error)                 |
| **Help Text**        | Each command has clear `--help` output                        |

```bash
# Spot-check these critical commands first:
cli/lib/commands/init.js
cli/lib/commands/serve.js
cli/lib/commands/swarm.js
cli/lib/commands/build.js
cli/lib/commands/audit.js
```

---

### 2. Core Libraries (`cli/lib/`)

| Directory               | Focus                                     |
| ----------------------- | ----------------------------------------- |
| `mcp/` (7 files)        | MCP server stability, endpoint validation |
| `swarm/` (4 files)      | Multi-agent coordination, race conditions |
| `kernel/` (5 files)     | State management, memory leaks            |
| `providers/` (12 files) | API error handling, rate limiting         |
| `utils/` (43 files)     | Code duplication, null checks             |

---

### 3. Quality Checklist Per File

Apply this to **every modified file**:

```
□ No hardcoded secrets/API keys
□ Proper async/await (no floating promises)
□ Functions under 50 lines
□ Clear variable naming
□ JSDoc on exported functions
□ No console.log in production code (use logger)
□ Graceful error messages
```

---

## 📁 Files to Modify (Specific Paths)

### Priority 1: Core Entry Points

```
cli/bin/ultra-dex.js          → Clean entry, proper shebang
cli/lib/index.js              → Export validation
cli/lib/plugin-system.js      → Security hardening
```

### Priority 2: Command Handlers

```
cli/lib/commands/init.js      → User input sanitization
cli/lib/commands/serve.js     → Port validation, graceful shutdown
cli/lib/commands/swarm.js     → Agent coordination error handling
cli/lib/commands/build.js     → Template validation
```

### Priority 3: Infrastructure

```
cli/lib/mcp/server.js         → Connection handling
cli/lib/kernel/*.js           → State persistence
cli/lib/providers/*.js        → API retry logic
```

---

## 🔧 Common Fixes Required

### A. Standardize Error Handling

```javascript
// ❌ WRONG
throw new Error(err);

// ✅ CORRECT
import { AppError } from '../utils/errors.js';
throw new AppError('USER_FRIENDLY_MESSAGE', { cause: err, code: 'ERR_CODE' });
```

### B. Validate All Inputs

```javascript
// ❌ WRONG
const config = JSON.parse(input);

// ✅ CORRECT
import { validateConfig } from '../utils/validation.js';
const config = validateConfig(input);
```

### C. Consistent Logging

```javascript
// ❌ WRONG
console.log('Starting server...');

// ✅ CORRECT
import { logger } from '../utils/logger.js';
logger.info('Starting server...');
```

---

## 📋 Review Sequence

1. **Read** → `cli/lib/utils/errors.js` (understand error patterns)
2. **Read** → `cli/lib/utils/logger.js` (understand logging)
3. **Review** → Each `cli/lib/commands/*.js` file
4. **Review** → Each `cli/lib/mcp/*.js` file
5. **Review** → Each `cli/lib/swarm/*.js` file
6. **Fix** → Apply standardization as you go

---

## ✅ Completion Criteria

| Area            | Standard                             |
| --------------- | ------------------------------------ |
| All 61 commands | Try/catch, input validation          |
| MCP server      | Graceful shutdown, connection limits |
| Swarm system    | Race condition handling              |
| Utils           | No code duplication                  |
| Zero            | `console.log` in production code     |
| 100%            | JSDoc on exported functions          |

---

## 🚫 DO NOT Touch

- `node_modules/`
- `*.md` documentation files
- `agents/*.md` prompts (separate review)
- `cursor-rules/*.mdc` (separate review)
- `website/` (separate review)
- `vscode-extension/` (separate review)

---

## Start Here

```bash
# Open in editor and begin:
code cli/lib/commands/init.js
```

**First task:** Ensure `init.js` has proper error handling, input validation, and uses the standard logger pattern.
