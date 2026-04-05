# Dispatch Sheet — Cycle 1: Post-Review Remediation
> Source: Full project review (2026-04-05)
> Gate: "Can users ship with Ultra-Dex after this action?"
> Maya orchestrates. Each window is independent unless noted.

---

## ⚠️ MANUAL ACTIONS (You Must Do These — Cannot Be Delegated)

```
ACTION 1 — URGENT
Revoke all 4 NVIDIA API keys immediately:
  <REVOKED_NVIDIA_KEY_1>
  <REVOKED_NVIDIA_KEY_2>
  <REVOKED_NVIDIA_KEY_3>
  <REVOKED_NVIDIA_KEY_4>
  → Go to: https://build.nvidia.com → API Keys → Revoke all four

ACTION 2 — After revoking keys
Remove .env and .env.local from git history:
  brew install bfg
  bfg --delete-files .env
  bfg --delete-files .env.local
  git reflog expire --expire=now --all && git gc --prune=now --aggressive
  git push origin --force
```

---

## P0 — CRITICAL (Run This Week, Parallel-Safe)

---

[WINDOW 1] QWEN — qwen-turbo
Task ID: P0-W1
Objective: Add .env, .env.local, .env.source to .gitignore and add pre-commit hook that blocks commits containing secrets
Target Files: .gitignore, .husky/pre-commit (or create), package.json
Why this lane: Mechanical config edits, no reasoning required, cheap labor
Power Tier: LOW
Command:
```bash
qwen --auth-type qwen-oauth --approval-mode yolo \
  "1) Open .gitignore and confirm .env, .env.local, .env.source, .env.*.local are listed — add any missing.
   2) In .husky/pre-commit add a check that runs: grep -rE '(nvapi-|sk-|AKIA|ghp_|ghs_)' --include='*.env*' --include='*.json' . && echo 'SECRET DETECTED — commit blocked' && exit 1 || exit 0
   3) In package.json scripts add: \"security:precommit\": \"sh .husky/pre-commit\"
   Verify the hook file is executable (chmod +x)."
```
Expected Output: Updated .gitignore, working .husky/pre-commit hook
Validation: Run `git add .env && git commit -m test` — must be blocked
Fallback #1: claude --model haiku --effort low -p "same task"
Fallback #2: gemini -p "same task"
Fallback #3: codex exec "same task"
Cost Class: FREE

---

[WINDOW 2] QWEN — qwen-turbo
Task ID: P0-W2
Objective: Remove default credentials from docker-compose.prod.yml and replace NEXTAUTH_SECRET placeholder
Target Files: docker-compose.prod.yml, .env.example
Why this lane: Simple string replacement, no reasoning required
Power Tier: LOW
Command:
```bash
qwen --auth-type qwen-oauth --approval-mode yolo \
  "1) In docker-compose.prod.yml: find all occurrences of fallback default passwords (e.g., ':-ultra_password', ':-ultra_redis_pass', 'requirepass ultra_redis_pass') and remove the fallback values so they REQUIRE explicit env vars — they should fail loudly if not set, not silently use a default.
   2) In .env.example: replace 'NEXTAUTH_SECRET=your-secret-here' with 'NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>'
   3) Add a comment block at top of docker-compose.prod.yml: '# All secrets must be set via environment variables. No defaults exist for security.'
   Do not change any other logic."
```
Expected Output: docker-compose.prod.yml with no fallback passwords, .env.example with clear instruction
Validation: grep for ':-ultra' in docker-compose.prod.yml — must return 0 matches
Fallback #1: gemini -p "same task"
Fallback #2: claude --model haiku -p "same task"
Fallback #3: codex exec "same task"
Cost Class: FREE

---

[WINDOW 3] QWEN — qwen-turbo
Task ID: P0-W3
Objective: Update tar dependency to >= 7.5.11 to patch arbitrary file read/write CVEs
Target Files: package.json (overrides section), package-lock.json
Why this lane: Simple version bump, mechanical
Power Tier: LOW
Command:
```bash
qwen --auth-type qwen-oauth --approval-mode yolo \
  "In package.json, the 'overrides' section has 'tar': '7.5.7'. Update this to '>=7.5.11'. Then run 'npm install' to update package-lock.json. Do not change any other dependency versions. Run 'npm audit --audit-level high' after and show the output."
```
Expected Output: tar at >=7.5.11, npm audit shows no HIGH/CRITICAL for tar
Validation: `npm audit --audit-level high | grep tar` — must return no findings
Fallback #1: gemini -p "same task"
Fallback #2: claude --model haiku -p "same task"
Fallback #3: codex exec "same task"
Cost Class: FREE

---

[WINDOW 4] QWEN — qwen-turbo
Task ID: P0-W4
Objective: Delete all .bak files and " 2.js" duplicate files (space-in-name macOS copies)
Target Files: src/core/**/*.bak, src/core/**/* 2.js
Why this lane: Pure file deletion, mechanical, no reasoning needed
Power Tier: LOW
Command:
```bash
qwen --auth-type qwen-oauth --approval-mode yolo \
  "1) Find and list all .bak files in src/: find src/ -name '*.bak'
   2) Find all files with ' 2.js' pattern (space before 2): find src/ -name '* 2.js'
   3) Show me the full list before deleting anything.
   4) Delete all found files.
   5) Run 'git status' to confirm what was removed.
   6) Verify no remaining import in any source file references a ' 2.js' file: grep -r '2\.js' src/ --include='*.js'
   Do NOT delete any file that is imported/required by active code."
```
Expected Output: All .bak and " 2.js" files removed, no broken imports
Validation: `find src/ -name "*.bak" | wc -l` → 0. `find src/ -name "* 2.js" | wc -l` → 0
Fallback #1: gemini -y -p "same task"
Fallback #2: claude --model haiku -p "same task"
Fallback #3: Manual: `find src/ -name "*.bak" -delete && find src/ -name "* 2.js" -delete`
Cost Class: FREE

---

## P1 — HIGH (Next 2 Weeks)

---

[WINDOW 5] CODEX — o1
Task ID: P1-W5
Objective: Fix broken build scripts — build:core always silently fails, build:cli output path mismatch
Target Files: package.json (scripts section), src/core/ (check if package.json needed)
Why this lane: Requires judgment on whether to create src/core/package.json or refactor the script
Power Tier: BALANCED
Command:
```bash
codex --full-auto -m o1 exec \
  "The build:core script does 'cd src/core && npm run build 2>/dev/null || echo Core built' but src/core/package.json does not exist, so it always silently fails. Fix this by one of: (a) creating a minimal src/core/package.json with a build script that runs tsc or esbuild, or (b) changing build:core to directly call the right build command.
   Also: build:cli outputs to dist/ultra-dex.js but package.json 'bin' points to apps/cli/bin/ultra-dex.js. Align these — either update the script output path or the bin field.
   Run npm run build after fixing. Show all output. Do not break anything else."
```
Expected Output: `npm run build` exits 0 with real output (not echo fallback), bin path aligned
Validation: `npm run build 2>&1 | grep 'Core built'` → must NOT match (that was the false-success echo)
Fallback #1: codex -m gpt-4 exec "same task"
Fallback #2: claude --model sonnet --effort high -p "same task"
Fallback #3: gemini -y -p "same task" with NVIDIA route
Cost Class: SUBSCRIPTION-INCLUDED

---

[WINDOW 6] CODEX — o1
Task ID: P1-W6
Objective: Add c8 coverage tooling and establish coverage baseline
Target Files: package.json, test scripts
Why this lane: Requires understanding of test infrastructure to wire correctly
Power Tier: BALANCED
Command:
```bash
codex --full-auto -m o1 exec \
  "1) Install c8: npm install --save-dev c8
   2) Update package.json test:coverage script to: 'NODE_ENV=test npx c8 --reporter=text --reporter=lcov node --test tests/core/*.test.js tests/integration/*.test.js tests/cli/*.test.js'
   3) Add 'coverage:report' script: 'c8 report --reporter=html'
   4) Run npm run test:coverage and capture the output
   5) Create docs/coverage-baseline.md with the current line/branch/function percentages per module
   Do not change any test files themselves."
```
Expected Output: c8 installed, test:coverage produces real numbers, baseline documented
Validation: `npm run test:coverage` exits 0 and prints coverage table with real percentages
Fallback #1: codex -m gpt-4 exec "same task"
Fallback #2: claude --model sonnet --effort high -p "same task"
Fallback #3: gemini -y -p "same task"
Cost Class: SUBSCRIPTION-INCLUDED

---

[WINDOW 7] CODEX — o3
Task ID: P1-W7
Objective: Enable noImplicitAny: true in tsconfig.json and fix all resulting type errors
Target Files: tsconfig.json, src/core/templates/**, src/services/ai-providers/**, src/types/index.d.ts, any .ts files with type errors
Why this lane: Complex multi-file type fix requiring reasoning — hardest P1 task
Power Tier: HIGH
Command:
```bash
codex -m o3 --full-auto exec \
  "1) Run 'npx tsc --noEmit 2>&1 | head -100' to see current errors with noImplicitAny: false.
   2) Set noImplicitAny: true in tsconfig.json.
   3) Run 'npx tsc --noEmit 2>&1' to see all new errors.
   4) Fix each error by adding proper types (not 'any' — use real types or 'unknown' where necessary).
   5) Special priority: src/types/index.d.ts — replace all 'any' fields with proper types.
   6) src/services/auth/enterprise-auth.ts — type user, session, tokens properly.
   7) Run 'npx tsc --noEmit' again — must exit 0 with 0 errors.
   Do not use 'as any' as a workaround. Use proper interfaces or 'unknown'."
```
Expected Output: tsconfig.json with noImplicitAny: true, tsc --noEmit exits 0
Validation: `npx tsc --noEmit 2>&1 | grep "error TS" | wc -l` → 0
Fallback #1: codex -m o1 exec "same task — fix only the top 10 most critical type errors first"
Fallback #2: claude --model opus --effort max -p "same task"
Fallback #3: NVIDIA route via OpenCode: opencode "same task" --provider nvidia
Cost Class: SUBSCRIPTION-INCLUDED

---

[WINDOW 8] GEMINI — gemini-2.5-pro
Task ID: P1-W8
Objective: Write tests for orchestration engine and agent systems — bring coverage from ~15% to ~50% for src/core/orchestration and src/core/agents
Target Files: tests/core/ (new test files), tests/integration/ (new test files)
Why this lane: TDD loop, parallel test writing — Gemini excels at this at $0
Power Tier: HIGH
Command:
```bash
gemini -y -p \
  "Read src/core/orchestration/index.js (AgentOrchestrator) and src/core/agents/ directory.
   Write comprehensive unit tests for:
   1) tests/core/orchestration.test.js — test AgentOrchestrator: task dispatch, governance gate enforcement, task pruning (>5min cleanup), event emission (task:complete)
   2) tests/core/agent-registry.test.js — test findAgentsByCapabilities(), agent registration, capability lookup
   3) tests/core/ralph-loop.test.js — test RALPHLoop: iteration limiting, phase execution, feedback threshold, event emission
   4) tests/core/memory-manager.test.js — test MemoryManager: store(), retrieve(), tiering logic (importance scores)
   Use Node.js built-in test runner (import { test, describe, assert } from 'node:test'/'node:assert').
   Mock external dependencies (AI providers) using simple stub objects.
   After writing: run 'NODE_ENV=test node --test tests/core/orchestration.test.js tests/core/agent-registry.test.js tests/core/ralph-loop.test.js tests/core/memory-manager.test.js' and fix any failures.
   Target: all new tests pass."
```
Expected Output: 4 new test files, all tests passing
Validation: Run the test command above → 0 failures
Fallback #1: gemini -y -p "same task — focus only on orchestration.test.js first"
Fallback #2: codex --full-auto exec "same task"
Fallback #3: claude --model sonnet --effort high -p "same task"
Cost Class: FREE

---

[WINDOW 9] GEMINI — gemini-2.5-flash
Task ID: P1-W9
Objective: Add ESLint to all TypeScript and source files — expand from cli/lib-only to full codebase
Target Files: eslint.config.js
Why this lane: Config editing + scan loop — Gemini parallel worker
Power Tier: BALANCED
Command:
```bash
gemini -y -p \
  "Read eslint.config.js. Currently it only lints apps/cli/lib and excludes all .ts/.tsx files.
   1) Add src/, packages/sdk/, apps/dashboard/src/ to the linted paths.
   2) Enable these additional rules at 'error' level: no-unused-vars (upgrade from warn), no-undef.
   3) Enable '@typescript-eslint' rules for .ts files: @typescript-eslint/no-explicit-any (warn), @typescript-eslint/explicit-function-return-type (warn).
      Install if needed: npm install --save-dev @typescript-eslint/eslint-plugin @typescript-eslint/parser
   4) Run 'npm run lint 2>&1 | tail -30' to see the new error count.
   5) Create docs/lint-baseline.md with the total error/warning count per directory.
   Do not fix the lint errors yet — just establish the baseline and make the config work."
```
Expected Output: eslint.config.js covering full source, lint runs without crashing, baseline documented
Validation: `npm run lint` runs without parsing errors (even if it reports violations)
Fallback #1: gemini -p "same task — limit to just expanding the file globs first"
Fallback #2: claude --model haiku -p "same task"
Fallback #3: codex exec "same task"
Cost Class: FREE

---

## P2 — MEDIUM (Next Month)

---

[WINDOW 10] CODEX — o1
Task ID: P2-W10
Objective: Add wall-clock timeout to Ralph Loop and MCP server auto-start
Target Files: src/core/agents/ralph.js (or ralph-loop.js), src/core/mcp/server-manager.js
Why this lane: Logic insertion requiring understanding of async patterns
Power Tier: BALANCED
Command:
```bash
codex --full-auto -m o1 exec \
  "1) In src/core/agents/ralph.js (RALPHLoop): add a configurable maxExecutionTimeMs option (default 300000 = 5min). Wrap the while loop in a Promise.race with a timeout that rejects with 'RALPHLoop timeout after {n}ms'. Emit a 'ralph.timeout' event before throwing.
   2) In src/core/mcp/server-manager.js: for the autoStart flow, wrap startServer() in a Promise.race with a 5-second timeout. If timeout: log a warning 'MCP server {id} unreachable at startup — skipping', do NOT throw (fail gracefully).
   Write a test for each timeout: tests/core/ralph-timeout.test.js and tests/core/mcp-timeout.test.js.
   Run the tests. Both must pass."
```
Expected Output: Timeouts implemented in both files, 2 passing tests
Validation: Tests pass. grep 'maxExecutionTimeMs' in ralph.js → 1+ match
Fallback #1: codex -m gpt-4 exec "same task"
Fallback #2: claude --model sonnet --effort high -p "same task"
Fallback #3: gemini -y -p "same task"
Cost Class: SUBSCRIPTION-INCLUDED

---

[WINDOW 11] CODEX — o1
Task ID: P2-W11
Objective: Persist governance audit trail to SQLite instead of in-memory ring buffer
Target Files: src/core/governance/governance-manager.js, src/core/governance/ (new audit-db module)
Why this lane: Requires understanding of existing SQLite setup and schema design
Power Tier: BALANCED
Command:
```bash
codex --full-auto -m o1 exec \
  "Read src/core/governance/governance-manager.js. Currently audit entries are stored in a _entries: [] array with max 50 entries.
   1) Create src/core/governance/audit-db.js that: opens/creates a SQLite DB at .ultra-dex/audit/governance.db, creates a 'governance_audit' table (id TEXT, action TEXT, agentId TEXT, task TEXT, result TEXT, details TEXT, timestamp TEXT), exposes insert(entry) and query(limit) functions.
   2) In governance-manager.js: replace the _entries array with calls to audit-db.js. On audit.record(): insert to DB async. On getAuditLog(): query from DB.
   3) Replace the Math.random() 4-char ID with uuid-based IDs (uuid is already in package.json).
   4) Write tests/core/governance-audit-persistence.test.js: create audit entries, restart governance manager, confirm entries survive.
   Run the tests."
```
Expected Output: Governance audit persisted to SQLite, existing tests still pass, new test passes
Validation: `ls .ultra-dex/audit/governance.db` → exists after running tests
Fallback #1: codex -m gpt-4 exec "same task"
Fallback #2: claude --model sonnet --effort high -p "same task"
Fallback #3: gemini -y -p "same task"
Cost Class: SUBSCRIPTION-INCLUDED

---

[WINDOW 12] CLAUDE — claude-sonnet-4
Task ID: P2-W12
Objective: Refactor SystemMonitor god object into focused classes
Target Files: src/monitoring/SystemMonitor.js (1,480 LOC), any importers
Why this lane: Architecture-sensitive refactor with risk of breaking callers — Premium lane required
Power Tier: HIGH
Command:
```bash
claude --model sonnet --effort high \
  "Read src/monitoring/SystemMonitor.js (1480 LOC). It has 40+ methods across 12 responsibilities.
   Refactor into these 4 focused classes in src/monitoring/:
   1) HealthChecker.js — health checks, component status
   2) AlertManager.js — alert evaluation, alert lifecycle
   3) MetricsReporter.js — metrics collection, reporting
   4) EngagementTracker.js — user engagement, agent performance
   Keep SystemMonitor.js as a facade that composes these 4 classes (thin wrapper for backward compatibility — do not break existing callers).
   Also fix the infinite recursion risk between getSystemHealthSummary() and getSystemStatus() — add a recursion guard.
   After refactor: run npm test. All existing tests must still pass."
```
Expected Output: 4 new focused modules, SystemMonitor.js as thin facade, tests passing
Validation: `npm run test:unit` → 0 failures. `wc -l src/monitoring/SystemMonitor.js` → < 200 lines
Fallback #1: claude --model opus --effort max -p "same task — focus on just splitting HealthChecker first"
Fallback #2: codex -m o3 exec "same task"
Fallback #3: NVIDIA route via OpenCode
Cost Class: SUBSCRIPTION-INCLUDED

---

[WINDOW 13] GEMINI — gemini-2.5-pro (3 parallel tabs)
Task ID: P2-W13
Objective: Write integration tests for orchestration, memory, and AI routing
Target Files: tests/integration/ (new files)
Why this lane: High-volume test writing — Gemini TDD loop at scale, $0 cost
Power Tier: HIGH
Command (Tab A — Orchestration Integration):
```bash
gemini -y -p \
  "Write tests/integration/orchestration-flow.test.js: test the full task dispatch flow through AgentOrchestrator — task submission → governance gate → agent selection → execution → result. Mock AI provider calls. Test: task succeeds, task blocked by governance, task fails and triggers self-healing event. Use Node.js test runner."
```
Command (Tab B — Memory Integration):
```bash
gemini -y -p \
  "Write tests/integration/memory-retrieval.test.js: test MemoryManager end-to-end — store entries with different importance scores (1-10), retrieve by query, verify tiering logic returns high-importance results first. Test cold/warm/hot tier classification. Use Node.js test runner. Use real SQLite (in-memory: ':memory:')."
```
Command (Tab C — AI Router Integration):
```bash
gemini -y -p \
  "Write tests/integration/ai-router.test.js: test SmartAIRouter — register 2 mock providers, route requests using cost strategy vs quality strategy, verify correct provider selected, simulate provider failure and verify fallback triggered. Verify latency metrics collected after routing. Use Node.js test runner."
```
Expected Output: 3 new integration test files, all tests passing
Validation: `npm run test:integration` → 0 failures
Fallback #1: gemini -p "same task for Tab A only first"
Fallback #2: codex --full-auto exec "same task"
Fallback #3: claude --model sonnet --effort high -p "same task"
Cost Class: FREE

---

[WINDOW 14] GEMINI — gemini-2.5-flash
Task ID: P2-W14
Objective: Add HTTPS/TLS to nginx.conf and configure SAST (CodeQL) in GitHub Actions
Target Files: nginx.conf, .github/workflows/codeql.yml (new)
Why this lane: Config editing — Gemini parallel worker
Power Tier: LOW
Command (Part 1 — Nginx):
```bash
gemini -y -p \
  "Read nginx.conf. It only listens on port 80. Add: server block on port 443 with ssl_certificate and ssl_certificate_key placeholders (variable-driven: \$SSL_CERT_PATH, \$SSL_KEY_PATH). Add redirect from port 80 to 443. Add: ssl_protocols TLSv1.2 TLSv1.3; ssl_prefer_server_ciphers on; add_header Strict-Transport-Security 'max-age=31536000'. Do not remove the port 80 block — keep it with the redirect."
```
Command (Part 2 — CodeQL):
```bash
gemini -y -p \
  "Create .github/workflows/codeql.yml: GitHub Actions workflow that runs CodeQL analysis on push and pull_request to main. Language: javascript-typescript. Schedule: weekly (cron '0 14 * * 1'). Use actions/checkout@v4, github/codeql-action/init@v3, github/codeql-action/autobuild@v3, github/codeql-action/analyze@v3. Set permissions: actions: read, contents: read, security-events: write."
```
Expected Output: nginx.conf with TLS config, .github/workflows/codeql.yml
Validation: `nginx -t -c nginx.conf` passes. CodeQL workflow file exists.
Fallback #1: gemini -p "same task — just nginx first"
Fallback #2: qwen --approval-mode yolo "same task"
Fallback #3: claude --model haiku -p "same task"
Cost Class: FREE

---

[WINDOW 15] QWEN — qwen-plus
Task ID: P2-W15
Objective: Fix Kubernetes deployment — move DB credentials to Secret, add RBAC, add NetworkPolicy
Target Files: config/k8s-deployment.yaml
Why this lane: Mechanical YAML editing — Qwen labor lane
Power Tier: BALANCED
Command:
```bash
qwen --auth-type qwen-oauth --approval-mode yolo \
  "Read config/k8s-deployment.yaml.
   Make these changes:
   1) DATABASE_URL: move it from ConfigMap to a Secret named 'ultra-dex-db-secret'. Update the Deployment to reference it via secretKeyRef instead of configMapKeyRef.
   2) Add a ServiceAccount named 'ultra-dex-sa' and reference it in the Deployment spec.
   3) Add a Role named 'ultra-dex-role' with minimal permissions (only: get/list on pods and services in the 'ultra-dex' namespace). Add a RoleBinding.
   4) Add a NetworkPolicy named 'ultra-dex-netpol' that: allows ingress only from the ingress controller (podSelector: app=ingress-nginx), allows egress only to postgres and redis pods (by label), denies all other pod-to-pod traffic.
   5) Replace 'ultra-dex.yourdomain.com' in Ingress with a placeholder: '\${ULTRA_DEX_DOMAIN}'.
   Keep all other existing configuration unchanged."
```
Expected Output: Updated k8s YAML with Secret, RBAC, NetworkPolicy
Validation: `kubectl apply --dry-run=client -f config/k8s-deployment.yaml` → no errors
Fallback #1: gemini -y -p "same task"
Fallback #2: codex exec "same task"
Fallback #3: claude --model haiku -p "same task"
Cost Class: FREE

---

## P3 — LOWER PRIORITY (Next Quarter)

---

[WINDOW 16] CLAUDE — claude-opus-4
Task ID: P3-W16
Objective: Replace keyword-based agent selection with semantic routing
Target Files: src/core/orchestration/index.js (selectAgentForTask), new src/core/orchestration/task-router.js
Why this lane: Architecture decision with significant downstream impact — Opus required
Power Tier: HIGH
Command:
```bash
claude --model opus --effort max \
  "Read src/core/orchestration/index.js, specifically selectAgentForTask(). It currently uses fragile keyword matching: if (taskLower.includes('ui')) return 'frontend'.
   Design and implement a semantic routing approach:
   1) Create src/core/orchestration/task-router.js with a TaskRouter class that scores tasks against agent capabilities using TF-IDF or cosine similarity (use gpt-tokenizer for tokenization, implement similarity in pure JS — no new deps).
   2) Agent profiles: read capability definitions from src/core/agents/registry.js and extract capability strings as the 'document' for each agent.
   3) Fall back to the existing keyword approach if similarity scores are all below 0.3.
   4) Write tests/core/task-router.test.js with 10+ routing scenarios.
   5) Wire TaskRouter into AgentOrchestrator replacing the old selectAgentForTask.
   Run all tests. Zero regressions."
```
Expected Output: TaskRouter class, wired into orchestrator, 10+ passing routing tests
Validation: `npm test` → 0 failures. Routing accuracy on 10 test cases > 80%
Fallback #1: claude --model sonnet --effort high -p "same task — start with weighted-keyword approach first"
Fallback #2: codex -m o3 exec "same task"
Fallback #3: NVIDIA route via OpenCode
Cost Class: API-KEY-USAGE

---

[WINDOW 17] CODEX — o1
Task ID: P3-W17
Objective: Fix dashboard build — replace local file: dependency with publishable package reference
Target Files: apps/dashboard/package.json, packages/core/ (new), root package.json
Why this lane: Requires understanding of monorepo publish strategy
Power Tier: BALANCED
Command:
```bash
codex --full-auto -m o1 exec \
  "Read apps/dashboard/package.json. It has '@ultra-dex/core': 'file:../../src/core' which breaks npm publish.
   1) Create packages/core/ as a proper package: copy src/core/index.js as the entry, create packages/core/package.json with name '@ultra-dex/core', version from root package.json, type: module, main: index.js.
   2) Update apps/dashboard/package.json to reference '@ultra-dex/core': 'workspace:*'.
   3) Add 'workspaces': ['apps/*', 'packages/*'] to root package.json if not present.
   4) Run 'npm install' and then 'cd apps/dashboard && npm run build'.
   5) Build must succeed."
```
Expected Output: packages/core/ created, dashboard builds without local file: reference
Validation: `cd apps/dashboard && npm run build` → exits 0
Fallback #1: codex -m gpt-4 exec "simpler: just add workspaces to root package.json"
Fallback #2: claude --model sonnet --effort high -p "same task"
Fallback #3: gemini -y -p "same task"
Cost Class: SUBSCRIPTION-INCLUDED

---

[WINDOW 18] QWEN — qwen-plus (2 tabs)
Task ID: P3-W18
Objective: Audit and remove unused cloud SDK dependencies
Target Files: package.json, src/**/*.js
Why this lane: Scanning + mechanical removal — Qwen high-volume labor
Power Tier: BALANCED
Command (Tab A — Scan first):
```bash
qwen --auth-type qwen-oauth --approval-mode plan \
  "Scan src/ and apps/ for actual import/require usage of each of these packages: @azure/functions, @azure/identity, @azure/monitor-query, @azure/storage-blob, @google-cloud/aiplatform, @google-cloud/logging, @google-cloud/monitoring, @google-cloud/storage, @aws-sdk/client-cloudwatch, @aws-sdk/client-iam, @aws-sdk/client-lambda. For each package: count how many files import it. Output a markdown table: package | import count | files."
```
Command (Tab B — Remove after reviewing Tab A output):
```bash
qwen --auth-type qwen-oauth --approval-mode yolo \
  "Based on the scan: remove any cloud SDK package from package.json that has 0 import usages in src/ and apps/. Run 'npm install' after. Run 'npm test' and confirm 0 regressions."
```
Expected Output: Scan table + reduced package.json with unused SDKs removed
Validation: `npm test` → 0 failures after removal
Fallback #1: Manual review of scan output before removal
Fallback #2: Keep all if any doubt
Cost Class: FREE

---

## Cycle Completion Checklist

Before closing Cycle 1, verify all of the following:

- [ ] `npm audit --audit-level high` → 0 findings
- [ ] `npx tsc --noEmit` → 0 errors
- [ ] `npm run test:coverage` → orchestration + agents >= 50% line coverage
- [ ] `npm run build` → no silent failures (no "Core built" echo fallback)
- [ ] `find src/ -name "*.bak" | wc -l` → 0
- [ ] `grep -r 'nvapi-' .env .env.local 2>/dev/null` → no matches (keys rotated)
- [ ] `grep ':-ultra_password' docker-compose.prod.yml` → no matches
- [ ] `.github/workflows/codeql.yml` exists

---

*Dispatches generated from full project review — 2026-04-05*
*Protocol: .protocol/orchestration.md + execution.md*
