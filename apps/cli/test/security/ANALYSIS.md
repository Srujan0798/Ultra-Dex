# Security Analysis: Workflow Separation and Handoffs

## Overview
This document details the analysis of the Ultra-Dex agent workflow, focusing on separation of concerns, review enforcement, and security boundaries.

## Objectives & Findings

### 1. Verify planner cannot execute code (Separation of Concerns)
**Status:** ✅ **VERIFIED**
- **Analysis:** The `planner` role is restricted by `GovernanceEngine` permissions defined in `cli/lib/governance/rules.js`. It has `write: ['docs', 'plan']` but NOT `code`.
- **Evidence:** `cli/test/security/workflow_analysis.test.js` confirms that attempts by the planner to use `WRITE_CODE` on `.js` files are blocked by the governance engine.

### 2. Verify coder cannot approve its own output (No Self-Review)
**Status:** ⚠️ **VIOLATION**
- **Analysis:** There is no structural "approval" step required before code is written to disk. The `backend` agent can write code immediately. While automated gates (linting, security checks) run *after* the write, there is no human-in-the-loop or separate reviewer agent required to "unlock" the write operation.
- **Evidence:** `cli/test/security/workflow_analysis.test.js` demonstrates that `backend` agent writes code to disk immediately upon tool usage.

### 3. Check reviewer has veto power that cannot be overridden
**Status:** ⚠️ **VIOLATION (Weak Veto)**
- **Analysis:** "Veto power" effectively means preventing the change from persisting. Since code is written *before* verification (and definitely before any human/agent review step in a sequential workflow), the "veto" comes too late. The state is already mutated (State Pollution).
- **Evidence:** `cli/test/security/workflow_analysis.test.js` shows that even if a subsequent step fails (simulating a veto/block), the file written by the previous step remains on disk.

### 4. Find ANY path where output skips review
**Status:** ✅ **VERIFIED (Path Found)**
- **Analysis:** Users can invoke `ultra-dex run backend` directly, bypassing any orchestration that might include a reviewer. Furthermore, even within a `swarm` workflow, the `runAgentLoop` executes writes immediately.
- **Evidence:** `cli/test/security/workflow_analysis.test.js` confirms `backend` writes code without any prior review step.

### 5. Analyze prompt injection resistance between phases
**Status:** ✅ **VERIFIED (Robust)**
- **Analysis:** The `GovernanceEngine` enforces permissions based on the *configured* role (passed by the system code), not the role claimed by the agent in its prompt. This prevents "jailbreak" style attacks where an agent is tricked into thinking it has higher privileges.
- **Evidence:** `cli/test/security/workflow_analysis.test.js` shows that a prompt injection attempting to override the `planner` role to `backend` fails to gain write permissions.

### 6. Check for state pollution between workflow phases
**Status:** ⚠️ **CONFIRMED**
- **Analysis:** The lack of a transactional filesystem or staging area means that failed agent steps leave behind artifacts. This "pollutes" the workspace for subsequent runs or agents.
- **Evidence:** `cli/test/security/workflow_analysis.test.js` demonstrates persistence of files after workflow failure.

## Recommendations

1.  **Implement a Staging Area:** Agents should write to a temporary directory or a git branch. Changes should only be merged to the main workspace after passing review/verification.
2.  **Enforce Review Step:** Introduce a "Review Gate" that requires explicit approval (human or `reviewer` agent) before the staging area is merged.
3.  **Strict State Management:** Use a transactional approach for agent operations where a failure rolls back all changes made in that step.

## Running Verification Tests
To run the analysis suite:
```bash
node --experimental-test-module-mocks --test cli/test/security/workflow_analysis.test.js
```
*Note: `--experimental-test-module-mocks` is required for Node.js v22.x to mock internal dependencies.*
