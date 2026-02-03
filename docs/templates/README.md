# Ultra-Dex Templates

Project planning and tracking templates for AI-driven SaaS development.

---

## 📄 Available Templates

### [MASTER-PLAN-TEMPLATE.md](./MASTER-PLAN-TEMPLATE.md)

**Purpose:** Single-file project overview for AI agents

**What it includes:**
- Project vision and goals
- Tech stack decisions (frontend, backend, database, deployment)
- Database schema planning
- API endpoint listing
- Feature roadmap
- Deployment plan
- Quarterly milestones

**Best for:**
- New projects that need a comprehensive overview
- Giving AI agents complete context in one file
- Teams that want a "single source of truth"

**How to use:**
1. Copy MASTER-PLAN-TEMPLATE.md to your project root as `MASTER-PLAN.md`
2. Fill in the sections (use AI agents like @CTO, @Planner to help)
3. Keep it updated as decisions are made
4. Reference it when working with AI agents

**Example AI prompt:**
```
Read MASTER-PLAN.md to understand the project context.

Act as @Backend agent and implement the user authentication endpoints
listed in Section 4 (API Endpoints).
```

**Size:** 800 lines | 14 KB

---

### [PHASE-TRACKER-TEMPLATE.md](./PHASE-TRACKER-TEMPLATE.md)

**Purpose:** Track implementation progress across 5 phases

**What it includes:**
- 5 development phases (Planning → Testing & QA)
- 40 example tasks with agent assignments
- Status tracking (⏳ Pending → 🔄 In Progress → ✅ Completed)
- Dependencies and blockers section
- Weekly progress snapshots

**Best for:**
- Breaking down large projects into manageable phases
- Tracking what's done vs what remains
- Coordinating multiple AI agents on different tasks
- Visualizing project progress

**How to use:**
1. Copy PHASE-TRACKER-TEMPLATE.md to your project as `PHASE-TRACKER.md`
2. Customize phases and tasks for your project
3. Update task status as you complete work
4. Use with AI agents for focused work

**Example workflow:**
```
Week 1: Focus on Phase 1 (Planning & Architecture)
- Work with @CTO on tech stack
- Work with @Database on schema design
- Update status to ✅ when complete

Week 2: Move to Phase 2 (Database & Backend)
- Work with @Backend on API endpoints
- Work with @Testing on unit tests
- Track progress in PHASE-TRACKER.md
```

**Size:** 329 lines | 11 KB

---

### [ORDER-TRACKER-TEMPLATE.md](./ORDER-TRACKER-TEMPLATE.md)

**Purpose:** Step-by-step execution guide with copy-paste prompts

**What it includes:**
- Numbered "orders" (1, 2, 3...) with exact prompts to paste
- Pre-written AI commands for each step
- Result documentation sections
- Execution log for tracking progress
- Blocker tracking

**Best for:**
- Users who want a scripted, guided experience
- Following exact sequences without deviating
- Learning the agent workflow (great for beginners)
- Projects where order of operations matters

**How to use:**
1. Copy ORDER-TRACKER-TEMPLATE.md to your project as `ORDERS.md`
2. Follow orders in sequence (Order #1, then #2, etc.)
3. Copy the prompt from each order into your AI tool
4. Paste the result back into the Result section
5. Move to next order when complete

**Example:**
```
Order #3: Database Schema

Prompt (copy this):
Read agents/2-development/database.md and continue as that agent.
Task: Create the User and Post tables with relationships.
[... full prompt ...]

Result:
[Paste @Database output here]
Migration: npx prisma migrate dev --name init
Status: ✅ Complete
```

**When to use ORDER-TRACKER vs PHASE-TRACKER:**
- **ORDER-TRACKER:** You want exact prompts, step-by-step guidance, more scripted
- **PHASE-TRACKER:** You want flexible task tracking, status overview, more freestyle

**Size:** 400+ lines | 15 KB

---

### [CASE-STUDY-TEMPLATE.md](./CASE-STUDY-TEMPLATE.md)

**Purpose:** Document real projects built with Ultra-Dex

**What it includes:**
- Project overview and metrics
- Tech stack decisions with reasoning
- Ultra-Dex agent usage breakdown
- Time savings and quality metrics
- Learnings and recommendations
- Screenshots and links

**Best for:**
- Sharing your success story
- Contributing to the Ultra-Dex community
- Documenting what worked (and what didn't)
- Building credibility for your portfolio

**How to use:**
1. Copy CASE-STUDY-TEMPLATE.md after shipping your project
2. Fill in the sections with real metrics
3. Submit via GitHub issue or PR
4. Get featured on the Ultra-Dex showcase (coming soon)

**Example submission:**
```
Title: Built a SaaS in 6 weeks with Ultra-Dex
Time saved: 40% vs previous projects
Key win: @Database agent designed perfect schema first try
```

**Size:** 150 lines | 4 KB

---

## 🎯 Which Template to Use?

### Use MASTER-PLAN when:
- ✅ Starting a new project from scratch
- ✅ Need to give AI complete project context
- ✅ Want a single-file overview of vision + tech + features
- ✅ Working alone or with 1-2 people

### Use PHASE-TRACKER when:
- ✅ Project is already defined (have tech stack, features)
- ✅ Need to track implementation progress
- ✅ Working with multiple AI agents on different tasks
- ✅ Team of 2+ people (need coordination)

### Use BOTH when:
- ✅ Large project (3+ months)
- ✅ MASTER-PLAN for vision/architecture
- ✅ PHASE-TRACKER for day-to-day task tracking

---

## 🚀 Getting Started

### Quick Setup (2 minutes)

**For new projects:**
```bash
# Copy both templates to your project
cp templates/MASTER-PLAN-TEMPLATE.md ./MASTER-PLAN.md
cp templates/PHASE-TRACKER-TEMPLATE.md ./PHASE-TRACKER.md

# Fill in the basics (use @Planner or @CTO agents)
# 1. Fill MASTER-PLAN.md Sections 1-3 (Vision, Tech Stack)
# 2. Fill PHASE-TRACKER.md Phase 1 tasks
```

**For existing projects:**
```bash
# If you already have vision/architecture:
cp templates/PHASE-TRACKER-TEMPLATE.md ./PHASE-TRACKER.md

# Break down your remaining work into phases
# Assign agents to each task
```

---

## 💡 How to Use with AI Agents

### Pattern 1: Context Loading
AI agents work best when they have full project context.

**Before asking AI to code:**
```
# Load context first
Read MASTER-PLAN.md (Sections 1-4) to understand:
- Project vision
- Tech stack
- Database schema
- API endpoints

# Then give task
Act as @Backend agent and implement user signup endpoint.
```

### Pattern 2: Agent Assignment
Assign specific agents to tasks in PHASE-TRACKER.

**Example from PHASE-TRACKER.md:**
```markdown
### Phase 2: Database & Backend
| Task | Status | Agent | Notes |
|------|--------|-------|-------|
| Design User schema | ✅ | @Database | Completed |
| Build auth API | 🔄 | @Backend | In progress |
| Write API tests | ⏳ | @Testing | Waiting |
```

**To work on the in-progress task:**
```
Load agents/2-development/backend.md

Read MASTER-PLAN.md Section 4 (API Endpoints) for specs.
Read PHASE-TRACKER.md Phase 2 to see current status.

Build the auth API endpoints (signup, login, logout).
```

### Pattern 3: Handoff Protocol
When completing a task, document for next agent.

**Example:**
```markdown
## Handoff from @Backend to @Testing

**Status:**
- ✅ Complete: Auth API (signup, login, logout, me)
- ✅ Complete: Password hashing (bcrypt)
- ⏳ Remaining: Rate limiting

**Deliverables:**
- POST /api/auth/signup - Creates user, returns JWT
- POST /api/auth/login - Validates credentials
- GET /api/auth/me - Returns current user

**Context for @Testing:**
- All endpoints need unit tests
- Use Jest for testing
- Coverage target: 80%+
- Test file: tests/auth.test.ts

**Next Action:**
Write unit tests for auth API endpoints. See PHASE-TRACKER.md Phase 2, Task 8.
```

---

## 📋 Template Customization

Both templates are **fully customizable**. Common modifications:

### MASTER-PLAN Customizations

**Add sections for:**
- Figma designs / wireframes
- Third-party integrations (Stripe, SendGrid)
- Environment variables reference
- Team roles and responsibilities

**Remove sections:**
- Quarterly roadmap (if solo project)
- Team section (if solo)
- Cost breakdown (if not needed yet)

### PHASE-TRACKER Customizations

**Add phases:**
- Phase 0: Research & Prototyping
- Phase 6: Beta Testing
- Phase 7: Launch & Marketing

**Modify task structure:**
- Add priority column (P0, P1, P2)
- Add time estimates
- Add links to PRs/issues
- Add blockers column

**Example customized task:**
```markdown
| Task | Priority | Status | Agent | Time | PR | Notes |
|------|----------|--------|-------|------|----|----|
| Build auth API | P0 | ✅ | @Backend | 4h | #23 | Ready |
```

---

## 🔄 Workflow Examples

### Example 1: Solo Developer, New SaaS

**Week 1:**
1. Fill MASTER-PLAN.md Sections 1-3 (vision, tech, schema)
2. Use @CTO agent to review architecture
3. Create PHASE-TRACKER.md with 5 phases

**Week 2-8:**
1. Work through Phase 1-5 in PHASE-TRACKER.md
2. Update status after each task
3. Use assigned agents (@Backend, @Frontend, etc.)

**Result:** Structured progress, clear priorities

---

### Example 2: Team of 3, Existing Project

**Setup:**
1. Create PHASE-TRACKER.md
2. Break remaining work into phases
3. Assign team members + AI agents to tasks

**Daily workflow:**
1. Check PHASE-TRACKER.md for current phase
2. Pick a ⏳ Pending task, mark 🔄 In Progress
3. Work with assigned AI agent
4. Update to ✅ when complete

**Result:** Clear coordination, no duplicate work

---

## 📊 Template Statistics

| Template | Lines | Size | Sections | Best For |
|----------|-------|------|----------|----------|
| MASTER-PLAN | 800 | 14 KB | 12 | Project overview & context |
| PHASE-TRACKER | 329 | 11 KB | 5 phases | Task tracking & progress |
| ORDER-TRACKER | 400 | 15 KB | 10 orders | Step-by-step execution |
| CASE-STUDY | 150 | 4 KB | 12 | Documenting success stories |
| **Total** | **1,679** | **44 KB** | **39** | **Complete project management** |

---

## 🔗 Related Resources

**Guides:**
- [Project Orchestration Guide](../docs/guides/PROJECT-ORCHESTRATION.md) - Multi-agent workflows
- [Advanced Workflows](../docs/guides/ADVANCED-WORKFLOWS.md) - Real-world examples

**Agent Prompts:**
- [Agent Index](../agents/00-AGENT_INDEX.md) - Quick reference for all 17 agents
- [Agents Directory](../agents/) - Full agent prompt library

**Core Framework:**
- [34-Section Template](../docs/reference/Saas%20plan/04-Imp-Template.md) - Complete implementation template
- [Main README](../README.md) - Project overview

---

## 💬 Common Questions

**Q: Do I need both templates?**
A: No. For small projects (<3 months), PHASE-TRACKER alone is enough. For large projects, use both.

**Q: Can I use these without AI agents?**
A: Yes! These are standard project management templates. The agent assignments are optional.

**Q: How often should I update these?**
A: Update MASTER-PLAN when architecture/tech changes. Update PHASE-TRACKER daily/weekly as tasks complete.

**Q: Can I integrate with Jira/Linear/GitHub Projects?**
A: Yes! Export tasks to your project management tool. Use templates as the "source of truth" for AI agents.

**Q: Are these in markdown on purpose?**
A: Yes! Markdown is:
  - Easy for AI to read and understand
  - Git-friendly (track changes over time)
  - Human-readable (no special tools needed)
  - Portable (works anywhere)

---

## 📝 Contributing

Found a better template structure? Want to add examples?

1. **Report issues:** [GitHub Issues](https://github.com/Srujan0798/Ultra-Dex/issues)
2. **Suggest improvements:** Open a discussion
3. **Submit templates:** Pull requests welcome

---

*Ultra-Dex v3.4.3 - Structured project management for AI-driven development*
