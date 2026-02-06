# Ultra-Dex User Guide - Complete Tutorial

**Version:** 3.4.5  
**Level:** Beginner to Advanced  
**Time:** 30 minutes to read, 2 hours to complete tutorial

---

## 🎯 What You'll Learn

- [ ] Install and configure Ultra-Dex
- [ ] Initialize your first project
- [ ] Generate AI-powered implementation plans
- [ ] Use agent swarms for development
- [ ] Track progress with alignment checking
- [ ] Deploy your project
- [ ] Advanced features and tips

---

## 📚 Table of Contents

1. [Installation & Setup](#1-installation--setup)
2. [Your First Project](#2-your-first-project)
3. [Understanding the Structure](#3-understanding-the-structure)
4. [Working with AI Agents](#4-working-with-ai-agents)
5. [Implementation Planning](#5-implementation-planning)
6. [Agent Swarms](#6-agent-swarms)
7. [Monitoring Progress](#7-monitoring-progress)
8. [Deployment](#8-deployment)
9. [Advanced Features](#9-advanced-features)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Installation & Setup

### 1.1 Prerequisites

Before installing Ultra-Dex, ensure you have:

- **Node.js 18+** - [Download here](https://nodejs.org)
- **Git** - [Download here](https://git-scm.com)
- **API Keys** (at least one):
  - Anthropic API key (for Claude)
  - OpenAI API key (for GPT)
  - Google AI key (for Gemini)

### 1.2 Install Ultra-Dex

```bash
# Install globally
npm install -g ultra-dex

# Verify installation
ultra-dex --version

# Should output: 3.4.5
```

### 1.3 Initial Configuration

Run the interactive configuration wizard:

```bash
ultra-dex config --wizard
```

This will guide you through:

1. **AI Provider Selection** - Choose your preferred AI (Claude, GPT, Gemini, Ollama)
2. **API Key Setup** - Securely save your API key
3. **Port Configuration** - Set dashboard ports (default: 3001/3002)
4. **Theme Selection** - Choose CLI color theme
5. **IDE Integration** - Set up Cursor or VS Code
6. **GitHub Integration** - Connect your GitHub account

**Example Configuration:**

```json
{
  "provider": {
    "default": "anthropic",
    "model": "claude-3-5-sonnet-20241022"
  },
  "server": {
    "kernelPort": 3001,
    "dashboardPort": 3002
  },
  "features": {
    "sandbox": true,
    "theme": "purple"
  }
}
```

### 1.4 Validate Setup

Check everything is working:

```bash
ultra-dex doctor
```

This runs 17 diagnostic checks including:

- Node.js version
- Git installation
- AI provider configuration
- Available ports
- Disk space
- Memory
- Network connectivity

✅ All checks should pass before proceeding.

---

## 2. Your First Project

### 2.1 Initialize a Project

Create a new project with Ultra-Dex:

```bash
# Create a new directory
mkdir my-first-saas
cd my-first-saas

# Initialize with Ultra-Dex
ultra-dex init
```

**What happens:**

1. Creates project structure
2. Generates QUICK-START.md
3. Creates CONTEXT.md template
4. Sets up IMPLEMENTATION-PLAN.md framework
5. Installs 17 AI agent prompts
6. Configures Cursor rules

### 2.2 Alternative: Use a Template

For faster setup, use a pre-configured template:

```bash
# List available templates
ultra-dex scaffold --list

# Available templates:
# - next15-prisma-clerk (Next.js 15 + Prisma + Clerk)
# - remix-supabase (Remix + Supabase)
# - sveltekit-drizzle (SvelteKit + Drizzle)
# - next15-trpc-prisma (Next.js + tRPC + Prisma)
# - astro-content-collections (Astro + MDX)
# - fastapi-react (FastAPI + React)
# - go-htmx-templ (Go + HTMX)
# - expo-supabase (React Native + Supabase)

# Use a template
ultra-dex scaffold next15-prisma-clerk
```

### 2.3 Live Scaffolding (Full Setup)

For a complete, ready-to-use project:

```bash
ultra-dex init --live --stack next15-prisma-clerk
```

This creates:

- ✅ Complete Next.js 15 project
- ✅ Prisma schema
- ✅ Clerk authentication
- ✅ Tailwind CSS setup
- ✅ Ultra-Dex planning documents
- ✅ TypeScript configuration
- ✅ Pre-commit hooks

---

## 3. Understanding the Structure

### 3.1 Key Files

Ultra-Dex creates these important files:

```
my-project/
├── QUICK-START.md          # Project overview & getting started
├── CONTEXT.md              # AI memory - project context (READ THIS!)
├── IMPLEMENTATION-PLAN.md  # 34-section detailed plan
├── .cursor/rules/          # Cursor IDE rules
├── .agents/                # 17 AI agent prompts
│   ├── 0-orchestration/
│   │   └── orchestrator.md
│   ├── 1-leadership/
│   │   ├── cto.md
│   │   ├── planner.md
│   │   └── research.md
│   ├── 2-development/
│   │   ├── backend.md
│   │   ├── frontend.md
│   │   └── database.md
│   └── ... (more tiers)
├── .ultra/
│   ├── state.json          # Project state tracking
│   └── config.json         # Ultra-Dex configuration
└── docs/
    ├── CHECKLIST.md        # 21-step verification
    └── AI-PROMPTS.md       # All agent instructions
```

### 3.2 CONTEXT.md Explained

**This is the most important file.** It's your AI's memory.

```markdown
# MyProject - Context

## Project Overview

**Name:** MyProject
**Started:** 2026-02-01
**Status:** Planning

## Quick Summary

A SaaS for task management with team collaboration.

## Key Decisions

- Frontend: Next.js 15 with App Router
- Database: PostgreSQL via Prisma
- Auth: Clerk for authentication
- Payments: Stripe for subscriptions
- Hosting: Vercel

## Current Focus

Setting up the implementation plan.

## Current State

- Files Analyzed: 0
- Dependencies: 0
- Project Phases: 0 active
- Last Sync: 2026-02-01T00:00:00.000Z

## Resources

- [Ultra-Dex Template](https://github.com/Srujan0798/Ultra-Dex)
```

**Keep this updated!** Use:

```bash
ultra-dex brain  # Auto-sync context
```

---

## 4. Working with AI Agents

### 4.1 Available Agents

Ultra-Dex provides 17 specialized AI agents:

| Agent              | Role                   | Best For                       |
| ------------------ | ---------------------- | ------------------------------ |
| **@orchestrator**  | Meta coordination      | Complex multi-agent tasks      |
| **@cto**           | Architecture decisions | Tech stack, system design      |
| **@planner**       | Task breakdown         | Sprint planning, roadmaps      |
| **@backend**       | API development        | Server logic, endpoints        |
| **@frontend**      | UI development         | Components, styling            |
| **@database**      | Data design            | Schemas, migrations            |
| **@auth**          | Security               | Authentication, authorization  |
| **@devops**        | Infrastructure         | Deployment, CI/CD              |
| **@testing**       | QA                     | Test cases, automation         |
| **@reviewer**      | Code review            | Quality checks, best practices |
| **@debugger**      | Bug fixing             | Troubleshooting, fixes         |
| **@documentation** | Docs                   | Technical writing              |
| **@performance**   | Optimization           | Speed, efficiency              |
| **@security**      | Security audit         | Vulnerability scanning         |

### 4.2 Using an Agent

**Method 1: Direct CLI**

```bash
# Ask an agent to help with a specific task
ultra-dex run backend "Create REST API for user authentication"
```

**Method 2: VS Code Extension**

1. Open VS Code
2. Click Ultra-Dex icon in sidebar
3. Browse agents by tier
4. Click an agent to copy prompt
5. Paste into your AI chat

**Method 3: Copy Prompt Manually**

```bash
# View agent prompt
ultra-dex agents show backend

# Copy to clipboard
ultra-dex agents copy backend
```

### 4.3 Agent Best Practices

1. **Be Specific**: "Create login API" → "Create POST /api/auth/login with email/password validation, JWT token generation, and error handling"

2. **Provide Context**: Reference your CONTEXT.md

3. **Use Agents in Sequence**:

   ```
   @planner: Break down "build authentication"
   @auth: Design security model
   @backend: Implement API
   @frontend: Create login UI
   @testing: Write tests
   ```

4. **Review with @reviewer**: Always have code reviewed

---

## 5. Implementation Planning

### 5.1 Generate AI Plan

Create a comprehensive 34-section plan:

```bash
ultra-dex generate "A task management SaaS with team collaboration"
```

**What you get:**

1. **Phase 1: Foundation**
   - Project setup
   - Authentication
   - Database schema
2. **Phase 2: Core Features**
   - Task management
   - Team collaboration
   - Real-time updates
3. **Phase 3: Advanced**
   - File attachments
   - Notifications
   - API integrations
4. **Phase 4: Polish**
   - Testing
   - Performance
   - Deployment

**The plan includes:**

- ✅ Detailed requirements
- ✅ Acceptance criteria
- ✅ Tech stack recommendations
- ✅ Database schemas
- ✅ API specifications
- ✅ UI mockup descriptions
- ✅ Testing strategies
- ✅ Deployment steps

### 5.2 Customize the Plan

Edit IMPLEMENTATION-PLAN.md to:

- Remove sections you don't need
- Add custom requirements
- Adjust timelines
- Modify tech stack choices

### 5.3 Plan Validation

Check if your plan is complete:

```bash
ultra-dex validate
```

This checks:

- ✅ Required sections present
- ✅ Content quality
- ✅ Alignment with best practices
- ✅ Missing critical components

---

## 6. Agent Swarms

### 6.1 What is a Swarm?

A **swarm** is multiple AI agents working in parallel on your task.

**Example:**

```
Input: "Build user authentication"

Swarm execution:
  @planner   → Creates implementation steps
  @auth      → Designs security model
  @backend   → Builds API (parallel with frontend)
  @frontend  → Creates UI (parallel with backend)
  @database  → Sets up schema (parallel)
  @testing   → Writes tests (after backend/frontend)
  @reviewer  → Reviews everything (final)
```

### 6.2 Run a Swarm

```bash
ultra-dex swarm "Build complete user authentication system"
```

**Options:**

```bash
# Parallel execution (faster)
ultra-dex swarm --parallel "Build auth system"

# Dry run (see what would happen)
ultra-dex swarm --dry-run "Build auth system"

# Specific agents only
ultra-dex swarm --agents "backend,frontend,testing" "Build auth"

# With context
ultra-dex swarm --context "Use JWT tokens, support OAuth" "Build auth"
```

### 6.3 Monitoring Swarms

**Terminal Output:**

```
🐝 Ultra-Dex Swarm Mode
Task: "Build complete user authentication system"

📦 Tier 1: Planning (sequential)
  ⟳ @planner - Analyzing requirements...
  ✓ @planner - Complete (3.2s)
    → Created 12 implementation steps

📦 Tier 2: Implementation (parallel)
  ⟳ @backend  - Building API...
  ⟳ @frontend - Creating UI...
  ⟳ @database - Setting up schema...
  ✓ @database - Complete (2.1s)
  ✓ @backend  - Complete (5.8s)
  ✓ @frontend - Complete (4.3s)

📦 Tier 3: Testing & Review (sequential)
  ⟳ @testing  - Writing tests...
  ✓ @testing  - Complete (2.7s)
  ⟳ @reviewer - Reviewing code...
  ✓ @reviewer - Complete (3.1s)

✨ Swarm complete! 6 agents, 21.2s total
```

**Dashboard:**

```bash
# Open real-time dashboard
ultra-dex serve
# Then open http://localhost:3001
```

---

## 7. Monitoring Progress

### 7.1 Check Alignment

Compare your plan vs. actual code:

```bash
ultra-dex diff
```

**Output:**

```
📋 Implementation Analysis:
Codebase: 45 files, 128 dependencies
Tasks: 12/34 completed

✅ Implemented (12):
   User Authentication ● ✓
      └─ src/auth/login.ts
      └─ src/auth/middleware.ts
   Database Schema ● ✓
   Project Structure ● ✓

⚠️ Partial (8):
   Task Management ◐ ⋯
      └─ src/tasks/api.ts (in progress)

📝 Planned (10):
   Real-time Updates ○
   File Attachments ○

🎯 Alignment Score: 72%
   ● Done: 12 | ◐ Partial: 8 | 📝 Planned: 10 | ○ Missing: 4

💡 Recommendation: Continue implementation, polish partial features
```

### 7.2 Track Performance

Monitor command execution times:

```bash
# View performance summary
ultra-dex perf --summary

# View specific command history
ultra-dex perf --operation swarm

# Export metrics
ultra-dex perf --export metrics.json
```

### 7.3 Brain Sync

Keep CONTEXT.md automatically updated:

```bash
# Manual sync
ultra-dex brain

# Auto-sync (continuous)
ultra-dex brain --watch

# Sync with git commit
ultra-dex brain --commit
```

---

## 8. Deployment

### 8.1 Pre-Deployment Checks

```bash
# Validate everything
ultra-dex validate --scan

# Check alignment
ultra-dex diff

# Run diagnostics
ultra-dex doctor

# Verify 21-step checklist
ultra-dex verify
```

### 8.2 Build for Production

```bash
ultra-dex build
```

This:

1. Validates project structure
2. Runs tests
3. Checks alignment (must be >70%)
4. Builds production bundle
5. Exports context for deployment

### 8.3 Deploy

Ultra-Dex supports multiple platforms:

**Vercel:**

```bash
npm i -g vercel
vercel --prod
```

**Netlify:**

```bash
npm i -g netlify-cli
netlify deploy --prod
```

**Railway:**

```bash
npm i -g @railway/cli
railway up
```

**Docker:**

```bash
docker build -t myapp .
docker run -p 3000:3000 myapp
```

---

## 9. Advanced Features

### 9.1 GitHub Integration

Sync with GitHub issues and PRs:

```bash
# Setup GitHub integration
ultra-dex github --setup

# Sync issues to Ultra-Dex tasks
ultra-dex github --sync-issues

# Create PR from current branch
ultra-dex github --create-pr
```

### 9.2 Code Search

Semantic code search:

```bash
# Search by meaning
ultra-dex search "authentication middleware" --semantic

# Regex search
ultra-dex search "function.*auth" --regex

# AI-powered search
ultra-dex search "where do I handle user sessions?" --ai
```

### 9.3 File Watching

Auto-run commands on file changes:

```bash
# Watch all files, run validation on change
ultra-dex watch --run "ultra-dex validate"

# Watch only TypeScript files
ultra-dex watch --only-ts --run "npm run build"

# Debounced watching (wait 1s after last change)
ultra-dex watch --debounce 1000 --run "ultra-dex diff"
```

### 9.4 Performance Monitoring

Track command performance:

```bash
# View performance metrics
ultra-dex perf --summary --days 7

# Find slow commands
ultra-dex perf --summary | grep -A 5 "Slow Operations"
```

### 9.5 Cloud Dashboard

Team collaboration dashboard:

```bash
# Start cloud server
ultra-dex cloud

# Access at:
# API: http://localhost:4001
# Dashboard: http://localhost:4003
# WebSocket: ws://localhost:4002
```

---

## 10. Troubleshooting

### 10.1 Common Issues

**"No AI provider configured"**

```bash
# Solution: Run config wizard
ultra-dex config --wizard

# Or set env variable
export ANTHROPIC_API_KEY=your-key
```

**"Port 3001 already in use"**

```bash
# Solution: Use different port
ultra-dex serve --port 3003

# Or kill existing process
lsof -ti:3001 | xargs kill -9
```

**"Command not found"**

```bash
# Solution: Reinstall globally
npm install -g ultra-dex

# Verify
which ultra-dex
```

**"Validation failed"**

```bash
# Check what's missing
ultra-dex validate --scan

# Common fixes:
ultra-dex init  # Re-initialize
ultra-dex brain  # Sync context
```

### 10.2 Getting Help

```bash
# Command help
ultra-dex --help
ultra-dex <command> --help

# Doctor diagnostics
ultra-dex doctor

# Debug mode
DEBUG=1 ultra-dex <command>
```

### 10.3 Support Channels

- **Documentation:** https://github.com/Srujan0798/Ultra-Dex#readme
- **Issues:** https://github.com/Srujan0798/Ultra-Dex/issues
- **Discussions:** https://github.com/Srujan0798/Ultra-Dex/discussions

---

## 🎓 Tutorial Summary

**What you learned:**

1. ✅ Installed and configured Ultra-Dex
2. ✅ Created your first project
3. ✅ Generated an AI implementation plan
4. ✅ Used agent swarms for development
5. ✅ Monitored progress with alignment checks
6. ✅ Deployed your project
7. ✅ Explored advanced features

**Next Steps:**

- Explore all 22 production commands
- Read the [Advanced Workflows Guide](./ADVANCED-WORKFLOWS.md)
- Check out [Example Projects](../examples/)
- Join the community discussions

**Quick Reference Card:**

```bash
# Essential commands
ultra-dex init                    # Initialize project
ultra-dex generate "idea"         # Generate plan
ultra-dex swarm "task"            # Run agent swarm
ultra-dex diff                    # Check alignment
ultra-dex brain                   # Sync context
ultra-dex validate                # Validate project
ultra-dex serve                   # Start dashboard
ultra-dex doctor                  # Diagnostics

# Get help
ultra-dex --help
ultra-dex <command> --help
```

---

**Congratulations!** You're now ready to build production-ready applications with Ultra-Dex. 🚀

_Happy building!_
