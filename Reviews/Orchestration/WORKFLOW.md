# Formal Orchestration Workflow

Ultra-Dex production pipeline with clear approval gates and phase structure.

---

## Standard Production Pipeline

### Phase 1: Planning & Architecture
**Agents:** @Planner, @CTO, @Research

#### 1. Task Assignment (@Planner)
- Break down user request into implementable tasks
- Identify required agents for each task
- Set priority order and dependencies
- **Output:** Task list in `IMPLEMENTATION-PLAN.md`

#### 2. Architecture Review (@CTO)
- Review technical approach
- Make tech stack decisions
- Design system architecture
- Approve or request changes
- **Output:** Architecture decisions in `CONTEXT.md`

#### 3. Technology Research (@Research - if needed)
- Compare framework/library options
- Benchmark solutions
- Performance/cost analysis
- Provide data-driven recommendations
- **Output:** Research findings in `CONTEXT.md`

**✅ Approval Gate:** Architecture must be approved by @CTO before implementation

---

### Phase 2: Implementation
**Agents:** @Backend, @Frontend, @Database, @Auth

#### 4. Database Schema (@Database - if needed)
- Design schema with relationships
- Create migrations
- Add indexes for performance
- **Output:** Database schema + migration files

#### 5. Backend Implementation (@Backend)
- Build API endpoints
- Implement business logic
- Add error handling
- Write API documentation
- **Output:** Working API + handoff notes

#### 6. Authentication (@Auth - if needed)
- Implement auth flows (login, signup, logout)
- Add authorization checks to endpoints
- Secure sensitive routes
- **Output:** Auth system + security notes

#### 7. Frontend Implementation (@Frontend)
- Build UI components
- Connect to API
- Handle loading/error states
- Ensure responsive design
- **Output:** Working UI + handoff notes

**✅ Approval Gate:** Implementation must be complete with basic manual testing

---

### Phase 3: Testing
**Agents:** @Testing

#### 8. Test Automation (@Testing)
- Write unit tests for functions/methods
- Write integration tests for API endpoints
- Write E2E tests for critical user flows
- Verify coverage targets (80%+ overall)
- **Output:** Test suite passing with adequate coverage

**✅ Approval Gate:** All tests must pass, coverage targets met

---

### Phase 4: Quality Review
**Agents:** @Security, @Performance, @Refactoring, @Reviewer

#### 9. Security Audit (@Security)
- Check for OWASP top 10 vulnerabilities
- Verify authentication/authorization implementation
- Run security tools (npm audit, Snyk)
- Check for exposed secrets
- **Output:** Security approval or issues to fix

#### 10. Performance Check (@Performance - if needed)
- Measure page load times (target: <2s)
- Check API response times (target: <500ms)
- Identify and fix N+1 queries
- Optimize assets and bundle size
- **Output:** Performance metrics approval

#### 11. Code Refactoring (@Refactoring - if needed)
- Remove code duplication (DRY principle)
- Improve readability and naming
- Apply design patterns where appropriate
- Reduce cyclomatic complexity
- **Output:** Clean, maintainable code

#### 12. Final Code Review (@Reviewer)
- Review code quality and patterns
- Check tests are comprehensive
- Verify error handling
- Ensure documentation is complete
- **Output:** Approval to deploy or feedback for fixes

**✅ Approval Gate:** All quality checks must pass (security, performance, review)

---

### Phase 5: Deployment
**Agents:** @DevOps

#### 13. Deploy to Production (@DevOps)
- Set environment variables
- Deploy to staging first
- Run smoke tests
- Deploy to production
- Monitor for errors
- **Output:** Live feature in production

**✅ Approval Gate:** Smoke tests pass, feature verified live

---

## Approval Gate Rules

Each tier must pass criteria before moving forward:

| From Tier | To Tier | Approval Required |
|-----------|---------|-------------------|
| **Leadership → Development** | Architecture approved by @CTO |
| **Development → Testing** | Implementation complete, basic manual testing done |
| **Testing → Quality** | All tests passing, coverage targets met |
| **Quality → DevOps** | Security approved, code review approved |
| **DevOps → Done** | Smoke tests pass, feature live |

**Rule:** Never skip approval gates for production features. They exist to maintain code quality.

---

## Fast-Track Workflows

### For Minor Changes

**Bug Fixes:**
@Debugger → @Testing (add regression test) → @Reviewer → @DevOps

**UI Tweaks:**
@Frontend → @Reviewer → @DevOps

**Performance Fixes:**
@Performance → @Testing → @Reviewer → @DevOps

**Refactoring:**
@Refactoring → @Testing (ensure no breakage) → @Reviewer → @DevOps

---

## Always Required (Never Skip)

Regardless of workflow type, these agents must always be involved:

- **@Testing** - Always write tests, even for small changes
- **@Reviewer** - Always get code review before deployment
- **@Security** - Always for auth, payment, or security-related changes
- **@DevOps** - Always for deployment (never push directly)

---

## Agent Handoff Protocol

When passing work between agents, use this standard format:

```markdown
## Handoff from @[YourAgent] to @[NextAgent]

**Status:**
- ✅ Complete: [What's fully done]
- 🔄 In Progress: [What's partially done]
- ⏳ Remaining: [What's not started]

**Deliverables:**
- [File/feature created or modified]
- [API endpoint or component built]
- [Tests written]

**Context for Next Agent:**
- [Important decisions made]
- [Dependencies they need]
- [Things to be aware of]

**Next Action:**
[Specific task for next agent to do]
```

**Example:**

```markdown
## Handoff from @Backend to @Frontend

**Status:**
- ✅ Complete: User authentication API endpoints
- ✅ Complete: Database schema migrated
- ⏳ Remaining: Rate limiting (Phase 2 feature)

**Deliverables:**
- `POST /api/auth/signup` - Creates user, returns JWT
- `POST /api/auth/login` - Validates credentials, returns JWT
- `POST /api/auth/logout` - Clears session
- `GET /api/auth/me` - Returns current user
- JWT tokens expire in 7 days
- Passwords hashed with bcrypt (cost: 10)

**Context for Next Agent:**
- JWT secret is in environment variable `JWT_SECRET`
- Tokens stored in httpOnly cookies (name: `auth_token`)
- CORS configured for localhost:3000 and production domain

**Next Action:**
Create login and signup forms that POST to these endpoints. Store returned token in httpOnly cookie. Implement protected route wrapper that checks /api/auth/me.
```

---

## Parallel Workflows

Some agents can work in parallel when there are no dependencies:

**Example: Auth + Dashboard Implementation**

```
Phase 1: @Planner breaks down both features
         @CTO approves architecture for both

Phase 2: Parallel streams:
         Stream A: @Backend (auth API) → @Frontend (login UI)
         Stream B: @Backend (dashboard API) → @Frontend (dashboard UI)

Phase 3: Converge:
         Both streams → @Testing → @Security → @Reviewer → @DevOps
```

**Rule:** Parallel work is allowed in the same phase, but approval gates still apply.

---

## Emergency Hotfix Workflow

For critical production bugs:

1. **@Debugger** - Identify root cause (30 min max)
2. **@Backend/@Frontend** - Implement fix (1 hour max)
3. **@Testing** - Add regression test (15 min)
4. **@Reviewer** - Quick review (15 min)
5. **@DevOps** - Deploy immediately to production

**Total: ~2 hours from bug report to deployed fix**

**Approval Gates:** Can be expedited but NOT skipped. Get verbal/Slack approval if needed.

---

## Workflow State Tracking

Update `IMPLEMENTATION-PLAN.md` after each phase:

```markdown
## Feature: User Authentication

### Status
- ✅ Phase 1: Planning & Architecture (Complete)
- ✅ Phase 2: Implementation (Complete)
- ✅ Phase 3: Testing (Complete)
- 🔄 Phase 4: Quality Review (In Progress - @Security)
- ⏳ Phase 5: Deployment (Pending)

### Current Blockers
None

### Next Steps
1. @Security to complete security audit
2. @Reviewer final approval
3. @DevOps deployment
```

---

## Related Documentation

- [Agent Index](../../agents/00-AGENT_INDEX.md) - Quick reference for all 14 agents
- [Orchestration Guide](./README.md) - Coordination patterns
- [Workflow Examples](./EXAMPLES.md) - Real multi-agent workflows
- [Multi-Tool Guide](../../guides/MULTI-TOOL-WORKFLOW.md) - Using multiple AI tools

---

*Ultra-Dex v1.6.0 - Formal production pipeline for AI-coordinated development*
