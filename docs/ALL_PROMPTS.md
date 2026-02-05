# Ultra-Dex - All Remaining Prompts

> **Total:** 14 Prompts | **~75 hours** of work
> **Date:** Feb 5, 2026

---

## 🔴 HIGH PRIORITY (15 hours)

---

### PROMPT 1: Enhanced Check Command (4h)

```
## Task: Enhance Ultra-Dex Check Command

**File:** cli/lib/commands/check.js

**Requirements:**
1. Add P0 section validation (check if all 11 P0 sections are filled)
2. Verify CONTEXT.md is up-to-date with codebase
3. Validate tech stack choices against package.json
4. Check for missing acceptance criteria in tasks
5. Verify atomic task breakdown (4-9 hour chunks)
6. Report completeness percentage per section
7. Add --p0-only flag for quick validation

**Usage:**
npx ultra-dex check --p0-only
npx ultra-dex check --sections 1,2,3

**Tests:** Add unit tests in tests/commands/check.test.js

**Commit:** "feat: Enhanced check command with section validation"
```

---

### PROMPT 2: Scaffold from Plan (6h)

```
## Task: Create Scaffold-Plan Command

**File:** cli/lib/commands/scaffold-plan.js (NEW)

**Requirements:**
1. Parse IMPLEMENTATION-PLAN.md for folder structure
2. Generate directory tree from plan
3. Create empty files with TODO comments matching plan tasks
4. Setup config files (.env.example, tsconfig.json, etc.)
5. Generate Prisma schema from data model section
6. Create placeholder API routes from plan endpoints
7. Register command in cli/bin/ultra-dex.js

**Usage:**
npx ultra-dex scaffold --from-plan
npx ultra-dex scaffold --from-plan --dry-run

**Dependencies:** None new

**Commit:** "feat: Add plan-based scaffolding command"
```

---

### PROMPT 3: Export Enhancements (3h)

```
## Task: Enhance Export Command

**File:** cli/lib/commands/export.js

**Requirements:**
1. Add --sections flag for selective export (--sections 1,2,3)
2. Add --format yaml for CI/CD integration
3. Add --format json for programmatic use
4. Add --pdf flag using puppeteer for PDF generation
5. Add --toc flag for auto-generated table of contents
6. Add --template option for custom export templates

**Usage:**
npx ultra-dex export --format yaml --sections 1-5
npx ultra-dex export --pdf --output report.pdf
npx ultra-dex export --json > context.json

**Dependencies:** puppeteer (optional, for PDF)

**Commit:** "feat: Enhanced export with multiple formats"
```

---

### PROMPT 4: Smart Diff Improvements (2h)

```
## Task: Enhance Diff Command

**File:** cli/lib/commands/diff.js

**Requirements:**
1. Compare IMPLEMENTATION-PLAN.md vs actual implementation
2. Show drift analysis (what changed from original plan)
3. Highlight missing implementations with file locations
4. Add --with-example flag to compare with example projects
5. Generate delta reports in markdown format
6. Color-coded output (green=done, yellow=partial, red=missing)

**Usage:**
npx ultra-dex diff --drift
npx ultra-dex diff --with-example nextjs-starter
npx ultra-dex diff --output drift-report.md

**Commit:** "feat: Smart diff with drift analysis"
```

---

## 🟡 MEDIUM PRIORITY (8 hours)

---

### PROMPT 5: Interactive REPL Mode (4h)

```
## Task: Implement Interactive REPL

**Files:**
- cli/lib/repl/index.js (NEW)
- cli/lib/repl/commands.js (NEW)
- cli/lib/repl/session.js (NEW)

**Requirements:**
1. Create REPL startup with npx ultra-dex repl
2. Implement slash commands:
   - /help - Show available commands
   - /clear - Clear screen
   - /save - Save session
   - /load <name> - Load session
   - /exit - Exit REPL
3. Session management with history persistence
4. Context-aware tab completions
5. Multi-line input support (use """ for multi-line)
6. Save conversations to .ultra-dex/sessions/

**Usage:**
npx ultra-dex repl
> /help
> generate a user auth flow
> /save my-session

**Dependencies:** readline, chalk

**Commit:** "feat: Add interactive REPL mode"
```

---

### PROMPT 6: Streaming with Vercel AI SDK (4h)

```
## Task: Add Vercel AI SDK Streaming

**Files:**
- cli/lib/providers/vercel-ai.js (NEW)
- cli/lib/utils/stream.js (NEW)

**Requirements:**
1. Install: npm install ai @ai-sdk/openai @ai-sdk/anthropic
2. Create streaming provider wrapper
3. Update generate command for --stream flag
4. Real-time token display with ora spinner
5. Support for all providers (OpenAI, Anthropic, Google)
6. Graceful error handling for stream interruption
7. Token count display after completion

**Usage:**
npx ultra-dex generate --stream
npx ultra-dex run task.md --stream
npx ultra-dex chat --stream

**Dependencies:** ai, @ai-sdk/openai, @ai-sdk/anthropic

**Commit:** "feat: Add Vercel AI SDK streaming support"
```

---

## 🟢 LOW PRIORITY (10 hours)

---

### PROMPT 7: Docker Sandbox Execution (4h)

```
## Task: Implement Docker Sandbox

**Files:**
- cli/lib/sandbox/docker.js (NEW)
- cli/lib/sandbox/permissions.js (NEW)
- cli/lib/sandbox/Dockerfile (NEW)

**Requirements:**
1. Create Docker container for safe code execution
2. Add permission system (read/write/execute/network)
3. Add --sandbox flag to exec command
4. Resource limits:
   - Memory: 512MB default
   - CPU: 1 core
   - Timeout: 30s default
5. Mount project as read-only by default
6. Auto-cleanup containers on exit
7. Support for multiple runtimes (node, python, bash)

**Usage:**
npx ultra-dex exec "node script.js" --sandbox
npx ultra-dex exec --sandbox --timeout 60 --memory 1g
npx ultra-dex exec "python main.py" --sandbox --allow-network

**Dependencies:** dockerode

**Commit:** "feat: Add Docker sandbox execution"
```

---

### PROMPT 8: Context Auto-Sync (3h)

```
## Task: Implement Context Auto-Sync

**File:** cli/lib/commands/watch.js (enhance existing)

**Requirements:**
1. Watch codebase for file changes using chokidar
2. Auto-update CONTEXT.md on file changes
3. Add --sync flag for continuous sync mode
4. Debounce updates (500ms default)
5. Exclude patterns: node_modules, .git, dist, build
6. Show sync notifications in terminal
7. Update file statistics (total files, lines, etc.)

**Usage:**
npx ultra-dex watch --sync
npx ultra-dex watch --sync --debounce 1000
npx ultra-dex watch --ignore "*.test.js,*.spec.js"

**Dependencies:** chokidar (already installed)

**Commit:** "feat: Add context auto-sync to watch command"
```

---

### PROMPT 9: Shell Completions Enhancement (1h)

```
## Task: Enhance Shell Completions

**Files:**
- cli/completions/ultra-dex.bash
- cli/completions/_ultra-dex (zsh)
- cli/completions/ultra-dex.fish (NEW)

**Requirements:**
1. Tab completion for all 60+ commands
2. Argument completion:
   - Agent names (architect, backend, frontend, etc.)
   - Provider names (anthropic, openai, google)
   - Template names (next15-saas, remix-saas, etc.)
3. Flag completion for each command
4. Dynamic file path completion for --file flags
5. Add fish shell support
6. Auto-install option in setup command

**Install:**
npx ultra-dex setup --completions
source ~/.bashrc

**Commit:** "feat: Enhanced shell completions for bash/zsh/fish"
```

---

### PROMPT 10: WebSocket Dashboard Updates (2h)

```
## Task: Add WebSocket to Dashboard

**Files:**
- cli/lib/server/websocket.js (NEW)
- dashboard/src/hooks/useSocket.ts (enhance)
- dashboard/src/components/LiveLog.tsx (NEW)

**Requirements:**
1. Install: npm install ws
2. Create WebSocket server on port 3002
3. Push real-time updates for:
   - Command execution status
   - Agent activity logs
   - Log streaming (stdout/stderr)
   - Progress updates
4. Dashboard auto-reconnect on disconnect (5s retry)
5. Event types: log, status, complete, error, progress

**Events Format:**
{
  "type": "log" | "status" | "complete" | "error",
  "data": { ... },
  "timestamp": "2026-02-05T10:00:00Z"
}

**Commit:** "feat: Add WebSocket push to dashboard"
```

---

## 🔵 FUTURE / ADVANCED (40+ hours)

---

### PROMPT 11: Graph RAG Implementation (3 weeks)

```
## Task: Implement Graph RAG for Context

**Files:**
- cli/lib/rag/graph.js (NEW)
- cli/lib/rag/neo4j.js (NEW)
- cli/lib/rag/embeddings.js (NEW)

**Requirements:**
1. Use Neo4j or FalkorDB for knowledge graph
2. Parse codebase into nodes:
   - Files, Functions, Classes, Variables
   - Dependencies, Imports, Exports
3. Create relationships:
   - IMPORTS, CALLS, EXTENDS, IMPLEMENTS
   - DEPENDS_ON, USED_BY, EXPORTS
4. Generate embeddings for semantic search
5. Query graph for context retrieval
6. Integrate with generate command
7. Incremental updates on file changes

**Usage:**
npx ultra-dex rag:index
npx ultra-dex rag:query "authentication flow"
npx ultra-dex generate --use-rag

**Dependencies:** neo4j-driver, @xenova/transformers

**Commit:** "feat: Add Graph RAG context engine"
```

---

### PROMPT 12: Enterprise Auth System (3 weeks)

```
## Task: Implement Enterprise Authentication

**Files:**
- cli/lib/auth/oauth.js (NEW)
- cli/lib/auth/sso.js (NEW)
- cli/lib/auth/rbac.js (NEW)
- cli/lib/server/middleware/auth.js (NEW)

**Requirements:**
1. MCP OAuth 2.1 integration per spec
2. SSO with SAML/OIDC providers:
   - Okta, Auth0, Azure AD
3. API key management per team/user
4. Role-based access control (RBAC):
   - Admin, Developer, Viewer roles
5. Audit logging for all actions
6. Rate limiting per user/org (100 req/min default)
7. Secure token storage with keytar

**Usage:**
npx ultra-dex auth login --sso
npx ultra-dex auth key create --name "ci-key"
npx ultra-dex auth roles add user@example.com developer

**Dependencies:** passport, keytar, express-rate-limit

**Commit:** "feat: Add enterprise auth system"
```

---

### PROMPT 13: VS Code Extension v2 (2 weeks)

```
## Task: Enhance VS Code Extension

**Files:**
- vscode/src/panels/ContextPanel.ts (NEW)
- vscode/src/codelens/TaskLens.ts (NEW)
- vscode/src/sidebar/AgentView.ts (enhance)

**Requirements:**
1. Inline CONTEXT.md editing with preview
2. Real-time alignment score display in status bar
3. Command palette integration (50+ commands)
4. Sidebar with:
   - Agent activity feed
   - Session history
   - Quick actions
5. CodeLens for implementation plan tasks:
   - Show task status above functions
   - Quick complete/update actions
6. Quick fix suggestions from agents
7. Diff view for plan vs implementation

**Commands:**
- Ultra-Dex: Generate
- Ultra-Dex: Align
- Ultra-Dex: Check
- Ultra-Dex: Open Dashboard

**Commit:** "feat: VS Code extension v2 with CodeLens"
```

---

### PROMPT 14: Multi-Agent Swarm Orchestration (2 weeks)

```
## Task: Implement Advanced Swarm Mode

**Files:**
- cli/lib/swarm/orchestrator.js (enhance)
- cli/lib/swarm/coordinator.js (NEW)
- cli/lib/swarm/checkpoint.js (NEW)

**Requirements:**
1. LangGraph-style agent coordination
2. Parallel task execution with worker pool
3. Agent handoff protocols:
   - Context passing between agents
   - State persistence
4. Checkpoint/resume capability:
   - Save swarm state to .ultra-dex/checkpoints/
   - Resume from last checkpoint
5. Conflict resolution for file edits:
   - Lock files during edit
   - Merge resolution UI
6. Progress reporting per agent
7. Cost tracking per agent

**Usage:**
npx ultra-dex swarm start task.md --parallel 4
npx ultra-dex swarm status
npx ultra-dex swarm resume --checkpoint abc123

**Commit:** "feat: Advanced swarm orchestration"
```

---

## 📊 SUMMARY TABLE

| # | Prompt | Hours | Priority | Best Agent |
|---|--------|-------|----------|------------|
| 1 | Enhanced Check | 4h | 🔴 High | Claude/Gemini |
| 2 | Scaffold Plan | 6h | 🔴 High | Claude/Qwen |
| 3 | Export Enhance | 3h | 🔴 High | Any |
| 4 | Smart Diff | 2h | 🔴 High | Gemini |
| 5 | REPL Mode | 4h | 🟡 Medium | Claude |
| 6 | Streaming | 4h | 🟡 Medium | Qwen |
| 7 | Docker Sandbox | 4h | 🟢 Low | Claude |
| 8 | Auto-Sync | 3h | 🟢 Low | Any |
| 9 | Shell Complete | 1h | 🟢 Low | Any |
| 10 | WebSocket | 2h | 🟢 Low | Qwen |
| 11 | Graph RAG | 3w | 🔵 Future | Team |
| 12 | Enterprise Auth | 3w | 🔵 Future | Team |
| 13 | VS Code v2 | 2w | 🔵 Future | Team |
| 14 | Swarm Mode | 2w | 🔵 Future | Team |

---

## ⚡ QUICK START

**For immediate impact, run prompts 1-4 in parallel:**

| Agent | Prompt | Time |
|-------|--------|------|
| Gemini | Prompt 1 (Check) | 4h |
| Claude | Prompt 2 (Scaffold) | 6h |
| Qwen | Prompt 3 (Export) | 3h |
| Any | Prompt 4 (Diff) | 2h |

**Total: 15 hours → 4 new features**

---

*Generated: Feb 5, 2026*
