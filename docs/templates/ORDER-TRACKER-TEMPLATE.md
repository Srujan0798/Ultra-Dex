# [Your Project] - Order Tracker

> Step-by-step execution guide with copy-paste prompts

**Project:** [Your Project Name]
**Started:** [Date]
**Current Order:** #1

---

## How to Use This File

This is a **scripted execution guide**. Follow the orders in sequence:

1. **Copy** the prompt from the current order
2. **Paste** into your AI tool (Claude Code, Cursor, ChatGPT)
3. **Execute** and wait for completion
4. **Document** the result in the Result section
5. **Move** to next order

**Status Key:**

- ⏳ Pending
- 🔄 In Progress
- ✅ Complete
- ❌ Blocked

---

## Progress Overview

| Phase                 | Orders | Status |
| --------------------- | ------ | ------ |
| Phase 1: Foundation   | #1-5   | ⏳ 0/5 |
| Phase 2: Core Feature | #6-12  | ⏳ 0/7 |
| Phase 3: Polish       | #13-18 | ⏳ 0/6 |
| Phase 4: Launch       | #19-22 | ⏳ 0/4 |

**Total:** 0/22 orders complete

---

# PHASE 1: FOUNDATION

## Order #1: Project Planning ⏳

**Agent:** @Planner
**Depends on:** None
**Estimated time:** 10-15 minutes

### Prompt (Copy this)

```
Read agents/1-leadership/planner.md and continue as that agent.

Task: Break down the MVP for [Your Project Name] into implementable tasks.

Project Context:
- Product: [One sentence description]
- Core Feature: [Main functionality]
- Target User: [Who uses this]
- Tech Stack: [Next.js / Node.js / PostgreSQL / etc.]

Create a task breakdown with:
1. Database tables needed
2. API endpoints required
3. UI pages/components
4. Dependencies between tasks

Output: Numbered task list with agent assignments.
```

### Result

```
[Paste @Planner output here after execution]

Tasks identified: [count]
Phases defined: [count]
```

**Status:** ⏳ → [Update to ✅ when done]

---

## Order #2: Architecture Review ⏳

**Agent:** @CTO
**Depends on:** Order #1
**Estimated time:** 10-15 minutes

### Prompt (Copy this)

```
Read agents/1-leadership/cto.md and continue as that agent.

Task: Review and approve the architecture for [Your Project Name].

Context from @Planner:
[Paste the task breakdown from Order #1]

Questions to answer:
1. Is the tech stack appropriate for this use case?
2. What's the database schema approach?
3. API design: REST vs tRPC vs GraphQL?
4. Authentication strategy?
5. Any scalability concerns?

Output: Approved architecture with specifications for each decision.
```

### Result

```
[Paste @CTO output here after execution]

Decisions made:
- Database: [choice]
- API: [choice]
- Auth: [choice]
```

**Status:** ⏳ → [Update to ✅ when done]

---

## Order #3: Database Schema ⏳

**Agent:** @Database
**Depends on:** Order #2
**Estimated time:** 15-20 minutes

### Prompt (Copy this)

```
Read agents/2-development/database.md and continue as that agent.

Task: Create the database schema for [Your Project Name].

Approved architecture from @CTO:
[Paste relevant database decisions from Order #2]

Requirements:
- Tables needed: [list from Order #1]
- Relationships: [describe relationships]
- Use Prisma ORM

Output:
1. Complete prisma/schema.prisma file
2. Migration command
3. Seed data (if applicable)
```

### Result

```
[Paste @Database output here]

Schema file: prisma/schema.prisma
Tables created: [list]
Migration command: npx prisma migrate dev --name init
```

**Execute migration:**

```bash
npx prisma migrate dev --name init
npx prisma generate
```

**Migration status:** ⏳ → [Update to ✅ when run]

**Status:** ⏳ → [Update to ✅ when done]

---

## Order #4: Backend API ⏳

**Agent:** @Backend
**Depends on:** Order #3
**Estimated time:** 30-45 minutes

### Prompt (Copy this)

```
Read agents/2-development/backend.md and continue as that agent.

Task: Implement the core API endpoints for [Your Project Name].

Database schema from @Database:
[Reference the schema created in Order #3]

Endpoints to build:
1. GET /api/[resource] - List with pagination
2. GET /api/[resource]/:id - Get single item
3. POST /api/[resource] - Create new
4. PUT /api/[resource]/:id - Update
5. DELETE /api/[resource]/:id - Delete

Requirements:
- Input validation with Zod
- Error handling
- TypeScript types
- Prisma for database access

Output: Complete API route files with all endpoints.
```

### Result

```
[Paste @Backend output here]

Files created:
- src/app/api/[resource]/route.ts
- src/lib/validations/[resource].ts

Test commands:
curl -X GET http://localhost:3000/api/[resource]
curl -X POST http://localhost:3000/api/[resource] -d '{...}'
```

**API tested:** ⏳ → [Update to ✅ when verified]

**Status:** ⏳ → [Update to ✅ when done]

---

## Order #5: Frontend UI ⏳

**Agent:** @Frontend
**Depends on:** Order #4
**Estimated time:** 30-45 minutes

### Prompt (Copy this)

```
Read agents/2-development/frontend.md and continue as that agent.

Task: Build the core UI for [Your Project Name].

API endpoints from @Backend:
[List the endpoints created in Order #4]

Pages to build:
1. /[resource] - List page with table/cards
2. /[resource]/[id] - Detail page
3. /[resource]/new - Create form
4. /[resource]/[id]/edit - Edit form

Requirements:
- Next.js App Router
- Tailwind CSS for styling
- Loading and error states
- Form validation
- Responsive design

Output: Complete page and component files.
```

### Result

```
[Paste @Frontend output here]

Files created:
- src/app/[resource]/page.tsx
- src/app/[resource]/[id]/page.tsx
- src/components/[Resource]Form.tsx
- src/components/[Resource]List.tsx

Manual test:
1. Visit http://localhost:3000/[resource]
2. Create new item
3. Edit item
4. Delete item
```

**UI tested:** ⏳ → [Update to ✅ when verified]

**Status:** ⏳ → [Update to ✅ when done]

---

# PHASE 2: CORE FEATURE

## Order #6: Feature Planning ⏳

**Agent:** @Planner
**Depends on:** Phase 1 complete
**Estimated time:** 10 minutes

### Prompt (Copy this)

```
Read agents/1-leadership/planner.md and continue as that agent.

Task: Plan the implementation of [Core Feature Name].

Context:
- Phase 1 complete: Basic CRUD working
- Now adding: [Describe the core feature]

Break down into:
1. Database changes needed
2. New API endpoints
3. UI components
4. Integration points

Output: Ordered task list for this feature.
```

### Result

```
[Paste output here]
```

**Status:** ⏳

---

## Order #7: Feature Database Changes ⏳

**Agent:** @Database
**Depends on:** Order #6
**Estimated time:** 15 minutes

### Prompt (Copy this)

```
Read agents/2-development/database.md and continue as that agent.

Task: Update schema for [Core Feature Name].

Requirements from @Planner:
[Paste database requirements from Order #6]

Current schema: [Reference existing tables]

Output:
1. Schema additions/modifications
2. Migration file
3. Updated seed data if needed
```

### Result

```
[Paste output here]

Migration: npx prisma migrate dev --name add_[feature]
```

**Status:** ⏳

---

## Order #8: Feature Backend ⏳

**Agent:** @Backend
**Depends on:** Order #7
**Estimated time:** 30 minutes

### Prompt (Copy this)

```
Read agents/2-development/backend.md and continue as that agent.

Task: Implement API for [Core Feature Name].

Schema from @Database:
[Reference updated schema]

Endpoints needed:
[List from Order #6]

Output: Complete API implementation with tests.
```

### Result

```
[Paste output here]
```

**Status:** ⏳

---

## Order #9: Feature Frontend ⏳

**Agent:** @Frontend
**Depends on:** Order #8
**Estimated time:** 30 minutes

### Prompt (Copy this)

```
Read agents/2-development/frontend.md and continue as that agent.

Task: Build UI for [Core Feature Name].

API from @Backend:
[Reference endpoints from Order #8]

Components needed:
[List from Order #6]

Output: Complete UI implementation.
```

### Result

```
[Paste output here]
```

**Status:** ⏳

---

## Order #10: Write Tests ⏳

**Agent:** @Testing
**Depends on:** Orders #8, #9
**Estimated time:** 20 minutes

### Prompt (Copy this)

```
Read agents/5-quality/testing.md and continue as that agent.

Task: Write tests for [Core Feature Name].

Code to test:
- Backend: [List endpoints]
- Frontend: [List components]

Coverage target: 80%+

Output:
1. API tests (Jest/Vitest)
2. Component tests (React Testing Library)
3. E2E test for main flow (Playwright)
```

### Result

```
[Paste output here]

Run tests: npm test
Coverage: [X]%
```

**Status:** ⏳

---

## Order #11: Security Audit ⏳

**Agent:** @Security
**Depends on:** Order #10
**Estimated time:** 15 minutes

### Prompt (Copy this)

```
Read agents/3-security/security.md and continue as that agent.

Task: Security audit for [Core Feature Name].

Code to review:
- API routes: [list files]
- Frontend forms: [list files]

Check for:
- Input validation
- SQL injection
- XSS vulnerabilities
- Auth/authz issues
- Sensitive data exposure

Output: Security report with findings and fixes.
```

### Result

```
[Paste output here]

Findings: [count]
Critical: [count]
Fixed: [Y/N]
```

**Status:** ⏳

---

## Order #12: Code Review ⏳

**Agent:** @Reviewer
**Depends on:** Order #11
**Estimated time:** 15 minutes

### Prompt (Copy this)

```
Read agents/5-quality/reviewer.md and continue as that agent.

Task: Final review for [Core Feature Name].

Files to review:
[List all files from Orders #7-11]

Check:
- Code quality
- Test coverage
- Security fixes applied
- Documentation

Output: Approval or change requests.
```

### Result

```
[Paste output here]

Status: APPROVED / CHANGES NEEDED
```

**Status:** ⏳

---

# PHASE 3: POLISH

## Order #13: Authentication ⏳

**Agent:** @Auth
**Depends on:** Phase 2 complete
**Estimated time:** 30 minutes

### Prompt (Copy this)

```
Read agents/3-security/auth.md and continue as that agent.

Task: Implement authentication for [Your Project Name].

Requirements:
- Sign up with email/password
- Login/logout
- Protected routes
- Session management

Tech: [NextAuth / Clerk / Custom JWT]

Output: Complete auth implementation.
```

### Result

```
[Paste output here]
```

**Status:** ⏳

---

## Order #14-18: [Additional Polish Orders]

[Follow the same pattern for:]

- #14: UI Polish (@Frontend)
- #15: Performance Optimization (@Performance)
- #16: Error Handling (@Backend, @Frontend)
- #17: Documentation (@Documentation)
- #18: Final Testing (@Testing)

---

# PHASE 4: LAUNCH

## Order #19: Pre-Launch Checklist ⏳

**Agent:** @DevOps
**Depends on:** Phase 3 complete
**Estimated time:** 10 minutes

### Prompt (Copy this)

```
Read agents/4-devops/devops.md and continue as that agent.

Task: Pre-launch checklist for [Your Project Name].

Verify:
- [ ] Environment variables documented
- [ ] Database migrations ready
- [ ] Error tracking configured
- [ ] Logging setup
- [ ] Health check endpoint
- [ ] SSL certificates
- [ ] Domain DNS

Output: Checklist status and any blockers.
```

### Result

```
[Paste output here]
```

**Status:** ⏳

---

## Order #20: Deploy to Staging ⏳

**Agent:** @DevOps
**Depends on:** Order #19
**Estimated time:** 20 minutes

### Prompt (Copy this)

```
Read agents/4-devops/devops.md and continue as that agent.

Task: Deploy to staging environment.

Platform: [Vercel / Railway / etc.]

Steps:
1. Set environment variables
2. Deploy application
3. Run database migrations
4. Smoke test

Output: Staging URL and test results.
```

### Result

```
[Paste output here]

Staging URL: https://[your-app]-staging.vercel.app
Smoke test: PASS / FAIL
```

**Status:** ⏳

---

## Order #21: Production Deploy ⏳

**Agent:** @DevOps
**Depends on:** Order #20 passing
**Estimated time:** 15 minutes

### Prompt (Copy this)

```
Read agents/4-devops/devops.md and continue as that agent.

Task: Deploy to production.

Staging verified: [Yes/No]

Steps:
1. Production environment variables
2. Deploy to production
3. Verify health check
4. Monitor for errors

Output: Production URL and monitoring links.
```

### Result

```
[Paste output here]

Production URL: https://[your-app].com
Health check: PASS / FAIL
Monitoring: [Sentry dashboard link]
```

**Status:** ⏳

---

## Order #22: Launch Complete ✅

**Final Checklist:**

- [ ] Production deployed and healthy
- [ ] Monitoring configured
- [ ] Documentation complete
- [ ] Team notified

**Launch Date:** [Date]
**Production URL:** [URL]

---

## Execution Log

| Date | Order | Agent     | Duration | Notes |
| ---- | ----- | --------- | -------- | ----- |
|      | #1    | @Planner  |          |       |
|      | #2    | @CTO      |          |       |
|      | #3    | @Database |          |       |
|      | ...   | ...       |          |       |

---

## Blockers & Resolutions

### Blocker #1: [Title]

**Order:** #[X]
**Issue:** [Description]
**Resolution:** [How it was resolved]
**Date resolved:** [Date]

---

_Template from Ultra-Dex v3.4.5 - Step-by-step AI orchestration_
