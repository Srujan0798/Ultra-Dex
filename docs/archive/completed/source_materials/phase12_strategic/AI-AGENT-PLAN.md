# Ultra-Dex Pro: AI Agent Master Plan

> Version: 3.4.5 Professional Release
> Created: February 2, 2026
> Purpose: Single Source of Truth for ALL AI Agents

## 🎯 MISSION STATEMENT

**Ultra-Dex** is an AI orchestration meta-layer that provides structure, memory, and architectural context to AI assistants for SaaS development. It doesn't write code—it makes AI dramatically smarter.

---

## 📁 PROJECT HIERARCHY (Golden Flow)

### **CRITICAL: Follow This Structure Exactly**

```
/Users/roshwinram/Music/Ultra-Dex/
├── cli/                    🟢 CORE PRODUCT - Node.js CLI tool
│   ├── bin/               CLI entry points
│   ├── lib/               Core business logic
│   │   ├── commands/      CLI command implementations
│   │   ├── providers/     AI provider integrations (Claude, GPT, Gemini)
│   │   ├── swarm/         Multi-agent coordination
│   │   ├── ui/            Terminal UI components
│   │   ├── memory/        State management
│   │   └── quality/       Code quality scanners
│   ├── test/              Test suites
│   └── package.json       v3.4.5
│
├── vscode-extension/       🟢 VS Code Integration
│   ├── src/               TypeScript source
│   │   ├── commands/      VS Code commands
│   │   ├── sidebar/       Sidebar views
│   │   └── providers/     Tree/data providers
│   └── package.json
│
├── agents/                 🟢 THE BRAINS - 17 AI Agent Prompts
│   ├── 0-orchestration/   Meta orchestration agents
│   ├── 1-leadership/      CTO, Planner, Research
│   ├── 2-development/     Backend, Frontend, Database
│   ├── 3-security/        Auth, Security
│   ├── 4-devops/          DevOps
│   ├── 5-quality/         Testing, Reviewer, Debugger, Documentation
│   └── 6-specialist/      Performance, Refactoring
│
├── docs/                   🟢 THE TRUTH - All documentation
│   ├── guides/            User guides and workflows
│   ├── reference/         API docs and templates
│   ├── architecture/      System architecture docs
│   └── strategy/          AI strategy documents
│
├── cursor-rules/           🟢 AI Coding Rules (.mdc files)
│   ├── 00-ultra-dex-core.mdc
│   ├── 01-database.mdc
│   ├── 02-api.mdc
│   └── ... (34 total rules)
│
├── examples/               🟡 Reference implementations (read-only)
│
└── reports/                🔴 HISTORY & LOGS - DO NOT READ FOR CONTEXT
    ├── archive/           Old reports (ignore)
    └── reviews/           Review reports (ignore)
```

---

## 🚦 DIRECTORY STATUS LEGEND

| Symbol | Status    | Action                        |
| ------ | --------- | ----------------------------- |
| 🟢     | Active    | Read/Write - Current focus    |
| 🟡     | Reference | Read-only - Use for guidance  |
| 🔴     | Ignore    | Do not read - Historical only |

---

## 🎭 THE 17 AI AGENTS (Organized by Tier)

### **TIER 0: Meta Orchestration**

| Agent                  | Purpose                           | File Location                                 |
| ---------------------- | --------------------------------- | --------------------------------------------- |
| **@Meta-Orchestrator** | High-level system coordination    | `agents/0-orchestration/meta-orchestrator.md` |
| **@Orchestrator**      | Feature coordination across tiers | `agents/0-orchestration/orchestrator.md`      |

### **TIER 1: Leadership (Strategy)**

| Agent         | Purpose                             | File Location                     |
| ------------- | ----------------------------------- | --------------------------------- |
| **@CTO**      | Architecture & tech stack decisions | `agents/1-leadership/cto.md`      |
| **@Planner**  | Task breakdown & sprint planning    | `agents/1-leadership/planner.md`  |
| **@Research** | Technology evaluation               | `agents/1-leadership/research.md` |

### **TIER 2: Development (Implementation)**

| Agent         | Purpose                       | File Location                      |
| ------------- | ----------------------------- | ---------------------------------- |
| **@Backend**  | API & server implementation   | `agents/2-development/backend.md`  |
| **@Database** | Schema design & migrations    | `agents/2-development/database.md` |
| **@Frontend** | UI & component implementation | `agents/2-development/frontend.md` |

### **TIER 3: Security**

| Agent         | Purpose                           | File Location                   |
| ------------- | --------------------------------- | ------------------------------- |
| **@Auth**     | Authentication & authorization    | `agents/3-security/auth.md`     |
| **@Security** | Security audits & vulnerabilities | `agents/3-security/security.md` |

### **TIER 4: DevOps**

| Agent       | Purpose                     | File Location               |
| ----------- | --------------------------- | --------------------------- |
| **@DevOps** | Deployment & infrastructure | `agents/4-devops/devops.md` |

### **TIER 5: Quality (Testing & Review)**

| Agent              | Purpose                      | File Location                       |
| ------------------ | ---------------------------- | ----------------------------------- |
| **@Debugger**      | Bug investigation & fixes    | `agents/5-quality/debugger.md`      |
| **@Documentation** | Technical writing            | `agents/5-quality/documentation.md` |
| **@Reviewer**      | Code review & quality checks | `agents/5-quality/reviewer.md`      |
| **@Testing**       | QA & test automation         | `agents/5-quality/testing.md`       |

### **TIER 6: Specialist (Optimization)**

| Agent            | Purpose                  | File Location                        |
| ---------------- | ------------------------ | ------------------------------------ |
| **@Performance** | Performance optimization | `agents/6-specialist/performance.md` |
| **@Refactoring** | Code quality improvement | `agents/6-specialist/refactoring.md` |

---

## 🔧 TECH STACK

### **CLI Core**

- **Runtime**: Node.js 18+
- **Framework**: Commander.js
- **UI**: Ink (React for CLI)
- **Database**: SQLite3
- **Validation**: Zod
- **AI SDKs**: Anthropic, OpenAI, Google Generative AI

### **VS Code Extension**

- **Language**: TypeScript
- **Framework**: VS Code Extension API
- **UI**: Webview panels

### **Key Dependencies**

```json
{
  "commander": "^11.1.0",
  "ink": "^4.4.1",
  "chalk": "^5.3.0",
  "zod": "^3.25.76",
  "sqlite3": "^5.1.7",
  "ws": "^8.19.0"
}
```

---

## 🎨 CORE FEATURES (v3.4.5)

1. **Multi-agent Swarms** - Parallel execution of specialized agents
2. **Self-Healing Workflows** - Autonomous error recovery
3. **Vision Auditing** - Multimodal code review
4. **Plugin Architecture** - Extensible functionality
5. **MCP Integration** - Model Context Protocol server
6. **Performance Monitoring** - Real-time metrics

---

## 📋 AI AGENT WORKFLOW RULES

### **Rule 1: ALWAYS Start Here**

```
1. Read CONTEXT.md (current project state)
2. Read this file (AI-AGENT-PLAN.md)
3. Check agents/00-AGENT_INDEX.md for agent selection
4. Only then proceed with task
```

### **Rule 2: NEVER Read Reports/**

- `reports/` directory is for historical logging only
- Contains old session summaries and reviews
- Reading these causes confusion and outdated context
- **Exception**: Only if explicitly asked by user

### **Rule 3: Follow the Golden Flow**

```
User Request
    ↓
Select Appropriate Agent (from 17 agents)
    ↓
Check Relevant cursor-rules/*.mdc
    ↓
Read Related docs/guides/
    ↓
Execute Task
    ↓
Update CONTEXT.md with changes
```

### **Rule 4: Multi-Agent Coordination**

When working alongside other agents:

1. **Check CONTEXT.md first** - See what others are working on
2. **Respect directory ownership**:
   - CLI changes → `cli/` only
   - Extension changes → `vscode-extension/` only
   - Docs changes → `docs/` only
3. **Update state.json** when making changes:
   - `cli/.ultra/state.json`
   - `.ultra/state.json` (root)

### **Rule 5: Code Quality Standards**

- **21-Step Verification** for major features
- **5-Step Quick Check** for minor fixes
- **80% test coverage** for business logic
- **Zod validation** at all API boundaries
- **TypeScript strict mode** always

---

## 🗂️ KEY FILES ALL AGENTS MUST KNOW

### **Critical Configuration**

| File                            | Purpose                      | When to Read             |
| ------------------------------- | ---------------------------- | ------------------------ |
| `CONTEXT.md`                    | Project state & requirements | ALWAYS first             |
| `cli/package.json`              | CLI dependencies & scripts   | When modifying CLI       |
| `vscode-extension/package.json` | Extension manifest           | When modifying extension |
| `mcp-config.json`               | MCP server configuration     | When working with MCP    |

### **Documentation Sources**

| File                                   | Purpose                    | When to Read                 |
| -------------------------------------- | -------------------------- | ---------------------------- |
| `docs/ONBOARDING.md`                   | Complete setup guide       | New user scenarios           |
| `docs/guides/PROJECT-ORCHESTRATION.md` | Multi-agent workflows      | Coordinating multiple agents |
| `docs/guides/ADVANCED-WORKFLOWS.md`    | Stripe, emails, migrations | Complex features             |
| `docs/FUTURE-TASKS.md`                 | Roadmap items              | Future planning              |

### **Agent Instructions**

| File                           | Purpose               | When to Read                |
| ------------------------------ | --------------------- | --------------------------- |
| `agents/00-AGENT_INDEX.md`     | Agent selection guide | Choosing which agent to use |
| `agents/AGENT-INSTRUCTIONS.md` | Common agent patterns | Writing agent prompts       |
| `agents/X-tier/agent-name.md`  | Specific agent prompt | Using that agent            |

### **Cursor Rules (AI Coding Assistance)**

| File                                 | Purpose               | When to Read  |
| ------------------------------------ | --------------------- | ------------- |
| `cursor-rules/00-ultra-dex-core.mdc` | Base coding standards | ALWAYS        |
| `cursor-rules/01-database.mdc`       | Database patterns     | DB work       |
| `cursor-rules/02-api.mdc`            | API design patterns   | API work      |
| `cursor-rules/03-auth.mdc`           | Auth implementation   | Security work |

---

## ⚡ QUICK REFERENCE: Agent Selection

### **"I'm starting a new feature"**

→ Read: `@Planner` (breakdown) → `@CTO` (architecture)

### **"I need to build an API"**

→ Read: `@Backend` + `@Database`

### **"I need to build a UI"**

→ Read: `@Frontend`

### **"Security concerns"**

→ Read: `@Auth` (implementation) + `@Security` (audit)

### **"Ready to deploy"**

→ Read: `@Testing` → `@Reviewer` → `@DevOps`

### **"Something is broken"**

→ Read: `@Debugger`

### **"Code needs cleanup"**

→ Read: `@Refactoring`

### **"Performance issues"**

→ Read: `@Performance`

---

## 🔄 STATE MANAGEMENT

### **State Files (JSON)**

All agents MUST update state when making changes:

```json
// cli/.ultra/state.json - CLI internal state
// .ultra/state.json - Root project state
{
  "version": "3.4.5",
  "lastUpdated": "2026-02-02T10:00:00Z",
  "activeAgents": [],
  "completedTasks": [],
  "pendingTasks": []
}
```

### **Context Files (Markdown)**

Always keep these updated:

- `CONTEXT.md` - Current project context
- `QUICK-START.md` - Quick reference
- `CHANGELOG.md` - Version history

---

## 🚫 ANTI-PATTERNS (NEVER DO THESE)

1. ❌ **Don't read reports/** for current context
2. ❌ **Don't modify agents/** without CTO approval
3. ❌ **Don't skip CONTEXT.md** before starting
4. ❌ **Don't write to examples/** (read-only)
5. ❌ **Don't mix concerns** - CLI logic stays in cli/, extension in vscode-extension/
6. ❌ **Don't ignore cursor-rules/** - Always apply relevant .mdc files
7. ❌ **Don't bypass 21-step verification** for major features

---

## ✅ PRE-FLIGHT CHECKLIST (Before Any Task)

```
☐ Read CONTEXT.md for current state
☐ Read this AI-AGENT-PLAN.md for structure
☐ Identify which of the 17 agents is appropriate
☐ Check relevant cursor-rules/*.mdc
☐ Verify no conflicts with other agents (check state.json)
☐ Confirm working directory matches task scope
☐ Ready to proceed!
```

---

## 🎓 UNDERSTANDING THE PROJECT FLOW

### **What Ultra-Dex Does:**

1. **Initialization** (`ultra-dex init`) - Creates project structure
2. **Generation** (`ultra-dex generate`) - Creates 34-section implementation plan
3. **Building** (`ultra-dex build`) - Auto-pilot execution
4. **Swarm** (`ultra-dex swarm`) - Multi-agent parallel execution
5. **Validation** (`ultra-dex validate`) - Quality checks

### **The 34-Section Template:**

Every project gets a comprehensive plan covering:

- Sections 1-10: Product, stack, database, API, auth, frontend
- Sections 11-20: Deployment, errors, logging, performance, security
- Sections 21-34: Advanced (docs, roadmap, A11y, analytics)

---

## 📞 ESCALATION PATH

**Confused about which agent to use?**
→ Check `agents/00-AGENT_INDEX.md`

**Need multi-agent coordination help?**
→ Read `docs/guides/PROJECT-ORCHESTRATION.md`

**Found a bug in the framework?**
→ Use `@Debugger` agent, then `@Reviewer`

**Need to add a new agent?**
→ Requires `@CTO` + `@Meta-Orchestrator` approval

---

## 🎯 CURRENT FOCUS (v3.4.5)

**Primary Goal:** Launch v3.4.5 Professional Release

**Active Work Areas:**

- CLI core functionality (`cli/lib/`)
- VS Code extension stability (`vscode-extension/src/`)
- Agent prompt refinement (`agents/`)
- Documentation completeness (`docs/`)

**Future Work** (do not touch unless explicitly asked):

- Voice features (in `docs/FUTURE-TASKS.md`)
- Advanced AI integrations (v3.5.0)

---

## 📝 AGENT COMMUNICATION PROTOCOL

When multiple agents are working:

1. **Sign your work** - Add agent name to commit messages
2. **Update state.json** - Mark tasks as complete
3. **Comment your changes** - Explain WHY, not just WHAT
4. **Respect boundaries** - Don't modify another agent's assigned files
5. **Use docs/ for coordination** - Leave notes in `docs/internal/` if needed

---

## 🏁 SUMMARY

**This is Ultra-Dex Pro v3.4.5 - an AI orchestration framework for SaaS development.**

**Key Directories:**

- 🟢 `cli/` - Core product (Node.js CLI)
- 🟢 `vscode-extension/` - VS Code integration
- 🟢 `agents/` - 17 AI agent prompts
- 🟢 `docs/` - All documentation
- 🟢 `cursor-rules/` - AI coding rules
- 🟡 `examples/` - Reference only
- 🔴 `reports/` - Historical logs (ignore)

**All agents must:**

1. Read CONTEXT.md first
2. Follow this plan's hierarchy
3. Never read reports/ for context
4. Update state.json after changes
5. Use appropriate agent from the 17 available

**Remember:**

> "Your Skeleton, Not Your Cage" - Structure without restriction

---

_Ultra-Dex v3.4.5 - Professional AI Orchestration Meta Layer_
_All AI Agents MUST follow this plan for consistent, confusion-free collaboration_
