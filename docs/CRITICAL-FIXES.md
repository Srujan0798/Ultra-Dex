# Critical Fixes Plan

This document outlines the required fixes for critical issues identified during the code quality audit.

## 🚨 Critical Security & Stability Fixes

### 1. Fix Shell Injection in `github.js`

**Severity:** Critical
**Issue:** Using `exec` with template strings allows shell injection if inputs contain metacharacters.
**Fix:** Switch to `execFile` (or `spawn`) to pass arguments as an array, bypassing the shell.

```javascript
// BEFORE (Vulnerable)
// const { stdout } = await execAsync(`gh issue create --title "${title}" --body "${body}"`);

// AFTER (Safe)
import { execFile } from 'child_process';
import { promisify } from 'util';
const execFileAsync = promisify(execFile);

async function createIssue(title, body, options = {}) {
  const args = ['issue', 'create', '--title', title, '--body', body];
  
  if (options.labels?.length) {
    args.push('--label', options.labels.join(','));
  }
  
  // Directly executes the binary, arguments are not parsed by shell
  const { stdout } = await execFileAsync('gh', args);
  return stdout.trim();
}
```

---

### 2. Fix Brittle Parsing in `code-gen.js` / `plan.js`

**Severity:** High
**Issue:** Regex parsing fails on minor formatting changes (case, whitespace).
**Fix:** Normalize input before parsing and use more robust, section-based matching or an AST parser.

```javascript
// BEFORE (Brittle)
// const techStackMatch = content.match(/## SECTION \d+.*TECH.*STACK[\s\S]*?(?=## SECTION|$)/i);

// AFTER (Robust)
import { marked } from 'marked'; // OR verify structure using standard Markdown logic

function parseSections(markdown) {
  const sections = {};
  let currentHeader = null;
  
  const tokens = marked.lexer(markdown);
  
  for (const token of tokens) {
    if (token.type === 'heading' && token.depth === 2) {
      // Normalize header: "## SECTION 1: TECH STACK" -> "TECH_STACK"
      currentHeader = token.text.replace(/SECTION \d+:/i, '').trim().toUpperCase().replace(/\s+/g, '_');
      sections[currentHeader] = '';
    } else if (currentHeader && token.type === 'text') {
      sections[currentHeader] += token.text + '
';
    } else if (currentHeader && token.type === 'code') {
      sections[currentHeader] += token.text + '
'; // Preserve code blocks
    }
  }
  
  return sections;
}
```

---

### 3. Fix Data Corruption in `cloud.js` (Atomic Writes)

**Severity:** High
**Issue:** `fs.writeFile` writes directly to the target. A crash during write leaves a corrupt/empty file.
**Fix:** Write to a temporary file first, then rename (atomic operation).

```javascript
// BEFORE (Risky)
// await fs.writeFile(CLOUD_CONFIG.sessionsFile, JSON.stringify(sessions));

// AFTER (Atomic)
import path from 'path';

async function atomicWrite(filePath, data) {
  const tempPath = `${filePath}.tmp.${Date.now()}`;
  
  try {
    // 1. Write to temp file
    await fs.writeFile(tempPath, JSON.stringify(data, null, 2));
    
    // 2. Rename (atomic on POSIX) replaces the old file instantly
    await fs.rename(tempPath, filePath);
  } catch (error) {
    // Cleanup temp file if rename fails
    try { await fs.unlink(tempPath); } catch {}
    throw error;
  }
}
```

---

### 4. Fix Webhook Timeouts in `ci-monitor.js`

**Severity:** Medium
**Issue:** Awaiting long-running agent tasks *before* sending HTTP 200 causes GitHub to timeout and retry/fail.
**Fix:** Send 200 OK immediately, then process the logic asynchronously.

```javascript
// BEFORE (Timeout Risk)
// if (payload.conclusion === 'failure') {
//   await handleBuildFailure(payload); // <--- BLOCKS RESPONSE
// }
// res.writeHead(200);

// AFTER (Async Processing)
if (payload.conclusion === 'failure') {
  // 1. Respond immediately
  res.writeHead(202); // 202 Accepted
  res.end('Processing build failure...');

  // 2. Process in background (fire & forget)
  handleBuildFailure(payload, options, notifyEvents).catch(err => {
    console.error('Background task failed:', err);
  });
  return;
}
```

---

### 5. Fix Blocking `execSync` in `quality.js`

**Severity:** Medium
**Issue:** `execSync` blocks the Node event loop. No streaming output for long tests; CLI appears frozen.
**Fix:** Use `spawn` to stream stdout/stderr and handle signals.

```javascript
// BEFORE (Blocking)
// const result = execSync('npm test', { stdio: 'pipe' });

// AFTER (Streaming)
import { spawn } from 'child_process';

function runCommandStreaming(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { 
      cwd, 
      stdio: 'inherit', // Stream directly to console
      shell: true 
    });

    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Command failed with code ${code}`));
    });

    child.on('error', (err) => reject(err));
  });
}

// Usage
// await runCommandStreaming('npm', ['test'], projectPath);
```
