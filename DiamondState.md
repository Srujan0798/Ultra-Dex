# Ultra-Dex Diamond State Protocol

> **From Eternal State (v2.1.0) → Diamond State (v3.0.0)**
> 
> *"Skeleton with real bones → Unstoppable enterprise titan"*

---

## The Diamond State Vision

Ultra-Dex v2.1.0 achieved **Eternal State** — stable, tested, documented. Diamond State transforms it into an **unstoppable enterprise titan** capable of handling thousands of global users with real-time transparency, predictive intelligence, and a thriving ecosystem.

---

## The 4 Diamond Pillars

| Pillar | Problem | Diamond Solution | Impact |
|--------|---------|------------------|--------|
| **1. Distributed Mesh** | Single Node.js instance = scale ceiling | Redis/Kafka distributed bus | Global multi-region deployment |
| **2. Streaming UX** | Black-box execution, limited visibility | SSE/WebSockets real-time streaming | ChatGPT-transparent user experience |
| **3. Predictive Memory** | Synchronous memory queries = slow | Background context pre-fetching | Millisecond agent startup |
| **4. MCP Ecosystem** | Static integrations, manual updates | Dynamic MCP App Store | Community-driven plugin marketplace |

---

## Phase 1: Distributed Multi-Agent Mesh

### Overview
Transition from in-memory EventEmitter to distributed Redis Pub/Sub or Kafka mesh. Enables NY orchestrator to hand off tasks to London workers seamlessly.

### Architecture
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Orchestrator   │────▶│  Redis/Kafka    │◀────│   Worker Pool   │
│   (New York)    │     │   Message Bus   │     │   (London)      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                                               │
         │              ┌─────────────────┐              │
         └─────────────▶│  Worker Pool    │◀─────────────┘
                        │  (Singapore)    │
                        └─────────────────┘
```

### Dispatch Commands

#### [WINDOW 1] CLAUDE — claude-opus-4
**Task ID:** D1-W1  
**Objective:** Design distributed message bus abstraction layer  
**Target Files:** `src/core/mesh/bus-interface.js`, `src/core/mesh/redis-adapter.js`, `src/core/mesh/kafka-adapter.js`  
**Why this lane:** Critical API design decision — requires Opus-level architectural judgment  
**Power Tier:** HIGH  
**Command:**
```bash
claude --model opus --effort max \
  "Design the distributed message bus abstraction for Ultra-Dex:

   GOAL: Replace in-memory EventEmitter with distributed Redis/Kafka mesh
   
   CREATE:
   1) src/core/mesh/bus-interface.js
      - Abstract class MessageBus with methods:
        - connect(), disconnect()
        - publish(channel, message)
        - subscribe(channel, handler)
        - request(replyChannel, message, timeout) → Promise
        - broadcast(event, payload)
      - Interface must be adapter-agnostic (works with Redis, Kafka, or in-memory fallback)
   
   2) src/core/mesh/redis-adapter.js
      - Implements MessageBus using ioredis
      - Pub/Sub for events, Redis Streams for persistence
      - Automatic reconnection with exponential backoff
      - Cluster mode support for Redis Cluster
   
   3) src/core/mesh/kafka-adapter.js  
      - Implements MessageBus using kafka-js
      - Producer/Consumer pattern
      - Topic auto-creation with sensible defaults
      - Consumer group balancing
   
   4) src/core/mesh/index.js
      - Factory: createBus(type, config) → MessageBus instance
      - Export bus types and health check utilities
   
   VALIDATION:
   - Write tests/core/mesh/bus-interface.test.js
   - Tests must pass with both Redis and Kafka adapters (use testcontainers or mocks)
   - npm test — zero regressions"
```
**Expected Output:** Message bus abstraction with Redis and Kafka adapters  
**Validation:** `ls src/core/mesh/*.js | wc -l` → 4+ files, tests pass  
**Fallback #1:** `claude --model sonnet --effort high -p "same — Redis adapter only, skip Kafka for now"`  
**Fallback #2:** `codex -m o3 exec "Implement basic Redis pub/sub wrapper only"`  
**Fallback #3:** `gemini -y -p "Create simple interface, implementations later"`  
**Cost Class:** API-KEY-USAGE

---

#### [WINDOW 2] CODEX — o3
**Task ID:** D1-W2  
**Objective:** Migrate CommunicationBus to distributed mesh  
**Target Files:** `src/core/orchestration/communication-bus.js`, `src/core/agents/agent-registry.js`  
**Why this lane:** Complex refactoring requiring careful state management  
**Power Tier:** HIGH  
**Command:**
```bash
codex -m o3 --full-auto exec \
  "Migrate CommunicationBus from EventEmitter to distributed mesh:

   CURRENT: src/core/orchestration/communication-bus.js uses EventEmitter
   TARGET: Use MessageBus abstraction from D1-W1

   MIGRATION STEPS:
   1) Read current CommunicationBus implementation
   2) Refactor to use MessageBus interface:
      - constructor(config) → accepts busType ('memory' | 'redis' | 'kafka')
      - All emit() calls → publish()
      - All on() calls → subscribe()
      - Add agent discovery: discoverAgents() → returns agents across mesh
      - Add task routing: routeTask(task, agentId) → sends to specific agent
   3) Update AgentRegistry to register agents with mesh:
      - On agent spawn: broadcast 'agent.online' with agent metadata
      - On agent exit: broadcast 'agent.offline'
      - Keep local cache but refresh from mesh periodically
   4) Add mesh health monitoring: getMeshStats() → connected nodes, message latency
   5) Backward compatibility: config.mesh = false → uses in-memory (for testing)

   TESTING:
   - Update tests/core/communication-bus.test.js
   - Test both in-memory and Redis modes
   - npm test — zero regressions"
```
**Expected Output:** CommunicationBus migrated to distributed mesh  
**Validation:** `grep 'MessageBus\|mesh' src/core/orchestration/communication-bus.js` → matches  
**Fallback #1:** `claude --model sonnet --effort high -p "same — keep EventEmitter, add mesh as wrapper"`  
**Fallback #2:** `codex -m o1 exec "Simple Redis pub/sub migration only"`  
**Fallback #3:** `gemini -y -p "Add mesh config option, implement later"`  
**Cost Class:** SUBSCRIPTION-INCLUDED

---

#### [WINDOW 3] GEMINI — gemini-2.5-pro
**Task ID:** D1-W3  
**Objective:** Create mesh worker pool and load balancer  
**Target Files:** `src/core/mesh/worker-pool.js`, `src/core/mesh/load-balancer.js`  
**Why this lane:** Load balancing algorithms — parallel implementation  
**Power Tier:** BALANCED  
**Command:**
```bash
gemini -y -p \
  "Create distributed worker pool and load balancer for mesh:

   1) src/core/mesh/worker-pool.js
      - WorkerPool class manages pool of agent workers across mesh
      - Methods:
        - registerWorker(workerId, capabilities, location)
        - unregisterWorker(workerId)
        - getAvailableWorkers(taskRequirements) → filtered workers
        - claimWorker(workerId) → reserves worker for task
        - releaseWorker(workerId)
      - Heartbeat monitoring: workers must ping every 30s or marked offline
   
   2) src/core/mesh/load-balancer.js
      - LoadBalancer class for routing tasks to workers
      - Strategies:
        - 'round-robin': distribute evenly
        - 'least-loaded': pick worker with fewest active tasks  
        - 'geographic': pick closest worker by region
        - 'capability': pick worker with best skill match
      - Methods:
        - selectWorker(task, strategy) → workerId
        - getWorkerLoad(workerId) → active tasks, queue depth
        - rebalance() → redistribute queued tasks
   
   3) Tests: tests/core/mesh/worker-pool.test.js, load-balancer.test.js
   
   4) npm test — zero regressions"
```
**Expected Output:** Worker pool and load balancer implemented  
**Validation:** `ls src/core/mesh/*.js | wc -l` → 6+ files  
**Fallback #1:** `gemini -p "Worker pool only, skip load balancer initially"`  
**Fallback #2:** `codex --full-auto exec "Simple round-robin load balancer"`  
**Fallback #3:** `qwen --approval-mode yolo "Basic worker tracking only"`  
**Cost Class:** FREE

---

## Phase 2: Streaming Real-Time UX

### Overview
Implement Server-Sent Events (SSE) / WebSockets for transparent, real-time agent reasoning streaming to frontend UI.

### Architecture
```
┌─────────────┐      SSE/WebSocket       ┌─────────────┐
│   React     │◀──── Real-time tokens ───│   Ultra-Dex  │
│  Dashboard  │◀──── Tool calls ─────────│   Server    │
│             │◀──── Agent thoughts ─────│             │
└─────────────┘                          └─────────────┘
                                                  │
                                                  ▼
                                          ┌─────────────┐
                                          │  AI Provider │
                                          │  (streaming) │
                                          └─────────────┘
```

### Dispatch Commands

#### [WINDOW 4] CLAUDE — claude-sonnet-4
**Task ID:** D2-W4  
**Objective:** Design streaming infrastructure with SSE and WebSocket support  
**Target Files:** `src/core/streaming/stream-manager.js`, `src/core/streaming/sse-handler.js`, `src/core/streaming/ws-handler.js`  
**Why this lane:** API design for real-time streaming — premium lane  
**Power Tier:** HIGH  
**Command:**
```bash
claude --model sonnet --effort high \
  "Create streaming infrastructure for real-time agent UX:

   GOAL: Stream raw AI tokens and agent reasoning to frontend
   
   CREATE:
   1) src/core/streaming/stream-manager.js
      - StreamManager class — central hub for all streaming
      - Methods:
        - createStream(sessionId, options) → stream instance
        - subscribe(sessionId, transport) → add SSE or WebSocket transport
        - publish(sessionId, eventType, payload) → broadcast to subscribers
        - endStream(sessionId)
      - Supports multiple transports per session (flexibility)
   
   2) src/core/streaming/sse-handler.js
      - Server-Sent Events handler for HTTP-based streaming
      - Express middleware: sseMiddleware()
      - Route: GET /api/stream/:sessionId
      - Event types: 'token', 'tool_call', 'thought', 'error', 'complete'
      - Proper headers: Content-Type: text/event-stream
   
   3) src/core/streaming/ws-handler.js
      - WebSocket handler using ws library
      - WS route: /ws/stream
      - Same event types as SSE
      - Binary support for future voice/video
      - Connection heartbeat/ping-pong
   
   4) src/core/streaming/index.js
      - Export all streaming components
      - Helper: createDashboardStream(sessionId) → preconfigured for dashboard

   VALIDATION:
   - Write tests/core/streaming/*.test.js
   - Test both SSE and WebSocket transports
   - npm test — zero regressions"
```
**Expected Output:** Streaming infrastructure with SSE and WebSocket handlers  
**Validation:** `ls src/core/streaming/*.js | wc -l` → 4+ files  
**Fallback #1:** `claude --model sonnet --effort high -p "same — SSE only, skip WebSockets for now"`  
**Fallback #2:** `codex -m o1 exec "Basic SSE endpoint only"`  
**Fallback #3:** `gemini -y -p "Simple EventEmitter-based stream manager"`  
**Cost Class:** SUBSCRIPTION-INCLUDED

---

#### [WINDOW 5] CODEX — o1
**Task ID:** D2-W5  
**Objective:** Wire streaming into AI provider calls  
**Target Files:** `src/core/ai/ai-meta-layer.js`, `src/core/orchestration/index.js`  
**Why this lane:** Integration with existing provider layer  
**Power Tier:** BALANCED  
**Command:**
```bash
codex --full-auto -m o1 exec \
  "Wire streaming into AI provider execution flow:

   CURRENT: AIMetaLayer.call() returns complete response
   TARGET: Stream tokens in real-time to connected clients

   INTEGRATION:
   1) Modify src/core/ai/ai-meta-layer.js
      - Add options.stream = true to enable streaming
      - When streaming: yield tokens instead of returning complete response
      - Hook into StreamManager for each token received:
        streamManager.publish(sessionId, 'token', { token, provider, model })
   
   2) Modify src/core/orchestration/index.js
      - On task start: create stream session
      - On agent thought: stream 'thought' events (plan, reasoning)
      - On tool call: stream 'tool_call' events (tool name, args)
      - On tool result: stream 'tool_result' events
      - On completion: stream 'complete' event, end stream
      - On error: stream 'error' event
   
   3) Add dashboard stream endpoint:
      - GET /api/orchestrator/:taskId/stream
      - Returns SSE stream for that specific task
      - Frontend can connect and see real-time execution
   
   4) Update tests to verify streaming

   VALIDATION:
   - Manual test: curl -N http://localhost:3000/api/stream/test | cat
   - Should see SSE events flowing
   - npm test — zero regressions"
```
**Expected Output:** AI calls stream tokens to frontend in real-time  
**Validation:** `grep 'streamManager\|publish' src/core/ai/ai-meta-layer.js` → matches  
**Fallback #1:** `codex -m gpt-4 exec "Simple console.log streaming first, then wire to HTTP"`  
**Fallback #2:** `claude --model sonnet --effort high -p "same task"`  
**Fallback #3:** `gemini -y -p "Add streaming option, implement later"`  
**Cost Class:** SUBSCRIPTION-INCLUDED

---

#### [WINDOW 6] GEMINI — gemini-2.5-flash
**Task ID:** D2-W6  
**Objective:** Create React dashboard streaming components  
**Target Files:** `apps/dashboard/src/components/StreamViewer.jsx`, `apps/dashboard/src/hooks/useStream.js`  
**Why this lane:** Frontend components — mechanical implementation  
**Power Tier:** LOW  
**Command:**
```bash
gemini -y -p \
  "Create React components for streaming dashboard:

   1) apps/dashboard/src/hooks/useStream.js
      - Custom hook: useStream(sessionId, options)
      - Returns: { events, isConnected, error, reconnect }
      - Auto-reconnect on disconnect
      - Buffer last N events (configurable)
      - Cleanup on unmount
   
   2) apps/dashboard/src/components/StreamViewer.jsx
      - Component that displays streaming events
      - Props: sessionId, onComplete, onError
      - Renders:
        - Token stream (typing effect)
        - Tool calls (collapsible JSON)
        - Agent thoughts (thought bubbles)
        - Errors (red alerts)
        - Completion status
      - Scroll auto-follow like ChatGPT UI
      - Copy-to-clipboard for full output
   
   3) apps/dashboard/src/components/TaskStreamPage.jsx
      - Full page: task input + stream viewer side by side
      - Route: /tasks/:taskId/stream
      - Start task → auto-open stream view

   VALIDATION:
   - Build: npm run build:dashboard (no errors)
   - npm test — zero regressions"
```
**Expected Output:** React components for streaming UI  
**Validation:** `ls apps/dashboard/src/components/Stream*.jsx | wc -l` → 2+ files  
**Fallback #1:** `gemini -p "Hook only, skip components initially"`  
**Fallback #2:** `qwen --approval-mode yolo "Basic component skeleton"`  
**Fallback #3:** `claude --model haiku -p "same task"`  
**Cost Class:** FREE

---

## Phase 3: Predictive Memory Pre-fetching

### Overview
Build Predictive Context Engine that pre-fetches relevant memory before agent starts, hydrating execution context in milliseconds.

### Architecture
```
User Submits Task
        │
        ▼
┌─────────────────┐
│  Orchestrator   │────┐
│  (main thread)  │    │
└─────────────────┘    │
        │              │
        ▼              │
┌─────────────────┐    │
│ Spawn Background │   │
│  Worker (async)  │◀──┘
└─────────────────┘
        │
        ▼
┌─────────────────┐     ┌─────────────────┐
│ Vector Search   │────▶│ Context Cache   │
│ (embeddings)    │     │ (pre-hydrated)  │
└─────────────────┘     └─────────────────┘
        │
        ▼
┌─────────────────┐
│ Graph Traversal │
│ (relationships) │
└─────────────────┘
```

### Dispatch Commands

#### [WINDOW 7] CLAUDE — claude-opus-4
**Task ID:** D3-W7  
**Objective:** Design predictive context engine architecture  
**Target Files:** `src/core/memory/predictive-engine.js`, `src/core/memory/context-cache.js`  
**Why this lane:** Complex algorithm design for prediction — Opus lane  
**Power Tier:** HIGH  
**Command:**
```bash
claude --model opus --effort max \
  "Design predictive memory pre-fetching engine:

   GOAL: Pre-fetch relevant memory before agent starts
   
   CREATE:
   1) src/core/memory/predictive-engine.js
      - PredictiveEngine class
      - Methods:
        - predictContext(taskDescription) → Promise<context>
        - analyzeTaskIntent(task) → { keywords, entities, intent }
        - vectorPreFetch(embedding, topK) → related memories
        - graphPreFetch(entities) → related nodes via relationships
        - mergeAndRank(vectorResults, graphResults) → ranked context
      - Background worker integration:
        - spawnBackgroundPrefetch(task) → worker handle
        - getPrefetchStatus(taskId) → pending | complete | error
        - awaitPrefetch(taskId, timeout) → Promise<context>
   
   2) src/core/memory/context-cache.js
      - ContextCache class — LRU cache for pre-fetched contexts
      - Key: taskId or content hash
      - Value: { context, fetchedAt, expiresAt }
      - Methods:
        - get(taskId) → context | null
        - set(taskId, context, ttl)
        - invalidate(taskId)
        - getStats() → hitRate, missRate, size
      - Redis-backed for distributed caching (optional config)
   
   3) src/core/memory/index.js
      - Export predictive engine and context cache
      - Integration helper: withPrefetch(task, fn) → runs fn with pre-fetched context

   VALIDATION:
   - Write tests/core/memory/predictive-engine.test.js
   - Test vector + graph merging logic
   - npm test — zero regressions"
```
**Expected Output:** Predictive engine and context cache  
**Validation:** `ls src/core/memory/predictive*.js` → files exist  
**Fallback #1:** `claude --model sonnet --effort high -p "same — simpler caching, skip background workers"`  
**Fallback #2:** `codex -m o3 exec "Basic vector search prefetch only"`  
**Fallback #3:** `gemini -y -p "Simple prediction logic, implement later"`  
**Cost Class:** API-KEY-USAGE

---

#### [WINDOW 8] CODEX — o3
**Task ID:** D3-W8  
**Objective:** Integrate predictive engine into orchestration flow  
**Target Files:** `src/core/orchestration/index.js`, `src/core/agents/ralph-loop.js`  
**Why this lane:** Complex integration with existing flow  
**Power Tier:** HIGH  
**Command:**
```bash
codex -m o3 --full-auto exec \
  "Integrate predictive memory into agent execution:

   CURRENT: Agent starts, then queries memory (synchronous)
   TARGET: Memory pre-fetched in background before agent starts

   INTEGRATION:
   1) Modify src/core/orchestration/index.js executeTask()
      - On task receive: immediately spawn background prefetch
      - While prefetching: do lightweight setup (validation, etc.)
      - Before agent.spawn(): await prefetch completion (with timeout)
      - Pass pre-fetched context to agent as initial memory
      - If prefetch fails: fall back to synchronous query (don't block)
   
   2) Modify src/core/agents/ralph-loop.js
      - Accept initialContext parameter in constructor
      - Pre-hydrate memory with initialContext before first iteration
      - Log: 'Context pre-hydrated with N memories in Xms'
   
   3) Add metrics:
      - prefetchTime (how long pre-fetch took)
      - prefetchHitRate (how often pre-fetched context was useful)
      - timeToFirstToken (improved by prefetch)
   
   4) Config option:
      - predictiveMemory: { enabled: true, timeout: 5000, cacheTtl: 300000 }

   VALIDATION:
   - Measure: before vs after memory query time
   - npm test — zero regressions"
```
**Expected Output:** Predictive memory integrated into execution flow  
**Validation:** `grep 'predictive\|prefetch' src/core/orchestration/index.js` → matches  
**Fallback #1:** `claude --model sonnet --effort high -p "same — manual prefetch call, no background"`  
**Fallback #2:** `codex -m o1 exec "Simple synchronous prefetch before spawn"`  
**Fallback #3:** `gemini -y -p "Add config option, implement later"`  
**Cost Class:** SUBSCRIPTION-INCLUDED

---

## Phase 4: MCP App Store Ecosystem

### Overview
Build MCP Registry for community plugins — dynamic loading without server restart. Think "App Store" for AI tools.

### Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    MCP App Store                            │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │   Jira      │  │   GitHub    │  │  Salesforce │  ...     │
│  │   Plugin    │  │   Plugin    │  │   Plugin    │          │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘          │
│         └─────────────────┴─────────────────┘               │
│                           │                                 │
│                    ┌──────▼──────┐                          │
│                    │ MCP Registry │                          │
│                    │  - Publish   │                          │
│                    │  - Discover  │                          │
│                    │  - Install   │                          │
│                    │  - Load      │                          │
│                    └──────┬──────┘                          │
│                           │                                 │
│                    ┌──────▼──────┐                          │
│                    │  Ultra-Dex  │                          │
│                    │   Runtime   │                          │
│                    │(hot reload) │                          │
│                    └─────────────┘                          │
└─────────────────────────────────────────────────────────────┘
```

### Dispatch Commands

#### [WINDOW 9] CLAUDE — claude-opus-4
**Task ID:** D4-W9  
**Objective:** Design MCP Registry architecture and plugin specification  
**Target Files:** `src/core/mcp/registry.js`, `docs/specs/MCP-PLUGIN-SPEC.md`  
**Why this lane:** Critical API design for ecosystem — Opus lane  
**Power Tier:** HIGH  
**Command:**
```bash
claude --model opus --effort max \
  "Design MCP Registry for community plugin ecosystem:

   GOAL: Dynamic plugin loading without server restart
   
   CREATE:
   1) docs/specs/MCP-PLUGIN-SPEC.md
      - Plugin package format (npm-compatible)
      - Required exports: name, version, activate(context), deactivate()
      - Optional exports: config, hooks, capabilities
      - Manifest format (ultra-dex section in package.json)
      - Security: permission model, sandbox requirements
      - Example minimal plugin
   
   2) src/core/mcp/registry.js
      - MCPRegistry class
      - Methods:
        - publish(pluginPackage) → validate and add to registry
        - discover(filter) → search available plugins
        - install(pluginId, version) → download and validate
        - load(pluginId) → dynamic import without restart
        - unload(pluginId) → graceful shutdown
        - list() → installed plugins
        - getStats() → registry metrics
      - Storage: local registry.json + npm registry proxy
      - Hot reload: watch for changes, auto-reload in dev mode
   
   3) src/core/mcp/plugin-sandbox.js
      - Sandbox for plugin execution
      - VM2 or Node.js vm module
      - Restricted require (whitelist allowed modules)
      - Timeout protection (infinite loop prevention)
      - Memory limits
   
   4) src/core/mcp/index.js
      - Export registry and utilities
      - Integration with existing PluginManager

   VALIDATION:
   - Create test plugin in tests/fixtures/test-plugin/
   - Test full lifecycle: publish → install → load → unload
   - npm test — zero regressions"
```
**Expected Output:** MCP Registry with plugin spec and sandbox  
**Validation:** `ls src/core/mcp/*.js | wc -l` → 3+ files  
**Fallback #1:** `claude --model sonnet --effort high -p "same — skip sandbox initially, use simple vm"`  
**Fallback #2:** `codex -m o3 exec "Basic registry without sandbox"`  
**Fallback #3:** `gemini -y -p "Spec document first, implementation later"`  
**Cost Class:** API-KEY-USAGE

---

#### [WINDOW 10] CODEX — o1
**Task ID:** D4-W10  
**Objective:** Build MCP CLI commands and marketplace API  
**Target Files:** `apps/cli/lib/commands/mcp.js`, `src/core/mcp/marketplace-api.js`  
**Why this lane:** CLI and API implementation  
**Power Tier:** BALANCED  
**Command:**
```bash
codex --full-auto -m o1 exec \
  "Create MCP CLI and marketplace API:

   1) src/core/mcp/marketplace-api.js
      - MarketplaceAPI class for remote registry
      - Methods:
        - search(query, filters) → Promise<plugins[]>
        - getPlugin(pluginId) → Promise<pluginDetails>
        - download(pluginId, version) → Promise<buffer>
        - publish(pluginPackage, authToken) → Promise<success>
      - Default registry: registry.ultra-dex.ai (configurable)
      - Caching: cache plugin list locally
   
   2) apps/cli/lib/commands/mcp.js
      - New command: ultra-dex mcp
      - Subcommands:
        - mcp search <query> [--category] [--author]
        - mcp install <pluginId> [--version]
        - mcp uninstall <pluginId>
        - mcp list [--verbose]
        - mcp publish [./path/to/plugin] [--registry]
        - mcp info <pluginId>
        - mcp update
      - Each command uses MarketplaceAPI + local Registry
   
   3) Integration with PluginManager:
      - On mcp install: Registry.install() + PluginManager.activate()
      - On mcp uninstall: PluginManager.deactivate() + Registry.uninstall()
   
   VALIDATION:
   - Test CLI: node apps/cli/bin/ultra-dex.js mcp search test
   - Mock marketplace API for tests
   - npm test — zero regressions"
```
**Expected Output:** MCP CLI commands and marketplace API  
**Validation:** `grep 'mcp' apps/cli/lib/commands/*.js` → matches  
**Fallback #1:** `codex -m gpt-4 exec "Basic install/uninstall commands only"`  
**Fallback #2:** `claude --model sonnet --effort high -p "same task"`  
**Fallback #3:** `gemini -y -p "CLI skeleton first, API later"`  
**Cost Class:** SUBSCRIPTION-INCLUDED

---

#### [WINDOW 11] GEMINI — gemini-2.5-pro
**Task ID:** D4-W11  
**Objective:** Create sample MCP plugins and documentation  
**Target Files:** `packages/plugins/jira/`, `packages/plugins/github/`, `docs/mcp/`  
**Why this lane:** Multiple plugins in parallel — Gemini volume  
**Power Tier:** BALANCED  
**Command:**
```bash
gemini -y -p \
  "Create sample MCP plugins and developer docs:

   1) packages/plugins/jira/
      - index.js: Jira integration plugin
      - package.json with ultra-dex manifest
      - Features:
        - Create Jira issue from task
        - Update issue status
        - Query issues
      - Config: JIRA_URL, JIRA_API_TOKEN
   
   2) packages/plugins/github/
      - index.js: GitHub integration plugin
      - Features:
        - Create issues from tasks
        - Link PRs to tasks
        - Query repository info
      - Config: GITHUB_TOKEN
   
   3) packages/plugins/slack/ (enhance existing)
      - Add MCP manifest
      - Add hook: onTaskComplete → post to Slack
   
   4) docs/mcp/DEVELOPER-GUIDE.md
      - How to create a plugin
      - Manifest format
      - Testing locally
      - Publishing to registry
   
   5) docs/mcp/API-REFERENCE.md
      - Plugin context object
      - Available hooks
      - Helper utilities

   VALIDATION:
   - All plugins have valid package.json with manifest
   - npm test — zero regressions"
```
**Expected Output:** 3 sample plugins + developer docs  
**Validation:** `ls packages/plugins/*/package.json | wc -l` → 11+ files  
**Fallback #1:** `gemini -p "One plugin only (GitHub), skip others"`  
**Fallback #2:** `qwen --approval-mode yolo "Basic plugin templates"`  
**Fallback #3:** `claude --model haiku -p "Developer guide only"`  
**Cost Class:** FREE

---

## Diamond State Completion Checklist

Before Ultra-Dex reaches Diamond State, verify ALL:

### Infrastructure
- [ ] Distributed mesh: `src/core/mesh/` with Redis + Kafka adapters
- [ ] CommunicationBus uses MessageBus abstraction
- [ ] Worker pool with load balancer
- [ ] Streaming: `src/core/streaming/` with SSE + WebSocket
- [ ] Dashboard streams tokens in real-time
- [ ] Predictive memory: `src/core/memory/predictive-engine.js`
- [ ] Context pre-fetching before agent spawn
- [ ] MCP Registry: `src/core/mcp/registry.js`
- [ ] MCP CLI: `ultra-dex mcp install <plugin>`

### Quality Gates
- [ ] `npm run build` → exits 0
- [ ] `npx tsc --noEmit` → 0 errors
- [ ] `npm run test:unit` → 0 failures
- [ ] `npm run test:integration` → 0 failures
- [ ] `npm run lint` → no crashes
- [ ] Version bumped to 3.0.0
- [ ] CHANGELOG.md updated with Diamond State features

### Documentation
- [ ] `docs/mcp/DEVELOPER-GUIDE.md` exists
- [ ] `docs/mcp/API-REFERENCE.md` exists
- [ ] `docs/specs/MCP-PLUGIN-SPEC.md` exists
- [ ] Sample plugins in `packages/plugins/`

---

## Execution Commands Summary

### Run All Windows (Parallel by Phase)
```bash
# Phase 1: Distributed Mesh (Windows 1-3)
claude --model opus --effort max -p "$(cat DiamondState.md | grep -A 50 'D1-W1')"
codex -m o3 --full-auto exec "$(cat DiamondState.md | grep -A 30 'D1-W2')"
gemini -y -p "$(cat DiamondState.md | grep -A 30 'D1-W3')"

# Phase 2: Streaming UX (Windows 4-6)
claude --model sonnet --effort high -p "$(cat DiamondState.md | grep -A 50 'D2-W4')"
codex --full-auto -m o1 exec "$(cat DiamondState.md | grep -A 30 'D2-W5')"
gemini -y -p "$(cat DiamondState.md | grep -A 30 'D2-W6')"

# Phase 3: Predictive Memory (Windows 7-8)
claude --model opus --effort max -p "$(cat DiamondState.md | grep -A 50 'D3-W7')"
codex -m o3 --full-auto exec "$(cat DiamondState.md | grep -A 30 'D3-W8')"

# Phase 4: MCP Ecosystem (Windows 9-11)
claude --model opus --effort max -p "$(cat DiamondState.md | grep -A 50 'D4-W9')"
codex --full-auto -m o1 exec "$(cat DiamondState.md | grep -A 30 'D4-W10')"
gemini -y -p "$(cat DiamondState.md | grep -A 30 'D4-W11')"
```

---

*Diamond State Protocol v1.0*  
*Generated: 2026-04-06*  
*From Eternal State (v2.1.0) → Diamond State (v3.0.0)*
