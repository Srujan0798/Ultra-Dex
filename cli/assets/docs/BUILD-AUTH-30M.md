# Build Auth in 30 Minutes with Ultra-Dex

> A practical, time-boxed script that uses Ultra-Dex agents to design and implement authentication.

## Goal

Build production-ready authentication (signup, login, session, and basic protections) in 30 minutes using Ultra-Dex.

## Prerequisites

- A project initialized with `npx ultra-dex init`.
- A baseline tech stack (Next.js + Prisma) and auth approach (NextAuth or custom JWT).
- `IMPLEMENTATION-PLAN.md` and `CONTEXT.md` available.

---

## 0–5 min: Planner + CTO alignment

**Agent:** `@Planner` then `@CTO`

**Planner prompt:**

```
Read IMPLEMENTATION-PLAN.md and CONTEXT.md.
Act as @Planner.
Task: Break down authentication into 4-5 atomic tasks (4-9h each) with acceptance criteria.
```

**CTO prompt:**

```
Read IMPLEMENTATION-PLAN.md and CONTEXT.md.
Act as @CTO.
Task: Approve auth architecture (session/JWT), password policy, and data model changes.
```

Output checklist:

- Auth flow decided (JWT or session)
- Password policy defined
- Auth-related schema changes approved

---

## 5–12 min: Database + Backend design

**Agent:** `@Database` then `@Backend`

**Database prompt:**

```
Read IMPLEMENTATION-PLAN.md Section 5 and CONTEXT.md.
Act as @Database.
Task: Add/verify User + Session tables, indexes, and constraints for auth.
Return Prisma schema changes.
```

**Backend prompt:**

```
Read IMPLEMENTATION-PLAN.md Sections 6-8 and CONTEXT.md.
Act as @Backend.
Task: Draft endpoints for signup/login/logout + validation + error handling.
```

Output checklist:

- Schema changes with indexes
- API endpoints defined
- Validation schema defined

---

## 12–20 min: Security + Testing plan

**Agent:** `@Security` then `@Testing`

**Security prompt:**

```
Read IMPLEMENTATION-PLAN.md Sections 7 & 12.
Act as @Security.
Task: Audit auth design for OWASP risks; add rate limiting + secure cookie policy.
```

**Testing prompt:**

```
Read IMPLEMENTATION-PLAN.md Section 10.
Act as @Testing.
Task: Define test cases for signup/login/session invalidation.
```

Output checklist:

- Rate limiting rules
- Secure cookie settings
- Test plan with edge cases

---

## 20–30 min: Implement + verify

**Execution steps:**

1. Implement schema changes (Prisma migration).
2. Implement API endpoints with validation and error handling.
3. Add basic tests for auth endpoints.
4. Run quick verification checklist.

**Quick verification (5-step):**

- [ ] Works locally (signup/login)
- [ ] Errors handled and validated
- [ ] No secrets in code
- [ ] Docs updated (if API changed)
- [ ] Build passes

---

## Suggested Output Files

- `prisma/schema.prisma`
- `app/api/auth/*` (or `src/routes/auth/*`)
- `src/**/__tests__/auth.test.ts`

---

## Next Step

Use the 21-step checklist for full production readiness:

- [CHECKLIST-21-STEP.md](./CHECKLIST-21-STEP.md)
