# Ultra-Dex Complete Launch Plan

> **Execute in order. Total time: ~3 hours**

---

## Phase 1: Publish v3.4.2 (5 min) [READY]

- [x] Update cli/package.json to 3.4.2
- [x] Verify CLI build and tests
- [ ] npm publish (Requires user credentials)

**Changelog v3.4.2:**
- Professional purple gradient theme
- Active Kernel (MCP + WebSocket + Dashboard)
- Autonomous Agent Swarms with parallel execution
- Docker Sandbox code execution (`exec`)
- Graph-Augmented Memory (Code Property Graph)

---

## Phase 2: VS Code Extension (30 min) [READY]

### Step 1: Update package.json
- [x] Update publisher to SrujanSaiKarna
- [x] Update engine version to ^1.80.0
- [x] Downgrade @types/vscode to 1.80.0 for compatibility

### Step 2: Package
- [x] Successfully packaged ultra-dex-vscode-3.4.2.vsix

### Step 3: Publish
- [ ] vsce publish (Requires user credentials)

---

## Phase 3: Demo Content (30 min)

### Demo GIF Script

#### Scene 1: Init (5s)
```bash
npx ultra-dex init myapp
# Show: Professional Purple banner
```

#### Scene 2: Generate (10s)
```bash
npx ultra-dex generate "Build a task manager SaaS"
# Show: AI generating plan
```

#### Scene 3: Agents (5s)
```bash
npx ultra-dex agents
# Show: 17 agents listed by tier
```

#### Scene 4: Swarm (10s)
```bash
npx ultra-dex swarm "Add user auth" --parallel
# Show: Parallel agent execution pipeline
```

#### Scene 5: Dashboard (5s)
```bash
npx ultra-dex serve
# Show: MCP Kernel and God Mode Dashboard
```

### Record with:
```bash
# macOS
brew install asciinema
asciinema rec demo.cast
# Then convert to GIF with agg or similar
```

---

## Phase 4: Launch Posts (20 min)

### Twitter/X Post
```
🚀 Just launched Ultra-Dex v3.4.2 — the AI Orchestration Meta-Layer

✅ 64+ CLI commands
✅ 17 AI agents (swarm mode!)
✅ Active Kernel (MCP + WebSocket)
✅ Docker Sandbox for safe execution
✅ Professional Purple UI 🎨

npx ultra-dex init myproject

github.com/Srujan0798/Ultra-Dex

#AI #DevTools #OpenSource #MCP
```

### Reddit (r/programming, r/webdev)

**Title:** Ultra-Dex v3.4.2 — Enterprise AI orchestration framework with 17 agents, swarms, and MCP kernel

**Body:**
```
Hey everyone! Just released Ultra-Dex v3.4.2.

**What is it?**
Ultra-Dex is the orchestration layer that sits ABOVE AI coding tools (Claude Code, Cursor, Devin). It provides:
- Persistent context (CONTEXT.md survives sessions)
- 17 specialized agents across 7 tiers
- Swarm mode for autonomous parallel pipelines
- MCP server for Claude Desktop integration
- Docker Sandbox for executing generated code

**Why?**
AI tools have amnesia and hallucinate. Ultra-Dex provides the memory and the verification sandbox.

**Quick start:**
npx ultra-dex init myproject

GitHub: github.com/Srujan0798/Ultra-Dex
npm: npmjs.com/package/ultra-dex

Would love feedback!
```

### Hacker News

**Title:** Show HN: Ultra-Dex – The Kubernetes of AI Coding (17 agents, MCP Kernel, Sandbox)

**Body:**
```
Ultra-Dex is an open-source meta-orchestration layer for AI development.

The problem: AI coding is getting powerful, but coordination is hard. Claude forgets, Cursor hallucinates, and humans become the "middleware" between tools.

The solution: A structured meta-layer with:
- Git-versioned context files (CONTEXT.md)
- A tiered agent system (7 tiers, 17 agents)
- An Active Kernel (MCP) that injects project state into any tool
- A Docker Sandbox to safely verify generated code

Features:
- 64+ CLI commands
- Parallel Swarm pipelines
- God Mode Dashboard
- Works with Claude, Cursor, Devin, Gemini

npx ultra-dex init

https://github.com/Srujan0798/Ultra-Dex
```

---

## Phase 5: Product Hunt (30 min)

### Listing Details

**Name:** Ultra-Dex

**Tagline:** The Meta-Orchestration Layer for AI Development

**Description:**
```
Ultra-Dex is the "Headless CTO" for your SaaS projects. It's a CLI framework that orchestrates AI coding tools like Claude Code, Cursor, and Devin.

Key Features:
✓ 64+ CLI commands for AI-assisted engineering
✓ 17 specialized agents in a 7-tier orchestration system
✓ Active Kernel (MCP) for Claude Desktop integration
✓ Docker Sandbox for code execution and testing
✓ 21-step verification framework

Just run: npx ultra-dex init

Ultra-Dex makes your AI assistants dramatically smarter by giving them structure, memory, and an execution environment.
```

**Topics:** Developer Tools, Artificial Intelligence, Open Source, Productivity

**First Comment:**
```
Hi Product Hunt! 👋

We built Ultra-Dex because we were tired of being the "human clipboard" moving context between different AI tools.

Ultra-Dex creates a shared project memory that any AI can access via MCP or Markdown. It handles the plan → code → verify loop autonomously with swarms and a Docker sandbox.

I'd love to hear how you're using AI in your dev workflow and how Ultra-Dex can help!
```

---

## Phase 6: Post-Launch (Ongoing)

### Day 1
- [ ] Monitor GitHub issues
- [ ] Respond to comments
- [ ] Fix any bugs reported

### Week 1
- [ ] Gather feedback
- [ ] Update roadmap for v3.5 (Voice Mode)
- [ ] Record feature walkthroughs

### Week 2-4
- [ ] Implement top community requests
- [ ] Expand Cursor rule library
- [ ] Enterprise team features

---

## Commands Summary

```bash
# Step 1: Publish npm
cd cli && npm version 3.4.2 && npm publish

# Step 2: Package VS Code extension
cd vscode-extension && npm install && npm run compile && vsce package && vsce publish

# Step 3: Record demo
asciinema rec demo.cast

# Step 4: Post everywhere
# - Twitter
# - Reddit
# - Hacker News
# - Product Hunt
```

---

*Ready to execute. Let's launch v3.4.2! 🚀*
