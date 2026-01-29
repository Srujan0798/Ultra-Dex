# Ultra-Dex Complete Launch Plan

> **Execute in order. Total time: ~3 hours**

---

## Phase 1: Publish v3.2.0 (5 min) [READY]

- [x] Update cli/package.json to 3.2.0
- [x] Verify CLI build and tests
- [ ] npm publish (Requires user credentials)

**Changelog v3.2.0:**
- Professional purple gradient theme
- Modern UI styling
- New UI module (theme.js, interface.js, spinners.js)
- Enhanced banner display

---

## Phase 2: VS Code Extension (30 min) [READY]

### Step 1: Update package.json
- [x] Update publisher to SrujanSaiKarna
- [x] Update engine version to ^1.80.0
- [x] Downgrade @types/vscode to 1.80.0 for compatibility

### Step 2: Package
- [x] Successfully packaged ultra-dex-vscode-1.0.0.vsix

### Step 3: Publish
- [ ] vsce publish (Requires user credentials)

---

## Phase 3: Demo Content (30 min)

### Demo GIF Script

#### Scene 1: Init (5s)
```bash
npx ultra-dex init myapp
# Show: Doomsday banner, green theme
```

#### Scene 2: Generate (10s)
```bash
npx ultra-dex generate "Build a task manager SaaS"
# Show: AI generating plan
```

#### Scene 3: Agents (5s)
```bash
npx ultra-dex agents
# Show: 16 agents listed
```

#### Scene 4: Swarm (10s)
```bash
npx ultra-dex swarm "Add user auth" --dry-run
# Show: Agent pipeline
```

#### Scene 5: Dashboard (5s)
```bash
npx ultra-dex dashboard
# Show: Web UI opening
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
🚀 Just launched Ultra-Dex v3.2 — the AI Orchestration Meta-Layer

✅ 35 CLI commands
✅ 16 AI agents (swarm mode!)
✅ MCP server built-in
✅ Claude + Cursor + Devin compatible
✅ Doomsday green theme 🎨

npx ultra-dex init myproject

github.com/Srujan0798/Ultra-Dex

#AI #DevTools #OpenSource
```

### Reddit (r/programming, r/webdev)

**Title:** Ultra-Dex v3.2 — Open source AI orchestration framework with 16 agents, swarm mode, and MCP server

**Body:**
```
Hey everyone! Just released Ultra-Dex v3.2.

**What is it?**
Ultra-Dex is the orchestration layer that sits ABOVE AI coding tools (Claude Code, Cursor, Devin). It provides:
- Persistent context (CONTEXT.md survives sessions)
- 16 specialized agents (planner, backend, frontend, etc.)
- Swarm mode for autonomous pipelines
- MCP server for Claude Desktop integration

**Why?**
AI tools have amnesia. Ultra-Dex is their memory.

**Quick start:**
npx ultra-dex init myproject

GitHub: github.com/Srujan0798/Ultra-Dex
npm: npmjs.com/package/ultra-dex

Would love feedback!
```

### Hacker News

**Title:** Show HN: Ultra-Dex – AI Orchestration Meta-Layer (35 commands, 16 agents, MCP)

**Body:**
```
Ultra-Dex is an open-source CLI that orchestrates AI coding tools.

The problem: Every AI session starts from zero. Claude forgets, Cursor forgets.

The solution: Git-versioned context files (CONTEXT.md, IMPLEMENTATION-PLAN.md) that ANY AI can read.

Features:
- 35 CLI commands
- 16 specialized agents with swarm mode
- MCP server for Claude Desktop
- Works with Claude, Cursor, Devin, Gemini

npx ultra-dex init

https://github.com/Srujan0798/Ultra-Dex
```

---

## Phase 5: Product Hunt (30 min)

### Listing Details

**Name:** Ultra-Dex

**Tagline:** AI Orchestration Meta-Layer for SaaS Development

**Description:**
```
Ultra-Dex is the command-line framework that sits above AI coding tools like Claude Code, Cursor, and Devin. It solves the "AI amnesia" problem with git-versioned context files.

Key Features:
✓ 35 CLI commands for AI-assisted development
✓ 16 specialized agents (run them in swarm mode!)
✓ MCP server for Claude Desktop integration
✓ 34-section implementation template
✓ 21-step verification checklist

Just run: npx ultra-dex init

Works with ANY AI tool. Free and open source.
```

**Topics:** Developer Tools, Artificial Intelligence, Open Source, Command Line

**First Comment:**
```
Hi Product Hunt! 👋

I built Ultra-Dex because I was frustrated with AI coding tools forgetting context between sessions.

The solution: A framework that keeps context in Git-versioned files. Now any AI can pick up where the last one left off.

I'd love to hear your feedback and answer any questions!
```

---

## Phase 6: Post-Launch (Ongoing)

### Day 1
- [ ] Monitor GitHub issues
- [ ] Respond to comments
- [ ] Fix any bugs reported

### Week 1
- [ ] Gather feedback
- [ ] Plan v3.3 features
- [ ] Update roadmap

### Week 2-4
- [ ] Implement top requests
- [ ] More integrations
- [ ] Enterprise features

---

## Commands Summary

```bash
# Step 1: Publish npm
cd cli && npm version 3.2.0 && npm publish

# Step 2: Package VS Code extension
cd vscode-extension && npm install && vsce package && vsce publish

# Step 3: Record demo
asciinema rec demo.cast

# Step 4: Post everywhere
# - Twitter
# - Reddit
# - Hacker News
# - Product Hunt
```

---

*Ready to execute. Let's launch! 🚀*
