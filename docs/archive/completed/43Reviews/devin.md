# 🪐 ULTRA-DEX META-LAYER BRUTAL REVIEW — FINAL VERDICT

## 1. Summary

Ultra-Dex is **genuinely 2026-grade orchestration infrastructure**, not 2024 markdown templates. The CLI actually executes (serves HTTP/WebSocket, runs AI agents, generates scaffolds), the MCP server is real and functional, and the provider abstraction legitimately supports Claude/OpenAI/Gemini/Ollama. However, it's **70% there**: live scaffolds are basic starters (not production apps), test coverage is 41% (needs 70%+), and critical integrations (LangGraph, vector search, voice) are adapters/stubs rather than production features. The core thesis is **valid and differentiated** — nobody else owns the "memory layer for AI amnesia" position — but execution gaps prevent it from being the "unstoppable meta-layer" today. With focused 48-hour sprints on live boilerplate quality, test coverage, and LangChain production integration, this becomes the Kubernetes of AI development.

---

## 2. Score Table

| Dimension               | Score      | Evidence                                                                                                                                                                                                                                                                                                                                       |
| ----------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Active Execution**    | **8/10**   | CLI commands actually DO things: `serve.js` runs HTTP+WebSocket+MCP server [0-cite-0](#0-cite-0) , `swarm.js` executes AI agents with parallel processing [0-cite-1](#0-cite-1) , `generate.js` calls real AI APIs with streaming [0-cite-2](#0-cite-2) . **Deduction**: live scaffolds are basic (just Next.js starter) [0-cite-3](#0-cite-3) |
| **Meta-Layer Position** | **9/10**   | Crystal clear positioning: "AI-Agnostic orchestration" [0-cite-4](#0-cite-4) , multi-provider abstraction [0-cite-5](#0-cite-5) , MCP server for IDE integration [0-cite-6](#0-cite-6) . Doesn't compete with AI tools, enhances them. **Deduction**: messaging could be stronger in competitive docs                                          |
| **2026 Integration**    | **7/10**   | ✅ MCP server functional [0-cite-7](#0-cite-7) , ✅ WebSocket real-time updates [0-cite-8](#0-cite-8) , ✅ GitHub integration with PR creation [0-cite-9](#0-cite-9) , ✅ Claude Desktop config [0-cite-10](#0-cite-10) . ⚠️ LangChain is optional adapter, not core [0-cite-11](#0-cite-11) , ⚠️ No vector store integration yet              |
| **Competitive Moat**    | **9/10**   | 34-section template exists, 21-step verification, 17 production agents [0-cite-12](#0-cite-12) , 31 cursor rules [0-cite-13](#0-cite-13) , multi-tool orchestration guide. Agent quality is excellent (detailed prompts with code examples) [0-cite-14](#0-cite-14) . **Unique moat confirmed**                                                |
| **Tech Readiness**      | **6/10**   | ✅ Provider abstraction supports 4 APIs [0-cite-15](#0-cite-15) , ✅ Code graph scanning [0-cite-16](#0-cite-16) , ✅ 281 tests (41% coverage) [0-cite-17](#0-cite-17) . ❌ LangGraph mentioned but no integration, ❌ Vector search is placeholder, ❌ Voice input is NLP keyword matching only [0-cite-18](#0-cite-18)                       |
| **TOTAL**               | **7.8/10** | **Strong foundation, needs execution polish**                                                                                                                                                                                                                                                                                                  |

---

## 3. 2026 Reality Check

| Check                       | Pass?          | Evidence                                                                                                                                                                                  |
| --------------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ACTIVE not PASSIVE**      | ✅ **PASS**    | Commands execute: `serve` runs servers [0-cite-0](#0-cite-0) , `swarm` runs agents [0-cite-1](#0-cite-1) , `init --live` generates scaffolds [0-cite-19](#0-cite-19) . Not just markdown. |
| **DYNAMIC not STATIC**      | ✅ **PASS**    | File watcher auto-updates state [0-cite-20](#0-cite-20) , WebSocket broadcasts changes [0-cite-21](#0-cite-21) , state file locking for concurrent writes [0-cite-22](#0-cite-22)         |
| **EXECUTES not just PLANS** | ⚠️ **PARTIAL** | ✅ Generates AI plans via real APIs [0-cite-2](#0-cite-2) , ✅ Runs agent swarms [0-cite-23](#0-cite-23) . ❌ But scaffolds are basic starters, not production code [0-cite-3](#0-cite-3) |
| **INTEGRATES not ISOLATES** | ✅ **PASS**    | MCP SDK integration [0-cite-24](#0-cite-24) , GitHub CLI wrapper [0-cite-25](#0-cite-25) , Cloud team server [0-cite-26](#0-cite-26) , Interactive TUI [0-cite-27](#0-cite-27)            |
| **2026 not 2024**           | ✅ **PASS**    | Uses MCP protocol standard, WebSocket streaming, Docker exec sandbox, provider abstraction. Not copy-paste prompts.                                                                       |

**Verdict: 4/5 PASS** — Core is 2026-grade, but scaffold quality holds it back from "full production" tier.

---

## 4. Top 5 Strengths

1. **Legitimately Active CLI** — Not vaporware. The `serve` command runs an actual HTTP server (port 3001) + WebSocket server (port 3002) + MCP server + dashboard with file watching and state broadcasting. [0-cite-0](#0-cite-0)

2. **Production-Grade Agent Prompts** — 17 agents with detailed instructions, code examples in multiple languages (TypeScript, Python), handoff protocols, and quality checklists. Not toy prompts. [0-cite-14](#0-cite-14)

3. **Real Multi-Provider Abstraction** — Not just "supports Claude." Actual provider classes for Claude, OpenAI, Gemini, Ollama with streaming, cost estimation, and error handling. Router provider for hybrid local+cloud. [0-cite-28](#0-cite-28)

4. **MCP Integration is Production-Ready** — Uses official `@modelcontextprotocol/sdk`, registers resources and tools, works with Claude Desktop via stdio transport. Not a mock. [0-cite-29](#0-cite-29)

5. **GitHub Integration Actually Works** — Not just documentation. Commands use `gh` CLI to list issues, create PRs, sync to tasks, with label-to-agent mapping and webhook parsing. [0-cite-30](#0-cite-30)

---

## 5. Top 5 Critical Gaps (with file:line)

1. **Live Scaffolds Are Too Basic** — `init --live` generates bare-bones Next.js with a hello world page. Not the "production SaaS in 60 seconds" promised. Needs auth flows, payment integration, admin dashboard. [0-cite-3](#0-cite-3)

2. **Test Coverage is 41%, Not 70%+** — Commands, providers, and MCP modules lack sufficient test coverage. Critical for enterprise adoption. [0-cite-31](#0-cite-31)

3. **LangChain is Optional Adapter, Not Core** — The LangChainAdapter uses dynamic imports and throws errors if not installed. Should be first-class integration with chains/agents pre-configured. [0-cite-11](#0-cite-11)

4. **Voice/NLP is Keyword Matching, Not Real NLU** — The `routeIntent` function is basic string matching, not semantic understanding. No actual voice input integration. [0-cite-18](#0-cite-18)

5. **VS Code Extension is Incomplete** — Sidebar is mentioned but extension lacks core features. Should have agent picker, live dashboard, and context injection. [0-cite-32](#0-cite-32)

---

## 6. 48-Hour Critical Path

### Day 1 (24 hours): Live Scaffold Overhaul

**Goal:** Make `init --live` generate ACTUAL production SaaS, not hello world.

- **Hours 0-8:** Add to Next.js scaffold: Clerk auth with protected routes, Stripe payment integration (checkout + webhooks), Prisma with 5-table schema (User, Subscription, Invoice, Feature, Usage)
- **Hours 8-16:** Add admin dashboard (user list, revenue chart, feature flags), email setup (Resend/SendGrid with templates), file upload (S3/Vercel Blob)
- **Hours 16-24:** Add Remix and SvelteKit equivalents with same features. Update docs with "Deploy in 5 minutes" guide.

**Deliverable:** `npx ultra-dex init --live --stack next15-saas` creates a working SaaS with login, payment, dashboard.

### Day 2 (24 hours): Test Coverage + LangChain Production

**Goal:** Hit 70% test coverage and make LangChain first-class.

- **Hours 0-12:** Write integration tests for all commands (init, generate, serve, swarm, github, cloud). Mock AI providers. Achieve 70% coverage.
- **Hours 12-18:** Remove dynamic imports from LangChain adapter. Bundle LangChain as core dependency. Pre-configure 5 chains (summarize, code-review, task-breakdown, RAG, memory).
- **Hours 18-24:** Add vector search command using @langchain/community + local embeddings fallback. Update swarm to use LangChain memory for context.

**Deliverable:** CI passes with 70%+ coverage. LangChain works out-of-box without optional dependencies.

---

## 7. "If I Were CEO" (Single Biggest Call)

### 🎯 THE CALL: **Make Live Scaffolds Production-Grade or Die**

**Why:** The #1 competitive threat is Devin/Bolt/Replit generating full apps in 60 seconds. Ultra-Dex's moat is "AI-agnostic orchestration with memory," but if users can't bootstrap a REAL app (with auth, payments, database) instantly, they'll churn to tools that do.

The current scaffolds are embarrassingly basic [0-cite-3](#0-cite-3) — a hello world page doesn't prove Ultra-Dex can "orchestrate production apps."

**Execution:**

1. Partner with 3 SaaS founders to extract their actual starter repos (with all the auth/payment/email plumbing)
2. Fork these into `cli/assets/live-templates/` with Ultra-Dex context files pre-generated
3. Demo video: "From idea to deployed SaaS in 10 minutes using Ultra-Dex + Claude + Cursor"

**Impact:** This transforms the value prop from "meta-layer for experts" to "fastest way to production SaaS with AI." Still keeps the orchestration core, but with a **killer entry point**.

---

## 8. The Meta Question

> **"Is Ultra-Dex the Kubernetes of AI coding — the orchestration layer everyone builds on?"**

### Answer: **YES, but in 2027, not 2026**

**Why YES:**

- **Unique Position Secured:** Nobody else owns "AI-agnostic memory and orchestration." Cursor/Devin/Claude are vertical tools. Ultra-Dex is horizontal infrastructure. [0-cite-4](#0-cite-4)
- **Technical Foundation is Solid:** MCP integration is real [0-cite-6](#0-cite-6) , multi-provider abstraction works [0-cite-33](#0-cite-33) , agent swarms execute [0-cite-1](#0-cite-1)
- **Network Effects Possible:** If teams standardize on Ultra-Dex context format (CONTEXT.md, IMPLEMENTATION-PLAN.md), AI tools must support it — creating lock-in

**Why Not 2026:**

- **Adoption Chicken-Egg:** Kubernetes succeeded because Docker needed orchestration. What creates the "must orchestrate AI tools" pain so severe that teams adopt Ultra-Dex? Currently it's voluntary.
- **Live Scaffold Gap:** Can't be infrastructure if the entry point is weak. Kubernetes had `kubectl run` — Ultra-Dex needs production-grade `init --live`.
- **Ecosystem Integrations Incomplete:** LangChain is adapter, not core. No Vercel AI SDK integration. No Replicate/Hugging Face support.

### What Accelerates This:

1. **Vertical SaaS Starters:** Ship 10 production templates (Next.js SaaS, Remix E-commerce, FastAPI API, etc.) so people start FROM Ultra-Dex
2. **AI Tool Plugins:** Get Cursor/Windsurf/Cline to bundle "Import from Ultra-Dex" button natively
3. **Team Plan with Shared Context:** Multi-user dashboard where distributed teams sync AI agent outputs — this is the killer enterprise feature
4. **Open Standard:** Publish "Ultra-Dex Context Format v1.0" as an open spec, get other tools to support reading/writing it

### Timeline:

- **Feb-Jun 2026:** Fix gaps (scaffolds, tests, integrations) — reach production readiness
- **Jul-Dec 2026:** Acquire 1,000 teams, iterate on workflows, build ecosystem
- **2027:** Become the standard — "All AI coding tools read Ultra-Dex format"

---

## Notes

**What Ultra-Dex Gets RIGHT:**

- The core insight is **profound and correct**: AI tools lose context across sessions, and nobody else is solving persistent memory at the orchestration layer
- The architecture is **genuinely 2026-modern**: MCP protocol, WebSocket streaming, provider abstraction, agent orchestration
- The positioning is **defensible**: Not competing with AI tools, enabling them

**What Needs Immediate Fix:**

- Live scaffolds must be production-grade SaaS templates, not hello world
- Test coverage must hit 70%+ for enterprise trust
- LangChain/ecosystem integrations should be core, not optional

**The Make-or-Break Moment:**
If Ultra-Dex ships production scaffolds in the next 48 hours and gets 100 teams using it by March, this becomes inevitable infrastructure. If it stays at "expert meta-layer" without mainstream entry point, it becomes niche tooling for consultants.

**Final Score: 7.8/10** — Strong thesis, solid foundation, needs execution sprint to become unstoppable.

### Citations

**File:** cli/lib/commands/serve.js (L58-225)

```javascript
async function startUnifiedKernel(portStr) {
  const port = Number.parseInt(portStr, 10);

  console.log(chalk.bold.hex('#7c3aed')('\n🚀 Opening Multiverse Portal (Infinity Kernel)...\n'));
  console.log(chalk.italic(chalk.gray(`"${getRandomMessage('loading')}"`)));

  // Initialize Graph
  console.log(chalk.gray('🧠 Linking Neural Interface (Code Graph)...'));
  try {
    await projectGraph.scan();
    console.log(chalk.green(`✅ Graph stabilized: ${projectGraph.nodes.size} nodes`));
  } catch (e) {
    console.log(chalk.yellow(`⚠️ Graph alignment failed: ${e.message}`));
  }

  const server = http.createServer(async (req, res) => {
    // CORS headers for local tools
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;

    try {
      // Dashboard UI
      if (pathname === '/' || pathname === '/dashboard') {
        const html = await getDashboardHTML();
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
        return;
      }

      // Endpoint: /api/info
      if (pathname === '/api/info') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify(
            {
              name: 'Ultra-Dex Multiverse Kernel',
              version: VERSION,
              status: 'online',
              endpoints: ['/api/state', '/api/plan', '/api/context', '/api/graph', '/api/swarm'],
            },
            null,
            2
          )
        );
        return;
      }

      // Endpoint: /api/graph
      if (pathname === '/api/graph' || pathname === '/graph') {
        const summary = projectGraph.getSummary();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(summary, null, 2));
        return;
      }

      // Endpoint: /api/state
      if (pathname === '/api/state' || pathname === '/state') {
        const state = await loadState();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(state, null, 2));
        return;
      }

      // Endpoint: /api/swarm (Execute Swarm)
      if ((pathname === '/api/swarm' || pathname === '/swarm') && req.method === 'POST') {
        let body = '';
        req.on('data', (chunk) => (body += chunk));
        req.on('end', async () => {
          try {
            const { task, feature, parallel } = JSON.parse(body);
            const objective = task || feature;
            if (!objective) throw new Error('Task/Feature objective is required');

            // Run swarm
            swarmCommand(objective, { parallel, dryRun: false }).catch((err) => console.error(err));

            res.writeHead(202, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'accepted', message: 'Swarm initiated' }));
          } catch (e) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: e.message }));
          }
        });
        return;
      }

      // Endpoint: /api/plan
      if (pathname === '/api/plan' || pathname === '/plan') {
        const state = await loadState();
        const markdown = generateMarkdown(state);
        res.writeHead(200, { 'Content-Type': 'text/markdown' });
        res.end(markdown);
        return;
      }

      // SSE Events for Dashboard
      if (pathname === '/events') {
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        });
        res.write(
          `data: ${JSON.stringify({ type: 'log', message: 'Connected to Multiverse Kernel' })}\n\n`
        );
        // We'd need to manage clients here if we wanted to push updates
        return;
      }

      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found in this timeline' }));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
  });

  // Use the singleton instance instead of creating new one
  const wss = webSocketServer;
  await wss.start({ port: 3002 });

  // Store watcher reference for cleanup
  let fileWatcher = null;

  server.listen(port, () => {
    console.log(chalk.green(`✅ Portal Stabilized at http://localhost:${port}`));
    console.log(chalk.gray(`   • Dashboard: http://localhost:${port}/`));
    console.log(chalk.gray(`   • MCP API:   http://localhost:${port}/api/info`));

    console.log(chalk.bold.hex('#dc2626')('\n🔌 Weapon Integration (IDE):'));
    console.log(chalk.white('   Cursor IDE: '));
    console.log(chalk.cyan(`     URL: http://localhost:${port}/api/info`));
    console.log(chalk.white('   Claude Desktop:'));
    console.log(chalk.cyan(`     Run "ultra-dex config --mcp" to register.`));

    // Auto-Pilot with proper cleanup
    fileWatcher = fs.watch(process.cwd(), { recursive: true }, async (eventType, filename) => {
      if (
        !filename ||
        filename.includes('node_modules') ||
        filename.includes('.git') ||
        filename.includes('IMPLEMENTATION-PLAN.md')
      )
        return;

      console.log(chalk.gray(`\n🔄 Timeline Shift detected in ${filename}. Synchronizing...`));
      try {
        const state = await loadState();
        if (state) {
          const markdown = generateMarkdown(state);
          await fs.writeFile(path.resolve(process.cwd(), 'IMPLEMENTATION-PLAN.md'), markdown);
          // Broadcast state update to all connected clients
          wss.broadcast({ type: 'state_update', data: state, timestamp: new Date().toISOString() });
        }
      } catch (e) {}
    });
  });

  // Cleanup on process exit
  const cleanup = () => {
    if (fileWatcher) {
      fileWatcher.close();
      fileWatcher = null;
    }
    wss.stop();
    server.close();
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}
```

**File:** cli/lib/commands/swarm.js (L26-42)

```javascript
async function withStateLock(callback) {
  const lockFile = join(process.cwd(), '.ultra-dex', 'state.lock');
  let retries = 0;
  while (existsSync(lockFile) && retries < 50) {
    await new Promise((r) => setTimeout(r, 100));
    retries++;
  }

  try {
    await writeFile(lockFile, String(Date.now()));
    return await callback();
  } finally {
    if (existsSync(lockFile)) {
      await unlink(lockFile).catch(() => {});
    }
  }
}
```

**File:** cli/lib/commands/swarm.js (L118-277)

```javascript
export async function swarmCommand(task, options) {
  renderer.clearScreen();
  await renderer.text(`**🐝 Ultra-Dex Swarm Mode**\nTask: "${task}"`);

  const startTime = Date.now();

  if (options.dryRun) {
    const pipelineInfo = options.parallel
      ? [
          '📦 Tier: 1-Planning (sequential)',
          '  1. @planner - Break down task into steps',
          '  2. @cto - Define architecture',
          '',
          '📦 Tier: 2-Implementation (PARALLEL)',
          '  3. @database - Design schema',
          '  4. @backend - Implement API',
          '  5. @frontend - Build UI',
          '',
          '📦 Tier: 3-Security (sequential)',
          '  6. @auth - Security & authentication review',
          '',
          '📦 Tier: 4-Quality (sequential)',
          '  7. @testing - Write tests',
          '  8. @reviewer - Code review',
        ].join('\n')
      : AGENT_PIPELINE.map((a, i) => `${i + 1}. @${a.name} - ${a.description}`).join('\n');

    renderer.box(
      pipelineInfo,
      options.parallel ? 'Dry Run Pipeline (Parallel Mode)' : 'Dry Run Pipeline',
      'info'
    );
    return;
  }

  // Load context & Graph
  const contextPath = join(process.cwd(), 'CONTEXT.md');
  const planPath = join(process.cwd(), 'IMPLEMENTATION-PLAN.md');

  let context = '';
  if (existsSync(contextPath)) context += await readFile(contextPath, 'utf-8');
  if (existsSync(planPath)) context += '\n\n' + (await readFile(planPath, 'utf-8'));

  // Inject Code Graph
  renderer.startSpinner('Scanning Codebase Graph...');
  try {
    const graphSummary = await projectGraph.scan();
    context += `\n\n## Codebase Graph Summary\n- Total Files: ${graphSummary.nodeCount}\n- Total Dependencies: ${graphSummary.edgeCount}\n`;
    renderer.succeed(`Codebase mapped: ${graphSummary.nodeCount} nodes`);
  } catch (e) {
    renderer.fail('Graph scan failed, using limited context.');
  }

  // Get AI provider
  const provider = getProvider();
  if (!provider) {
    renderer.fail('No AI provider configured.');
    renderer.box(
      `export ANTHROPIC_API_KEY=sk-ant-...\nexport OPENAI_API_KEY=sk-...\nollama serve`,
      'Configuration Required',
      'error'
    );
    return;
  }

  const logDir = await ensureLogDirectory();

  await withStateLock(async () => {
    const state = (await loadState()) || {
      project: { mode: 'ULTRA_MODE' },
      agents: { active: [] },
    };
    state.agents = state.agents || { active: [] };
    state.updatedAt = new Date().toISOString();
    await saveState(state);
  });

  let previousOutput = '';
  const agentResults = [];
  const agentTimings = {};

  const executionTiers = options.parallel
    ? [
        {
          name: '1-Planning',
          agents: AGENT_PIPELINE.filter((a) => a.tier === '1-planning'),
          parallel: false,
        },
        {
          name: '2-Implementation',
          agents: AGENT_PIPELINE.filter((a) => a.tier === '2-implementation'),
          parallel: true,
        },
        {
          name: '3-Security',
          agents: AGENT_PIPELINE.filter((a) => a.tier === '3-security'),
          parallel: false,
        },
        {
          name: '4-Quality',
          agents: AGENT_PIPELINE.filter((a) => a.tier === '4-quality'),
          parallel: false,
        },
      ]
    : [{ name: 'All', agents: AGENT_PIPELINE, parallel: false }];

  for (const tier of executionTiers) {
    if (tier.agents.length === 0) continue;

    console.log(theme.dim(`\n📦 Tier: ${tier.name}`));

    if (tier.parallel) {
      // Parallel Execution
      const promises = tier.agents.map(async (agent) => {
        const agentStart = Date.now();
        // Use a generic spinner since parallel spinners are messy in terminal
        console.log(theme.accent(`  ⟳ Running @${agent.name}...`));

        try {
          const result = await runAgent(agent, task, context, previousOutput, provider);
          const duration = Date.now() - agentStart;
          agentTimings[agent.name] = duration;
          console.log(theme.success(`  ✓ @${agent.name} complete (${duration}ms)`));
          return { agent: agent.name, result, success: true };
        } catch (error) {
          console.log(theme.error(`  ✖ @${agent.name} failed: ${error.message}`));
          return { agent: agent.name, error: error.message, success: false };
        }
      });

      const results = await Promise.all(promises);
      agentResults.push(...results);
      previousOutput +=
        '\n\n' +
        results
          .filter((r) => r.success)
          .map((r) => r.result)
          .join('\n\n');
    } else {
      // Serial Execution
      for (const agent of tier.agents) {
        const agentStart = Date.now();
        renderer.startSpinner(`Agent @${agent.name} is working...`);

        try {
          const result = await runAgent(agent, task, context, previousOutput, provider);
          const duration = Date.now() - agentStart;
          agentTimings[agent.name] = duration;
          previousOutput = result;
          renderer.succeed(`@${agent.name} complete (${duration}ms)`);

          // Stream a preview of the output
          const preview = result.slice(0, 150).replace(/\n/g, ' ') + '...';
          console.log(theme.dim(`    › ${preview}`));

          agentResults.push({ agent: agent.name, result, success: true });
        } catch (error) {
          renderer.fail(`@${agent.name} failed: ${error.message}`);
          agentResults.push({ agent: agent.name, error: error.message, success: false });
          break;
        }
      }
    }
  }

  const totalDuration = Date.now() - startTime;
  const successCount = agentResults.filter((r) => r.success).length;
  const failCount = agentResults.filter((r) => !r.success).length;

  await updateStateFile();

  const stats = {
    totalDuration,
    agentTimings,
    successCount,
    failCount,
    parallel: options.parallel || false,
  };
  const logPath = await writeSwarmLog(logDir, task, agentResults, stats);

  renderer.divider();
  await renderer.text(`**Execution Complete**\nTotal time: ${totalDuration}ms`);
  renderer.box(
    `Succeeded: ${successCount}  Failed: ${failCount}\nLog saved: ${logPath}`,
    'Stats',
    failCount > 0 ? 'error' : 'success'
  );
}
```

**File:** cli/lib/commands/generate.js (L94-117)

```javascript
      try {
        let result;
        let planContent = '';

        if (options.stream) {
          spinner.stop();
          console.log(chalk.cyan('📝 Manifesting Reality:\n'));
          console.log(chalk.gray('─'.repeat(60)));

          result = await provider.generateStream(
            SYSTEM_PROMPT,
            generateUserPrompt(idea),
            (chunk) => {
              process.stdout.write(chunk);
              planContent += chunk;
            }
          );

          console.log(chalk.gray('\n' + '─'.repeat(60)));
        } else {
          result = await provider.generate(SYSTEM_PROMPT, generateUserPrompt(idea));
          planContent = result.content;
          spinner.succeed('Plan generated!');
        }
```

**File:** cli/assets/live-templates/next15-prisma-clerk/app/page.tsx (L1-8)

```typescript
export default function HomePage() {
  return (
    <main style={{ padding: 32 }}>
      <h1>Ultra-Dex Live Scaffold</h1>
      <p>Next.js 15 + Prisma + Clerk starter.</p>
    </main>
  );
}
```

**File:** README.md (L22-32)

```markdown
## 🧠 Core Philosophy: "Your Skeleton, Not Your Cage"

Ultra-Dex is a **meta-orchestration layer** - it doesn't write code for you, it makes your AI assistants dramatically smarter by giving them structure, memory, and architectural context.

| Principle                      | What It Means                                     |
| ------------------------------ | ------------------------------------------------- |
| ✅ **AI-Agnostic**             | Works with Claude, GPT, Gemini, Cursor, Copilot   |
| ✅ **Comprehensive by Design** | 34 sections prevent "forgot to plan X" syndrome   |
| ✅ **100% Flexible**           | Add, remove, modify any section to fit your needs |
| ✅ **Production-Grade**        | Not for MVPs - for real, scalable applications    |
```

**File:** README.md (L169-180)

````markdown
```bash
cd vscode-extension
npm install
npm run compile
```
````

- Press `F5` to launch the Extension Development Host.
- Run **Ultra-Dex: Select Agent** from the command palette.

Local-only extension (not published). More: **[vscode-extension/README.md](./vscode-extension/README.md)**.

````

**File:** cli/lib/providers/index.js (L12-145)
```javascript
const PROVIDERS = {
  claude: {
    class: ClaudeProvider,
    envKey: 'ANTHROPIC_API_KEY',
    name: 'Claude (Anthropic)',
  },
  openai: {
    class: OpenAIProvider,
    envKey: 'OPENAI_API_KEY',
    name: 'OpenAI',
  },
  gemini: {
    class: GeminiProvider,
    envKey: 'GOOGLE_AI_KEY',
    name: 'Google Gemini',
  },
  ollama: {
    class: OllamaProvider,
    envKey: 'OLLAMA_HOST', // Optional
    name: 'Ollama (Local)',
  },
  router: {
    class: RouterProvider,
    name: 'Semantic Router (Hybrid)',
  }
};

/**
 * Get the list of available providers
 * @returns {Array<{id: string, name: string, envKey: string}>}
 */
export function getAvailableProviders() {
  return Object.entries(PROVIDERS).map(([id, config]) => ({
    id,
    name: config.name,
    envKey: config.envKey,
  }));
}

/**
 * Create an AI provider instance
 * @param {string} providerId - Provider identifier (claude, openai, gemini, ollama, router)
 * @param {Object} options - Provider options
 * @param {string} options.apiKey - API key (optional, will use env var if not provided)
 * @param {string} options.model - Model to use (optional)
 * @returns {BaseProvider}
 */
export function createProvider(providerId, options = {}) {
  if (providerId === 'router') {
    const cloudId = options.cloudProvider || getDefaultProvider() || 'claude';
    const cloudProvider = createProvider(cloudId, options);

    let localProvider = null;
    try {
      localProvider = new OllamaProvider(null, options);
    } catch (e) {
      // Local not available
    }

    return new RouterProvider(null, {
      ...options,
      cloudProvider,
      localProvider
    });
  }

  const providerConfig = PROVIDERS[providerId];

  if (!providerConfig) {
    throw new Error(`Unknown provider: ${providerId}. Available: ${Object.keys(PROVIDERS).join(', ')}`);
  }

  // Get API key from options or environment (Ollama doesn't strictly need one)
  const apiKey = options.apiKey || (providerConfig.envKey ? process.env[providerConfig.envKey] : null);

  if (!apiKey && providerId !== 'ollama') {
    throw new Error(
      `API key not found for ${providerConfig.name}.\n\n` +
      `To fix this, either:\n` +
      `  1. Set ${providerConfig.envKey} environment variable:\n` +
      `     export ${providerConfig.envKey}=your-key-here\n\n` +
      `  2. Pass the key directly:\n` +
      `     ultra-dex generate "idea" --key your-key-here\n\n` +
      `  3. Use Ollama for local AI (no key needed):\n` +
      `     ultra-dex generate "idea" --provider ollama`
    );
  }

  return new providerConfig.class(apiKey, options);
}

/**
 * Get the default provider based on available API keys
 * @returns {string|null} Provider ID or null if none available
 */
export function getDefaultProvider() {
  if (process.env.ULTRA_DEX_DEFAULT_PROVIDER) return process.env.ULTRA_DEX_DEFAULT_PROVIDER;

  // Check environment variables in order of preference
  if (process.env.ANTHROPIC_API_KEY) return 'claude';
  if (process.env.OPENAI_API_KEY) return 'openai';
  if (process.env.GOOGLE_AI_KEY) return 'gemini';
  return null;
}

/**
 * Check which providers have API keys configured
 * @returns {Array<{id: string, name: string, configured: boolean}>}
 */
export function checkConfiguredProviders() {
  return Object.entries(PROVIDERS).map(([id, config]) => ({
    id,
    name: config.name,
    envKey: config.envKey,
    configured: !!process.env[config.envKey],
  }));
}

/**
 * Get a default configured provider instance
 * @returns {BaseProvider|null}
 */
export function getProvider() {
  const id = getDefaultProvider();
  if (!id) return null;
  try {
    return createProvider(id);
  } catch (e) {
    return null;
  }
}

// Core providers
export { ClaudeProvider, OpenAIProvider, GeminiProvider, OllamaProvider, RouterProvider };
````

**File:** cli/lib/mcp/server.js (L1-53)

```javascript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerResources } from './resources.js';
import { registerTools } from './tools.js';
import { projectGraph } from './graph.js';
import { webSocketServer } from './websocket.js';
import { VERSION } from '../utils/version.js';

export async function startMcpServer(options = {}) {
  const port = options.port || 3001;

  // Initialize Graph
  console.error('Initializing Ultra-Dex Active Kernel...');
  try {
    await projectGraph.scan();
    console.error(
      `Graph loaded: ${projectGraph.nodes.size} nodes, ${projectGraph.edges.length} edges.`
    );
  } catch (e) {
    console.error('Graph initialization warning:', e.message);
  }

  // Create server instance
  const server = new McpServer({
    name: 'Ultra-Dex Active Kernel',
    version: VERSION,
  });

  // Register features
  registerResources(server);
  registerTools(server);

  // Start WebSocket server for real-time updates
  try {
    await webSocketServer.start({ port: 3002 });
    console.error('WebSocket server started on port 3002');
  } catch (error) {
    console.error('Failed to start WebSocket server:', error.message);
  }

  // Connect transport
  if (options.transport === 'http') {
    const transport = new HttpServerTransport({ port });
    await server.connect(transport);
    console.error(`Ultra-Dex MCP Server running on HTTP port ${port}...`);
  } else {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Ultra-Dex MCP Server running on Stdio...');
  }

  // Note: Stdio transport takes over stdin/stdout, so no logging to console.log here!
  // Any logging must go to stderr
  console.error('Ultra-Dex Active Kernel initialized with MCP + WebSocket...');
}
```

**File:** docs/MCP-INTEGRATION.md (L1-100)

````markdown
# Ultra-Dex MCP Integration Guide

> **Model Context Protocol (MCP)** is the open standard that connects AI assistants to your systems. Ultra-Dex provides a native MCP server ("Active Kernel") that allows tools like **Claude Desktop** and **Cursor** to read your project context, execute agents, and monitor state directly.

---

## 🚀 1. Setup for Claude Desktop

Claude Desktop can connect directly to your local Ultra-Dex project, giving it "God Mode" access to your plans, code graph, and CLI agents.

### Automatic Setup (Recommended)

Run this command in your project root:

```bash
npx ultra-dex config --mcp
```
````

This will generate the configuration and output the path to your Claude Desktop config file.

### Manual Setup

Add this to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "ultra-dex": {
      "command": "npx",
      "args": ["ultra-dex", "serve"],
      "cwd": "/absolute/path/to/your/project"
    }
  }
}
```

### Verification

1. Restart Claude Desktop.
2. Look for the 🔌 icon (Project Connection).
3. Ask Claude: _"What is the current status of the project plan?"_

---

## 🖱️ 2. Setup for Cursor / Windsurf

Cursor can use the Ultra-Dex "Active Kernel" via MCP or by consuming the generated context files.

### Option A: Direct Context (Simple)

Ultra-Dex maintains `CONTEXT.md` and `IMPLEMENTATION-PLAN.md` as the single source of truth.

1. Run `npx ultra-dex watch` in a terminal.
2. In Cursor, type `@CONTEXT.md` to reference the project state.

### Option B: Rule Integration

Generate AI-optimized rules for Cursor:

```bash
npx ultra-dex config --cursor
```

This creates `.cursor/rules/ultra-dex.mdc` which teaches Cursor how to follow your implementation plan.

---

## 🔌 3. WebSocket Protocol (For Custom Clients)

You can build your own tools that connect to the Ultra-Dex Kernel.

**Endpoint:** `ws://localhost:3001/stream`

### Message Types

#### `connected`

Sent immediately upon connection.

```json
{ "type": "connected", "timestamp": 1709238492000 }
```

#### `state_update`

Broadcast when file watcher detects changes.

```json
{
  "type": "state_update",
  "data": {
    "project": { "name": "MyApp", "version": "0.1.0" },
    "phases": [...]
  }
}
```

#### `log`

Real-time system logs from the CLI.

```json
{ "type": "log", "message": "Build started", "level": "info" }
```

#### `agent_status`

Live updates on agent activity.

```json
{
  "type": "agent_status",
  "agent": "backend",
  "status": "working",
  "activity": "Generating API routes..."
}
```

````

**File:** cli/lib/commands/github.js (L61-85)
```javascript
async function checkGitHubCLI() {
  try {
    await execAsync('gh --version');
    const { stdout } = await execAsync('gh auth status 2>&1');
    return { installed: true, authenticated: stdout.includes('Logged in') };
  } catch (err) {
    if (err.message.includes('not found')) {
      return { installed: false, authenticated: false };
    }
    // gh auth status returns non-zero if not authenticated
    return { installed: true, authenticated: false };
  }
}

/**
 * Get current repository info
 */
async function getRepoInfo() {
  try {
    const { stdout } = await execAsync('gh repo view --json owner,name,url');
    return JSON.parse(stdout);
  } catch {
    return null;
  }
}
````

**File:** cli/lib/commands/github.js (L237-270)

```javascript
/**
 * Create PR from swarm output
 */
async function createPRFromSwarm(swarmResult, options = {}) {
  const { branch = null, title = null, draft = true } = options;

  // Generate branch name
  const branchName = branch || `ultra-dex/${Date.now()}`;

  // Create branch
  await execAsync(`git checkout -b ${branchName}`);

  // Stage all changes
  await execAsync('git add -A');

  // Commit
  const commitMsg = swarmResult.goal || 'Ultra-Dex agent swarm implementation';
  await execAsync(`git commit -m "${commitMsg}"`);

  // Push
  await execAsync(`git push -u origin ${branchName}`);

  // Generate PR body
  const prBody = GITHUB_CONFIG.prTemplate
    .replace('{summary}', swarmResult.goal || 'Automated implementation')
    .replace('{changes}', swarmResult.artifacts?.join('\n- ') || 'See commits for details')
    .replace('{testing}', '- [ ] Manual testing\n- [ ] Automated tests pass');

  // Create PR
  const prTitle = title || `🤖 ${commitMsg}`;
  const prUrl = await createPullRequest(prTitle, prBody, { head: branchName, draft });

  return { branch: branchName, prUrl };
}
```

**File:** cli/lib/commands/github.js (L311-464)

```javascript
export function registerGitHubCommand(program) {
  program
    .command('github')
    .description('GitHub integration for issues, PRs, and CI/CD')
    .option('--sync', 'Sync GitHub issues to local tasks')
    .option('--issues', 'List open issues')
    .option('--prs', 'List open pull requests')
    .option('--create-issue <title>', 'Create a new issue')
    .option('--create-pr', 'Create PR from current changes')
    .option('--status', 'Check GitHub CLI status')
    .option('--labels <labels>', 'Filter by labels (comma-separated)')
    .option('--draft', 'Create PR as draft')
    .action(async (options) => {
      console.log(chalk.cyan('\n🐙 Ultra-Dex GitHub Integration\n'));

      // Check GitHub CLI
      const spinner = ora('Checking GitHub CLI...').start();
      const ghStatus = await checkGitHubCLI();

      if (!ghStatus.installed) {
        spinner.fail('GitHub CLI (gh) not installed');
        console.log(chalk.yellow('\nInstall: https://cli.github.com/'));
        return;
      }

      if (!ghStatus.authenticated) {
        spinner.fail('Not authenticated with GitHub');
        console.log(chalk.yellow('\nRun: gh auth login'));
        return;
      }

      spinner.succeed('GitHub CLI ready');

      // Get repo info
      const repo = await getRepoInfo();
      if (!repo) {
        console.log(chalk.yellow('\n⚠️  Not in a GitHub repository'));
        return;
      }

      console.log(chalk.gray(`Repository: ${repo.owner.login}/${repo.name}\n`));

      try {
        if (options.status) {
          // Just show status (already done above)
          console.log(chalk.green('✅ GitHub integration active'));
          return;
        }

        if (options.issues) {
          // List issues
          spinner.start('Fetching issues...');
          const labelFilter = options.labels?.split(',') || [];
          const issues = await listIssues({ labels: labelFilter });
          spinner.succeed(`Found ${issues.length} open issues\n`);

          if (issues.length === 0) {
            console.log(chalk.gray('No open issues found.'));
            return;
          }

          for (const issue of issues) {
            const labels = (issue.labels || []).map((l) => chalk.cyan(`[${l.name}]`)).join(' ');
            console.log(`#${chalk.bold(issue.number)} ${issue.title} ${labels}`);
          }
          return;
        }

        if (options.prs) {
          // List PRs
          spinner.start('Fetching pull requests...');
          const prs = await listPRs();
          spinner.succeed(`Found ${prs.length} open PRs\n`);

          for (const pr of prs) {
            console.log(
              `#${chalk.bold(pr.number)} ${pr.title} ${chalk.gray(`(${pr.headRefName})`)}`
            );
          }
          return;
        }

        if (options.sync) {
          // Sync issues to tasks
          spinner.start('Syncing issues to tasks...');
          const result = await syncIssuesToTasks();
          spinner.succeed(`Synced ${result.all.length} issues (${result.new.length} new)\n`);

          if (result.new.length > 0) {
            console.log(chalk.bold('New tasks:'));
            for (const task of result.new) {
              console.log(`  ${task.agent} #${task.issueNumber}: ${task.title}`);
            }
          }
          return;
        }

        if (options.createIssue) {
          // Create issue
          const { body } = await inquirer.prompt([
            {
              type: 'editor',
              name: 'body',
              message: 'Issue description:',
            },
          ]);

          spinner.start('Creating issue...');
          const url = await createIssue(options.createIssue, body);
          spinner.succeed(`Issue created: ${url}`);
          return;
        }

        if (options.createPr) {
          // Create PR from current changes
          const { title, description } = await inquirer.prompt([
            { type: 'input', name: 'title', message: 'PR title:' },
            { type: 'editor', name: 'description', message: 'PR description:' },
          ]);

          spinner.start('Creating pull request...');

          const prBody = GITHUB_CONFIG.prTemplate
            .replace('{summary}', description)
            .replace('{changes}', 'See commits for details')
            .replace('{testing}', '- [ ] Tests pass\n- [ ] Manual testing');

          const url = await createPullRequest(title, prBody, { draft: options.draft });
          spinner.succeed(`Pull request created: ${url}`);
          return;
        }

        // Default: show menu
        const { action } = await inquirer.prompt([
          {
            type: 'list',
            name: 'action',
            message: 'What would you like to do?',
            choices: [
              { name: '📋 List open issues', value: 'issues' },
              { name: '🔀 List open PRs', value: 'prs' },
              { name: '🔄 Sync issues to tasks', value: 'sync' },
              { name: '➕ Create new issue', value: 'create-issue' },
              { name: '🚀 Create PR from changes', value: 'create-pr' },
              { name: '❌ Cancel', value: 'cancel' },
            ],
          },
        ]);

        // Recurse with selected action
        if (action !== 'cancel') {
          const newOptions = { ...options, [action.replace('-', '')]: true };
          await registerGitHubCommand(program).action(newOptions);
        }
      } catch (err) {
        spinner.fail(`Failed: ${err.message}`);
      }
    });
}
```

**File:** cli/lib/providers/langchain.js (L59-86)

```javascript
  async initialize() {
    if (this.langchain) return;

    try {
      // Dynamic import for optional dependency
      const langchainCore = await import('@langchain/core');
      const langchainOpenAI = await import('@langchain/openai');

      this.langchain = {
        ChatOpenAI: langchainOpenAI.ChatOpenAI,
        HumanMessage: langchainCore.HumanMessage,
        SystemMessage: langchainCore.SystemMessage,
        AIMessage: langchainCore.AIMessage,
      };

      this.llm = new this.langchain.ChatOpenAI({
        modelName: this.model,
        temperature: this.temperature,
        maxTokens: this.maxTokens,
        openAIApiKey: this.apiKey,
        streaming: true,
      });
    } catch (error) {
      throw new Error(
        'LangChain not installed. Run: npm install @langchain/core @langchain/openai'
      );
    }
  }
```

**File:** agents/00-AGENT_INDEX.md (L1-166)

```markdown
# Ultra-Dex Agent Index

Quick reference for all 17 production agents organized by tier.

---

## 0. Meta Orchestration

| Agent                  | Role                                        | When to Use                                | File                                                           |
| ---------------------- | ------------------------------------------- | ------------------------------------------ | -------------------------------------------------------------- |
| **@Meta-Orchestrator** | High-level system coordination & strategy   | Complex multi-repo or multi-phase projects | [meta-orchestrator.md](./0-orchestration/meta-orchestrator.md) |
| **@Orchestrator**      | Coordinate all agents for complete features | Building features that span multiple tiers | [orchestrator.md](./0-orchestration/orchestrator.md)           |

---

## 1. Leadership Tier

Strategic planning and technology decisions.

| Agent         | Role                                | When to Use                                  | File                                      |
| ------------- | ----------------------------------- | -------------------------------------------- | ----------------------------------------- |
| **@CTO**      | Architecture & tech stack decisions | Major features, system design, stack choices | [cto.md](./1-leadership/cto.md)           |
| **@Planner**  | Task breakdown & sprint planning    | Starting any feature, breaking down work     | [planner.md](./1-leadership/planner.md)   |
| **@Research** | Technology evaluation & comparison  | Choosing frameworks, libraries, approaches   | [research.md](./1-leadership/research.md) |

---

## 2. Development Tier

Core implementation of features.

| Agent         | Role                               | When to Use                            | File                                       |
| ------------- | ---------------------------------- | -------------------------------------- | ------------------------------------------ |
| **@Backend**  | API & server implementation        | Building endpoints, business logic     | [backend.md](./2-development/backend.md)   |
| **@Database** | Schema design & query optimization | Database changes, migrations           | [database.md](./2-development/database.md) |
| **@Frontend** | UI & component implementation      | Building pages, components, user flows | [frontend.md](./2-development/frontend.md) |

---

## 3. Security Tier

Authentication, authorization, and security audits.

| Agent         | Role                                  | When to Use                         | File                                    |
| ------------- | ------------------------------------- | ----------------------------------- | --------------------------------------- |
| **@Auth**     | Authentication & authorization        | Login, permissions, user management | [auth.md](./3-security/auth.md)         |
| **@Security** | Security audits & vulnerability fixes | Before deployment, security reviews | [security.md](./3-security/security.md) |

---

## 4. DevOps Tier

Deployment and infrastructure management.

| Agent       | Role                        | When to Use                   | File                              |
| ----------- | --------------------------- | ----------------------------- | --------------------------------- |
| **@DevOps** | Deployment & infrastructure | Shipping to production, CI/CD | [devops.md](./4-devops/devops.md) |

---

## 5. Quality Tier

Testing, debugging, and code review.

| Agent              | Role                                 | When to Use                              | File                                             |
| ------------------ | ------------------------------------ | ---------------------------------------- | ------------------------------------------------ |
| **@Debugger**      | Bug investigation & fixes            | When something breaks, troubleshooting   | [debugger.md](./5-quality/debugger.md)           |
| **@Documentation** | Technical writing & docs maintenance | Updating docs, API documentation, guides | [documentation.md](./5-quality/documentation.md) |
| **@Reviewer**      | Code review & quality checks         | Before merging, final approval           | [reviewer.md](./5-quality/reviewer.md)           |
| **@Testing**       | QA & test automation                 | Writing tests, ensuring coverage         | [testing.md](./5-quality/testing.md)             |

---

## 6. Specialist Tier

Advanced optimization and code improvement.

| Agent            | Role                           | When to Use                           | File                                            |
| ---------------- | ------------------------------ | ------------------------------------- | ----------------------------------------------- |
| **@Performance** | Performance optimization       | Slow pages/APIs, optimization needed  | [performance.md](./6-specialist/performance.md) |
| **@Refactoring** | Code quality & design patterns | Cleaning up code, reducing complexity | [refactoring.md](./6-specialist/refactoring.md) |

---

## Agent → Template Section Map

| Agent                  | Primary Template Sections | Supporting Sections |
| ---------------------- | ------------------------- | ------------------- |
| **@Planner**           | 1, 2, 16, 18              | 17, 23              |
| **@CTO**               | 12, 15, 19                | 21, 22              |
| **@Research**          | 15, 29, 30                | 25, 26              |
| **@Backend**           | 11, 13                    | 9, 27               |
| **@Database**          | 10                        | 11, 21              |
| **@Frontend**          | 6, 7, 9                   | 8, 14               |
| **@Auth**              | 11                        | 21, 27              |
| **@Security**          | 21, 28                    | 27, 22              |
| **@DevOps**            | 19, 20                    | 18, 24              |
| **@Testing**           | 20                        | 16, 27              |
| **@Reviewer**          | 20, 21                    | 17, 27              |
| **@Debugger**          | 27                        | 13, 20              |
| **@Documentation**     | 24                        | 18, 22              |
| **@Performance**       | 21, 22                    | 27, 32              |
| **@Refactoring**       | 16, 17                    | 13, 22              |
| **@Orchestrator**      | 16, 18                    | 12, 24              |
| **@Meta-Orchestrator** | 1, 2, 26, 34              | 12, 20, 24          |

---

## Quick Selection Guide

**Starting a new feature?**
→ @Planner (break it down) → @CTO (architecture)

**Building the API?**
→ @Backend + @Database

**Building the UI?**
→ @Frontend

**Security concerns?**
→ @Auth (implementation) + @Security (audit)

**Ready to deploy?**
→ @Testing → @Reviewer → @DevOps

**Performance issues?**
→ @Performance

**Code needs cleanup?**
→ @Refactoring

**Something broken?**
→ @Debugger

**Technology choice?**
→ @Research

**Documentation outdated?**
→ @Documentation

**Complex multi-repo orchestration?**
→ @Meta-Orchestrator

---

## Multi-Agent Orchestration

For complete multi-agent workflows and coordination patterns, see:

**Production Guides:**

- [Project Orchestration Guide](../guides/PROJECT-ORCHESTRATION.md) - Step-by-step multi-agent workflows
- [Advanced Workflows](../guides/ADVANCED-WORKFLOWS.md) - Stripe, emails, migrations, real-time features
- [Multi-Tool Workflow](../guides/MULTI-TOOL-WORKFLOW.md) - Coordinate Claude + Cursor + Copilot + ChatGPT
- [Custom Agents Guide](../guides/CUSTOM-AGENTS-GUIDE.md) - Create domain-specific agents for your SaaS

**Orchestration Examples:**

- [Orchestration Examples](../Orchestration/EXAMPLES.md) - Real-world multi-agent workflow examples
- [Orchestration README](../Orchestration/README.md) - Orchestration pattern overview

**Templates:**

- [Phase Tracker Template](../templates/PHASE-TRACKER-TEMPLATE.md) - Track progress by phase
- [Order Tracker Template](../templates/ORDER-TRACKER-TEMPLATE.md) - Step-by-step execution with copy-paste prompts
- [Master Plan Template](../templates/MASTER-PLAN-TEMPLATE.md) - Single-file project overview

**Decision Frameworks:**

- [Database Selection Guide](../guides/DATABASE-DECISION-FRAMEWORK.md) - PostgreSQL vs MongoDB vs MySQL
- [Architecture Patterns](../guides/ARCHITECTURE-PATTERNS.md) - Monolith to Microservices
- [AI Model Selection](../guides/AI-MODEL-SELECTION.md) - Choose the right AI for each task

---

_Ultra-Dex v3.4.3 - Professional AI Orchestration Meta Layer_
```

**File:** cursor-rules/00-ultra-dex-core.mdc (L1-1)

```text
# Ultra-Dex Core Rules
```

**File:** agents/2-development/backend.md (L1-516)

````markdown
# Backend Developer Agent

You are a senior backend developer working on this project. You build APIs, implement server logic, handle database operations, and integrate external services.

## Your Context

Before responding, read these files to understand the project:

- `IMPLEMENTATION-PLAN.md` - Full project specification (focus on Sections 5-8, 12, 15)
- `CONTEXT.md` - Project background
- `.cursor/rules/` - Coding patterns and standards (if available)

## Your Responsibilities

### API Development

- Build RESTful API endpoints per Section 6 of the plan
- Implement request validation and error handling
- Follow API naming conventions and versioning
- Document endpoints with clear request/response examples

### Database Operations

- Write efficient database queries
- Implement data access patterns per Section 5
- Handle transactions and data integrity
- Optimize query performance

### Business Logic

- Implement core business rules
- Handle edge cases and validation
- Write reusable service functions
- Keep controllers thin, services thick

### Integrations

- Connect to external APIs (payments, email, etc.)
- Implement webhooks and callbacks
- Handle API rate limits and retries
- Secure API keys and credentials

## How You Work

1. **Check the plan first** - Reference IMPLEMENTATION-PLAN.md for specifications
2. **Follow existing patterns** - Match the codebase style
3. **Write tests** - Cover critical paths and edge cases
4. **Handle errors gracefully** - Per Section 15 error handling patterns
5. **Think about security** - Validate inputs, sanitize outputs

## Code Standards

- Use TypeScript for type safety
- Follow the project's naming conventions
- Add JSDoc comments for public functions
- Keep functions small and focused
- Use dependency injection where appropriate

---

## Code Examples

### REST API Endpoint (Next.js App Router)

```typescript
// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema
const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
});

// GET /api/users - List users with pagination
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const skip = (page - 1) * limit;

  try {
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: { id: true, email: true, name: true, createdAt: true },
      }),
      prisma.user.count(),
    ]);

    return NextResponse.json({
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// POST /api/users - Create user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createUserSchema.parse(body);

    const user = await prisma.user.create({
      data: validated,
      select: { id: true, email: true, name: true, createdAt: true },
    });

    return NextResponse.json({ data: user }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Failed to create user:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
```
````

### Express.js API Endpoint (Task Creation)

```typescript
// src/routes/tasks.ts
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

const router = Router();
const createTaskSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
});

router.post('/tasks', async (req: Request, res: Response) => {
  try {
    const data = createTaskSchema.parse(req.body);
    const task = await prisma.task.create({
      data: { ...data, userId: req.user.id },
    });
    res.status(201).json(task);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ errors: error.errors });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

export default router;
```

### Prisma Query with Relations

```typescript
const userWithTasks = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    tasks: { orderBy: { createdAt: 'desc' }, take: 10 },
    profile: true,
  },
});
```

### REST API Endpoint (FastAPI + SQLAlchemy)

```python
# app/api/users.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import User

router = APIRouter(prefix="/api/users", tags=["users"])

class UserCreate(BaseModel):
    email: EmailStr
    name: str

@router.get("")
def list_users(db: Session = Depends(get_db), page: int = 1, limit: int = 10):
    offset = (page - 1) * limit
    users = db.query(User).order_by(User.created_at.desc()).offset(offset).limit(limit).all()
    return {"data": users, "pagination": {"page": page, "limit": limit}}

@router.post("", status_code=201)
def create_user(payload: UserCreate, db: Session = Depends(get_db)):
    exists = db.query(User).filter(User.email == payload.email).first()
    if exists:
        raise HTTPException(status_code=409, detail="Resource already exists")
    user = User(email=payload.email, name=payload.name)
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"data": user}
```

### Service Layer Pattern

```typescript
// lib/services/user.service.ts
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class UserService {
  /**
   * Get user by ID with related data
   */
  async getById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: { posts: true, profile: true },
    });
  }

  /**
   * Update user with validation
   */
  async update(id: string, data: Prisma.UserUpdateInput) {
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  /**
   * Soft delete user
   */
  async delete(id: string) {
    return prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Search users by email or name
   */
  async search(query: string, limit = 10) {
    return prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: query, mode: 'insensitive' } },
          { name: { contains: query, mode: 'insensitive' } },
        ],
        deletedAt: null,
      },
      take: limit,
    });
  }
}

export const userService = new UserService();
```

### Service Layer Pattern (FastAPI)

```python
# app/services/user_service.py
from datetime import datetime
from sqlalchemy.orm import Session
from app.models import User

class UserService:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, user_id: str):
        return self.db.query(User).filter(User.id == user_id).first()

    def update(self, user_id: str, data: dict):
        user = self.get_by_id(user_id)
        if not user:
            return None
        for key, value in data.items():
            setattr(user, key, value)
        self.db.commit()
        self.db.refresh(user)
        return user

    def soft_delete(self, user_id: str):
        user = self.get_by_id(user_id)
        if not user:
            return None
        user.deleted_at = datetime.utcnow()
        self.db.commit()
        return user
```

### Error Handling Middleware

```typescript
// lib/api/error-handler.ts
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function handleApiError(error: unknown) {
  // Validation errors
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: 'Validation failed', details: error.errors },
      { status: 400 }
    );
  }

  // Custom API errors
  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.statusCode }
    );
  }

  // Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Resource already exists' }, { status: 409 });
    }
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }
  }

  // Unknown errors
  console.error('Unhandled error:', error);
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}
```

### Webhook Handler (Stripe Example)

```typescript
// app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutComplete(session);
        break;
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  await prisma.order.update({
    where: { stripeSessionId: session.id },
    data: { status: 'paid', paidAt: new Date() },
  });
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  await prisma.subscription.update({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: subscription.status,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    },
  });
}
```

## Start By

1. Read IMPLEMENTATION-PLAN.md Sections 5-8
2. Check existing code structure
3. Ask: "What backend feature or API would you like me to build?"

## Example Tasks You Handle

- "Build the user registration API endpoint"
- "Implement the payment webhook handler"
- "Create the data export functionality"
- "Add pagination to the list endpoints"
- "Optimize the slow database query"

---

## Works With

### Request Review From

- **@CTO** - Architecture decisions, tech approach
- **@Auth** - Security review for sensitive endpoints
- **@Database** - Schema changes, query optimization

### Hand Off To

- **@Frontend** - When API is ready for integration
- **@Reviewer** - For code review before merging
- **@DevOps** - For deployment and environment setup

### Coordinate With

- **@Database** - On data models and queries
- **@Auth** - On authentication/authorization logic

---

## Quality Checklist

Before handing off API work, verify:

- [ ] API endpoints tested (unit + integration)
- [ ] Error handling implemented for all failure cases
- [ ] Database queries optimized (no N+1 problems)
- [ ] API documented (request/response examples)
- [ ] Input validation in place
- [ ] Authentication/authorization checks added
- [ ] Logging added for debugging
- [ ] Ready for frontend integration

---

## Handoff Protocol

When handing off API implementation to other agents, document in this format:

### Handoff from @Backend to @[NextAgent]

**Status:**

- ✅ Complete: [API endpoints implemented and tested]
- 🔄 In Progress: [Endpoints being refined]
- ⏳ Remaining: [Future API features]

**Deliverables:**

- API endpoints with routes and methods
- Request/response schemas
- Error handling implementation
- Database integration complete
- API documentation
- Integration/unit tests passing

**Context for Next Agent:**

- API base URL and authentication method
- Rate limiting rules
- CORS configuration
- Environment variables needed
- Key implementation decisions

**Next Action:**
@Frontend to integrate with API endpoints, or @Testing to write comprehensive test suite, or @Reviewer for code review before deployment.

---

_Ultra-Dex Backend Agent - Building robust server-side logic_

````

**File:** cli/lib/providers/claude.js (L23-51)
```javascript
export class ClaudeProvider extends BaseProvider {
  constructor(apiKey, options = {}) {
    super(apiKey, options);
    this.baseUrl = 'https://api.anthropic.com/v1';
    this.apiVersion = '2023-06-01';
  }

  getName() {
    return 'Claude (Anthropic)';
  }

  getDefaultModel() {
    return 'claude-sonnet-4-20250514';
  }

  getAvailableModels() {
    return MODELS;
  }

  estimateCost(inputTokens, outputTokens) {
    const pricing = PRICING[this.model] || PRICING['claude-sonnet-4-20250514'];
    const inputCost = (inputTokens / 1_000_000) * pricing.input;
    const outputCost = (outputTokens / 1_000_000) * pricing.output;
    return {
      input: inputCost,
      output: outputCost,
      total: inputCost + outputCost,
    };
  }
````

**File:** cli/test/README.md (L30-40)

```markdown
## Coverage Report

**Current Coverage: 41.27%** (target: 70%)

| Metric     | Current | Target |
| ---------- | ------- | ------ |
| Statements | 41.27%  | 70%    |
| Branches   | 78.7%   | 70%    |
| Functions  | 26.34%  | 70%    |
| Lines      | 41.27%  | 70%    |
```

**File:** cli/lib/nlp/router.js (L7-42)

```javascript
export function routeIntent(input) {
  if (!input) return null;

  const text = input.toLowerCase().trim();

  // Command Mapping Table
  const mappings = [
    {
      intent: 'init',
      keywords: ['init', 'new project', 'create project', 'start project', 'setup'],
    },
    { intent: 'generate', keywords: ['generate', 'plan', 'idea', 'blueprint', 'design'] },
    { intent: 'build', keywords: ['build', 'develop', 'implement', 'code', 'make'] },
    { intent: 'agents', keywords: ['agent', 'specialist', 'who', 'list agents', 'browse'] },
    { intent: 'swarm', keywords: ['swarm', 'pipeline', 'autonomous', 'workflow', 'auto'] },
    { intent: 'status', keywords: ['status', 'how is', 'progress', 'score', 'alignment'] },
    { intent: 'dashboard', keywords: ['dashboard', 'gui', 'web', 'monitor', 'visualize'] },
    { intent: 'doctor', keywords: ['doctor', 'health', 'fix system', 'check system', 'diagnose'] },
    { intent: 'help', keywords: ['help', 'what can', 'how to', 'commands', 'usage'] },
    { intent: 'audit', keywords: ['audit', 'security', 'review', 'check code'] },
    { intent: 'serve', keywords: ['serve', 'mcp', 'server', 'connect'] },
    { intent: 'exit', keywords: ['exit', 'quit', 'bye', 'stop', 'close'] },
  ];

  for (const mapping of mappings) {
    if (mapping.keywords.some((kw) => text.includes(kw))) {
      return mapping.intent;
    }
  }

  // Default: check for direct command names
  const directCommands = mappings.map((m) => m.intent);
  const firstWord = text.split(' ')[0];
  if (directCommands.includes(firstWord)) {
    return firstWord;
  }

  return null;
}
```

**File:** cli/lib/commands/init.js (L52-93)

```javascript
if (options.live) {
  const preset = options.stack || 'next15-prisma-clerk';
  if (!LIVE_STACKS[preset]) {
    console.log(chalk.red(`Unknown preset: ${preset}`));
    console.log(chalk.gray(`Available presets: ${Object.keys(LIVE_STACKS).join(', ')}`));
    process.exit(1);
  }

  const outputDir = path.resolve(options.dir);
  if (await pathExists(outputDir, 'dir')) {
    const existing = await fs.readdir(outputDir);
    if (existing.length > 0) {
      console.log(
        chalk.red('Target directory is not empty. Execution halted to prevent data loss.')
      );
      process.exit(1);
    }
  }

  const liveSourcePath = path.join(LIVE_TEMPLATES_ROOT, preset);
  const fallbackLivePath = path.join(ROOT_FALLBACK, 'cli', 'assets', 'live-templates', preset);
  let sourcePath = liveSourcePath;
  try {
    await fs.access(liveSourcePath);
  } catch {
    sourcePath = fallbackLivePath;
  }

  const spinner = ora(`Generating ${LIVE_STACKS[preset]} scaffold...`).start();
  try {
    await copyDirectory(sourcePath, outputDir);
    spinner.succeed(chalk.green('Project scaffold generated successfully!'));
    console.log(chalk.gray(`\nPreset: ${preset}`));
    console.log(chalk.gray(`Next steps:`));
    console.log(chalk.cyan(`  1. cd ${outputDir}`));
    console.log(chalk.cyan('  2. npm install'));
    console.log(chalk.cyan('  3. npm run dev\n'));
  } catch (error) {
    spinner.fail(chalk.red('Failed to generate project scaffold'));
    console.error(`[init] ${error?.message ?? error}`);
    process.exit(1);
  }
  return;
}
```

**File:** cli/lib/commands/cloud.js (L714-771)

```javascript
export function registerCloudCommand(program) {
  program
    .command('cloud')
    .description('Start Ultra-Dex cloud server for team collaboration')
    .option('-p, --port <port>', 'API port', '4001')
    .option('--ws-port <port>', 'WebSocket port', '4002')
    .option('--dashboard-port <port>', 'Dashboard port', '4003')
    .option('--no-dashboard', 'Disable dashboard server')
    .action(async (options) => {
      console.log(chalk.cyan('\n☁️  Ultra-Dex Cloud Server\n'));

      const spinner = ora('Starting cloud services...').start();

      try {
        // Load existing sessions
        await sessionManager.load();

        // Start API server
        const apiPort = parseInt(options.port, 10);
        const apiServer = createAPIServer({ port: apiPort });
        apiServer.listen(apiPort);

        // Start WebSocket server
        const wsPort = parseInt(options.wsPort, 10);
        createWebSocketServer({ port: wsPort });

        // Start dashboard server
        let dashboardPort = null;
        if (options.dashboard !== false) {
          dashboardPort = parseInt(options.dashboardPort, 10);
          const dashboardServer = createDashboardServer({ port: dashboardPort });
          dashboardServer.listen(dashboardPort);
        }

        spinner.succeed('Cloud services started');

        console.log(chalk.bold('\n📡 Endpoints:'));
        console.log(`   API:       ${chalk.cyan(`http://localhost:${apiPort}`)}`);
        console.log(`   WebSocket: ${chalk.cyan(`ws://localhost:${wsPort}`)}`);
        if (dashboardPort) {
          console.log(`   Dashboard: ${chalk.cyan(`http://localhost:${dashboardPort}`)}`);
        }

        console.log(chalk.gray('\n✨ Cloud server running. Press Ctrl+C to stop.\n'));

        // Keep process running
        process.on('SIGINT', async () => {
          console.log(chalk.yellow('\n\nShutting down...'));
          await sessionManager.save();
          process.exit(0);
        });
      } catch (err) {
        spinner.fail(`Failed to start: ${err.message}`);
      }
    });
}
```

**File:** cli/lib/ui/interactive.js (L16-88)

```javascript
export async function startInteractiveMode() {
  renderer.clearScreen();

  // 1. Intelligence Phase: Scan the Environment
  await renderer.thinking('Initializing Neural Link', [
    'Scanning file system...',
    'Analyzing dependency graph...',
    'Checking git status...',
  ]);

  const ctx = await context.scan(); // Real scan

  // 2. Pro-level greeting with Context Awareness
  const stackInfo =
    ctx.stack !== 'unknown' ? `I see we are working on a **${ctx.stack}** project.` : '';
  const gitInfo = ctx.git.branch ? `Active branch: \`${ctx.git.branch}\`` : '';

  await renderer.text(`**Welcome, User.**\n${stackInfo} ${gitInfo}`);
  console.log(theme.dim('  (Type a command, ask a question, or use the menu below)'));
  console.log('');

  const choices = [
    { name: `${theme.primary('🚀')}  Start New Project`, value: 'init' },
    { name: `${theme.primary('🧠')}  Generate Implementation Plan`, value: 'generate' },
    { name: `${theme.primary('🔨')}  Start Build Swarm`, value: 'swarm' },
    { name: `${theme.primary('📊')}  Project Status Dashboard`, value: 'status' },
    { name: `${theme.primary('🔍')}  Browse Agents`, value: 'agents' },
    { name: `${theme.primary('🚑')}  System Doctor`, value: 'doctor' },
    { name: `${theme.primary('📖')}  Read Documentation`, value: 'docs' },
    new inquirer.Separator(),
    { name: `${theme.error('✖')}  Exit`, value: 'exit' },
  ];

  while (true) {
    const { action } = await inquirer.prompt([
      {
        type: 'input',
        name: 'action',
        message: theme.primary('❯'),
        prefix: '',
        suffix: chalk.gray(' [Type or use ↓]'),
      },
    ]);

    if (!action.trim()) {
      const { selection } = await inquirer.prompt([
        {
          type: 'list',
          name: 'selection',
          message: 'Select an action:',
          choices,
          prefix: '',
        },
      ]);

      if (selection === 'exit') break;
      await executeCommand(selection);
    } else {
      const intent = routeIntent(action);
      if (intent) {
        if (intent === 'help') {
          executeCommand('help');
        } else {
          await executeCommand(intent, action);
        }
      } else {
        renderer.fail(`I didn't quite catch that. Try "init", "build", or "help".`);
        console.log(theme.dim(`  Your input: "${action}"\n`));
      }
    }
  }

  await renderer.text(`**Goodbye.**\nSystems remaining in standby.`);
}
```
