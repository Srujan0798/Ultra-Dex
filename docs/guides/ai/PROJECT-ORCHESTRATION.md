# Ultra-Dex Project Orchestration Guide

> How to coordinate 16 AI agents to build your SaaS from scratch

**Last Updated:** January 23, 2026
**Ultra-Dex Version:** v6.0.0 OVERPOWERED

---

## Quick Start

**New to Ultra-Dex?** Start here: [Your First Feature in 30 Minutes](#your-first-feature-building-authentication)

**Experienced user?** Jump to: [Full Production Pipeline](#full-production-pipeline)

---

## What is Agent Orchestration?

Ultra-Dex provides **16 specialized AI agents** organized in **6 tiers**. Each agent has a specific role in the production pipeline.

**The Problem:** You have great agents, but how do you coordinate them to build a feature?

**The Solution:** This guide shows you **exactly** how to orchestrate agents step-by-step, with real commands and expected outputs.

---

## Your First Feature: Building Authentication

**Goal:** Build user signup/login with JWT authentication in 30 minutes

**Agents Used:** 7 agents across all tiers

**Prerequisites:**

- Ultra-Dex initialized (`npx ultra-dex init`)
- Your AI tool ready (Claude Code, Cursor, ChatGPT, etc.)

---

### Step 1: Planning (@Planner) - 3 minutes

**Open your AI tool and paste:**

```
Load agents/1-leadership/planner.md

Task: Break down "user authentication with JWT" into implementation tasks.

Project context:
- Stack: Next.js (frontend), Node.js + Express (backend), PostgreSQL (database)
- Goal: Users can signup, login, and access protected routes
```

**Expected Output:**

```
@Planner Analysis:

Phase 1: Database
- Task 1: Create User table (email, passwordHash, createdAt)
- Task 2: Create migration

Phase 2: Backend API
- Task 3: POST /api/auth/signup (create user, return JWT)
- Task 4: POST /api/auth/login (validate credentials, return JWT)
- Task 5: GET /api/auth/me (verify JWT, return user)
- Task 6: POST /api/auth/logout (clear session)

Phase 3: Frontend
- Task 7: Signup form component
- Task 8: Login form component
- Task 9: Protected route wrapper (redirects if not logged in)

Phase 4: Testing
- Task 10: API tests
- Task 11: Component tests

Phase 5: Review & Deploy
- Task 12: Code review
- Task 13: Deploy

Dependencies:
- Database → Backend → Frontend → Testing → Review → Deploy
```

**✅ Checkpoint:** You now have a clear task list. Move to architecture review.

---

### Step 2: Architecture Review (@CTO) - 3 minutes

**In your AI tool:**

```
Load agents/1-leadership/cto.md

Task: Review authentication architecture. Approve or suggest changes.

Context: Planner suggests JWT authentication with signup/login/me/logout endpoints.
Stack: Next.js, Node.js + Express, PostgreSQL

Questions:
1. JWT or session-based auth?
2. Where to store JWT (localStorage, cookies, httpOnly cookies)?
3. Token expiration policy?
4. Password hashing algorithm?
```

**Expected Output:**

```
@CTO Architecture Review:

✅ APPROVED with specifications:

Authentication Method: JWT tokens
Rationale: Stateless, scalable, works with API-first architecture

Token Storage: httpOnly cookies (name: auth_token)
Rationale: Secure against XSS attacks, not accessible via JavaScript

Token Expiration: 7 days
Rationale: Balance between security and user convenience

Password Hashing: bcrypt with cost factor 10
Rationale: Industry standard, resistant to rainbow table attacks

Additional Requirements:
- Rate limiting: Max 5 login attempts per minute per IP
- JWT secret: Store in environment variable JWT_SECRET
- CORS: Configure for localhost:3000 (dev) and production domain

Handoff to @Database: Create User table with email (unique), passwordHash, createdAt, updatedAt
```

**✅ Checkpoint:** Architecture approved. Move to database implementation.

---

### Step 3: Database Schema (@Database) - 3 minutes

**In your AI tool:**

```
Load agents/2-development/database.md

Task: Create User table based on @CTO's specifications.

Requirements from @CTO:
- Fields: email (unique), passwordHash, createdAt, updatedAt
- Email must be unique index
- Use Prisma for schema

Action: Generate Prisma schema and migration.
```

**Expected Output:**

```
@Database Implementation:

Prisma Schema (prisma/schema.prisma):

model User {
  id           String   @id @default(uuid())
  email        String   @unique
  passwordHash String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

Migration Command:
npx prisma migrate dev --name add_users

Seed Data (optional):
npx prisma db seed

✅ Schema created
✅ Unique index on email
✅ UUIDs for IDs (scalable)

Handoff to @Backend:
- User model ready
- Import PrismaClient and use prisma.user.create(), prisma.user.findUnique()
- Connection string should be in DATABASE_URL environment variable
```

**Action:** Run the migration command in your terminal.

```bash
cd backend
npx prisma migrate dev --name add_users
npx prisma generate
```

**✅ Checkpoint:** Database ready. Move to backend API.

---

### Step 4: Backend API (@Backend) - 8 minutes

**In your AI tool:**

```
Load agents/2-development/backend.md

Task: Implement authentication API endpoints.

Requirements from @CTO:
- POST /api/auth/signup - Create user, hash password with bcrypt (cost: 10), return JWT in httpOnly cookie
- POST /api/auth/login - Verify password, return JWT in httpOnly cookie
- GET /api/auth/me - Verify JWT from cookie, return user data
- POST /api/auth/logout - Clear auth_token cookie
- JWT expiration: 7 days
- Rate limiting: 5 requests/minute for signup/login
- JWT secret from JWT_SECRET environment variable

Database: Use Prisma with User model (from @Database)

Action: Generate complete API code with error handling.
```

**Expected Output:**

```
@Backend Implementation:

File: backend/src/routes/auth.ts

[Full code for 4 endpoints provided]

Key Features:
✅ bcrypt password hashing (cost: 10)
✅ JWT tokens (expires in 7 days)
✅ httpOnly cookies (secure)
✅ Rate limiting middleware (5 req/min)
✅ Error handling (validation, unique email, invalid credentials)
✅ TypeScript types

Test Commands:
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Use a secure, randomly generated password following company standards"}'

curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Use a secure, randomly generated password following company standards"}'

curl -X GET http://localhost:3001/api/auth/me \
  -H "Cookie: auth_token=<token_from_login>"

Handoff to @Frontend:
- All 4 endpoints working
- Cookies: auth_token (httpOnly, 7 days)
- Base URL: http://localhost:3001 (dev), configure for production
- CORS enabled for localhost:3000
```

**Action:** Copy the code to your backend, start server, test with curl.

```bash
cd backend
npm install bcrypt jsonwebtoken express-rate-limit
npm run dev

# Test signup endpoint
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

**✅ Checkpoint:** API working. Move to frontend.

---

### Step 5: Frontend UI (@Frontend) - 8 minutes

**In your AI tool:**

```
Load agents/2-development/frontend.md

Task: Build authentication UI components.

Requirements:
- Signup form (email, password, confirm password)
- Login form (email, password)
- Protected route wrapper (checks /api/auth/me)
- Logout button

API Endpoints from @Backend:
- POST /api/auth/signup
- POST /api/auth/login
- GET /api/auth/me
- POST /api/auth/logout

Stack: Next.js 14, React, Tailwind CSS

Action: Generate components with error handling and loading states.
```

**Expected Output:**

```
@Frontend Implementation:

Components Created:
1. components/auth/SignupForm.tsx
2. components/auth/LoginForm.tsx
3. components/auth/ProtectedRoute.tsx
4. components/auth/LogoutButton.tsx

Pages Created:
1. app/auth/signup/page.tsx
2. app/auth/login/page.tsx
3. app/dashboard/page.tsx (protected example)

Features:
✅ Form validation (email format, password strength)
✅ Loading states during API calls
✅ Error handling with user-friendly messages
✅ Automatic redirect after successful login
✅ Protected routes check authentication on mount
✅ Responsive design (mobile-friendly)

Test Flow:
1. Visit http://localhost:3000/auth/signup
2. Fill form → Submit → Should redirect to /dashboard
3. Refresh page → Should stay logged in (cookie persists)
4. Click logout → Should redirect to /auth/login
5. Try visiting /dashboard without login → Should redirect to /auth/login

Handoff to @Testing:
- 4 components ready for testing
- Test signup flow, login flow, protected routes, logout
```

**Action:** Copy components to your frontend, start dev server, test manually.

```bash
cd frontend
npm run dev

# Visit http://localhost:3000/auth/signup
# Test the complete flow
```

**✅ Checkpoint:** UI working end-to-end. Move to testing.

---

### Step 6: Testing (@Testing) - 5 minutes

**In your AI tool:**

```
Load agents/5-quality/testing.md

Task: Write tests for authentication feature.

Components to test:
- Backend: 4 API endpoints (signup, login, me, logout)
- Frontend: 4 components (SignupForm, LoginForm, ProtectedRoute, LogoutButton)

Requirements:
- Backend: Jest for API tests
- Frontend: React Testing Library for component tests
- Coverage target: 80%+

Action: Generate test files.
```

**Expected Output:**

```
@Testing Implementation:

Backend Tests (backend/src/routes/__tests__/auth.test.ts):
✅ POST /api/auth/signup - creates user and returns JWT
✅ POST /api/auth/signup - rejects duplicate email
✅ POST /api/auth/signup - validates email format
✅ POST /api/auth/login - returns JWT for valid credentials
✅ POST /api/auth/login - rejects invalid password
✅ GET /api/auth/me - returns user for valid JWT
✅ GET /api/auth/me - rejects invalid JWT
✅ POST /api/auth/logout - clears cookie

Frontend Tests (frontend/src/components/auth/__tests__/):
✅ SignupForm - renders form fields
✅ SignupForm - validates password match
✅ SignupForm - calls API on submit
✅ LoginForm - renders form fields
✅ LoginForm - calls API on submit
✅ ProtectedRoute - redirects if not authenticated
✅ ProtectedRoute - renders children if authenticated

Run Tests:
cd backend && npm test
cd frontend && npm test

Coverage: 85% (target: 80%+) ✅

Handoff to @Reviewer:
- All tests passing
- Coverage meets target
- Ready for code review
```

**Action:** Copy tests, run them.

```bash
cd backend
npm test

cd frontend
npm test
```

**✅ Checkpoint:** Tests passing. Move to code review.

---

### Step 7: Code Review (@Reviewer) - 3 minutes

**In your AI tool:**

```
Load agents/5-quality/reviewer.md

Task: Review authentication implementation.

Files to review:
- backend/src/routes/auth.ts
- frontend/src/components/auth/*.tsx
- All test files

Check for:
- Code quality (readability, DRY principles)
- Security (password hashing, JWT handling, no secrets in code)
- Error handling (all edge cases covered)
- Tests (comprehensive, meaningful assertions)

Action: Provide approval or feedback.
```

**Expected Output:**

```
@Reviewer Code Review:

✅ APPROVED with minor suggestions:

Security: ✅ EXCELLENT
- Passwords hashed with bcrypt
- JWT tokens in httpOnly cookies (XSS-safe)
- Rate limiting implemented
- No secrets in code

Code Quality: ✅ GOOD
- Clear function names
- Consistent error handling
- TypeScript types used correctly

Suggestions (Optional):
1. Add JSDoc comments to auth functions
2. Extract JWT secret to config file
3. Add refresh token mechanism (future enhancement)

Tests: ✅ COMPREHENSIVE
- 85% coverage
- Edge cases covered
- Meaningful test descriptions

Verdict: READY FOR DEPLOYMENT

Handoff to @DevOps:
- All code reviewed and approved
- Tests passing
- Security checks passed
- Ready for staging deployment
```

**✅ Checkpoint:** Code approved. Move to deployment.

---

### Step 8: Deployment (@DevOps) - 5 minutes

**In your AI tool:**

```
Load agents/4-devops/devops.md

Task: Deploy authentication feature to staging.

Environment:
- Frontend: Vercel
- Backend: Railway
- Database: Already on Neon

Requirements:
- Set JWT_SECRET environment variable
- Configure CORS for production domain
- Deploy to staging first, then production

Action: Provide deployment steps.
```

**Expected Output:**

```
@DevOps Deployment:

Step 1: Set Environment Variables

Backend (Railway):
JWT_SECRET=<generate-random-64-char-string>
DATABASE_URL=<your-neon-postgres-url>
FRONTEND_URL=https://your-app.vercel.app
NODE_ENV=production

Frontend (Vercel):
NEXT_PUBLIC_API_URL=https://your-backend.railway.app

Step 2: Deploy Backend
git push origin main
# Railway auto-deploys from main branch

Step 3: Deploy Frontend
git push origin main
# Vercel auto-deploys from main branch

Step 4: Smoke Test
curl https://your-backend.railway.app/api/auth/signup -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

Visit https://your-app.vercel.app/auth/signup
Test signup → login → dashboard flow

✅ Staging Deployment Complete

Step 5: Production Deployment
(If staging tests pass)
Promote staging to production in Railway + Vercel dashboards

Handoff to Team:
- Feature live in production
- Smoke tests passed
- Ready for user testing
```

**Action:** Deploy following the steps.

**✅ Checkpoint:** Feature deployed. Authentication complete!

---

## 📊 What You Just Built

**In 30 minutes, you orchestrated 7 agents to build:**

- ✅ Database schema (User table)
- ✅ 4 API endpoints (signup, login, me, logout)
- ✅ 4 UI components (signup form, login form, protected routes, logout)
- ✅ 16 tests (backend + frontend)
- ✅ Code review passed
- ✅ Deployed to production

**Agents Used:**

1. @Planner - Broke down feature into tasks
2. @CTO - Approved architecture
3. @Database - Created schema
4. @Backend - Built API
5. @Frontend - Built UI
6. @Testing - Wrote tests
7. @Reviewer - Approved code
8. @DevOps - Deployed

**Lines of Code Generated:** ~500 lines
**Production-Ready:** Yes
**Time Saved vs Manual:** ~6 hours

---

## Full Production Pipeline

### When to Use Each Agent

#### 1. Leadership Tier (Planning & Architecture)

**@Planner** - Start here for ANY feature

```
Use when: Starting any new feature
Input: Feature description
Output: Task breakdown with dependencies
Next: @CTO for architecture review
```

**@CTO** - Architecture decisions

```
Use when: Need to decide tech stack, API design, data model
Input: Feature requirements from @Planner
Output: Technical specifications, approved architecture
Next: @Database, @Backend, or @Frontend
```

**@Research** - Technology evaluation

```
Use when: Choosing between frameworks, libraries, tools
Input: Problem to solve, options to compare
Output: Pros/cons analysis, recommendation
Next: @CTO for final decision
```

---

#### 2. Development Tier (Implementation)

**@Database** - Schema design

```
Use when: Need to create/modify database schema
Input: Data requirements from @CTO
Output: Prisma schema, migrations, seed data
Next: @Backend (to use the schema)
```

**@Backend** - API development

```
Use when: Need to build server logic, API endpoints
Input: Database schema from @Database, requirements from @CTO
Output: API code, error handling, tests
Next: @Frontend (to consume API) or @Testing
```

**@Frontend** - UI development

```
Use when: Need to build user interface, components
Input: API contract from @Backend, design requirements
Output: React components, pages, routing
Next: @Testing or @Reviewer
```

---

#### 3. Security Tier (Authentication & Audits)

**@Auth** - Authentication implementation

```
Use when: Building login, signup, sessions, permissions
Input: Requirements from @CTO
Output: Auth flows, JWT/session logic, middleware
Next: @Security for audit
```

**@Security** - Security audits

```
Use when: Before deploying ANY feature (mandatory)
Input: Code from @Backend, @Frontend, @Auth
Output: Security report, vulnerabilities found, fixes
Next: @Reviewer or @DevOps (if approved)
```

---

#### 4. DevOps Tier (Deployment)

**@DevOps** - Infrastructure & deployment

```
Use when: Ready to deploy (after @Reviewer approval)
Input: Approved code, environment requirements
Output: Deployment scripts, CI/CD config, live feature
Next: Monitoring and maintenance
```

---

#### 5. Quality Tier (Testing & Review)

**@Testing** - Test automation

```
Use when: After ANY code is written (mandatory)
Input: Code from @Backend, @Frontend, @Database
Output: Unit tests, integration tests, E2E tests
Next: @Reviewer
```

**@Documentation** - Technical writing

```
Use when: Need to update docs (README, API docs, guides)
Input: New features, API changes
Output: Updated documentation, examples, guides
Next: @Reviewer
```

**@Reviewer** - Code review

```
Use when: Before merging ANY code (mandatory)
Input: Code + tests from any agent
Output: Approval or feedback for changes
Next: @DevOps (if approved) or back to developer agent
```

**@Debugger** - Bug fixing

```
Use when: Something breaks in production or dev
Input: Bug report, error logs
Output: Root cause analysis, fix, regression test
Next: @Testing (add regression test), then @Reviewer
```

---

#### 6. Specialist Tier (Optimization)

**@Performance** - Performance optimization

```
Use when: Feature works but is slow
Input: Performance metrics, slow endpoints/pages
Output: Optimizations, caching, query improvements
Next: @Testing (verify no breakage), then @Reviewer
```

**@Refactoring** - Code quality improvement

```
Use when: Code works but is messy, duplicated, or hard to maintain
Input: Existing code that needs cleanup
Output: Refactored code (same behavior, better structure)
Next: @Testing (verify no breakage), then @Reviewer
```

---

## Common Workflows

### Workflow 1: New Feature (Complex)

```
User Request: "Add payment processing with Stripe"

Step 1: @Planner → Break down feature
Step 2: @CTO → Review Stripe integration approach
Step 3: @Research → Compare payment providers (if needed)
Step 4: @Database → Create Payment, Subscription tables
Step 5: @Backend → Implement Stripe webhook, checkout API
Step 6: @Frontend → Build checkout page, payment form
Step 7: @Testing → Write tests for payment flow
Step 8: @Security → Audit Stripe integration (critical!)
Step 9: @Reviewer → Final code review
Step 10: @DevOps → Deploy to staging, then production
Step 11: @Documentation → Update docs with payment setup

Timeline: 2-4 hours (vs 2 days manual)
```

---

### Workflow 2: Bug Fix (Fast)

```
User Report: "Dashboard page crashes when data is empty"

Step 1: @Debugger → Identify root cause (missing null check)
Step 2: @Frontend → Fix null check, add loading state
Step 3: @Testing → Add regression test for empty data
Step 4: @Reviewer → Quick review (low risk change)
Step 5: @DevOps → Hotfix deploy

Timeline: 15-30 minutes (vs 2 hours manual)
```

---

### Workflow 3: Performance Optimization

```
User Report: "Homepage loads slowly (5 seconds)"

Step 1: @Performance → Profile page, identify bottlenecks
Step 2: @Database → Add indexes, optimize N+1 queries
Step 3: @Backend → Add Redis caching for expensive queries
Step 4: @Frontend → Implement lazy loading, code splitting
Step 5: @Testing → Verify performance (target: <2s load time)
Step 6: @Reviewer → Verify no functionality broken
Step 7: @DevOps → Deploy optimization

Timeline: 1-2 hours (vs 1 day manual)
```

---

### Workflow 4: Database Schema Change

```
Need: "Add 'role' field to User table (admin, user, guest)"

Step 1: @Planner → Plan migration strategy (no downtime)
Step 2: @Database → Create migration, set default role
Step 3: @Backend → Update user endpoints to handle role
Step 4: @Auth → Add role-based middleware (requireAdmin)
Step 5: @Frontend → Show/hide features based on role
Step 6: @Testing → Test all role scenarios
Step 7: @Reviewer → Review migration + code
Step 8: @DevOps → Deploy (run migration in production)

Timeline: 1 hour (vs 4 hours manual)
```

---

## Best Practices

### 1. Always Start with @Planner

❌ **Bad:** Jump straight to @Backend and start coding

✅ **Good:** Use @Planner first to break down the feature, then follow the plan

**Why:** Planning prevents scope creep, identifies dependencies early, and ensures you don't forget critical tasks (like testing or deployment).

---

### 2. Never Skip @Testing

❌ **Bad:** Deploy code without tests

✅ **Good:** Write tests after (or before) implementation

**Why:** Tests catch bugs before users do. Untested code always breaks in production.

---

### 3. Always Use @Reviewer Before Deploy

❌ **Bad:** Merge code directly to main after implementation

✅ **Good:** Get @Reviewer approval before @DevOps deployment

**Why:** Fresh eyes catch bugs, security issues, and code smells you might miss.

---

### 4. Use @Security for Auth & Payment Features

❌ **Bad:** Deploy authentication without security audit

✅ **Good:** Always run @Security before deploying auth, payment, or sensitive features

**Why:** Security vulnerabilities are expensive. Better to catch them before deployment.

---

### 5. Document as You Build

❌ **Bad:** Build entire feature, then try to remember what to document

✅ **Good:** Use @Documentation after each major milestone

**Why:** Documentation is easier when the code is fresh in your mind.

---

## Troubleshooting

### Problem: "I don't know which agent to use next"

**Solution:** Follow the tier order (Leadership → Development → Security → Quality → DevOps)

**Example:** After @Backend finishes API, use @Frontend (next in development tier) or @Testing (move to quality tier).

---

### Problem: "Agent output is too generic"

**Solution:** Provide more context in your prompt

❌ **Bad:** "Build login"
✅ **Good:** "Build login with email/password, JWT tokens, httpOnly cookies, Next.js frontend, Express backend"

---

### Problem: "Feature is getting too complex"

**Solution:** Break it down smaller with @Planner

**Example:** Instead of "Build entire dashboard", break it into:

- Task 1: Dashboard layout
- Task 2: Chart component
- Task 3: Data fetching
- Task 4: Filters

Then tackle one task at a time.

---

### Problem: "Code not working as expected"

**Solution:** Use @Debugger

```
Load agents/5-quality/debugger.md

Problem: Login endpoint returns 500 error
Error log: [paste error]
Code: [paste relevant code]

Find root cause and fix.
```

---

## Advanced: Multi-Agent Sessions

### Running Multiple Agents in Parallel

You can use different AI tools for different agents simultaneously:

**Example:** Building a feature with 3 developers

```
Developer 1 (Claude Code):
→ @Backend building API endpoints

Developer 2 (Cursor):
→ @Frontend building UI components

Developer 3 (ChatGPT):
→ @Testing writing test cases

All three share CONTEXT.md for handoff notes
All three update PHASE-TRACKER.md with progress
```

**Benefits:**

- 3x faster development
- Each agent focuses on their specialty
- Shared context prevents conflicts

---

## Next Steps

**Just finished this guide?**

1. ✅ Create your `PHASE-TRACKER.md` (see [templates/PHASE-TRACKER-TEMPLATE.md](../templates/PHASE-TRACKER-TEMPLATE.md))
2. ✅ Copy the authentication workflow above and adapt to your project
3. ✅ Join the Ultra-Dex community for support

**Want more examples?**

- [Workflow Examples](../Orchestration/EXAMPLES.md)
- [Orchestration Overview](../Orchestration/README.md)

**Need templates?**

- [Phase Tracker Template](../templates/PHASE-TRACKER-TEMPLATE.md)
- [Master Plan Template](../templates/MASTER-PLAN-TEMPLATE.md)

---

## Feedback

**Found this helpful?** Star the repo: https://github.com/Srujan0798/Ultra-Dex

**Have questions?** Open an issue: https://github.com/Srujan0798/Ultra-Dex/issues

**Want to improve this guide?** PRs welcome!

---

_Ultra-Dex v6.0.0 OVERPOWERED - The only framework that shows you HOW to coordinate AI agents_
