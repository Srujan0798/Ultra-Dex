# Multi-Tool AI Orchestration

> How to use Claude Code + Cursor + Copilot + ChatGPT + Gemini together with Ultra-Dex agents

---

## The Problem

You have multiple AI tools installed:
- Claude Code (best reasoning)
- Cursor (fast coding)
- GitHub Copilot (autocomplete)
- ChatGPT (research, free web search)
- Gemini (free alternative)

But when you switch between them:
- **Context gets lost** - each tool starts fresh
- **Work gets duplicated** - you re-explain the same thing
- **No coordination** - tools don't know what others did
- **Inconsistent quality** - no systematic approach

**Result:** Wasted time, higher costs, mediocre output

---

## The Solution: Ultra-Dex Orchestration

Ultra-Dex provides the **coordination layer** that makes ANY AI tool work together:

```
┌─────────────────────────────────────────────────────────┐
│                    ULTRA-DEX (Meta Layer)                │
│          Agents • Workflow • Quality Gates              │
└──────────────┬──────────────────────────────────────────┘
               │
     ┌─────────┼─────────┬──────────┬──────────┐
     │         │         │          │          │
   Claude    Cursor   Copilot   ChatGPT    Gemini
   Code
```

**How it works:**
1. **Shared State** - All tools read/write to IMPLEMENTATION-PLAN.md, CONTEXT.md
2. **Agent Roles** - Each tool acts as a specific agent (@Backend, @Frontend, etc.)
3. **Handoff Protocol** - Agents document what they built for the next agent
4. **Quality Gates** - Each agent checks criteria before passing work forward

---

## Setup (2 minutes)

### Step 1: Install Ultra-Dex

```bash
npx ultra-dex init
```

This creates:
- `IMPLEMENTATION-PLAN.md` - Shared project state
- `CONTEXT.md` - Project background
- `.agents/` - Agent prompt files
- `QUICK-START.md` - Your captured idea

### Step 2: Use ANY AI Tool

In **any** AI tool (Claude, Cursor, ChatGPT, etc.), paste:

```
Act as @Backend agent from .agents/backend.md.
Read IMPLEMENTATION-PLAN.md to understand the project.
Implement the user authentication API.
```

**That's it!** Now all your AI tools are coordinated.

---

## Example Workflow: Building Authentication

Let's build user authentication using 4 different AI tools:

### 1. @Planner in ChatGPT (Free!)

```
You: "Act as @Planner from .agents/planner.md. Read IMPLEMENTATION-PLAN.md
and break down 'Add user authentication' into implementable tasks."
```

ChatGPT breaks it down:
- Task 1: Database schema (User table)
- Task 2: Auth API endpoints (signup, login, logout)
- Task 3: Login/signup UI components
- Task 4: Security review

**Updates:** IMPLEMENTATION-PLAN.md with task breakdown

---

### 2. @CTO in Claude Code (Best Reasoning)

```
You: "Act as @CTO from .agents/cto.md. Read IMPLEMENTATION-PLAN.md.
Review the authentication architecture and make tech stack decisions."
```

Claude decides:
- JWT tokens (stateless)
- httpOnly cookies (XSS protection)
- bcrypt password hashing
- Refresh + access token pattern

**Updates:** CONTEXT.md with architecture decisions

---

### 3. @Database in Cursor (Fast Coding)

```
You: "Act as @Database from .agents/database.md. Read CONTEXT.md.
Create the User schema with Prisma."
```

Cursor generates:
```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String   // bcrypt hashed
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

Cursor also creates migration: `npx prisma migrate dev`

**Hands off to:** @Backend (schema ready)

---

### 4. @Backend in Claude Code (API Implementation)

```
You: "Act as @Backend from .agents/backend.md. Read CONTEXT.md and the Prisma schema.
Implement authentication API endpoints."
```

Claude implements:
- `POST /api/auth/signup` - Create user, hash password
- `POST /api/auth/login` - Verify credentials, return JWT
- `POST /api/auth/logout` - Clear session
- `GET /api/auth/me` - Get current user

**Hands off to:** @Frontend (API ready)

---

### 5. @Frontend in Copilot (UI Components)

```
You: "Act as @Frontend from .agents/frontend.md. Read the API spec.
Create login and signup form components."
```

Copilot creates:
- `LoginForm.tsx` - Email/password form, calls `/api/auth/login`
- `SignupForm.tsx` - Registration form
- `AuthContext.tsx` - React context for auth state
- `ProtectedRoute.tsx` - Redirect if not logged in

**Hands off to:** @Security (UI ready)

---

### 6. @Security in ChatGPT (Security Audit)

```
You: "Act as @Security from .agents/security.md. Review the authentication code
for security vulnerabilities."
```

ChatGPT checks:
- ✅ Passwords hashed with bcrypt
- ✅ JWT secret from environment variable
- ✅ httpOnly cookies (prevents XSS)
- ✅ Rate limiting on login endpoint
- ⚠️ Missing: CSRF protection (recommends adding)

**Hands off to:** @Reviewer (security approved with notes)

---

### 7. @Reviewer in Claude Code (Final Review)

```
You: "Act as @Reviewer from .agents/reviewer.md. Review all authentication code."
```

Claude reviews:
- Code quality: ✅ Good
- Tests: ⚠️ Missing (writes tests)
- Documentation: ⚠️ Missing (adds API docs)
- Security fixes: ✅ Implements CSRF protection

**Hands off to:** @DevOps (approved for deployment)

---

### 8. @DevOps in Cursor (Deployment)

```
You: "Act as @DevOps from .agents/devops.md. Deploy authentication to staging."
```

Cursor:
- Sets `JWT_SECRET` in environment
- Deploys to Vercel/Railway
- Runs smoke tests
- Verifies auth flow works

**Done!** ✅

---

## Key Principles

### 1. Shared State via Files

All AI tools read/write to the same files:

- **IMPLEMENTATION-PLAN.md** - The master plan, task breakdown
- **CONTEXT.md** - Decisions, architecture, important notes
- **.agents/** - Agent role definitions

This ensures **context preservation** across tools.

### 2. Agent Handoff

Each agent documents what they built:

```markdown
## Handoff from @Backend to @Frontend

### What I Built
- POST /api/auth/signup - Creates user
- POST /api/auth/login - Returns JWT token
- GET /api/auth/me - Returns current user

### API Contract
```typescript
// Login endpoint
POST /api/auth/login
Body: { email: string, password: string }
Response: { token: string, user: { id, email } }
```

### Next Steps for @Frontend
- Create login form that calls POST /api/auth/login
- Store token in httpOnly cookie
- Implement protected routes
```

This ensures **seamless handoff** between agents.

### 3. Quality Gates

Each agent checks criteria before moving forward:

**@Backend Checklist:**
- [ ] API endpoints tested
- [ ] Error handling implemented
- [ ] Database queries optimized
- [ ] API documented

**@Frontend Checklist:**
- [ ] Responsive on mobile
- [ ] Accessible (keyboard navigation)
- [ ] Loading/error states
- [ ] Tests written

This ensures **consistent quality**.

### 4. Tool Specialization

Use each AI for what it does best:

| Tool | Best For | Cost | Use When |
|------|----------|------|----------|
| **Claude Code** | Complex reasoning, architecture | $18/MTok (Sonnet) | Planning, refactoring, reviews |
| **Cursor** | Fast coding, autocomplete | Free or $20/mo | Implementation, quick edits |
| **Copilot** | Code suggestions | $10/mo | Inline suggestions, boilerplate |
| **ChatGPT** | Research, planning | Free tier | Research, task breakdown |
| **Gemini** | Free alternative | Free | Budget-friendly alternative |

**Strategy:** Use ChatGPT for planning (free), Claude Code for architecture (best reasoning), Cursor for implementation (fast), ChatGPT for security review (free).

**Avg cost per feature:** $2-5 (vs $50+ with single expensive tool)

---

## Advanced: Multi-Tool Workflows

### Parallel Work

**Scenario:** Backend and Frontend work in parallel

1. @CTO (Claude): Define API contract
2. @Backend (Cursor) + @Frontend (Copilot) work simultaneously
   - Backend implements API
   - Frontend builds UI (mocking API)
3. @Integration (Claude): Verify they work together

### Tool Switching Mid-Task

**Scenario:** Start in Cursor, get stuck, switch to Claude

1. Cursor builds API endpoint (fast)
2. Hit complex edge case
3. **Document current state** in IMPLEMENTATION-PLAN.md:
   ```markdown
   ## Current Status
   - ✅ Basic endpoint working
   - ⚠️ Need help with rate limiting logic
   ```
4. Switch to Claude Code: "Act as @Backend. Read IMPLEMENTATION-PLAN.md. Help with rate limiting."
5. Claude solves it, documents solution
6. Switch back to Cursor to implement

---

## Troubleshooting

### Issue: AI doesn't remember context

**Solution:** Always start with:
```
Act as @[AgentName] from .agents/[agent].md.
Read IMPLEMENTATION-PLAN.md to understand the project.
```

### Issue: Work gets duplicated

**Solution:** Update IMPLEMENTATION-PLAN.md after each agent:
```markdown
## Completed
- ✅ Database schema (by @Database)
- ✅ Auth API (by @Backend)

## In Progress
- 🔄 Login UI (by @Frontend)

## TODO
- ⏳ Security review
- ⏳ Deployment
```

### Issue: AI suggests wrong tech stack

**Solution:** Make sure CONTEXT.md has clear decisions:
```markdown
## Tech Stack Decisions

**Backend:** Node.js + Express + Prisma + PostgreSQL
**Frontend:** Next.js + React + Tailwind
**Hosting:** Vercel

DO NOT suggest alternatives. These decisions are final.
```

---

## Benefits

### Before Ultra-Dex

- **Time:** 3-4 hours per feature
- **Cost:** $10-15 in API costs
- **Quality:** Mediocre (no systematic review)
- **Context:** Lost when switching tools

### With Ultra-Dex

- **Time:** 45 minutes per feature (4x faster)
- **Cost:** $2-3 (5x cheaper via hybrid approach)
- **Quality:** Production-grade (systematic review)
- **Context:** Preserved across ALL tools

**ROI:** 4x faster, 5x cheaper, 10x better quality

---

## Quick Reference

```bash
# 1. Setup (once)
npx ultra-dex init

# 2. In ANY AI tool, start with:
Act as @[AgentName] from .agents/[agent].md.
Read IMPLEMENTATION-PLAN.md.
[Your specific task]

# 3. Common agents:
@Planner - Task breakdown
@CTO - Architecture decisions
@Backend - API implementation
@Frontend - UI implementation
@Database - Schema design
@Testing - Write tests
@Security - Security audit
@Reviewer - Code review
@DevOps - Deployment
```

---

## Related Guides

**Get Started:**
- [Project Orchestration](./PROJECT-ORCHESTRATION.md) - Step-by-step guide to build features with agents
- [Advanced Workflows](./ADVANCED-WORKFLOWS.md) - Real-world examples (Stripe, emails, migrations)

**Decision Frameworks:**
- [AI Model Selection](./AI-MODEL-SELECTION.md) - Choose the right AI for each task
- [Database Selection](./DATABASE-DECISION-FRAMEWORK.md) - Choose the right database
- [Architecture Patterns](./ARCHITECTURE-PATTERNS.md) - Choose the right architecture

**Agent Reference:**
- [Agent Index](../agents/00-AGENT_INDEX.md) - Quick reference for all 17 agents

---

**Ultra-Dex: Your AI Orchestration Meta Layer**

We don't replace your AI tools. We coordinate them.
