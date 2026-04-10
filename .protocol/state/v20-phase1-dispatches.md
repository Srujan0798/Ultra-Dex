# V2.0 PHASE 1 DISPATCHES — FOUNDATION (Months 1-2)
> Source: V2.0 Strategic Plan + /engineering:architecture + /engineering:system-design + /engineering:deploy-checklist
> Cycle 6 Status: 85% COMPLETE (15/17 files exist, v3.1.0 tagged, architecture clean)
> Phase 1 Starts: After Cycle 6 gate passes

---

## PHASE OVERVIEW

**Thesis:** Stop being a project. Become a product. Replace file-based storage with production databases, publish to npm, go public on GitHub. Make Ultra-Dex installable and usable by someone who isn't the author.

**Success Gate:**
```bash
npm install -g @ultra-dex/cli && ultra-dex --help  # works on clean machine
ultra-dex run planner -t "hello" --provider nvidia  # works with Redis memory
docker compose up  # CLI + dashboard + Redis + Postgres all healthy
# New user: configure provider → run task in <5 minutes
```

**Total Windows:** 16 (4 per week × 4 weeks)
**Parallel Safe:** All windows within same week are parallel-safe
**Estimated Runtime:** 4 weeks continuous

---

## ═══════════════════════════════════════════════
## WEEK 1: REDIS MEMORY TIER (Replace file-based L2/L3)
## ═══════════════════════════════════════════════

### Week 1 Parallel Windows: W1, W2, W3, W4
### Gate: `ultra-dex run planner -t "hello"` works with Redis persistence, memory survives restart

---

### [WINDOW 1] CLAUDE — claude-opus-4
Task ID: V20-W1-REDIS-ADAPTER
Objective: Create Redis adapter for memory tier replacing file-based .ultra/memory.json
Target Files: src/core/memory/redis-adapter.ts (NEW), src/core/memory/tiered-storage.ts, src/core/memory/unified-api.ts
Why this lane: Database architecture is irreversible. Opus for correctness on critical persistence layer.
Power Tier: HIGH
Command:
```bash
claude --model opus --effort max -p \
  "Create Redis adapter for Ultra-Dex memory system.

   CURRENT STATE:
   - src/core/memory/tiered-storage.ts (117 LOC) — L1 cache, L2 file, L3 long-term
   - src/core/memory/unified-api.ts (521 LOC) — ppmManager with semantic search
   - Storage: .ultra/memory.json (file-based, survives restart but not scalable)

   CREATE src/core/memory/redis-adapter.ts:
   1) RedisMemoryAdapter class implementing IMemoryStorage interface
   2) Methods:
      - connect(redisUrl): Connect to Redis instance
      - get(key): Get memory entry (<10ms target)
      - set(key, value, ttl?): Store with optional TTL
      - search(query, topK): Vector similarity search via RediSearch FT.SEARCH
      - delete(key): Remove entry
      - flush(): Clear all entries for tenant
      - healthCheck(): PING response
   3) Connection pooling with ioredis
   4) Graceful fallback: if REDIS_URL not set, fall back to file-based storage
   5) Key namespacing: ultra-dex:{tenantId}:{memoryType}:{key}

   UPDATE tiered-storage.ts:
   - L2: Redis (was file)
   - L3: Redis with vector index (was file)
   - L1: In-memory Map (unchanged)
   - Storage selection: env MEMORY_BACKEND=redis|file (default: file for dev)

   UPDATE unified-api.ts:
   - Import RedisMemoryAdapter
   - Use adapter based on MEMORY_BACKEND env var
   - All existing ppmManager methods must still work

   DEPENDENCIES: npm install ioredis @redis/search

   VALIDATE:
   - npm run typecheck → 0 errors
   - Existing memory tests still pass
   - New test: write → restart process → read → same data"
```
Expected Output: Redis adapter with <10ms reads, vector search, graceful file fallback
Validation:
```bash
npx tsc --noEmit 2>&1 | tail -3
npm run test:unit -- tests/core/memory*.test.js 2>&1 | tail -5
```
Fallback #1: `claude --model sonnet --effort high -p "Create Redis adapter for Ultra-Dex memory. Read src/core/memory/tiered-storage.ts and unified-api.ts. Replace file-based L2/L3 with ioredis. Graceful fallback if no REDIS_URL."`
Fallback #2: `codex --full-auto -m o1 exec "Create src/core/memory/redis-adapter.ts. ioredis-based. Methods: connect, get, set, search (RediSearch), delete, flush, healthCheck. Key pattern: ultra-dex:{tenantId}:{type}:{key}. Update tiered-storage.ts L2/L3 to use it."`
Fallback #3: `opencode run -m opencode/devstral-2-123b-instruct-2512 -p "Create src/core/memory/redis-adapter.ts for Ultra-Dex. Wraps ioredis. Implements IMemoryStorage. Updates tiered-storage.ts to use Redis for L2/L3 when MEMORY_BACKEND=redis. Falls back to file-based when no REDIS_URL."`
Cost Class: SUBSCRIPTION-INCLUDED

---

### [WINDOW 2] CLAUDE — claude-sonnet-4
Task ID: V20-W2-POSTGRES-SCHEMA
Objective: Design and create Postgres schema for audit trail, billing, and users
Target Files: src/core/database/schema.sql (NEW), src/core/database/postgres-client.ts (NEW), src/core/database/migrations/ (NEW)
Why this lane: Schema design requires careful relational modeling. Sonnet for balanced speed/quality.
Power Tier: BALANCED
Command:
```bash
claude --model sonnet --effort high -p \
  "Create Postgres database layer for Ultra-Dex.

   CURRENT STATE:
   - Audit: SQLite at .ultra/governance-audit.db (audit-db.ts, 271 LOC)
   - Billing: In-memory + Stripe API (billing-service.ts, 283 LOC)
   - Users: Clerk external (clerk-auth-service.ts, 124 LOC)

   CREATE src/core/database/schema.sql:
   \`\`\`sql
   -- Users (synced from Clerk)
   CREATE TABLE users (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     clerk_id TEXT UNIQUE NOT NULL,
     email TEXT NOT NULL,
     role TEXT NOT NULL DEFAULT 'developer',
     plan TEXT NOT NULL DEFAULT 'free',
     created_at TIMESTAMPTZ DEFAULT NOW(),
     updated_at TIMESTAMPTZ DEFAULT NOW()
   );

   -- Audit log (replaces SQLite)
   CREATE TABLE audit_events (
     id BIGSERIAL PRIMARY KEY,
     user_id UUID REFERENCES users(id),
     agent TEXT NOT NULL,
     action TEXT NOT NULL,
     target TEXT,
     result TEXT NOT NULL,
     metadata JSONB,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   CREATE INDEX idx_audit_created ON audit_events(created_at);
   CREATE INDEX idx_audit_user ON audit_events(user_id);

   -- Usage tracking (replaces in-memory)
   CREATE TABLE usage_events (
     id BIGSERIAL PRIMARY KEY,
     user_id UUID REFERENCES users(id),
     provider TEXT NOT NULL,
     model TEXT NOT NULL,
     tokens_in INTEGER DEFAULT 0,
     tokens_out INTEGER DEFAULT 0,
     latency_ms INTEGER,
     cost_usd DECIMAL(10,6),
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   CREATE INDEX idx_usage_user_date ON usage_events(user_id, created_at);

   -- Execution traces
   CREATE TABLE execution_traces (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     run_id TEXT UNIQUE NOT NULL,
     user_id UUID REFERENCES users(id),
     agent TEXT NOT NULL,
     task TEXT,
     steps JSONB NOT NULL DEFAULT '[]',
     status TEXT NOT NULL DEFAULT 'running',
     started_at TIMESTAMPTZ DEFAULT NOW(),
     completed_at TIMESTAMPTZ
   );
   \`\`\`

   CREATE src/core/database/postgres-client.ts:
   1) PostgresClient class wrapping 'pg' (node-postgres)
   2) Connection pool with pg.Pool
   3) Methods: query, transaction, migrate, healthCheck
   4) Graceful fallback: if DATABASE_URL not set, use SQLite
   5) Env vars: DATABASE_URL, DB_POOL_SIZE (default 10)

   CREATE src/core/database/migrations/:
   - 001_initial_schema.sql (the schema above)
   - migrate.ts (runner that applies migrations in order)

   DEPENDENCIES: npm install pg @types/pg

   VALIDATE:
   - npm run typecheck → 0 errors
   - Schema validates: psql < schema.sql (syntax check)"
```
Expected Output: Postgres schema + client + migration runner
Validation:
```bash
test -f src/core/database/schema.sql && test -f src/core/database/postgres-client.ts
npx tsc --noEmit 2>&1 | tail -3
```
Fallback #1: `claude --model haiku --effort medium -p "Create Postgres schema and client for Ultra-Dex. Tables: users, audit_events, usage_events, execution_traces. Use pg library. Graceful SQLite fallback."`
Fallback #2: `gemini -y -p "Create src/core/database/ with schema.sql (users, audit_events, usage_events, execution_traces), postgres-client.ts (pg.Pool wrapper), and migrations/001_initial_schema.sql"`
Fallback #3: `opencode run -m opencode/devstral-2-123b-instruct-2512 -p "Create src/core/database/schema.sql with 4 tables (users, audit_events, usage_events, execution_traces), postgres-client.ts wrapping pg.Pool, migrations/001_initial_schema.sql. Fallback to SQLite if no DATABASE_URL."`
Cost Class: SUBSCRIPTION-INCLUDED

---

### [WINDOW 3] GEMINI — gemini-2.5-pro
Task ID: V20-W3-AUDIT-MIGRATE
Objective: Migrate audit-db.ts from SQLite to Postgres adapter pattern
Target Files: src/core/governance/audit-db.ts, src/core/governance/audit.ts
Why this lane: Adapter pattern refactor is structured work. Gemini Pro for clean extraction.
Power Tier: BALANCED
Command:
```bash
gemini -y -p \
  "Refactor Ultra-Dex audit system to use adapter pattern.

   CURRENT: src/core/governance/audit-db.ts (271 LOC) writes directly to SQLite.

   REFACTOR:
   1) Create IAuditStore interface in src/core/governance/audit-store.ts:
      - logEvent(event): Promise<void>
      - queryEvents(filters): Promise<AuditEvent[]>
      - exportCSV(dateRange): Promise<string>

   2) Create SqliteAuditStore (extract from current audit-db.ts)
   3) Create PostgresAuditStore (uses postgres-client.ts from W2)
   4) Update audit-db.ts to use factory:
      - if DATABASE_URL set → PostgresAuditStore
      - else → SqliteAuditStore (existing behavior preserved)

   5) Update audit.ts (203 LOC) to use the interface, not the concrete class

   CRITICAL: Existing tests MUST still pass. SQLite is default for dev.

   VALIDATE:
   - npm run typecheck → 0 errors
   - npm run test:unit -- tests/core/governance*.test.js → all pass"
```
Expected Output: Audit system with Postgres/SQLite adapter pattern
Validation:
```bash
npx tsc --noEmit 2>&1 | tail -3
npm run test:unit -- tests/core/governance*.test.js 2>&1 | tail -5
```
Fallback #1: `gemini -p "Create IAuditStore interface for Ultra-Dex audit system. Extract SqliteAuditStore from audit-db.ts. Create PostgresAuditStore using pg client. Factory pattern based on DATABASE_URL."`
Fallback #2: `qwen --auth-type qwen-oauth --approval-mode yolo "Refactor src/core/governance/audit-db.ts to adapter pattern. IAuditStore interface, SqliteAuditStore, PostgresAuditStore. Factory based on DATABASE_URL."`
Fallback #3: `opencode run -m opencode/devstral-2-123b-instruct-2512 -p "Refactor audit-db.ts (271 LOC) to adapter pattern. Create IAuditStore interface, SqliteAuditStore (existing), PostgresAuditStore (new). Factory: DATABASE_URL → Postgres, else SQLite."`
Cost Class: FREE

---

### [WINDOW 4] GEMINI — gemini-2.5-flash
Task ID: V20-W4-DOCKER-COMPOSE
Objective: Create docker-compose.yml for local development with Redis + Postgres
Target Files: docker-compose.yml (NEW), Dockerfile (NEW), .env.example (UPDATE)
Why this lane: DevOps config generation. Gemini Flash for speed.
Power Tier: LOW
Command:
```bash
gemini -y -p \
  "Create Docker setup for Ultra-Dex local development.

   CREATE docker-compose.yml:
   services:
     ultra-dex:
       build: .
       ports: ['3000:3000', '3002:3002']
       env_file: .env
       depends_on: [redis, postgres]
       volumes: ['.:/app', '/app/node_modules']

     redis:
       image: redis/redis-stack:latest
       ports: ['6379:6379', '8001:8001']
       volumes: ['redis-data:/data']

     postgres:
       image: postgres:16-alpine
       ports: ['5432:5432']
       environment:
         POSTGRES_DB: ultradex
         POSTGRES_USER: ultradex
         POSTGRES_PASSWORD: ultradex_dev
       volumes: ['postgres-data:/var/lib/postgresql/data']

   volumes:
     redis-data:
     postgres-data:

   CREATE Dockerfile:
   - FROM node:22-alpine
   - WORKDIR /app
   - COPY package*.json ./
   - RUN npm ci
   - COPY . .
   - RUN npm run build
   - EXPOSE 3000 3002
   - CMD ['node', 'apps/cli/bin/ultra-dex.js', 'serve']

   UPDATE .env.example:
   - Add REDIS_URL=redis://localhost:6379
   - Add DATABASE_URL=postgresql://ultradex:ultradex_dev@localhost:5432/ultradex
   - Add MEMORY_BACKEND=redis

   VALIDATE:
   - docker compose config → valid YAML
   - Dockerfile syntax correct"
```
Expected Output: docker-compose.yml + Dockerfile + updated .env.example
Validation:
```bash
test -f docker-compose.yml && test -f Dockerfile
docker compose config 2>&1 | head -5
```
Fallback #1: `qwen --auth-type qwen-oauth --approval-mode yolo "Create docker-compose.yml with ultra-dex, redis, postgres services. Create Dockerfile from node:22-alpine. Update .env.example."`
Fallback #2: `gemini -p "Create Docker Compose for Ultra-Dex: app (node:22), redis (redis-stack), postgres (16-alpine). Dockerfile, .env.example."`
Fallback #3: `opencode run -m opencode/gpt-5-nano -p "Create docker-compose.yml (3 services: app, redis, postgres), Dockerfile (node:22-alpine), update .env.example with REDIS_URL and DATABASE_URL."`
Cost Class: FREE

---

## ═══════════════════════════════════════════════
## WEEK 2: POSTGRES MIGRATION + INTEGRATION TESTS
## ═══════════════════════════════════════════════

### Week 2 Parallel Windows: W5, W6, W7, W8
### Gate: `docker compose up` → all services healthy, audit writes to Postgres, memory reads from Redis

---

### [WINDOW 5] CLAUDE — claude-sonnet-4
Task ID: V20-W5-USAGE-MIGRATE
Objective: Migrate usage-meter.ts from in-memory Map to Postgres
Target Files: src/core/billing/usage-meter.ts, src/core/database/postgres-client.ts
Why this lane: Billing data persistence is business-critical. Sonnet for precision.
Power Tier: BALANCED
Command:
```bash
claude --model sonnet --effort high -p \
  "Migrate Ultra-Dex usage metering from in-memory to Postgres.

   CURRENT: src/core/billing/usage-meter.ts (176 LOC) uses in-memory Map.

   UPDATE usage-meter.ts:
   1) Add PostgresUsageStore that writes to usage_events table
   2) Keep InMemoryUsageStore as fallback (no DATABASE_URL)
   3) trackUsage() → INSERT INTO usage_events
   4) getUsage() → SELECT COUNT + SUM from usage_events WHERE user_id AND date range
   5) checkLimit() → Compare count against tier limits
   6) Add aggregation: getUsageSummary(userId, period) → {requests, tokens, cost, byProvider}

   The usage_events table schema from W2:
   id BIGSERIAL, user_id UUID, provider TEXT, model TEXT,
   tokens_in INT, tokens_out INT, latency_ms INT, cost_usd DECIMAL, created_at TIMESTAMPTZ

   VALIDATE:
   - npm run typecheck → 0 errors
   - Existing usage-meter tests still pass"
```
Expected Output: Usage metering persisted to Postgres with in-memory fallback
Validation: `npx tsc --noEmit 2>&1 | tail -3`
Fallback #1: `claude --model haiku --effort medium -p "Update usage-meter.ts to write to Postgres usage_events table. Keep in-memory fallback."`
Fallback #2: `gemini -y -p "Migrate src/core/billing/usage-meter.ts from in-memory Map to Postgres usage_events table. Adapter pattern. Keep in-memory fallback."`
Fallback #3: `opencode run -m opencode/devstral-2-123b-instruct-2512 -p "Update src/core/billing/usage-meter.ts. Add PostgresUsageStore writing to usage_events table. Keep InMemoryUsageStore as fallback. Adapter pattern."`
Cost Class: SUBSCRIPTION-INCLUDED

---

### [WINDOW 6] CODEX — o1
Task ID: V20-W6-TRACE-MIGRATE
Objective: Migrate execution traces from run.js in-memory to Postgres execution_traces table
Target Files: apps/cli/lib/commands/run.js, src/core/database/postgres-client.ts
Why this lane: Trace persistence in 1632-LOC run.js needs strong reasoning. Codex o1.
Power Tier: HIGH
Command:
```bash
codex --full-auto -m o1 exec \
  "Migrate Ultra-Dex execution traces to Postgres.

   CURRENT: apps/cli/lib/commands/run.js (1632 LOC) stores traces in-memory (run_id, steps[]).

   ADD persistence layer:
   1) At execution start: INSERT INTO execution_traces (run_id, user_id, agent, task, status)
   2) After each step: UPDATE execution_traces SET steps = steps || new_step WHERE run_id = ?
   3) At completion: UPDATE execution_traces SET status = 'completed', completed_at = NOW()
   4) On error: UPDATE execution_traces SET status = 'failed'

   Use postgres-client.ts from src/core/database/.
   If no DATABASE_URL → skip persistence, keep in-memory only (current behavior).

   DO NOT change run.js execution logic. Only ADD persistence calls at 4 points.

   VALIDATE:
   - npm run typecheck → 0 errors
   - MOCK_AI=true node apps/cli/bin/ultra-dex.js run planner -t 'hello' → still works"
```
Expected Output: Execution traces persisted to Postgres
Validation: `MOCK_AI=true node apps/cli/bin/ultra-dex.js run planner -t "hello" 2>&1 | tail -5`
Fallback #1: `codex --full-auto -m gpt-4 exec "Add Postgres persistence to run.js execution traces. 4 INSERT/UPDATE points. Skip if no DATABASE_URL."`
Fallback #2: `claude --model sonnet --effort high -p "Add Postgres persistence to apps/cli/lib/commands/run.js execution traces. INSERT at start, UPDATE per step, UPDATE at completion/error."`
Fallback #3: `opencode run -m opencode/devstral-2-123b-instruct-2512 -p "Add trace persistence to run.js. INSERT INTO execution_traces at start, UPDATE steps per step, SET status=completed at end. Use postgres-client.ts. Skip if no DATABASE_URL."`
Cost Class: SUBSCRIPTION-INCLUDED

---

### [WINDOW 7] GEMINI — gemini-2.5-pro
Task ID: V20-W7-INTEGRATION-TESTS
Objective: Write integration tests for Redis memory + Postgres audit + usage metering
Target Files: tests/integration/redis-memory.test.js (NEW), tests/integration/postgres-audit.test.js (NEW), tests/integration/usage-persistence.test.js (NEW)
Why this lane: Integration test design needs broad codebase understanding. Gemini Pro.
Power Tier: BALANCED
Command:
```bash
gemini -y -p \
  "Write integration tests for Ultra-Dex v2.0 database layer.

   Use Node.js built-in test runner (node:test), NOT Jest.

   CREATE tests/integration/redis-memory.test.js:
   - Test RedisMemoryAdapter connect/disconnect
   - Test set → get roundtrip (<10ms)
   - Test search returns relevant results
   - Test graceful fallback when REDIS_URL not set
   - Use REDIS_URL=redis://localhost:6379 or skip if unavailable

   CREATE tests/integration/postgres-audit.test.js:
   - Test audit event write → query roundtrip
   - Test date range filtering
   - Test CSV export
   - Test graceful SQLite fallback when DATABASE_URL not set

   CREATE tests/integration/usage-persistence.test.js:
   - Test trackUsage writes to Postgres
   - Test getUsage aggregation by date range
   - Test checkLimit with real tier limits
   - Test in-memory fallback when DATABASE_URL not set

   All tests must: skip gracefully if database not available, pass with mock data.

   VALIDATE:
   - npm run test:integration → all new tests pass (or skip if no DB)"
```
Expected Output: 3 integration test files with graceful skip
Validation: `npm run test:integration 2>&1 | tail -10`
Fallback #1: `gemini -p "Write integration tests for Redis memory adapter and Postgres audit/usage persistence. Node.js built-in test runner. Skip if DB unavailable."`
Fallback #2: `qwen --auth-type qwen-oauth --approval-mode yolo "Write integration tests for redis-adapter, postgres-audit, usage-persistence in tests/integration/"`
Fallback #3: `opencode run -m opencode/devstral-2-123b-instruct-2512 -p "Write 3 integration test files in tests/integration/: redis-memory.test.js, postgres-audit.test.js, usage-persistence.test.js. Use node:test. Skip if no DB connection."`
Cost Class: FREE

---

### [WINDOW 8] QWEN — qwen-max
Task ID: V20-W8-ENV-DOCS
Objective: Update all environment documentation for new database vars
Target Files: .env.example, docs/DEPLOYMENT.md, README.md
Why this lane: Documentation update is mechanical. Qwen for cheap throughput.
Power Tier: LOW
Command:
```bash
qwen --auth-type qwen-oauth --approval-mode yolo \
  "Update Ultra-Dex documentation for v2.0 database layer.

   UPDATE .env.example — add these vars with comments:
   # --- Database ---
   REDIS_URL=redis://localhost:6379
   DATABASE_URL=postgresql://ultradex:password@localhost:5432/ultradex
   MEMORY_BACKEND=redis  # redis | file (default: file)
   DB_POOL_SIZE=10

   UPDATE docs/DEPLOYMENT.md — add section:
   ## Database Setup
   - Redis: for memory tier (L2/L3), vector search
   - Postgres: for audit trail, usage tracking, execution traces
   - Docker Compose: docker compose up
   - Manual: install Redis + Postgres, run migrations

   UPDATE README.md Quick Start section — add:
   docker compose up  # Start with Redis + Postgres
   Or: MEMORY_BACKEND=file ultra-dex run ...  # File-based (no Docker needed)

   VALIDATE: all files updated, no broken links"
```
Expected Output: Updated env docs, deployment guide, README
Validation: `grep "REDIS_URL" .env.example && grep "Database" docs/DEPLOYMENT.md`
Fallback #1: `qwen --auth-type qwen-oauth "Update .env.example and docs/DEPLOYMENT.md with Redis and Postgres configuration"`
Fallback #2: `gemini -p "Update .env.example, docs/DEPLOYMENT.md, README.md with Redis + Postgres setup instructions"`
Fallback #3: `opencode run -m opencode/gpt-5-nano -p "Update .env.example with REDIS_URL, DATABASE_URL, MEMORY_BACKEND. Update docs/DEPLOYMENT.md with Database Setup section."`
Cost Class: FREE

---

## ═══════════════════════════════════════════════
## WEEK 3: NPM PUBLISH + PACKAGE STRUCTURE
## ═══════════════════════════════════════════════

### Week 3 Parallel Windows: W9, W10, W11, W12
### Gate: `npm install -g @ultra-dex/cli && ultra-dex --help` works on clean machine

---

### [WINDOW 9] CLAUDE — claude-opus-4
Task ID: V20-W9-NPM-PACKAGE
Objective: Prepare @ultra-dex/cli for npm publication — package.json, bin, exports, prepublish
Target Files: package.json, apps/cli/package.json, dist/, .npmignore
Why this lane: Package publication is irreversible (npm publish). Opus for correctness.
Power Tier: HIGH
Command:
```bash
claude --model opus --effort max -p \
  "Prepare Ultra-Dex for npm publication as @ultra-dex/cli.

   CURRENT: Monorepo with apps/cli, packages/*. Never published to npm.

   TASKS:
   1) Update apps/cli/package.json:
      - name: '@ultra-dex/cli'
      - version: match root (3.1.0)
      - bin: { 'ultra-dex': './bin/ultra-dex.js' }
      - files: ['bin/', 'lib/', 'assets/', 'templates/']
      - engines: { node: '>=18.0.0' }
      - publishConfig: { access: 'public' }
      - dependencies: only production deps (no devDeps in published)
      - peerDependencies: none (bundle everything)

   2) Create .npmignore in apps/cli/:
      - tests/, *.test.js, .env*, node_modules/, *.map

   3) Create prepublish script:
      - npm run build:cli (creates dist/ultra-dex.js)
      - Validate: dist/ exists, bin/ exists, no test files included

   4) Test locally:
      - cd apps/cli && npm pack → inspect tarball contents
      - npm install -g ./ultra-dex-cli-3.1.0.tgz → verify ultra-dex --help

   5) Add npm publish command to package.json scripts:
      'publish:cli': 'cd apps/cli && npm publish --access public'

   DO NOT actually publish. Just prepare the package.

   VALIDATE:
   - cd apps/cli && npm pack → creates tarball
   - npm install -g ./tarball → ultra-dex --help works"
```
Expected Output: Package ready for npm publish
Validation: `cd apps/cli && npm pack 2>&1 | tail -3`
Fallback #1: `claude --model sonnet --effort high -p "Prepare @ultra-dex/cli for npm. Update package.json, create .npmignore, add prepublish script, test with npm pack."`
Fallback #2: `codex --full-auto -m o1 exec "Prepare apps/cli/ for npm publish. Update package.json with name @ultra-dex/cli, bin, files, publishConfig. Create .npmignore. Test with npm pack."`
Fallback #3: `opencode run -m opencode/devstral-2-123b-instruct-2512 -p "Prepare apps/cli/package.json for npm publish as @ultra-dex/cli. Set bin, files, publishConfig. Create .npmignore. Add prepublish build script."`
Cost Class: SUBSCRIPTION-INCLUDED

---

### [WINDOW 10] CLAUDE — claude-sonnet-4
Task ID: V20-W10-SDK-PACKAGE
Objective: Prepare @ultra-dex/sdk for npm publication — programmatic API
Target Files: packages/sdk/package.json, packages/sdk/src/index.ts
Why this lane: SDK API design requires careful type exports. Sonnet for balanced quality.
Power Tier: BALANCED
Command:
```bash
claude --model sonnet --effort high -p \
  "Prepare @ultra-dex/sdk for npm publication.

   This is the PROGRAMMATIC API for developers who want to use Ultra-Dex from code (not CLI).

   UPDATE packages/sdk/package.json:
   - name: '@ultra-dex/sdk'
   - version: 3.1.0
   - main: './dist/index.js'
   - types: './dist/index.d.ts'
   - exports: { '.': { import: './dist/index.js', types: './dist/index.d.ts' } }
   - publishConfig: { access: 'public' }

   UPDATE packages/sdk/src/index.ts — export:
   - UltraDex class (main entry point)
   - createProvider(name, config) → provider instance
   - createAgent(role, config) → agent instance
   - createMemory(config) → memory instance
   - Types: Provider, Agent, Memory, Task, ExecutionTrace, GovernancePolicy

   UltraDex class API:
   \`\`\`typescript
   const dex = new UltraDex({ defaultProvider: 'nvidia', memoryBackend: 'redis' });
   const result = await dex.run({ agent: 'planner', task: 'Design an API', provider: 'claude' });
   console.log(result.output, result.trace);
   \`\`\`

   VALIDATE:
   - npm run typecheck → 0 errors
   - cd packages/sdk && npm pack → creates tarball"
```
Expected Output: SDK package ready for npm publish
Validation: `cd packages/sdk && npm pack 2>&1 | tail -3`
Fallback #1: `gemini -y -p "Prepare packages/sdk for npm as @ultra-dex/sdk. UltraDex class with run(), createProvider(), createAgent(). Export types."`
Fallback #2: `qwen --auth-type qwen-oauth --approval-mode yolo "Prepare @ultra-dex/sdk package. Update package.json, create index.ts with UltraDex class and type exports."`
Fallback #3: `opencode run -m opencode/devstral-2-123b-instruct-2512 -p "Prepare packages/sdk/package.json as @ultra-dex/sdk. Create index.ts exporting UltraDex class with run(), createProvider(), createAgent(). Types for Provider, Agent, Memory, Task."`
Cost Class: SUBSCRIPTION-INCLUDED

---

### [WINDOW 11] GEMINI — gemini-2.5-flash
Task ID: V20-W11-GITHUB-CI
Objective: Create GitHub Actions CI/CD pipeline for test, build, publish
Target Files: .github/workflows/ci.yml (NEW), .github/workflows/publish.yml (NEW)
Why this lane: CI/CD config generation. Gemini Flash for speed.
Power Tier: LOW
Command:
```bash
gemini -y -p \
  "Create GitHub Actions workflows for Ultra-Dex.

   CREATE .github/workflows/ci.yml:
   - Trigger: push to main, pull_request
   - Matrix: node [18, 20, 22]
   - Steps: checkout, install, typecheck, lint, test:unit, test:integration, build
   - Services: redis:7, postgres:16 (for integration tests)
   - Env: REDIS_URL, DATABASE_URL, MOCK_AI=true
   - Cache: node_modules

   CREATE .github/workflows/publish.yml:
   - Trigger: push tag v*
   - Steps: checkout, install, build, npm publish @ultra-dex/cli, npm publish @ultra-dex/sdk
   - Needs: ci workflow passes
   - Secret: NPM_TOKEN

   VALIDATE:
   - YAML syntax valid
   - All required steps present"
```
Expected Output: CI + publish workflows
Validation: `test -f .github/workflows/ci.yml && test -f .github/workflows/publish.yml`
Fallback #1: `qwen --auth-type qwen-oauth --approval-mode yolo "Create .github/workflows/ci.yml and publish.yml for Ultra-Dex. CI: test/build/lint. Publish: npm on tag push."`
Fallback #2: `gemini -p "Create GitHub Actions CI workflow with node matrix, Redis, Postgres services. Publish workflow on tag push."`
Fallback #3: `opencode run -m opencode/gpt-5-nano -p "Create .github/workflows/ci.yml (test/build matrix, redis+postgres services) and publish.yml (npm publish on v* tag). Cache node_modules."`
Cost Class: FREE

---

### [WINDOW 12] QWEN — qwen-plus
Task ID: V20-W12-CONTRIBUTING
Objective: Create CONTRIBUTING.md and developer setup guide
Target Files: CONTRIBUTING.md (NEW), docs/DEVELOPMENT.md (NEW)
Why this lane: Documentation generation. Qwen for cheap throughput.
Power Tier: LOW
Command:
```bash
qwen --auth-type qwen-oauth --approval-mode yolo \
  "Create developer documentation for Ultra-Dex open source.

   CREATE CONTRIBUTING.md:
   - Welcome message
   - Code of Conduct reference
   - Getting started: clone, install, run tests
   - Development: npm run dev, npm test, npm run lint
   - PR process: fork, branch, commit (conventional commits), PR template
   - Architecture overview (link to docs/ARCHITECTURE.md)
   - Code style: TypeScript strict, ESM, async/await, custom Error classes

   CREATE docs/DEVELOPMENT.md:
   - Prerequisites: Node 18+, npm 8+, Docker (optional)
   - Quick setup: git clone, npm install, npm run dev
   - With Docker: docker compose up
   - Environment: .env.example → .env
   - Testing: npm test (unit), npm run test:integration (needs Docker)
   - Building: npm run build
   - Debugging: npm run dev with NODE_DEBUG=ultra-dex
   - Project structure: monorepo layout explained"
```
Expected Output: CONTRIBUTING.md + docs/DEVELOPMENT.md
Validation: `test -f CONTRIBUTING.md && test -f docs/DEVELOPMENT.md`
Fallback #1: `gemini -p "Create CONTRIBUTING.md and docs/DEVELOPMENT.md for Ultra-Dex open source project"`
Fallback #2: `qwen --auth-type qwen-oauth "Create open source contribution guide and developer setup docs"`
Fallback #3: `opencode run -m opencode/gpt-5-nano -p "Create CONTRIBUTING.md (PR process, code style, getting started) and docs/DEVELOPMENT.md (prerequisites, setup, testing, debugging) for Ultra-Dex."`
Cost Class: FREE

---

## ═══════════════════════════════════════════════
## WEEK 4: PUBLIC REPO + ONBOARDING FLOW
## ═══════════════════════════════════════════════

### Week 4 Parallel Windows: W13, W14, W15, W16
### Gate: Stranger can clone → install → configure → run task in <5 minutes

---

### [WINDOW 13] CLAUDE — claude-opus-4
Task ID: V20-W13-README-REWRITE
Objective: Rewrite README.md to be star-worthy — clear, honest, compelling
Target Files: README.md
Why this lane: README is the first impression. Must be perfect. Opus for quality.
Power Tier: HIGH
Command:
```bash
claude --model opus --effort max -p \
  "Rewrite Ultra-Dex README.md to be star-worthy for public GitHub launch.

   CURRENT: README.md (150+ LOC) — too aspirational, lists features that don't fully work.

   REWRITE with honest, compelling copy:

   Structure:
   1) One-liner: 'Route any AI task to any provider with persistent memory.'
   2) Badge row: version, license, node, CI status
   3) What is Ultra-Dex? (3 sentences max)
   4) Quick Start (5 commands: install, configure, run, swarm, serve)
   5) Why Ultra-Dex? (comparison table vs LangChain/CrewAI/raw API)
   6) Supported Providers (actual working list, not aspirational)
   7) Core Concepts: Routing, Agents, Memory, Governance (1 paragraph each)
   8) CLI Reference (table of REAL commands that work)
   9) Configuration (.env example)
   10) Docker (docker compose up)
   11) Contributing (link to CONTRIBUTING.md)
   12) License (MIT)

   RULES:
   - Only list features that ACTUALLY WORK
   - No emojis in headers
   - Code examples must be copy-pasteable and functional
   - Comparison table: honest about what we do vs don't
   - <300 lines total

   VALIDATE: All code examples actually work"
```
Expected Output: Honest, compelling README under 300 lines
Validation: `wc -l README.md`
Fallback #1: `claude --model sonnet --effort high -p "Rewrite README.md for public launch. Honest, <300 lines. Only list working features."`
Fallback #2: `codex --full-auto -m o1 exec "Rewrite Ultra-Dex README.md. Star-worthy. Honest features only. Under 300 lines."`
Fallback #3: `opencode run -m opencode/devstral-2-123b-instruct-2512 -p "Rewrite README.md for Ultra-Dex public launch. One-liner, quick start, comparison table, CLI reference, config, Docker. Only working features. <300 lines."`
Cost Class: SUBSCRIPTION-INCLUDED

---

### [WINDOW 14] CLAUDE — claude-sonnet-4
Task ID: V20-W14-ONBOARDING-E2E
Objective: Create e2e onboarding flow — `ultra-dex init` creates working project in <2 minutes
Target Files: apps/cli/lib/commands/init.js
Why this lane: Onboarding UX is critical for adoption. Sonnet for balanced quality.
Power Tier: BALANCED
Command:
```bash
claude --model sonnet --effort high -p \
  "Improve Ultra-Dex 'ultra-dex init' onboarding flow.

   CURRENT: apps/cli/lib/commands/init.js (760 LOC) — exists but may not be smooth.

   VERIFY and improve:
   1) ultra-dex init my-project → creates directory with:
      - .env.example (with all provider keys listed)
      - package.json (with @ultra-dex/sdk dependency)
      - ultra-dex.config.json (default config)
      - src/index.ts (example: import UltraDex, run a task)
   2) Interactive provider selection: 'Which providers do you have API keys for?'
   3) Test connection: validates API key works
   4) First run: auto-runs a test task to prove setup works
   5) Success message with next steps

   The ENTIRE flow must complete in <2 minutes.

   VALIDATE:
   - mkdir /tmp/test-init && cd /tmp/test-init
   - node /path/to/ultra-dex.js init test-project
   - cd test-project && node src/index.ts"
```
Expected Output: Smooth init flow completing in <2 minutes
Validation: `MOCK_AI=true node apps/cli/bin/ultra-dex.js init /tmp/test-init 2>&1 | tail -10`
Fallback #1: `gemini -y -p "Improve ultra-dex init command. Verify it creates a working project with .env, config, example code. Test interactively."`
Fallback #2: `qwen --auth-type qwen-oauth --approval-mode yolo "Verify and improve apps/cli/lib/commands/init.js onboarding flow"`
Fallback #3: `opencode run -m opencode/devstral-2-123b-instruct-2512 -p "Verify apps/cli/lib/commands/init.js creates working project. Fix if broken. Must complete in <2 min. Test with MOCK_AI=true."`
Cost Class: SUBSCRIPTION-INCLUDED

---

### [WINDOW 15] CODEX — o1
Task ID: V20-W15-SMOKE-TESTS
Objective: Create smoke test suite that validates entire installation from scratch
Target Files: tests/smoke/install.test.js (NEW), tests/smoke/providers.test.js (NEW), tests/smoke/e2e.test.js (NEW)
Why this lane: E2E smoke tests need strong reasoning about failure modes. Codex o1.
Power Tier: HIGH
Command:
```bash
codex --full-auto -m o1 exec \
  "Create smoke test suite for Ultra-Dex fresh installation.

   CREATE tests/smoke/install.test.js:
   - Test: npm pack → npm install -g → ultra-dex --help
   - Test: ultra-dex doctor → reports health
   - Test: ultra-dex --version → matches package.json

   CREATE tests/smoke/providers.test.js:
   - Test: MOCK_AI=true ultra-dex run planner -t 'hello' → completes
   - Test: ultra-dex run planner -t 'hello' --provider nvidia → works (if NVIDIA_API_KEY set)
   - Test: ultra-dex run planner -t 'hello' --provider openai → works (if OPENAI_API_KEY set)

   CREATE tests/smoke/e2e.test.js:
   - Test: ultra-dex init /tmp/smoke-test → creates project
   - Test: cd /tmp/smoke-test && npm install → succeeds
   - Test: ultra-dex serve → starts server, /health returns 200
   - Test: ultra-dex run planner -t 'test' → returns output

   All tests: skip gracefully if dependencies not available.
   Node.js built-in test runner."
```
Expected Output: 3 smoke test files
Validation: `ls tests/smoke/*.test.js`
Fallback #1: `codex --full-auto -m gpt-4 exec "Create smoke tests for Ultra-Dex: install, providers, e2e"`
Fallback #2: `claude --model sonnet --effort high -p "Create tests/smoke/ with install.test.js, providers.test.js, e2e.test.js. Node.js test runner. Graceful skip if deps missing."`
Fallback #3: `opencode run -m opencode/devstral-2-123b-instruct-2512 -p "Create tests/smoke/ directory with install.test.js, providers.test.js, e2e.test.js. Test full installation flow. Node.js built-in test runner."`
Cost Class: SUBSCRIPTION-INCLUDED

---

### [WINDOW 16] COPILOT — Claude Sonnet 4.5
Task ID: V20-W16-PR-TEMPLATE
Objective: Create GitHub issue/PR templates and repository config for public launch
Target Files: .github/ISSUE_TEMPLATE/ (NEW), .github/pull_request_template.md (NEW), .github/CODEOWNERS (NEW)
Why this lane: GitHub repo config and templates. Copilot for GitHub-native features.
Power Tier: LOW
Command:
```bash
copilot --allow-all -p \
  "Create GitHub repository configuration for Ultra-Dex public launch.

   CREATE .github/ISSUE_TEMPLATE/bug_report.md:
   - Describe the bug, steps to reproduce, expected behavior
   - Environment: OS, Node version, Ultra-Dex version
   - Provider used, error message

   CREATE .github/ISSUE_TEMPLATE/feature_request.md:
   - Is this related to a problem?
   - Describe the solution
   - Alternatives considered
   - Additional context

   CREATE .github/pull_request_template.md:
   - What does this PR do?
   - Related issue
   - Type of change: bug fix / feature / breaking
   - Checklist: tests pass, lint pass, docs updated

   CREATE .github/CODEOWNERS:
   * @Srujan0798

   VALIDATE: All template files created"
```
Expected Output: GitHub templates for issues and PRs
Validation: `ls .github/ISSUE_TEMPLATE/ .github/pull_request_template.md .github/CODEOWNERS`
Fallback #1: `gemini -y -p "Create GitHub issue templates (bug_report.md, feature_request.md), PR template, and CODEOWNERS for Ultra-Dex"`
Fallback #2: `qwen --auth-type qwen-oauth --approval-mode yolo "Create .github/ templates: bug report, feature request, PR template, CODEOWNERS"`
Fallback #3: `opencode run -m opencode/gpt-5-nano -p "Create .github/ISSUE_TEMPLATE/bug_report.md, feature_request.md, pull_request_template.md, CODEOWNERS for Ultra-Dex."`
Cost Class: SUBSCRIPTION-INCLUDED

---

## EXECUTION ORDER + DEPENDENCIES

```
WEEK 1 (All Parallel):
  W1 (Redis adapter) ──┐
  W2 (Postgres schema) ├─── All independent, run simultaneously
  W3 (Audit migration) ─┤   W3 needs W2's schema design (start W3 after W2)
  W4 (Docker compose)  ─┘

WEEK 2 (Depends on Week 1):
  W5 (Usage migrate)    ──── Needs W2 (Postgres schema)
  W6 (Trace migrate)    ──── Needs W2 (Postgres schema)
  W7 (Integration tests) ─── Needs W1, W2, W3 (all adapters)
  W8 (Env docs)          ─── Needs W4 (Docker compose)

WEEK 3 (Depends on Week 2):
  W9 (npm cli package)   ──── Independent
  W10 (npm sdk package)  ──── Independent
  W11 (GitHub CI)         ──── Needs W7 (tests to run)
  W12 (Contributing docs) ─── Independent

WEEK 4 (Depends on Week 3):
  W13 (README rewrite)    ──── Needs all prior (honest feature list)
  W14 (Onboarding e2e)    ──── Needs W9 (npm package)
  W15 (Smoke tests)       ──── Needs W9, W10 (packages to test)
  W16 (GitHub templates)  ──── Independent
```

---

## WINDOW SUMMARY

| Window | Agent | Task | Cost |
|--------|-------|------|------|
| W1 | Claude Opus | Redis memory adapter | SUBSCRIPTION |
| W2 | Claude Sonnet | Postgres schema + client | SUBSCRIPTION |
| W3 | Gemini Pro | Audit migration to adapter | FREE |
| W4 | Gemini Flash | Docker compose | FREE |
| W5 | Claude Sonnet | Usage meter → Postgres | SUBSCRIPTION |
| W6 | Codex o1 | Trace persistence | SUBSCRIPTION |
| W7 | Gemini Pro | Integration tests | FREE |
| W8 | Qwen Max | Env docs update | FREE |
| W9 | Claude Opus | npm CLI package | SUBSCRIPTION |
| W10 | Claude Sonnet | npm SDK package | SUBSCRIPTION |
| W11 | Gemini Flash | GitHub CI/CD | FREE |
| W12 | Qwen Plus | Contributing docs | FREE |
| W13 | Claude Opus | README rewrite | SUBSCRIPTION |
| W14 | Claude Sonnet | Onboarding flow | SUBSCRIPTION |
| W15 | Codex o1 | Smoke tests | SUBSCRIPTION |
| W16 | Copilot | GitHub templates | SUBSCRIPTION |

**Total: 16 windows, 4 weeks | 8 SUBSCRIPTION, 6 FREE, 2 SUBSCRIPTION**

---

*Phase 1 dispatches generated 2026-04-10 | V2.0 Foundation | 16 windows | 4 weeks*
