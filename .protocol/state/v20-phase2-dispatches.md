# V2.0 PHASE 2 DISPATCHES — INTELLIGENCE (Months 3-4)
> Source: V2.0 Strategic Plan + /engineering:architecture + /engineering:code-review
> Depends: Phase 1 COMPLETE (Redis, Postgres, npm published, public repo)
> Skills Used: /engineering:architecture, /engineering:code-review, /engineering:system-design

---

## PHASE OVERVIEW

**Thesis:** Make Ultra-Dex smarter — cost-optimized routing that saves money, memory that makes agents better over time, a marketplace that creates ecosystem value. This is where Ultra-Dex becomes more than infrastructure — it becomes intelligence.

**Success Gate:**
```bash
# Routing saves 30%+ cost vs single provider
ultra-dex run planner -t "complex task" --optimize cost → picks cheapest adequate provider
# Memory improves outputs
ultra-dex run planner -t "similar task" → retrieves relevant past context, measurably better
# Marketplace works
ultra-dex marketplace list → shows available agents
ultra-dex marketplace install @ultra-dex/security-auditor → installs agent
# LiteLLM compatibility
ultra-dex run planner --provider litellm/gpt-4o → routes via LiteLLM proxy
```

**Total Windows:** 16 (4 per week × 4 weeks)
**Parallel Safe:** All windows within same week

---

## ═══════════════════════════════════════════════
## WEEK 5: COST-OPTIMIZED ROUTING ENGINE
## ═══════════════════════════════════════════════

### Week 5 Parallel: W17, W18, W19, W20
### Gate: `--optimize cost` flag picks cheapest provider that meets quality threshold

---

### [WINDOW 17] CLAUDE — claude-opus-4
Task ID: V20-W17-ROUTING-ENGINE
Objective: Implement multi-armed bandit routing algorithm for cost/latency/quality optimization
Target Files: src/core/routing/bandit-router.ts (NEW), src/core/routing/provider-stats.ts (NEW)
Why this lane: Routing algorithm is the core differentiator. Opus for algorithmic correctness.
Power Tier: HIGH
Command:
```bash
claude --model opus --effort max -p \
  "Implement multi-armed bandit routing for Ultra-Dex provider selection.

   CURRENT: apps/cli/lib/providers/router.js (122 LOC) — static hybrid routing.

   CREATE src/core/routing/bandit-router.ts:
   1) ThompsonSamplingRouter class:
      - selectProvider(task, constraints): Pick best provider using Thompson sampling
      - updateStats(provider, result): Update success/cost/latency stats after call
      - getProviderStats(): Return current stats for all providers

   2) Constraints interface:
      - maxCostPerToken: number (e.g., 0.003)
      - maxLatencyMs: number (e.g., 5000)
      - minQualityScore: number (0-1, e.g., 0.8)
      - preferredProviders: string[] (optional bias)

   3) Algorithm:
      - Each provider has Beta(alpha, beta) distribution for success
      - Sample from each distribution
      - Filter by constraints (cost, latency)
      - Pick highest sample that passes constraints
      - After execution: update alpha (success) or beta (failure)

   4) Cost model per provider (from base.js pricing):
      - claude: $15/M input, $75/M output (Opus), $3/$15 (Sonnet)
      - openai: $5/M input, $15/M output (GPT-4o)
      - nvidia: $0.60/M input, $0.60/M output (Nemotron)
      - gemini: Free (within limits)

   CREATE src/core/routing/provider-stats.ts:
   - ProviderStats: track per-provider success rate, avg latency, avg cost, total calls
   - Persist stats to Redis (or in-memory fallback)
   - Decay old stats (exponential moving average, window=100 calls)

   Wire into apps/cli/lib/providers/index.js:
   - When --optimize cost|latency|quality flag present → use BanditRouter
   - When --provider explicit → bypass router (existing behavior)
   - Default: BanditRouter with balanced constraints

   VALIDATE:
   - npm run typecheck → 0 errors
   - Unit test: BanditRouter picks cheapest when --optimize cost"
```
Expected Output: Thompson sampling router with per-provider stats
Validation: `npx tsc --noEmit 2>&1 | tail -3`
Fallback #1: `claude --model sonnet --effort high -p "Create Thompson sampling router in src/core/routing/bandit-router.ts. Provider stats tracking. Wire into providers/index.js with --optimize flag."`
Fallback #2: `codex --full-auto -m o1 exec "Implement multi-armed bandit routing for Ultra-Dex. Thompson sampling. Per-provider stats. --optimize cost|latency|quality flag."`
Fallback #3: `opencode run -m opencode/devstral-2-123b-instruct-2512 -p "Create src/core/routing/bandit-router.ts with ThompsonSamplingRouter. Beta distribution per provider. selectProvider(task, constraints), updateStats(provider, result). Wire into providers/index.js."`
Cost Class: SUBSCRIPTION-INCLUDED

---

### [WINDOW 18] CLAUDE — claude-sonnet-4
Task ID: V20-W18-HEALTH-MONITOR
Objective: Create provider health monitoring with auto-degradation detection
Target Files: src/core/routing/health-monitor.ts (NEW)
Why this lane: Health monitoring needs careful threshold design. Sonnet for precision.
Power Tier: BALANCED
Command:
```bash
claude --model sonnet --effort high -p \
  "Create provider health monitoring for Ultra-Dex.

   CREATE src/core/routing/health-monitor.ts:
   1) ProviderHealthMonitor class:
      - checkHealth(providerId): Lightweight ping to provider API
      - recordLatency(providerId, ms): Track latency trend
      - recordError(providerId, error): Track error rate
      - isHealthy(providerId): Boolean — is provider responding within SLA?
      - getStatus(): Map of all providers with health status

   2) Auto-degradation:
      - If error rate > 20% in last 5 minutes → mark DEGRADED
      - If error rate > 50% → mark UNHEALTHY
      - If latency > 3x baseline → mark SLOW
      - BanditRouter excludes UNHEALTHY providers

   3) Recovery:
      - Every 60s: send probe to UNHEALTHY providers
      - If probe succeeds 3x → upgrade to DEGRADED → HEALTHY

   4) Integration:
      - Wire into circuit breaker (already exists in providers/index.js)
      - Feed health status into BanditRouter constraints
      - Log state changes to Better Stack logger

   VALIDATE:
   - npm run typecheck → 0 errors
   - Unit test: provider marked UNHEALTHY after 50% error rate"
```
Expected Output: Health monitor with auto-degradation and recovery
Validation: `npx tsc --noEmit 2>&1 | tail -3`
Fallback #1: `gemini -y -p "Create src/core/routing/health-monitor.ts. ProviderHealthMonitor with checkHealth, recordLatency, recordError, isHealthy. Auto-degradation at 20% error rate."`
Fallback #2: `qwen --auth-type qwen-oauth --approval-mode yolo "Create provider health monitor at src/core/routing/health-monitor.ts with degradation thresholds and recovery probes"`
Fallback #3: `opencode run -m opencode/devstral-2-123b-instruct-2512 -p "Create src/core/routing/health-monitor.ts. Track error rate and latency per provider. Mark DEGRADED at 20% errors, UNHEALTHY at 50%. Recovery probes every 60s. Wire into circuit breaker."`
Cost Class: SUBSCRIPTION-INCLUDED

---

### [WINDOW 19] GEMINI — gemini-2.5-pro
Task ID: V20-W19-ROUTING-TESTS
Objective: Write comprehensive tests for routing engine + health monitor
Target Files: tests/core/bandit-router.test.js (NEW), tests/core/health-monitor.test.js (NEW)
Why this lane: Test design for probabilistic system. Gemini Pro for thorough coverage.
Power Tier: BALANCED
Command:
```bash
gemini -y -p \
  "Write tests for Ultra-Dex routing engine.

   Node.js built-in test runner (node:test).

   CREATE tests/core/bandit-router.test.js:
   - Test: selectProvider returns a valid provider
   - Test: with --optimize cost → prefers cheapest (nvidia/gemini over claude)
   - Test: with --optimize quality → prefers highest rated (claude over gemini)
   - Test: updateStats affects future selections (exploitation)
   - Test: constraints filter out providers exceeding maxCost
   - Test: empty provider list throws meaningful error
   - Test: stats persistence to Redis (mock) and retrieval

   CREATE tests/core/health-monitor.test.js:
   - Test: healthy provider returns isHealthy=true
   - Test: 20% error rate → DEGRADED
   - Test: 50% error rate → UNHEALTHY
   - Test: UNHEALTHY excluded from routing
   - Test: recovery after 3 successful probes
   - Test: latency spike → SLOW status

   VALIDATE:
   - npm run test:unit -- tests/core/bandit-router.test.js → all pass
   - npm run test:unit -- tests/core/health-monitor.test.js → all pass"
```
Expected Output: Comprehensive routing and health test suites
Validation: `npm run test:unit -- tests/core/bandit-router.test.js tests/core/health-monitor.test.js 2>&1 | tail -5`
Fallback #1: `gemini -p "Write tests for bandit-router.ts and health-monitor.ts. Node.js built-in test runner."`
Fallback #2: `qwen --auth-type qwen-oauth --approval-mode yolo "Write test files for routing engine and health monitor in tests/core/"`
Fallback #3: `opencode run -m opencode/devstral-2-123b-instruct-2512 -p "Write tests/core/bandit-router.test.js and tests/core/health-monitor.test.js. Node.js test runner. Test provider selection, cost optimization, health degradation, recovery."`
Cost Class: FREE

---

### [WINDOW 20] QWEN — qwen-max
Task ID: V20-W20-COST-DASHBOARD
Objective: Add cost analytics to monitoring service — per-provider spend tracking
Target Files: src/core/system/monitoring.ts, src/core/routing/provider-stats.ts
Why this lane: Metrics aggregation is structured work. Qwen for volume.
Power Tier: LOW
Command:
```bash
qwen --auth-type qwen-oauth --approval-mode yolo \
  "Add cost analytics to Ultra-Dex monitoring.

   UPDATE src/core/system/monitoring.ts:
   - Add metrics:
     ai_cost_usd_total (counter, labels: provider, model)
     ai_cost_per_request_avg (gauge, labels: provider)
     ai_cost_savings_usd (counter) — money saved by routing vs most expensive option
     routing_decisions_total (counter, labels: strategy, selected_provider)

   UPDATE src/core/routing/provider-stats.ts:
   - Add getCostSavings(): Calculate how much BanditRouter saved vs always using most expensive
   - Add getProviderCostBreakdown(): Per-provider cost aggregation

   Wire cost metrics into /metrics endpoint.

   VALIDATE:
   - npm run typecheck → 0 errors"
```
Expected Output: Cost metrics in Prometheus format at /metrics
Validation: `npx tsc --noEmit 2>&1 | tail -3`
Fallback #1: `qwen --auth-type qwen-oauth "Add cost analytics metrics to monitoring.ts and provider-stats.ts"`
Fallback #2: `gemini -y -p "Add ai_cost_usd_total, ai_cost_savings_usd metrics to monitoring.ts. Add getCostSavings() to provider-stats.ts."`
Fallback #3: `opencode run -m opencode/gpt-5-nano -p "Add cost tracking metrics to src/core/system/monitoring.ts. Per-provider cost, savings vs baseline. Wire into /metrics."`
Cost Class: FREE

---

## ═══════════════════════════════════════════════
## WEEK 6: MEMORY-ENHANCED PROMPTS + RAG
## ═══════════════════════════════════════════════

### Week 6 Parallel: W21, W22, W23, W24
### Gate: Agents retrieve relevant past execution context, outputs measurably improved

---

### [WINDOW 21] CLAUDE — claude-opus-4
Task ID: V20-W21-MEMORY-RAG
Objective: Implement RAG pipeline — agents auto-retrieve relevant past context before execution
Target Files: src/core/memory/rag-pipeline.ts (NEW), src/core/memory/unified-api.ts
Why this lane: RAG architecture is the core intelligence feature. Opus for correctness.
Power Tier: HIGH
Command:
```bash
claude --model opus --effort max -p \
  "Implement RAG pipeline for Ultra-Dex agent memory.

   CURRENT: unified-api.ts (521 LOC) has semantic search. Agents don't auto-use it.

   CREATE src/core/memory/rag-pipeline.ts:
   1) RAGPipeline class:
      - retrieveContext(task, agent, topK=5): Search memory for relevant past executions
      - augmentPrompt(systemPrompt, context[]): Inject retrieved context into prompt
      - storeResult(task, agent, result): Write execution result back to memory
      - relevanceScore(query, memory): Cosine similarity score

   2) Context retrieval strategy:
      - Search by task similarity (semantic search on task description)
      - Search by agent role (same agent type has relevant patterns)
      - Search by provider (same provider has known behaviors)
      - Deduplicate and rank by recency + relevance

   3) Prompt augmentation template:
      \`\`\`
      ## Relevant Past Context
      The following past executions are relevant to your current task:

      ### Past Execution 1 (similarity: 0.89)
      Task: {past_task}
      Agent: {past_agent}
      Result: {past_result_summary}
      ---
      \`\`\`

   4) Wire into run.js execution loop:
      - Before agent execution: pipeline.retrieveContext(task, agent)
      - Augment system prompt with retrieved context
      - After execution: pipeline.storeResult(task, agent, result)

   5) Opt-out: --no-memory flag skips RAG pipeline

   VALIDATE:
   - npm run typecheck → 0 errors
   - Run task twice → second run retrieves first run's context"
```
Expected Output: RAG pipeline with retrieve → augment → store loop
Validation: `npx tsc --noEmit 2>&1 | tail -3`
Fallback #1: `claude --model sonnet --effort high -p "Create RAG pipeline in src/core/memory/rag-pipeline.ts. Auto-retrieve past context, augment prompt, store results. Wire into run.js."`
Fallback #2: `codex --full-auto -m o1 exec "Create src/core/memory/rag-pipeline.ts. RAGPipeline class: retrieveContext, augmentPrompt, storeResult. Wire into run.js before/after agent execution."`
Fallback #3: `opencode run -m opencode/devstral-2-123b-instruct-2512 -p "Create src/core/memory/rag-pipeline.ts. Retrieve past execution context via semantic search, augment agent prompts, store results back. Wire into apps/cli/lib/commands/run.js."`
Cost Class: SUBSCRIPTION-INCLUDED

---

### [WINDOW 22] CLAUDE — claude-sonnet-4
Task ID: V20-W22-EMBEDDING-SERVICE
Objective: Create embedding service for memory vector search — replace @xenova/transformers with production-grade embeddings
Target Files: src/core/memory/embedding-service.ts (NEW), src/core/memory/vector-store.ts
Why this lane: Embedding model selection affects search quality. Sonnet for balanced design.
Power Tier: BALANCED
Command:
```bash
claude --model sonnet --effort high -p \
  "Create production embedding service for Ultra-Dex memory.

   CURRENT: vector-store.ts (122 LOC) uses @xenova/transformers for embeddings.
   Problem: Large dependency, slow startup, limited model choice.

   CREATE src/core/memory/embedding-service.ts:
   1) EmbeddingService class with adapter pattern:
      - embed(text): Promise<number[]> — get embedding vector
      - embedBatch(texts): Promise<number[][]> — batch embedding
      - similarity(a, b): number — cosine similarity

   2) Adapters:
      - OpenAIEmbeddingAdapter: text-embedding-3-small (1536 dims, cheap)
      - LocalEmbeddingAdapter: @xenova/transformers (offline, 384 dims)
      - NVIDIAEmbeddingAdapter: NVIDIA embed model via API

   3) Selection: env EMBEDDING_PROVIDER=openai|local|nvidia (default: local)
   4) Caching: Cache embeddings in Redis to avoid re-computing

   UPDATE vector-store.ts:
   - Use EmbeddingService instead of direct @xenova/transformers import
   - Support variable embedding dimensions based on adapter

   VALIDATE:
   - npm run typecheck → 0 errors
   - Embedding of 'hello world' returns vector of correct dimension"
```
Expected Output: Pluggable embedding service with 3 adapters
Validation: `npx tsc --noEmit 2>&1 | tail -3`
Fallback #1: `gemini -y -p "Create src/core/memory/embedding-service.ts with adapter pattern. OpenAI, Local, NVIDIA embedding adapters. Cache in Redis."`
Fallback #2: `qwen --auth-type qwen-oauth --approval-mode yolo "Create embedding service with OpenAI, local, NVIDIA adapters at src/core/memory/embedding-service.ts"`
Fallback #3: `opencode run -m opencode/devstral-2-123b-instruct-2512 -p "Create src/core/memory/embedding-service.ts. Adapter pattern: OpenAIEmbeddingAdapter (text-embedding-3-small), LocalEmbeddingAdapter (@xenova), NVIDIAEmbeddingAdapter. Redis caching. Update vector-store.ts."`
Cost Class: SUBSCRIPTION-INCLUDED

---

### [WINDOW 23] GEMINI — gemini-2.5-pro
Task ID: V20-W23-LITELLM-ADAPTER
Objective: Create LiteLLM adapter to support 100+ providers through LiteLLM proxy
Target Files: apps/cli/lib/providers/litellm.js (NEW), apps/cli/lib/providers/index.js
Why this lane: Provider adapter is well-defined integration work. Gemini Pro.
Power Tier: BALANCED
Command:
```bash
gemini -y -p \
  "Create LiteLLM adapter for Ultra-Dex provider system.

   LiteLLM is a proxy that normalizes 100+ LLM providers behind an OpenAI-compatible API.
   Users run: litellm --model gpt-4o → proxy at http://localhost:4000

   CREATE apps/cli/lib/providers/litellm.js:
   1) LiteLLMProvider class extending base provider:
      - constructor(apiKey, options): options.baseUrl (default http://localhost:4000)
      - generate(systemPrompt, userPrompt): Call LiteLLM OpenAI-compatible endpoint
      - listModels(): GET /models to discover available models
      - getName(): 'litellm'

   2) Support model format: litellm/model-name (e.g., litellm/gpt-4o, litellm/claude-3-opus)
   3) Pass through all OpenAI-compatible parameters (temperature, max_tokens, etc.)

   UPDATE apps/cli/lib/providers/index.js:
   - Register litellm provider
   - envKey: LITELLM_API_KEY (or LITELLM_BASE_URL for local proxy)

   VALIDATE:
   - npm run typecheck → 0 errors
   - Provider registered: node -e \"import('./apps/cli/lib/providers/index.js').then(m => console.log(Object.keys(m.PROVIDERS)))\""
```
Expected Output: LiteLLM adapter supporting 100+ providers
Validation: `npx tsc --noEmit 2>&1 | tail -3`
Fallback #1: `gemini -p "Create LiteLLM provider adapter at apps/cli/lib/providers/litellm.js. OpenAI-compatible proxy. Register in index.js."`
Fallback #2: `qwen --auth-type qwen-oauth --approval-mode yolo "Create LiteLLM provider at apps/cli/lib/providers/litellm.js wrapping OpenAI-compatible API"`
Fallback #3: `opencode run -m opencode/devstral-2-123b-instruct-2512 -p "Create apps/cli/lib/providers/litellm.js. LiteLLMProvider class wrapping OpenAI-compatible API at configurable baseUrl. Register in providers/index.js."`
Cost Class: FREE

---

### [WINDOW 24] QWEN — qwen-plus
Task ID: V20-W24-REPLAY-CMD
Objective: Create `ultra-dex replay` command for execution trace playback
Target Files: apps/cli/lib/commands/replay.ts (NEW), apps/cli/bin/ultra-dex.js
Why this lane: New CLI command is structured work. Qwen for speed.
Power Tier: LOW
Command:
```bash
qwen --auth-type qwen-oauth --approval-mode yolo \
  "Create 'ultra-dex replay' command for execution trace playback.

   CREATE apps/cli/lib/commands/replay.ts:
   1) Command: ultra-dex replay <run_id>
      - Fetch execution trace from Postgres (or in-memory)
      - Display step-by-step with timing:
        Step 1: [agent: planner] [provider: claude] [2.3s] ✓
        Step 2: [agent: backend] [provider: nvidia] [1.1s] ✓
        ...
      - Show total cost, total tokens, total time
   2) Command: ultra-dex replay --list
      - List recent execution traces (last 10)
      - Show: run_id, agent, task, status, started_at
   3) Command: ultra-dex replay <run_id> --json
      - Output full trace as JSON (for piping)

   Register in apps/cli/bin/ultra-dex.js as 'replay' command.

   VALIDATE:
   - node apps/cli/bin/ultra-dex.js replay --help → shows usage
   - npm run typecheck → 0 errors"
```
Expected Output: Replay command with trace playback and listing
Validation: `node apps/cli/bin/ultra-dex.js replay --help 2>&1 | head -5`
Fallback #1: `gemini -y -p "Create ultra-dex replay command at apps/cli/lib/commands/replay.ts. Fetch and display execution traces."`
Fallback #2: `qwen --auth-type qwen-oauth "Create replay command for Ultra-Dex CLI"`
Fallback #3: `opencode run -m opencode/gpt-5-nano -p "Create apps/cli/lib/commands/replay.ts. Commands: replay <run_id> (show steps), replay --list (recent traces), replay <id> --json. Register in ultra-dex.js."`
Cost Class: FREE

---

## ═══════════════════════════════════════════════
## WEEK 7: AGENT MARKETPLACE V1
## ═══════════════════════════════════════════════

### Week 7 Parallel: W25, W26, W27, W28
### Gate: `ultra-dex marketplace list` → shows agents, `ultra-dex marketplace install` works

---

### [WINDOW 25] CLAUDE — claude-opus-4
Task ID: V20-W25-MARKETPLACE-ARCH
Objective: Design and implement agent marketplace architecture — publish, discover, install agents
Target Files: src/core/marketplace/marketplace-service.ts (NEW), src/core/marketplace/agent-registry.ts (NEW)
Why this lane: Marketplace is a platform-level architecture decision. Opus for correctness.
Power Tier: HIGH
Command:
```bash
claude --model opus --effort max -p \
  "Design and implement Ultra-Dex agent marketplace.

   CURRENT: src/core/marketplace/plugin-marketplace.ts (106 LOC) — basic stub.

   CREATE src/core/marketplace/marketplace-service.ts:
   1) MarketplaceService class:
      - listAgents(filters?): List available agents from registry
      - getAgent(id): Get agent metadata + README
      - installAgent(id): Download and register agent locally
      - uninstallAgent(id): Remove local agent
      - publishAgent(agentDir): Package and publish agent to registry
      - searchAgents(query): Semantic search across agents

   2) Agent package format (.ultra-agent/):
      - agent.json: name, version, description, author, capabilities[], providers[]
      - prompt.md: System prompt template
      - tools.json: MCP tools the agent uses (optional)
      - README.md: Documentation

   CREATE src/core/marketplace/agent-registry.ts:
   3) AgentRegistry class:
      - Local registry: ~/.ultra-dex/agents/ (installed agents)
      - Remote registry: GitHub releases or npm packages
      - Built-in agents: 8 from src/core/agents/ auto-registered

   4) Agent resolution:
      - @ultra-dex/planner → built-in agent
      - @community/security-auditor → marketplace agent
      - ./my-agent → local agent directory

   VALIDATE:
   - npm run typecheck → 0 errors
   - MarketplaceService.listAgents() returns 8 built-in agents"
```
Expected Output: Marketplace service with publish/install/search
Validation: `npx tsc --noEmit 2>&1 | tail -3`
Fallback #1: `claude --model sonnet --effort high -p "Create marketplace service and agent registry. Package format, install/publish flow, local + remote registry."`
Fallback #2: `codex --full-auto -m o1 exec "Create Ultra-Dex marketplace: MarketplaceService (list, install, publish, search), AgentRegistry (local + remote), agent package format."`
Fallback #3: `opencode run -m opencode/devstral-2-123b-instruct-2512 -p "Create src/core/marketplace/marketplace-service.ts and agent-registry.ts. Agent package format with agent.json, prompt.md. Install to ~/.ultra-dex/agents/. 8 built-in agents auto-registered."`
Cost Class: SUBSCRIPTION-INCLUDED

---

### [WINDOW 26] CLAUDE — claude-sonnet-4
Task ID: V20-W26-MARKETPLACE-CLI
Objective: Create CLI commands for marketplace interaction
Target Files: apps/cli/lib/commands/marketplace.ts (NEW), apps/cli/bin/ultra-dex.js
Why this lane: CLI UX for marketplace needs clean design. Sonnet for balanced quality.
Power Tier: BALANCED
Command:
```bash
claude --model sonnet --effort high -p \
  "Create Ultra-Dex marketplace CLI commands.

   CREATE apps/cli/lib/commands/marketplace.ts:
   1) ultra-dex marketplace list [--category <cat>]
      - Display table: name, version, description, author, downloads
      - Categories: planning, coding, review, security, data

   2) ultra-dex marketplace install <agent-id>
      - Download agent package
      - Install to ~/.ultra-dex/agents/
      - Verify agent.json is valid
      - Print: 'Installed @community/agent-name v1.0.0'

   3) ultra-dex marketplace publish <dir>
      - Validate agent package structure
      - Package into .tar.gz
      - Publish to registry (GitHub release or npm)

   4) ultra-dex marketplace search <query>
      - Semantic search across marketplace
      - Display matching agents with relevance score

   5) ultra-dex marketplace info <agent-id>
      - Show full agent metadata, README, capabilities

   Register in apps/cli/bin/ultra-dex.js.

   VALIDATE:
   - node apps/cli/bin/ultra-dex.js marketplace --help
   - node apps/cli/bin/ultra-dex.js marketplace list → shows built-in agents"
```
Expected Output: Marketplace CLI with list, install, publish, search, info
Validation: `node apps/cli/bin/ultra-dex.js marketplace --help 2>&1 | head -10`
Fallback #1: `gemini -y -p "Create marketplace CLI commands: list, install, publish, search, info. Register in ultra-dex.js."`
Fallback #2: `qwen --auth-type qwen-oauth --approval-mode yolo "Create marketplace CLI at apps/cli/lib/commands/marketplace.ts"`
Fallback #3: `opencode run -m opencode/devstral-2-123b-instruct-2512 -p "Create apps/cli/lib/commands/marketplace.ts. Commands: list, install, publish, search, info. Register in ultra-dex.js."`
Cost Class: SUBSCRIPTION-INCLUDED

---

### [WINDOW 27] GEMINI — gemini-2.5-pro
Task ID: V20-W27-BUILTIN-AGENTS
Objective: Package 8 built-in agents as marketplace-compatible agent packages
Target Files: src/core/agents/*.ts → agents/ directory with agent.json + prompt.md
Why this lane: Packaging 8 agents is parallel structured work. Gemini Pro.
Power Tier: BALANCED
Command:
```bash
gemini -y -p \
  "Package Ultra-Dex built-in agents as marketplace-compatible packages.

   Current agents in src/core/agents/: planner, executor, swarm, checkpoint, scheduler, daemon, computer-use-agent, protocol

   For each of the 8 main agents, create agents/<name>/:
   - agent.json: { name, version, description, author, capabilities[], providers[], minVersion }
   - prompt.md: Extract system prompt from the agent class
   - README.md: Usage examples

   Example agents/planner/:
   agent.json:
   {
     \"name\": \"@ultra-dex/planner\",
     \"version\": \"3.1.0\",
     \"description\": \"Task decomposition and planning specialist\",
     \"author\": \"Ultra-Dex\",
     \"capabilities\": [\"planning\", \"decomposition\", \"architecture\"],
     \"providers\": [\"any\"],
     \"minVersion\": \"3.1.0\"
   }

   VALIDATE:
   - ls agents/*/agent.json → 8 files
   - Each agent.json is valid JSON"
```
Expected Output: 8 agent packages in agents/ directory
Validation: `ls agents/*/agent.json 2>/dev/null | wc -l`
Fallback #1: `qwen --auth-type qwen-oauth --approval-mode yolo "Package 8 Ultra-Dex built-in agents as marketplace packages in agents/ directory"`
Fallback #2: `gemini -p "Create agent.json and prompt.md for each built-in agent: planner, executor, swarm, checkpoint, scheduler, daemon, computer-use, protocol"`
Fallback #3: `opencode run -m opencode/gpt-5-nano -p "Create agents/ directory with 8 subdirs (planner, executor, swarm, checkpoint, scheduler, daemon, computer-use-agent, protocol). Each has agent.json and prompt.md."`
Cost Class: FREE

---

### [WINDOW 28] QWEN — qwen-max
Task ID: V20-W28-USAGE-DASHBOARD
Objective: Create usage analytics CLI command — per-provider cost, latency, success rate
Target Files: apps/cli/lib/commands/analytics.ts (NEW)
Why this lane: Data display command. Qwen for speed.
Power Tier: LOW
Command:
```bash
qwen --auth-type qwen-oauth --approval-mode yolo \
  "Create 'ultra-dex analytics' CLI command.

   CREATE apps/cli/lib/commands/analytics.ts:
   1) ultra-dex analytics [--period 7d|30d|all]
      - Display per-provider table:
        Provider | Requests | Tokens | Cost | Avg Latency | Success Rate
        claude   | 150      | 450K   | $12.30 | 2.1s       | 98.5%
        nvidia   | 89       | 230K   | $0.14  | 1.3s       | 95.2%
      - Total cost, total requests, cost savings from routing

   2) ultra-dex analytics --top-agents
      - Most used agents with execution counts

   3) ultra-dex analytics --export csv
      - Export raw data as CSV

   Query from Postgres usage_events table (or in-memory if no DB).

   Register in ultra-dex.js.

   VALIDATE:
   - node apps/cli/bin/ultra-dex.js analytics --help"
```
Expected Output: Analytics command with cost/latency/success tables
Validation: `node apps/cli/bin/ultra-dex.js analytics --help 2>&1 | head -5`
Fallback #1: `gemini -y -p "Create analytics CLI command at apps/cli/lib/commands/analytics.ts with per-provider cost table"`
Fallback #2: `qwen --auth-type qwen-oauth "Create analytics command for Ultra-Dex CLI"`
Fallback #3: `opencode run -m opencode/gpt-5-nano -p "Create apps/cli/lib/commands/analytics.ts. Show per-provider stats table. Export CSV. Query from Postgres or in-memory."`
Cost Class: FREE

---

## ═══════════════════════════════════════════════
## WEEK 8: INTEGRATION + VERSION 4.0.0
## ═══════════════════════════════════════════════

### Week 8 Parallel: W29, W30, W31, W32
### Gate: v4.0.0 tagged, routing + memory + marketplace all integrated, all tests pass

---

### [WINDOW 29] CODEX — o1
Task ID: V20-W29-INTEGRATION-VERIFY
Objective: End-to-end integration test — routing + memory + marketplace working together
Target Files: tests/integration/e2e-intelligence.test.js (NEW)
Why this lane: E2E integration requires deep reasoning about system interactions. Codex o1.
Power Tier: HIGH
Command:
```bash
codex --full-auto -m o1 exec \
  "Write end-to-end integration test for Ultra-Dex Intelligence layer.

   Test scenario:
   1) Install a marketplace agent
   2) Run task with --optimize cost → BanditRouter picks cheapest
   3) Verify RAG pipeline stored the result
   4) Run similar task → RAG retrieves past context
   5) Verify second run's prompt includes 'Relevant Past Context'
   6) Check analytics shows both runs with cost data
   7) Check health monitor reports all providers HEALTHY

   Use MOCK_AI=true for provider calls.
   Node.js built-in test runner.

   VALIDATE:
   - npm run test:integration -- tests/integration/e2e-intelligence.test.js → pass"
```
Expected Output: E2E integration test verifying full intelligence stack
Validation: `npm run test:integration -- tests/integration/e2e-intelligence.test.js 2>&1 | tail -5`
Fallback #1: `codex --full-auto -m gpt-4 exec "Write e2e test for routing + memory + marketplace integration"`
Fallback #2: `claude --model sonnet --effort high -p "Write integration test verifying BanditRouter, RAG pipeline, and marketplace work together"`
Fallback #3: `opencode run -m opencode/devstral-2-123b-instruct-2512 -p "Write tests/integration/e2e-intelligence.test.js. Test BanditRouter + RAG pipeline + marketplace agent install. MOCK_AI=true. Node.js test runner."`
Cost Class: SUBSCRIPTION-INCLUDED

---

### [WINDOW 30] CLAUDE — claude-sonnet-4
Task ID: V20-W30-VERSION-4
Objective: Bump version to 4.0.0, update CHANGELOG, tag
Target Files: package.json, CHANGELOG.md
Why this lane: Version management. Sonnet for precision.
Power Tier: BALANCED
Command:
```bash
claude --model sonnet --effort high -p \
  "Bump Ultra-Dex to v4.0.0 for Intelligence release.

   1) Update package.json: 3.1.0 → 4.0.0
   2) Update CHANGELOG.md:

   ## [4.0.0] - 2026-06-XX
   ### Added
   - Multi-armed bandit routing (Thompson sampling, --optimize cost|latency|quality)
   - Provider health monitoring with auto-degradation and recovery
   - RAG pipeline for memory-enhanced agent prompts
   - Pluggable embedding service (OpenAI, Local, NVIDIA)
   - LiteLLM adapter (100+ providers via proxy)
   - Agent marketplace v1 (list, install, publish, search)
   - 8 built-in agents packaged as marketplace agents
   - Execution replay command (ultra-dex replay)
   - Usage analytics command (ultra-dex analytics)
   - Cost savings tracking and Prometheus metrics

   ### Changed
   - Provider routing: static → intelligent (30%+ cost savings)
   - Memory: file-based → Redis-backed with vector search
   - Audit: SQLite → Postgres with adapter pattern

   3) git tag v4.0.0
   DO NOT push."
```
Expected Output: Version 4.0.0, CHANGELOG updated, tag created
Validation: `grep '"version"' package.json && git tag -l 'v4.0.0'`
Fallback #1: `gemini -y -p "Bump Ultra-Dex to v4.0.0, update CHANGELOG with Phase 2 features, git tag"`
Fallback #2: `qwen --auth-type qwen-oauth --approval-mode yolo "Bump version to 4.0.0, update CHANGELOG, git tag v4.0.0"`
Fallback #3: `opencode run -m opencode/gpt-5-nano -p "Update package.json to 4.0.0, add CHANGELOG entry for Phase 2 features, git tag v4.0.0."`
Cost Class: SUBSCRIPTION-INCLUDED

---

### [WINDOW 31] GEMINI — gemini-2.5-flash
Task ID: V20-W31-DOCS-ROUTING
Objective: Document routing engine, memory RAG, and marketplace
Target Files: docs/ROUTING.md (NEW), docs/MEMORY.md (NEW), docs/MARKETPLACE.md (NEW)
Why this lane: Documentation generation. Gemini Flash for speed.
Power Tier: LOW
Command:
```bash
gemini -y -p \
  "Create documentation for Ultra-Dex v4.0.0 features.

   CREATE docs/ROUTING.md:
   - How routing works (Thompson sampling)
   - --optimize cost|latency|quality flags
   - Provider health monitoring
   - Cost savings tracking
   - Configuration: ROUTING_STRATEGY env var

   CREATE docs/MEMORY.md:
   - 3-tier memory architecture (L1 cache, L2 Redis, L3 vector)
   - RAG pipeline (auto-retrieve, augment, store)
   - Embedding service (OpenAI, Local, NVIDIA)
   - --no-memory flag
   - Configuration: MEMORY_BACKEND, EMBEDDING_PROVIDER

   CREATE docs/MARKETPLACE.md:
   - Agent package format (agent.json, prompt.md)
   - CLI commands (list, install, publish, search)
   - Creating custom agents
   - Publishing to marketplace
   - Built-in agents reference"
```
Expected Output: 3 documentation files
Validation: `test -f docs/ROUTING.md && test -f docs/MEMORY.md && test -f docs/MARKETPLACE.md`
Fallback #1: `qwen --auth-type qwen-oauth --approval-mode yolo "Create docs/ROUTING.md, docs/MEMORY.md, docs/MARKETPLACE.md for Ultra-Dex v4.0.0"`
Fallback #2: `gemini -p "Document routing engine, memory RAG, and marketplace for Ultra-Dex"`
Fallback #3: `opencode run -m opencode/nemotron-3-super-free -p "Create docs/ROUTING.md (Thompson sampling, --optimize flags), docs/MEMORY.md (3-tier, RAG, embeddings), docs/MARKETPLACE.md (agent packages, CLI commands)."`
Cost Class: FREE

---

### [WINDOW 32] CODEX — o3
Task ID: V20-W32-PHASE2-GATE
Objective: FINAL VALIDATION — all Phase 2 criteria checked
Target Files: ALL
Why this lane: Final gate check. Codex o3 for strongest verification.
Power Tier: HIGH
Command:
```bash
codex --full-auto -m o3 exec \
  "PHASE 2 FINAL VALIDATION for Ultra-Dex v4.0.0.

   CHECK ALL:
   [ ] BanditRouter selects providers based on constraints
   [ ] --optimize cost picks cheapest adequate provider
   [ ] Health monitor detects degradation at 20% error rate
   [ ] RAG pipeline retrieves relevant past context
   [ ] Second run on similar task includes past context in prompt
   [ ] EmbeddingService works with local adapter
   [ ] LiteLLM adapter registered and callable
   [ ] ultra-dex marketplace list → shows 8 built-in agents
   [ ] ultra-dex marketplace install works
   [ ] ultra-dex replay <run_id> shows trace
   [ ] ultra-dex analytics shows cost table
   [ ] npm run typecheck → 0 errors
   [ ] npm run lint → 0 errors
   [ ] npm test → 0 failures
   [ ] npm run build → exits 0
   [ ] Version 4.0.0 in package.json
   [ ] CHANGELOG includes v4.0.0
   [ ] docs/ROUTING.md, docs/MEMORY.md, docs/MARKETPLACE.md exist

   Fix any failures. Generate final report."
```
Expected Output: All checks passing
Validation: All criteria verified
Fallback #1: `codex --full-auto -m o1 exec "Run Phase 2 validation for Ultra-Dex v4.0.0"`
Fallback #2: `claude --model opus --effort max -p "Validate all Phase 2 criteria for Ultra-Dex v4.0.0"`
Fallback #3: `opencode run -m opencode/devstral-2-123b-instruct-2512 -p "Run all Phase 2 checks: routing, memory, marketplace, tests, build, docs. Fix failures."`
Cost Class: SUBSCRIPTION-INCLUDED

---

## WINDOW SUMMARY

| Window | Agent | Task | Week | Cost |
|--------|-------|------|------|------|
| W17 | Claude Opus | Bandit router | 5 | SUBSCRIPTION |
| W18 | Claude Sonnet | Health monitor | 5 | SUBSCRIPTION |
| W19 | Gemini Pro | Routing tests | 5 | FREE |
| W20 | Qwen Max | Cost dashboard | 5 | FREE |
| W21 | Claude Opus | RAG pipeline | 6 | SUBSCRIPTION |
| W22 | Claude Sonnet | Embedding service | 6 | SUBSCRIPTION |
| W23 | Gemini Pro | LiteLLM adapter | 6 | FREE |
| W24 | Qwen Plus | Replay command | 6 | FREE |
| W25 | Claude Opus | Marketplace arch | 7 | SUBSCRIPTION |
| W26 | Claude Sonnet | Marketplace CLI | 7 | SUBSCRIPTION |
| W27 | Gemini Pro | Package agents | 7 | FREE |
| W28 | Qwen Max | Analytics cmd | 7 | FREE |
| W29 | Codex o1 | E2E integration | 8 | SUBSCRIPTION |
| W30 | Claude Sonnet | Version 4.0.0 | 8 | SUBSCRIPTION |
| W31 | Gemini Flash | Docs | 8 | FREE |
| W32 | Codex o3 | Final validation | 8 | SUBSCRIPTION |

**Total: 16 windows, 4 weeks | 9 SUBSCRIPTION, 7 FREE**

---

*Phase 2 dispatches generated 2026-04-10 | V2.0 Intelligence | 16 windows | Weeks 5-8*
