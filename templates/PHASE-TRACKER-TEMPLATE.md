# [Your Project Name] - Phase Tracker

> Track your SaaS implementation with Ultra-Dex agents

**Project:** [Your Project Name]
**Started:** [Date]
**Target Launch:** [Date]
**Last Updated:** [Date]

---

## How to Use This File

1. **Copy this template** to your project root
2. **Rename** to `PHASE-TRACKER.md`
3. **Fill in your project details** (name, dates, features)
4. **Define your phases** below (copy Phase 1 template for each phase)
5. **Mark tasks** as ✅ DONE, 🔄 IN PROGRESS, or ⏳ PENDING
6. **Work in order** - Don't skip ahead
7. **Update daily** - Keep this as your source of truth

---

## Project Overview

**Elevator Pitch:** [Your product in one sentence]

**Core Features:**
1. [Feature 1]
2. [Feature 2]
3. [Feature 3]

**Tech Stack:**
- Frontend: [Next.js / React / Vue]
- Backend: [Node.js / Python / Go]
- Database: [PostgreSQL / MongoDB / MySQL]
- Hosting: [Vercel / Railway / AWS]

---

## Progress Summary

| Phase | Tasks | Complete | Status |
|-------|-------|----------|--------|
| Phase 1: MVP Foundation | 1-10 | 0/10 | ⏳ NOT STARTED |
| Phase 2: Authentication | 11-18 | 0/8 | ⏳ PENDING |
| Phase 3: Core Feature | 19-28 | 0/10 | ⏳ PENDING |
| Phase 4: Polish & Test | 29-35 | 0/7 | ⏳ PENDING |
| Phase 5: Launch | 36-40 | 0/5 | ⏳ PENDING |

**Total Progress:** 0/40 tasks (0%)

**Next Task:** #1 - @Planner (Define MVP scope)

---

# PHASE 1: MVP FOUNDATION

**Goal:** Core feature working end-to-end (no auth, no polish)

**Duration:** 1-2 days

**Definition of Done:**
- [ ] Database schema deployed
- [ ] Core API endpoints working
- [ ] Basic UI renders
- [ ] Can create/read/update/delete main entity
- [ ] Deployed to staging

| # | Agent | Task | Status | Notes |
|---|-------|------|--------|-------|
| 1 | @Planner | Define MVP scope | ⏳ PENDING | |
| 2 | @CTO | Architecture review | ⏳ PENDING | |
| 3 | @Database | Schema design | ⏳ PENDING | |
| 4 | @Backend | Core API endpoints | ⏳ PENDING | |
| 5 | @Frontend | Basic UI | ⏳ PENDING | |
| 6 | @Testing | Write tests | ⏳ PENDING | |
| 7 | @Reviewer | Code review | ⏳ PENDING | |
| 8 | @DevOps | Deploy to staging | ⏳ PENDING | |

---

### Task 1: Define MVP Scope ⏳

```
Agent: @Planner
Status: ⏳ PENDING
Started: [Date]
Completed: [Date]

Command:
Load agents/1-leadership/planner.md

Task: Break down MVP into implementable tasks.

Project: [Your project name]
Goal: [What the MVP should do]
Features: [List main features]
Timeline: [Target completion]

Expected Output:
- Task list with dependencies
- Priority order
- Estimated complexity for each task

Next Agent: @CTO (architecture review)
```

**Result:**
```
[Paste @Planner output here after completion]
```

---

### Task 2: Architecture Review ⏳

```
Agent: @CTO
Status: ⏳ PENDING
Started: [Date]
Completed: [Date]

Command:
Load agents/1-leadership/cto.md

Task: Review MVP architecture and approve tech stack.

Context from @Planner:
[Paste task breakdown]

Questions:
1. Database choice (PostgreSQL, MongoDB, MySQL)?
2. API design (REST, GraphQL, tRPC)?
3. Authentication approach (defer to Phase 2)?
4. Hosting platform (Vercel, Railway, AWS)?

Expected Output:
- Approved architecture decisions
- Tech stack choices with rationale
- API design principles
- Database schema guidelines

Next Agent: @Database (schema design)
```

**Result:**
```
[Paste @CTO output here after completion]
```

---

### Task 3: Schema Design ⏳

```
Agent: @Database
Status: ⏳ PENDING
Started: [Date]
Completed: [Date]

Command:
Load agents/2-development/database.md

Task: Design database schema for MVP.

Requirements from @CTO:
[Paste approved data model]

Action:
- Create Prisma schema (or equivalent ORM)
- Define relationships between entities
- Add indexes for queries
- Create migration files

Expected Output:
- Schema file (prisma/schema.prisma)
- Migration command
- Seed data (optional)

Next Agent: @Backend (API implementation)
```

**Result:**
```
[Paste schema code here]

Migration command:
npx prisma migrate dev --name init

Status: ⏳ NOT RUN / ✅ MIGRATED
```

---

### Task 4: Core API Endpoints ⏳

```
Agent: @Backend
Status: ⏳ PENDING
Started: [Date]
Completed: [Date]

Command:
Load agents/2-development/backend.md

Task: Implement CRUD endpoints for main entity.

Schema from @Database:
[Reference schema]

Endpoints to build:
- GET /api/[resource] (list with pagination)
- GET /api/[resource]/:id (single item)
- POST /api/[resource] (create)
- PUT /api/[resource]/:id (update)
- DELETE /api/[resource]/:id (delete)

Requirements:
- Input validation
- Error handling
- TypeScript types

Expected Output:
- Working API endpoints
- Test curl commands
- Error handling for edge cases

Next Agent: @Frontend (UI implementation)
```

**Result:**
```
[Paste API code location]

Test commands:
curl [examples]

Status: ⏳ NOT TESTED / ✅ WORKING
```

---

### Task 5: Basic UI ⏳

```
Agent: @Frontend
Status: ⏳ PENDING
Started: [Date]
Completed: [Date]

Command:
Load agents/2-development/frontend.md

Task: Build basic UI for main feature.

API from @Backend:
[Reference endpoints]

Components needed:
- List view (shows all items)
- Detail view (shows single item)
- Create form
- Edit form
- Delete confirmation

Requirements:
- Responsive design
- Loading states
- Error handling
- Form validation

Expected Output:
- Working UI components
- Pages connected to API
- Basic styling (Tailwind CSS)

Next Agent: @Testing (write tests)
```

**Result:**
```
[Paste component locations]

Pages:
- /[resource] (list)
- /[resource]/:id (detail)
- /[resource]/new (create)

Status: ⏳ NOT TESTED / ✅ WORKING
```

---

### Task 6: Write Tests ⏳

```
Agent: @Testing
Status: ⏳ PENDING
Started: [Date]
Completed: [Date]

Command:
Load agents/5-quality/testing.md

Task: Write tests for MVP.

Code to test:
- Backend: 5 API endpoints
- Frontend: 5 components

Test types:
- Unit tests (functions, helpers)
- Integration tests (API endpoints)
- Component tests (UI rendering)

Coverage target: 80%+

Expected Output:
- Test files for all endpoints
- Test files for all components
- All tests passing
- Coverage report

Next Agent: @Reviewer (code review)
```

**Result:**
```
Tests written: [count]
Tests passing: [count]
Coverage: [percentage]

Command to run tests:
npm test

Status: ⏳ NOT RUN / ✅ PASSING
```

---

### Task 7: Code Review ⏳

```
Agent: @Reviewer
Status: ⏳ PENDING
Started: [Date]
Completed: [Date]

Command:
Load agents/5-quality/reviewer.md

Task: Review MVP code quality.

Files to review:
- Backend API code
- Frontend components
- Test files

Check for:
- Code quality (readability, DRY)
- Security (no secrets, input validation)
- Error handling
- Test coverage

Expected Output:
- Approval or list of changes needed
- Priority of changes (blocking vs nice-to-have)

Next Agent: @DevOps (if approved) or back to developer agents (if changes needed)
```

**Result:**
```
Review status: ⏳ PENDING / ✅ APPROVED / ❌ CHANGES NEEDED

Feedback:
[Paste review comments]

Blocking issues: [count]
Nice-to-have: [count]

Status: ⏳ / ✅ APPROVED
```

---

### Task 8: Deploy to Staging ⏳

```
Agent: @DevOps
Status: ⏳ PENDING
Started: [Date]
Completed: [Date]

Command:
Load agents/4-devops/devops.md

Task: Deploy MVP to staging environment.

Environment:
- Frontend: [Vercel / Netlify / etc]
- Backend: [Railway / Render / etc]
- Database: [Neon / PlanetScale / etc]

Environment variables:
- DATABASE_URL=[your-db-url]
- API_URL=[your-api-url]
- [other env vars]

Expected Output:
- Frontend URL: [staging-url]
- Backend URL: [api-staging-url]
- Smoke test passing

Next Phase: Phase 2 (Authentication)
```

**Result:**
```
Frontend: [URL]
Backend: [URL]
Database: [provider]

Smoke test:
curl [staging-api-url]/health
→ Status: ⏳ NOT DEPLOYED / ✅ LIVE

Phase 1 Complete: [Date]
```

---

# PHASE 2: AUTHENTICATION & USERS

**Goal:** Users can signup, login, and have personal data

**Duration:** 1 day

**Definition of Done:**
- [ ] User table in database
- [ ] Signup/login/logout working
- [ ] JWT or session-based auth
- [ ] Protected routes in frontend
- [ ] Tests passing
- [ ] Deployed

| # | Agent | Task | Status | Notes |
|---|-------|------|--------|-------|
| 9 | @Planner | Plan auth flow | ⏳ PENDING | |
| 10 | @CTO | Approve auth approach | ⏳ PENDING | |
| 11 | @Database | User table | ⏳ PENDING | |
| 12 | @Auth | Auth endpoints | ⏳ PENDING | |
| 13 | @Frontend | Login/signup UI | ⏳ PENDING | |
| 14 | @Testing | Auth tests | ⏳ PENDING | |
| 15 | @Security | Security audit | ⏳ PENDING | |
| 16 | @Reviewer | Code review | ⏳ PENDING | |
| 17 | @DevOps | Deploy | ⏳ PENDING | |

---

### Task 9-17: [Follow same pattern as Phase 1]

**Tip:** Copy the task template from Phase 1 and adapt for authentication feature.

---

# PHASE 3: CORE FEATURE (MAIN DIFFERENTIATOR)

**Goal:** [Your unique feature that makes the product valuable]

**Duration:** [Estimate]

**Definition of Done:**
- [ ] [Specific criteria for this feature]

[Define tasks 18-28 using the same template]

---

# PHASE 4: POLISH & TESTING

**Goal:** Make it production-ready

**Duration:** [Estimate]

**Definition of Done:**
- [ ] UI polished and responsive
- [ ] Error handling comprehensive
- [ ] Performance optimized
- [ ] Security audit passed
- [ ] Documentation complete

[Define tasks 29-35 using the same template]

---

# PHASE 5: LAUNCH PREPARATION

**Goal:** Deploy to production and announce

**Duration:** [Estimate]

**Definition of Done:**
- [ ] Production environment configured
- [ ] Domain configured
- [ ] Monitoring setup
- [ ] Landing page live
- [ ] Launch announcement ready

[Define tasks 36-40 using the same template]

---

## Weekly Progress Report

### Week 1: [Date Range]
**Progress:** [X]% complete
**Tasks Completed:** [count]
**Blockers:** [list any blockers]
**Next Week Goals:** [what you'll tackle]

### Week 2: [Date Range]
[Same format]

---

## Notes & Decisions

### Technical Decisions
- [Date] Decided to use PostgreSQL instead of MongoDB because [reason]
- [Date] Switched from REST to tRPC because [reason]

### Changes to Plan
- [Date] Added Task 41: [new task] because [reason]
- [Date] Removed Task 15 because [no longer needed]

### Learnings
- [Date] Discovered that [insight]
- [Date] Agent @Backend works best when [tip]

---

## Resources

**Agent Files:**
- All agents: [agents/00-AGENT_INDEX.md](../agents/00-AGENT_INDEX.md)
- Orchestration guide: [guides/PROJECT-ORCHESTRATION.md](../docs/guides/PROJECT-ORCHESTRATION.md)

**Templates:**
- Master Plan: [templates/MASTER-PLAN-TEMPLATE.md](../templates/MASTER-PLAN-TEMPLATE.md)

**Examples:**
- Workflow examples: [Orchestration/EXAMPLES.md](../Orchestration/EXAMPLES.md)

---

## Maintenance Checklist

**Daily:**
- [ ] Update task statuses (⏳ → 🔄 → ✅)
- [ ] Note any blockers
- [ ] Update progress summary

**Weekly:**
- [ ] Review completed tasks
- [ ] Plan next week's focus
- [ ] Update launch timeline if needed

**Monthly:**
- [ ] Archive completed phases
- [ ] Review technical decisions
- [ ] Update learnings section

---

*Template from Ultra-Dex v3.4.5 - Professional AI Orchestration Meta Layer*
