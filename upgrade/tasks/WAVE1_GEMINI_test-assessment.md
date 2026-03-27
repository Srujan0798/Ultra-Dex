# TASK 12: Test Infrastructure Assessment

**Assigned to:** Gemini CLI (3 windows)  
**Priority:** Wave 1  
**Estimated time:** 15–20 minutes

---

## Objective

Run all existing tests. Document which pass, which fail, which hang. Map test coverage gaps for the critical subsystems.

## Instructions

### Window 1: Run Core Tests

```bash
cd /Users/srujansai/Desktop/Ultra-Dex
NODE_ENV=test node --test --test-force-exit --test-timeout=30000 tests/core/*.test.js 2>&1 | tee upgrade/reports/test-core-output.txt
```

### Window 2: Run Integration + CLI Tests

```bash
cd /Users/srujansai/Desktop/Ultra-Dex
NODE_ENV=test node --test --test-force-exit --test-timeout=30000 tests/integration/*.test.js 2>&1 | tee upgrade/reports/test-integration-output.txt

NODE_ENV=test node --test --test-force-exit --test-timeout=30000 tests/cli/*.test.js 2>&1 | tee upgrade/reports/test-cli-output.txt
```

### Window 3: Run Validation + Analyze Coverage Gaps

```bash
cd /Users/srujansai/Desktop/Ultra-Dex
node test-validation.cjs 2>&1 | tee upgrade/reports/test-validation-output.txt
```

Then analyze which critical systems have NO tests:
- Session isolation for TaskGraph
- Governance enforcement in executeTool
- Atomic write safety for ledger/memory
- Schema migration
- Memory pruning / bounded history
- Symlink path traversal protection

## Expected Output

Create the file: `upgrade/reports/test-status.md`

The report must contain:

### 1. Test Results Summary Table

| Test File | Status | Pass | Fail | Skip | Notes |
|-----------|--------|------|------|------|-------|

### 2. Failing Tests Detail
For each failing test:
- Test name
- Error message
- Likely cause

### 3. Coverage Gap Analysis

| Critical Subsystem | Has Tests? | What's Missing |
|--------------------|-----------|----------------|
| Session isolation | ❌ | Need concurrent execution test |
| Governance enforcement | ❌ | Need policy block test |
| Atomic writes | ❌ | Need crash-recovery test |
| Schema migration | ❌ | Need version upgrade test |
| Memory pruning | ❌ | Need bounded growth test |
| Symlink protection | ❌ | Need traversal test |

### 4. Recommendations
- Which tests to write for Milestone 1
- Test framework assessment (node:test vs vitest — currently mixed)

## Validation

- All test commands attempted
- Results documented even if tests fail or hang
- Coverage gaps mapped to Milestone 1 tasks
