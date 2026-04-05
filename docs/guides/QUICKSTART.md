# 🚀 Ultra-Dex Quick Start Guide

**Ultra-Dex is now an AI Orchestration System** - it provides the brain that tells AI agents WHAT to build properly.

---

## ⚡ Quick Start (30 Seconds)

### Step 1: Choose Your Agent

```bash
ls .agents/
```

Available agents:

- `cto` - Architecture decisions
- `planner` - Task breakdown
- `backend` - API & database
- `frontend` - UI components
- `reviewer` - Code quality
- `debugger` - Troubleshooting
- `devops` - Deployment
- `auth` - Security

### Step 2: Copy Agent Prompt

```bash
cat .agents/backend.md | pbcopy  # macOS
cat .agents/backend.md | clip    # Windows
cat .agents/backend.md | xclip -selection clipboard  # Linux
```

### Step 3: Paste into AI Assistant

Open your AI assistant (Cursor, Claude Code, Devin, etc.) and paste:

1. The agent prompt (just copied)
2. Your project context (`CONTEXT.md` or describe your idea)
3. Let the AI execute!

---

## 📋 Example Workflows

### Workflow 1: Build a Feature

**Time:** 5-10 minutes

```
1. Copy CTO agent → Get architecture approval
2. Copy Planner agent → Break into tasks
3. Copy Backend agent → Implement API
4. Copy Frontend agent → Build UI
5. Copy Reviewer agent → Quality check
6. Copy DevOps agent → Deploy
```

### Workflow 2: Fix a Bug

**Time:** 2-5 minutes

```
1. Copy Debugger agent → Diagnose issue
2. Implement fix
3. Copy Reviewer agent → Verify fix
```

### Workflow 3: Review Code

**Time:** 3-5 minutes

```
1. Copy Reviewer agent
2. Paste code to review
3. Get detailed audit report
```

---

## 🎯 What Each Agent Does

| Agent        | When to Use                        | Output                       |
| ------------ | ---------------------------------- | ---------------------------- |
| **CTO**      | Starting project, major decisions  | Architecture doc, tech stack |
| **Planner**  | Complex features, multi-step tasks | Task breakdown, timeline     |
| **Backend**  | API endpoints, database logic      | Code, migrations, tests      |
| **Frontend** | UI components, user flows          | Components, styles, state    |
| **Reviewer** | Before merge, quality audit        | Issue list, fixes needed     |
| **Debugger** | Something's broken                 | Root cause, fix, tests       |
| **DevOps**   | Deploying to production            | CI/CD config, monitoring     |
| **Auth**     | Login, permissions, security       | Auth flow, security checks   |

---

## 💡 Pro Tips

### Tip 1: Chain Agents

Use multiple agents in sequence for complex features:

```
CTO → Planner → Backend → Frontend → Reviewer
```

### Tip 2: Provide Context

Always include:

- Your project idea or `CONTEXT.md`
- Any relevant constraints
- Desired outcome

### Tip 3: Quality First

Always run the Reviewer agent before deploying:

```bash
cat .agents/reviewer.md | pbcopy
# Paste your code for audit
```

---

## 📊 What Changed? (Pivot Summary)

**Before:** Ultra-Dex was a 34-section template that humans filled manually (30+ minutes)

**After:** Ultra-Dex provides AI agent prompts that work with Cursor, Claude Code, Devin, etc. (5-10 minutes)

**Result:**

- Score improved from 40/100 → 82/100
- Works with ANY AI assistant
- Maintains quality standards (21-step verification)
- No vendor lock-in

---

## ✅ CLI Commands (Ready)

Use the CLI directly:

```bash
# List all agents
ultra-dex agents

# View specific agent
ultra-dex agents backend

# Copy to clipboard
ultra-dex agents backend --copy

# Fast-path generate (idea → code)
ultra-dex generate "Task management SaaS"

# Review code
ultra-dex review ./src

# Run planner with NVIDIA
export NVIDIA_API_KEY=nvapi-your-key
ultra-dex run planner -t "Build auth API" --provider nvidia
```

**Current Status:** ✅ Available  
**Note:** AI-powered commands need a configured provider key (or Ollama for local).

---

## 📚 Documentation

- **Agent Usage:** `.agents/README.md`
- **Strategy:** `PIVOT-IMPLEMENTATION.md`
- **Status:** `STATUS.md`
- **Implementation:** `IMPLEMENTATION_SUMMARY.md`

---

## ❓ FAQ

**Q: Do I need to install anything?**  
A: No! Just copy agent prompts and paste into your AI assistant.

**Q: Which AI assistants work with this?**  
A: Any! Cursor, Claude Code, Devin, GitHub Copilot, etc.

**Q: How is this different from just asking AI?**  
A: Ultra-Dex agents provide structured thinking frameworks, quality checklists, and ensure nothing is missed.

**Q: Can I customize the agents?**  
A: Yes! Modify the `.md` files in `.agents/` for your team's needs.

**Q: Why do AI commands say no provider configured?**  
A: Set one key first (for example `NVIDIA_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, or `GOOGLE_AI_KEY`), or run with `--provider ollama`.

---

## 🎯 Next Steps

1. **Try an agent now:** `cat .agents/backend.md | pbcopy`
2. **Paste into your AI assistant**
3. **See the magic happen!**
4. **Share feedback** on GitHub

---

**Ready to build with AI orchestration?** Start with `.agents/README.md` →

**Need help?** See `STATUS.md` or open GitHub issue.
