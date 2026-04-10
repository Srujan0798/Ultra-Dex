# 🚀 ULTRA-DEX V2.0 PHASE 1 — FOUNDATION EXECUTION
## Execute Strategic Plan Using .protocol Orchestration

---

## 🎯 MISSION

Execute **Phase 1: Foundation (Months 1-2)** from the V2.0 Strategic Plan.

**Phase 1 Goal:** "Make It Real" — Ship v3.2.0 with Redis, Postgres, npm publish, and public repo.

**Reference:** `docs/strategic/v2.0-strategic-plan.md` (Section 4.2 Phase 1)

---

## 📚 CONTEXT FILES (Read First)

1. **docs/strategic/v2.0-strategic-plan.md** — Full strategic plan
2. **.protocol/orchestration.md** — How to orchestrate multi-window execution
3. **.protocol/execution.md** — Execution rules and identity
4. **CLAUDE.md** — Project architecture and commands
5. **NOTION/pre v2.0.md** — Original protocol context

---

## 🏗️ .PROTOCOL ORCHESTRATION STRUCTURE

### 4-Window Parallel System

Use the .protocol/orchestration.md dispatch format:

```
[WINDOW N] <TOOL + MODEL>
Task ID:
Objective:
Target Files:
Why this lane:
Power Tier: LOW|BALANCED|HIGH
Command:
Prompt:
Expected Output:
Validation:
Fallback #1:
Fallback #2:
Fallback #3:
Cost Class: FREE|SUBSCRIPTION-INCLUDED|API-KEY-USAGE
```

### Window Assignment

| Window | Role | Tool | Responsibility |
|--------|------|------|----------------|
| **W1** | Database Engineer | Claude Sonnet | Redis + Postgres setup |
| **W2** | DevOps Engineer | Claude Sonnet | Docker compose + npm publish |
| **W3** | Documentation | Gemini Flash | README + contributing guide |
| **W4** | QA/Validation | Codex o1 | End-to-end testing |

---

## 🔧 PHASE 1 EXECUTION — WEEK BY WEEK

### ═══════════════════════════════════════════════
### WEEK 1: ✅ Ship Cycle 6 (VERIFY — Already Done)
### ═══════════════════════════════════════════════

**Window 4 (QA):** Verify Cycle 6 completion

```bash
[WINDOW 4] CODEX — o1
Task ID: W4-VERIFY-CYCLE6
Objective: Verify all 35 completion criteria from Cycle 6
Target Files: test suites, build outputs
Why this lane: Comprehensive verification requires o1 analysis
Power Tier: HIGH
Command:
codex --full-auto -m o1 exec "Run comprehensive verification of Ultra-Dex"
Prompt: "Verify Ultra-Dex Cycle 6 completion:

1. Run all tests: npm test
2. Check build: npm run build
3. Verify CLI: node apps/cli/bin/ultra-dex.js --help
4. Check lint: npm run lint
5. Check TypeScript: npx tsc --noEmit

Report EXACT counts:
- Tests passing: X/Y
- Build: exit code
- CLI help: works/broken
- Lint errors: X
- TS errors: X

Verdict: READY FOR V2.0 / BLOCKED"
Expected Output: Verification report with pass/fail for each check
Validation: All checks pass
Fallback #1: claude --model sonnet --effort high -p "Run npm test and report results"
Fallback #2: qwen --auth-type qwen-oauth -y "Run Ultra-Dex test suite"
Fallback #3: opencode run -m opencode/devstral-2-123b-instruct-2512 -p "Run npm test and npm run build"
Cost Class: SUBSCRIPTION-INCLUDED
```

---

### ═══════════════════════════════════════════════
### WEEK 2: Redis Persistence for Memory (PARALLEL)
### ═══════════════════════════════════════════════

**Window 1 (Database Engineer):** Redis implementation

```bash
[WINDOW 1] CLAUDE — claude-sonnet-4
Task ID: W1-REDIS-MEMORY
Objective: Replace file-based memory with Redis tier
Target Files: src/core/memory/tiered-storage.ts, src/core/memory/unified-api.ts
Why this lane: Database architecture requires Sonnet's careful design
Power Tier: BALANCED
Command:
claude --model sonnet --effort high -p "Implement Redis persistence for Ultra-Dex memory"
Prompt: "Ultra-Dex V2.0 Phase 1 — Week 2: Redis Memory Implementation

CURRENT STATE:
- Memory system has 3 tiers: L1 (in-process), L2 (file), L3 (vector)
- L2 is file-based and doesn't survive restarts

GOAL:
Replace L2 file storage with Redis for persistence and speed.

IMPLEMENTATION:
1. Install Redis client: npm install ioredis
2. Update src/core/memory/tiered-storage.ts:
   - Add Redis client initialization
   - Replace file-based L2 with Redis L2
   - Keep L1 (in-process) for speed
   - Keep L3 (vector) for semantic search
3. Environment variables:
   - REDIS_URL=redis://localhost:6379
4. Update docker-compose.yml to include Redis service

VALIDATION:
```bash
# Start Redis
docker compose up redis -d

# Run Ultra-Dex task
ultra-dex run planner -t "hello"

# Restart server
# Run same task — should use cached memory
```

Expected: Memory persists across restarts, <10ms reads

Report: files changed, Redis config, validation results"
Expected Output: Redis-integrated memory system with validation
Validation: ultra-dex run planner works with Redis persistence
Fallback #1: claude --model sonnet --effort medium -p "Add Redis to docker-compose only"
Fallback #2: gemini -p "Set up Redis service in docker-compose.yml"
Fallback #3: opencode run -m opencode/gpt-5-nano -p "Add Redis to Ultra-Dex docker-compose"
Cost Class: SUBSCRIPTION-INCLUDED
```

---

### ═══════════════════════════════════════════════
### WEEK 3: Postgres Migration + npm Publish (PARALLEL)
### ═══════════════════════════════════════════════

**Window 1 (Database Engineer):** Postgres for audit + billing

```bash
[WINDOW 1] CLAUDE — claude-sonnet-4
Task ID: W1-POSTGRES-AUDIT
Objective: Migrate SQLite audit and billing to Postgres
Target Files: src/core/governance/audit-db.ts, src/core/billing/billing-service.ts
Why this lane: Database migration requires careful data handling
Power Tier: BALANCED
Command:
claude --model sonnet --effort high -p "Migrate Ultra-Dex from SQLite to Postgres"
Prompt: "Ultra-Dex V2.0 Phase 1 — Week 3: Postgres Migration

CURRENT STATE:
- Audit logging uses SQLite
- Need to migrate to Postgres for production scale

GOAL:
Migrate governance audit and billing to Postgres.

IMPLEMENTATION:
1. Install Postgres client: npm install pg
2. Create database schema:
   - audits table (id, timestamp, user_id, action, result)
   - billing_events table (id, user_id, event_type, amount, timestamp)
3. Update src/core/governance/audit-db.ts:
   - Replace SQLite with Postgres queries
4. Update src/core/billing/billing-service.ts:
   - Use Postgres for billing events
5. Environment variables:
   - DATABASE_URL=postgresql://user:pass@localhost:5432/ultradex
6. Migration script for existing SQLite data (if any)

VALIDATION:
```bash
# Start Postgres
docker compose up postgres -d

# Run tests
npm run test:integration

# Verify data in Postgres
psql $DATABASE_URL -c "SELECT COUNT(*) FROM audits;"
```

Report: schema, migration script, validation results"
Expected Output: Postgres-migrated audit and billing system
Validation: Integration tests pass with Postgres
Fallback #1: claude --model sonnet --effort medium -p "Create Postgres schema only"
Fallback #2: codex --full-auto -m o1 exec "Migrate SQLite to Postgres"
Fallback #3: opencode run -m opencode/devstral-2-123b-instruct-2512 -p "Set up Postgres for audit logging"
Cost Class: SUBSCRIPTION-INCLUDED
```

**Window 2 (DevOps Engineer):** npm publish + Docker

```bash
[WINDOW 2] CLAUDE — claude-sonnet-4
Task ID: W2-NPM-PUBLISH
Objective: Publish @ultra-dex/cli to npm and Docker Hub
Target Files: package.json, Dockerfile, .github/workflows/publish.yml
Why this lane: DevOps pipeline setup requires Sonnet
Power Tier: BALANCED
Command:
claude --model sonnet --effort high -p "Set up npm and Docker publish for Ultra-Dex"
Prompt: "Ultra-Dex V2.0 Phase 1 — Week 3: Publish to npm and Docker

GOAL:
Make Ultra-Dex installable via npm and Docker.

IMPLEMENTATION:

1. npm Package Setup:
   - Update package.json:
     * name: "@ultra-dex/cli"
     * version: "3.2.0"
     * bin: { "ultra-dex": "./apps/cli/bin/ultra-dex.js" }
     * files: ["apps/cli", "src/core", "dist"]
     * publishConfig: { "access": "public" }
   - Create .npmignore
   - Build before publish: npm run build:cli

2. GitHub Actions Workflow (.github/workflows/publish.yml):
   - Trigger on tag push (v*)
   - Build and test
   - Publish to npm
   - Create GitHub Release

3. Docker Setup:
   - Update Dockerfile for production
   - Multi-stage build (build → production)
   - docker-compose.yml for local dev
   - Push to Docker Hub or GitHub Container Registry

VALIDATION:
```bash
# npm (dry run)
npm publish --dry-run

# Docker
docker build -t ultra-dex:3.2.0 .
docker run ultra-dex:3.2.0 ultra-dex --help
```

Report: package.json changes, workflow file, Docker validation"
Expected Output: npm and Docker publish pipeline ready
Validation: npm publish --dry-run succeeds, Docker image builds
Fallback #1: claude --model sonnet --effort medium -p "Create npm publish workflow only"
Fallback #2: gemini -p "Set up GitHub Actions for npm publish"
Fallback #3: opencode run -m opencode/gpt-5-nano -p "Create Dockerfile and docker-compose.yml"
Cost Class: FREE
```

---

### ═══════════════════════════════════════════════
### WEEK 4: Go Public on GitHub (PARALLEL)
### ═══════════════════════════════════════════════

**Window 3 (Documentation):** README + contributing guide

```bash
[WINDOW 3] GEMINI — gemini-2.0-flash-exp
Task ID: W3-PUBLIC-README
Objective: Create star-worthy README and contributing guide
Target Files: README.md, CONTRIBUTING.md, LICENSE
Why this lane: Documentation generation at scale
Power Tier: BALANCED
Command:
gemini -p "Create star-worthy README for Ultra-Dex open source project"
Prompt: "Ultra-Dex V2.0 Phase 1 — Week 4: Public Repository Preparation

Create a star-worthy README.md for GitHub open source:

SECTIONS REQUIRED:
1. Hero banner (ASCII art or simple graphic)
2. One-line description
3. 30-second demo (asciinema or code block)
4. Installation (npm, Docker, source)
5. Quick start (3 commands to first task)
6. Key features (with emojis)
7. Architecture diagram (ASCII or mermaid)
8. Provider support matrix
9. Contributing section (link to CONTRIBUTING.md)
10. License (MIT)

ALSO CREATE:
- CONTRIBUTING.md: How to set up dev environment, run tests, submit PRs
- .github/ISSUE_TEMPLATE.md: Bug report template
- .github/PULL_REQUEST_TEMPLATE.md: PR template

TONE: Professional but approachable. Target: JS/TS developers.

Output: README.md, CONTRIBUTING.md, issue/PR templates"
Expected Output: Complete README.md and contributing docs
Validation: README passes markdown lint, looks good on GitHub
Fallback #1: gemini -p "Write README.md only with quick start"
Fallback #2: qwen --auth-type qwen-oauth -y "Create Ultra-Dex README"
Fallback #3: opencode run -m opencode/nemotron-3-super-free -p "Create open source README for AI orchestration CLI"
Cost Class: FREE
```

**Window 4 (QA):** End-to-end validation

```bash
[WINDOW 4] CODEX — o1
Task ID: W4-E2E-VALIDATION
Objective: E2E test: stranger can clone, install, configure, run in <10 min
Target Files: docs/QUICK-START.md, test/e2e/onboarding.test.ts
Why this lane: Comprehensive validation requires o1
Power Tier: HIGH
Command:
codex --full-auto -m o1 exec "Run E2E validation for Ultra-Dex onboarding"
Prompt: "Ultra-Dex V2.0 Phase 1 — Week 4: E2E Onboarding Validation

SIMULATE A NEW USER:

1. Clone repo (fresh directory)
2. Read README.md — understand what it does
3. Install dependencies (npm install)
4. Configure environment (.env from .env.example)
5. Run first task (ultra-dex run planner -t "hello")

VALIDATION CHECKLIST:
- [ ] Clone completes without errors
- [ ] README explains the project clearly
- [ ] npm install succeeds
- [ ] .env setup is documented
- [ ] First task runs and produces output
- [ ] Total time < 10 minutes

MEASURE:
- Time to first task
- Number of errors encountered
- Clarity of error messages
- Documentation helpfulness

Report: onboarding time, issues found, recommendations"
Expected Output: E2E validation report with timing and issues
Validation: New user can onboard in <10 min
Fallback #1: claude --model sonnet --effort high -p "Test Ultra-Dex onboarding as new user"
Fallback #2: gemini -p "Review Ultra-Dex README for clarity"
Fallback #3: opencode run -m opencode/gpt-5-nano -p "Test npm install and first run"
Cost Class: SUBSCRIPTION-INCLUDED
```

---

## 📋 SUCCESS CRITERIA (Phase 1 Complete)

**Gate to Phase 2:** All must pass

- [ ] Redis memory persistence works (<10ms reads)
- [ ] Postgres audit/billing migrated
- [ ] npm publish --dry-run succeeds
- [ ] Docker image builds and runs
- [ ] README is star-worthy
- [ ] New user onboard in <10 min
- [ ] v3.2.0 tagged and published

---

## 🚫 .PROTOCOL RULES (From .protocol/execution.md)

**The 4 Rules:**
1. **Don't break what works** — User trust > perfect code
2. **Verify before done** — Run the test
3. **One blocker at a time** — Focus beats scatter
4. **24h stall → act** — Otherwise watch

**Identity:**
```
Spider-Man  = Friendly, helpful, cares about people
Daredevil   = Disciplined, precise, protects the city
Punisher    = No compromise, relentless, correct intent
─────────────────────────────────────────────────────
Combined    = Silent Protector with Perfect Intent
```

**The Oath:**
```
I don't explain the plane.
I DELIVER the destination.

No credit needed.
No process theater.
Just outcomes.
```

---

## 📊 REPORTING FORMAT

**After each week, report:**

```
═══════════════════════════════════════════════════════════════
PHASE 1 — WEEK X: [NAME] — [STATUS]
═══════════════════════════════════════════════════════════════

COMPLETED:
✓ [Deliverable 1]
✓ [Deliverable 2]

WINDOW RESULTS:
- W1: [Status] — [Key output]
- W2: [Status] — [Key output]
- W3: [Status] — [Key output]
- W4: [Status] — [Key output]

BLOCKERS (if any):
⛔ [Blocker with owner and ETA]

NEXT: Week X+1 / Fix blockers
═══════════════════════════════════════════════════════════════
```

---

## 🎬 EXECUTION FLOW

```
START Phase 1
  ↓
Week 1: W4 verifies Cycle 6 complete
  ↓
Week 2: W1 implements Redis (parallel with planning Week 3)
  ↓
Week 3: W1 Postgres + W2 npm/Docker (parallel)
  ↓
Week 4: W3 README + W4 E2E validation (parallel)
  ↓
All gates pass?
  ├─ YES → Tag v3.2.0 → PHASE 2
  └─ NO  → Fix blockers → retry
```

---

**THIS IS .PROTOCOL EXECUTION.**
**MULTI-WINDOW PARALLEL.**
**WEEKLY GATES.**
**DELIVER OUTCOMES.**

---

*Phase 1: Foundation — "Make It Real"*
*Execute with .protocol orchestration*
