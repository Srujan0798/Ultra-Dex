# SaaSKit - Complete Implementation Plan

> **What is this?** A fully filled Ultra-Dex SaaS Implementation Template example.
> **Purpose:** Provide a generic open-source SaaS starter with multi-tenancy, RBAC, and billing.
> **SaaS:** SaaSKit - Launch-ready SaaS foundation for B2B teams.

---

# SECTION 1: HIGH-LEVEL SUMMARY

## 1.1 Product Vision (One-liner)
Launch any B2B SaaS with teams, roles, and billing in a weekend.

## 1.2 Problem Statement
Founders waste weeks rebuilding the same SaaS foundation (auth, teams, roles, billing). This slows validation, introduces security gaps, and creates inconsistent UX.

## 1.3 Solution Overview
SaaSKit is a production-ready starter with Clerk auth, multi-tenant workspaces, role-based access control, Stripe subscriptions, and Resend email notifications, all wired into Next.js 15 + Prisma + PostgreSQL.

## 1.4 Target Market
- Indie founders and small startups building B2B SaaS
- Agencies delivering SaaS MVPs for clients
- OSS contributors who want a reusable, secure base

## 1.5 Unique Value Proposition
- Opinionated defaults: teams, roles, billing, and onboarding out-of-the-box
- OSS-friendly: MIT license, clear extension points
- Production-grade: audit logs, rate limits, and secure role checks

## 1.6 Success Metrics (Key)
- 1,000 GitHub stars in 6 months
- <10 minutes median time to first workspace
- 90% of sample app flows covered by tests

---

# SECTION 2: CORE FEATURES

## 2.1 Core Production Features (Critical - P0)

**Feature 1: Multi-Tenant Workspaces**
- Simple Description: Create and switch between team workspaces
- Industry Standard: Workspace model with membership table and org context
- Acceptance Criteria:
  
  □ Workspace created with unique slug
  
  □ User can switch workspace and context updates
  
  □ Workspace ownership enforced

**Feature 2: Role-Based Access Control (RBAC)**
- Simple Description: Admin/member/viewer permissions per workspace
- Industry Standard: Membership role enum with permission checks at API + UI
- Acceptance Criteria:
  
  □ Admin can manage members and billing
  
  □ Member can create and edit resources
  
  □ Viewer has read-only access

**Feature 3: Stripe Subscriptions**
- Simple Description: Free/Pro/Enterprise plans with feature gating
- Industry Standard: Stripe Checkout + Webhooks + Billing Portal
- Acceptance Criteria:
  
  □ Checkout creates Stripe subscription
  
  □ Webhooks sync plan status to database
  
  □ Feature limits enforced by plan

**Feature 4: Team Invitations**
- Simple Description: Invite members by email with role selection
- Industry Standard: Invite tokens with expiry + accept flow
- Acceptance Criteria:
  
  □ Invite email sent via Resend
  
  □ Invite expires after 7 days
  
  □ Accepted invite creates membership

**Feature 5: Notification Center**
- Simple Description: In-app notifications + email updates
- Industry Standard: Notification table with read/unread state
- Acceptance Criteria:
  
  □ Notification created for invite and billing events
  
  □ Users can mark notifications as read
  
  □ Email notification sent for critical events

## 2.2 Enhanced Features (Important - P1)
- Audit logs for admin actions
- Workspace usage analytics dashboard
- API key creation for integrations

## 2.3 Future Features (Nice-to-Have - P2/P3)
- SSO (SAML) and SCIM provisioning
- Usage-based billing add-ons
- Multi-region data residency

---

# SECTION 3: PRODUCT DESCRIPTION (Industry Standard)

## 3.1 Elevator Pitch (30 seconds)
SaaSKit is an open-source foundation for modern B2B SaaS. It ships with teams, role-based permissions, billing, and notifications so founders can focus on their core product instead of rebuilding infrastructure.

## 3.2 Detailed Product Description
SaaSKit provides a complete multi-tenant backbone with Clerk authentication, Stripe billing, and Prisma-backed data models. It includes workspace management, member invitations, a notification center, and plan-based feature gating. The stack is opinionated around Next.js 15 for speed and developer experience.

## 3.3 Key Benefits
- Launch faster with a secure, tested foundation
- Reduce billing and access-control bugs with proven patterns
- Customize easily with clear extension points

## 3.4 How It Works (User Perspective)
Step 1: Create an account and a workspace  
Step 2: Invite teammates and assign roles  
Step 3: Upgrade to Pro or Enterprise via Stripe

## 3.5 Competitive Positioning
Compared to generic boilerplates, SaaSKit includes a full multi-tenant model, RBAC, and billing wired end-to-end with real integrations and tests.

---

# SECTION 4: USER PERSONAS

### Persona 1: Indie SaaS Founder
**Demographics:**
- Age: 25-40
- Occupation: Solo founder
- Tech Savviness: High
- Location: Global (remote)

**Goals:**
- Launch MVP in weeks
- Avoid security and billing mistakes

**Pain Points:**
- Rebuilding auth/billing every project
- Missing edge cases for teams and roles

**Behaviors:**
- Uses GitHub, Vercel, Stripe
- Iterates quickly

**Motivations:**
- Ship faster than competitors

### Persona 2: Agency CTO
**Demographics:**
- Age: 30-50
- Occupation: Technical lead
- Tech Savviness: High
- Location: North America/Europe

**Goals:**
- Deliver client SaaS projects reliably
- Standardize architecture

**Pain Points:**
- Inconsistent implementations across teams
- Hidden security gaps

**Behaviors:**
- Prefers documented patterns
- Maintains internal accelerators

**Motivations:**
- Reduce risk and rework

### Persona 3: OSS Contributor
**Demographics:**
- Age: 20-35
- Occupation: Developer
- Tech Savviness: High
- Location: Global

**Goals:**
- Contribute to a popular OSS project
- Learn SaaS architecture patterns

**Pain Points:**
- Vague contribution guidelines
- Poor test coverage

**Behaviors:**
- Submits PRs on weekends

**Motivations:**
- Build reputation and skills

---

# SECTION 5: USER STORIES

## 5.1 Basic User Stories (Epic Level)
**Epic 1: Authentication & Onboarding**
- As a new user, I want to sign up with Google/email so that I can access the app quickly
- As a new user, I want to create my first workspace so that I can organize my team

**Epic 2: Team Management**
- As an admin, I want to invite teammates so that we can collaborate
- As an admin, I want to assign roles so that access is controlled

**Epic 3: Billing**
- As an admin, I want to upgrade to Pro so that we can unlock features
- As an admin, I want to manage my subscription so that billing is predictable

## 5.2 Detailed User Stories (Task Level)
**Story: Invite a Teammate**
- As a: Workspace admin
- I want to: Invite a teammate by email and assign a role
- So that: They can access the workspace with the right permissions
- Acceptance Criteria:
  
  □ Invitation email contains a secure token
  
  □ Invite expires in 7 days
  
  □ Accepted invite creates membership with correct role
- Priority: P0
- Estimated Effort: 6 hours

**Story: Upgrade to Pro**
- As a: Workspace admin
- I want to: Checkout for a Pro subscription
- So that: My workspace unlocks Pro limits
- Acceptance Criteria:
  
  □ Stripe Checkout opens with Pro price
  
  □ Webhook updates subscription status
  
  □ Feature gating reflects new plan within 1 minute
- Priority: P0
- Estimated Effort: 7 hours

---

# SECTION 6: SCREEN / PAGE MAP

## 6.1 Public Pages (No Auth Required)
Landing (/)
Features (/features)
Pricing (/pricing)
Docs (/docs)
Login (/login)
Sign Up (/signup)

## 6.2 Authenticated Pages (Auth Required)
Dashboard (/app)
Workspace Switcher (/app/switch)
Members (/app/members)
Billing (/app/billing)
Notifications (/app/notifications)
Settings (/app/settings)

## 6.3 Page Component Breakdown
**Example: Members Page**
```
/app/members
├── TopBar
│   ├── WorkspaceSwitcher
│   └── InviteButton
├── MemberTable
│   ├── MemberRow
│   └── RoleDropdown
└── InviteModal
```

---

# SECTION 7: USER FLOW & SYSTEM FLOW

## 7.1 Simple User Flow (Happy Path)
User signs up -> creates workspace -> invites teammate -> upgrades to Pro -> uses features

## 7.2 Advanced System Flow (With Error Handling)
Upgrade flow:
User clicks "Upgrade" -> backend creates Stripe Checkout -> Stripe confirms payment -> webhook validates signature -> subscription stored -> workspace plan updated -> UI refreshes  
If webhook fails -> retry via queue -> notify admin if still failing

## 7.3 Critical User Journeys
**Journey 1: First-Time Onboarding**  
Sign up -> create workspace -> select plan -> invite teammates

**Journey 2: Role Change**  
Admin opens members -> changes role -> permission updates instantly

**Journey 3: Subscription Cancellation**  
Admin cancels in portal -> webhook updates status -> features downgrade after period

---

# SECTION 8: OBJECTIVES

## 8.1 Primary Objectives (Must Achieve)
1. **Ship a secure multi-tenant foundation**
   - Success Metric: 0 critical RBAC bugs in first 3 months
   - Timeline: Month 1
   - Owner: Engineering

2. **Enable paid billing flow**
   - Success Metric: Stripe subscription created in <2 minutes
   - Timeline: Month 1
   - Owner: Engineering

## 8.2 Secondary Objectives (Should Achieve)
1. Provide extensible integration points (hooks, events)

## 8.3 Tertiary Objectives (Nice to Achieve)
1. Add SSO/SCIM templates

## 8.4 Anti-Objectives (What We're NOT Doing)
1. No mobile apps in V1
2. No marketplace or plugin ecosystem in V1

---

# SECTION 9: FULL FEATURE SPECIFICATIONS

### Feature 1: Workspace Management
**Priority:** P0 (Production Critical)  
**Complexity:** Medium  
**Estimated Time:** 4 days

**Description:**  
Create, update, and switch between workspaces with isolation and ownership controls.

**User Value:**  
Allows teams to separate data and manage access.

**Functional Requirements:**
1. Create workspace with slug and name
2. Switch active workspace context
3. Archive workspace (soft delete)

**Technical Requirements:**
- Frontend: workspace switcher, settings form
- Backend: REST endpoints with membership checks
- Database: workspace + membership tables

**Acceptance Criteria:**
□ Workspace slug is unique  
□ Switching updates data context within 1 second  
□ Archived workspaces are hidden  
□ Response time <200ms (p95)  
□ Accessible UI with keyboard navigation

**Dependencies:**
- Depends on: Authentication (Clerk)

**UI/UX Notes:**  
Show current workspace in top bar with avatar icon.

**Test Scenarios:**
1. Happy path: create + switch
2. Edge: duplicate slug
3. Error: unauthorized user

### Feature 2: RBAC Permissions
**Priority:** P0 (Production Critical)  
**Complexity:** Medium  
**Estimated Time:** 3 days

**Description:**  
Role-based permissions for admin/member/viewer across all protected routes.

**User Value:**  
Prevents accidental or unauthorized changes.

**Functional Requirements:**
1. Role stored in membership
2. Permission checks in API and UI
3. Admin-only role management

**Technical Requirements:**
- Middleware permission checks
- Client-side guards

**Acceptance Criteria:**
□ Viewer cannot mutate data  
□ Member can create/update resources  
□ Admin can manage billing/members  
□ Audit log recorded for role changes

### Feature 3: Stripe Billing
**Priority:** P0 (Production Critical)  
**Complexity:** High  
**Estimated Time:** 5 days

**Description:**  
Stripe subscriptions for free/pro/enterprise with webhooks and portal.

**User Value:**  
Predictable billing and plan-based access.

**Functional Requirements:**
1. Create checkout sessions
2. Sync webhook events
3. Portal for cancellation/upgrade

**Acceptance Criteria:**
□ Webhook signature verified  
□ Plan updates within 60 seconds  
□ Failed payments notify admin

### Feature 4: Email & In-App Notifications
**Priority:** P1 (Important)  
**Complexity:** Medium  
**Estimated Time:** 3 days

**Description:**  
Send Resend emails and in-app notifications for invites and billing events.

**User Value:**  
Keeps teams informed without manual checks.

**Acceptance Criteria:**
□ Invite emails delivered with correct links  
□ In-app notifications show unread state  
□ Users can mark as read

---

# SECTION 10: DATA MODEL

## 10.1 Entity Relationship Overview
```
User --< Membership >-- Workspace --< Subscription
  |                         |
  --< Notification          --< Invite
```

## 10.2 Data Entities (JSON Schema)
**User Entity:**
```json
{
  "id": "uuid",
  "clerkId": "string (unique)",
  "email": "string (unique)",
  "fullName": "string",
  "avatarUrl": "string nullable",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

**Workspace Entity:**
```json
{
  "id": "uuid",
  "name": "string (required)",
  "slug": "string (unique)",
  "ownerId": "uuid (FK User)",
  "plan": "enum (free, pro, enterprise)",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

**Membership Entity:**
```json
{
  "id": "uuid",
  "workspaceId": "uuid (FK Workspace)",
  "userId": "uuid (FK User)",
  "role": "enum (admin, member, viewer)",
  "createdAt": "timestamp"
}
```

**Subscription Entity:**
```json
{
  "id": "uuid",
  "workspaceId": "uuid (FK Workspace)",
  "stripeCustomerId": "string",
  "stripeSubscriptionId": "string",
  "status": "enum (active, past_due, canceled)",
  "currentPeriodEnd": "timestamp"
}
```

**Invite Entity:**
```json
{
  "id": "uuid",
  "workspaceId": "uuid (FK Workspace)",
  "email": "string",
  "role": "enum (admin, member, viewer)",
  "tokenHash": "string",
  "expiresAt": "timestamp",
  "acceptedAt": "timestamp nullable",
  "createdAt": "timestamp"
}
```

**Notification Entity:**
```json
{
  "id": "uuid",
  "userId": "uuid (FK User)",
  "type": "enum (invite, billing, system)",
  "title": "string",
  "body": "string",
  "readAt": "timestamp nullable",
  "createdAt": "timestamp"
}
```

## 10.3 Relationships
- User has many Memberships and Notifications
- Workspace has many Memberships and Invites
- Workspace has one Subscription

## 10.4 Indexes
- User.email (unique)
- Workspace.slug (unique)
- Membership.workspaceId + userId (unique)
- Subscription.stripeSubscriptionId (unique)

## 10.5 Data Validation Rules
- Workspace slug: lowercase, 3-30 chars, alphanumeric + hyphen
- Role enum enforced at DB and API
- Plan transitions allowed: free -> pro -> enterprise, cancel -> free after period

---

# SECTION 11: API BLUEPRINT

## 11.1 API Architecture
Next.js 15 Route Handlers using Prisma. Clerk handles auth; internal APIs require verified session and workspace context.

## 11.2 Authentication Endpoints
- POST /api/auth/clerk-webhook (sync users)
- GET /api/auth/session (current user + workspace)

#### POST `/api/auth/clerk-webhook`
```json
{
  "type": "user.created",
  "data": { "id": "clerk_123", "email_addresses": [{ "email_address": "demo@saaskit.io" }] }
}
```
Response:
```json
{ "status": "ok" }
```

## 11.3 Resource Endpoints
- POST /api/workspaces
- GET /api/workspaces
- POST /api/workspaces/:id/invites
- PATCH /api/workspaces/:id/members/:memberId
- POST /api/billing/checkout
- POST /api/billing/portal
- GET /api/notifications

#### POST `/api/workspaces`
Request:
```json
{ "name": "Acme", "slug": "acme" }
```
Response:
```json
{ "id": "ws_123", "name": "Acme", "slug": "acme", "plan": "free" }
```

#### POST `/api/billing/checkout`
Request:
```json
{ "workspaceId": "ws_123", "plan": "pro" }
```
Response:
```json
{ "checkoutUrl": "https://checkout.stripe.com/xyz" }
```

## 11.4 Authentication Flow
Clerk session -> server validates session token -> load memberships -> set activeWorkspaceId -> authorize by role.

## 11.5 Error Handling Standards
| Code | Scenario | Message |
|------|----------|---------|
| 401 | No session | "Authentication required" |
| 403 | Role missing | "Insufficient permissions" |
| 409 | Duplicate slug | "Workspace slug already exists" |

## 11.6 Rate Limiting
- 60 req/min per user for standard APIs
- 10 req/min for invite creation

---

# SECTION 12: SYSTEM ARCHITECTURE

## 12.1 Architecture Overview
Next.js 15 App Router + Prisma API layer, PostgreSQL database, Clerk auth, Stripe billing, Resend email.

## 12.2 Frontend Architecture
- App Router pages
- Server Components for data-heavy views
- Client components for forms/modals
- Zustand for UI state

## 12.3 Backend Architecture
- Route handlers with Zod validation
- Prisma ORM
- Webhook handlers for Stripe + Clerk

## 12.4 Database Architecture
PostgreSQL with schema per environment and row-level isolation by workspace.

## 12.5 Third-Party Integrations
Clerk, Stripe, Resend, PostHog, Sentry.

---

# SECTION 13: LOGIC FLOW (Engineering Format)

## 13.1 Authentication Logic Flow
Login -> Clerk session created -> backend verifies token -> user record synced -> workspace context selected.

## 13.2 Core Feature Logic Flows
**Invite Member:**  
Create invite -> send Resend email -> accept link -> membership created -> notification logged.

**Upgrade Plan:**  
Create checkout -> Stripe payment -> webhook updates subscription -> plan gating refreshed.

## 13.3 State Management Flow
Server actions fetch workspace data -> client stores activeWorkspaceId in Zustand -> UI queries scoped by workspace.

---

# SECTION 14: PRD (Product Requirements Document)

## 14.1 Problem Statement
Teams need a reliable multi-tenant starter to avoid repeated infrastructure work.

## 14.2 Solution Overview
Deliver a fully wired SaaS foundation with auth, billing, roles, and notifications.

## 14.3 Constraints & Assumptions
- Auth via Clerk only
- Single database per environment
- Stripe is the only billing provider in V1

## 14.4 Success Metrics & KPIs
- 95% of feature flows functional in demo app
- <200ms p95 API response time
- 80%+ test coverage on core modules

## 14.5 Out of Scope (V1)
- SSO/SCIM
- On-prem deployments
- Multi-region data replication

---

# SECTION 15: TECH STACK RECOMMENDATIONS

## 15.1 Frontend Stack
| Layer | Technology | Version | Justification |
|-------|------------|---------|---------------|
| Framework | Next.js | 15.x | App Router + Server Actions |
| Language | TypeScript | 5.5+ | Type safety |
| Styling | Tailwind CSS | 3.4+ | Rapid UI |
| UI Kit | shadcn/ui | Latest | Accessible components |
| State | Zustand | 4.x | Lightweight client state |

## 15.2 Backend Stack
| Layer | Technology | Version | Justification |
|-------|------------|---------|---------------|
| API | Next.js Route Handlers | 15.x | Co-located APIs |
| ORM | Prisma | 5.x | Strong typing |
| Validation | Zod | 3.x | Schema validation |

## 15.3 Database & Storage
- PostgreSQL 15 (Neon)
- Optional Redis (Upstash) for rate limits

## 15.4 DevOps & Infrastructure
- Vercel hosting
- GitHub Actions CI
- Docker for local dev

## 15.5 Development Tools
- Package Manager: pnpm
- Linter: ESLint
- Formatter: Prettier
- Unit Tests: Vitest
- E2E: Playwright

## 15.6 Third-Party Services
- Auth: Clerk
- Payments: Stripe
- Email: Resend
- Monitoring: Sentry
- Analytics: PostHog

### 15.6 TASK BREAKDOWN METHODOLOGY
#### 15.6.1 Feature-to-Task Mapping Strategy
Break features into DB -> API -> UI -> Integration -> Tests.

#### 15.6.2 Task Sizing Guidelines
Target 4-9 hours per task with 20% buffer.

#### 15.6.3 Atomic Task Definition Criteria
Each task must be independently testable and shippable.

#### 15.6.4 Task Dependency Mapping Rules
List blocking and parallel tasks explicitly.

#### 15.6.5 Parallel vs Sequential Task Identification
Frontend and backend streams can run in parallel when APIs are stubbed.

#### 15.6.6 Task Granularity Examples
Example: "Create Workspace API endpoint" (6h) instead of "Build Workspace feature".

---

# SECTION 16: IMPLEMENTATION PLAN (ENHANCED)

## 16.A PHASES (High-Level Milestones)
Phase 0: Setup (Week 0) - repo, CI, base config  
Phase 1: Foundation (Week 1-2) - auth, workspace model, RBAC  
Phase 2: Billing & Notifications (Week 3-4)  
Phase 3: Polish & Testing (Week 5)

## 16.B SPRINTS (2-Week Cycles)
Sprint 1: Auth + Workspace core  
Sprint 2: Billing + Invitations  
Sprint 3: Notifications + QA

## 16.C ATOMIC TASKS (21-Step Verifiable Units)

#### 16.C.1 PHASE 0 TASKS (Project Setup)
TASK-000: Initialize Next.js 15 project with Clerk  
Description: Scaffold app, configure Clerk middleware, setup env templates.  
Acceptance Criteria:  
□ App runs locally with Clerk sign-in page  
□ .env.example includes all required keys  
□ Basic health route responds <200ms  
Dependencies: None  
**Estimated Time:** 6 hours  
**Assigned Phase:** Phase 0  
**Assigned Sprint:** Sprint 0  
**Priority:** P0  
**Required Skills:** Frontend/DevOps  
**Complexity:** Medium

TASK-001: Configure Prisma + PostgreSQL  
Description: Create schema, migrations, and seed script.  
Acceptance Criteria:  
□ Prisma schema compiles  
□ Migration applies cleanly  
□ Seed inserts demo workspace  
Dependencies: TASK-000  
**Estimated Time:** 7 hours  
**Assigned Phase:** Phase 0  
**Assigned Sprint:** Sprint 0  
**Priority:** P0  
**Required Skills:** Backend  
**Complexity:** Medium

TASK-002: Set up CI pipeline  
Description: Add lint, typecheck, test workflow.  
Acceptance Criteria:  
□ CI runs on PRs  
□ Lint and typecheck pass  
□ Test job executed  
Dependencies: TASK-000  
**Estimated Time:** 5 hours  
**Assigned Phase:** Phase 0  
**Assigned Sprint:** Sprint 0  
**Priority:** P0  
**Required Skills:** DevOps  
**Complexity:** Low

#### 16.C.2 PHASE 1 TASKS (Foundation & Authentication)
TASK-003: Implement workspace CRUD APIs  
Description: Create REST endpoints for workspaces.  
Acceptance Criteria:  
□ Create/list/update endpoints validated with Zod  
□ Workspace slug uniqueness enforced  
□ Audit log entry created  
Dependencies: TASK-001  
**Estimated Time:** 8 hours  
**Assigned Phase:** Phase 1  
**Assigned Sprint:** Sprint 1  
**Priority:** P0  
**Required Skills:** Backend  
**Complexity:** Medium

TASK-004: Build workspace switcher UI  
Description: Add top-bar switcher and create modal.  
Acceptance Criteria:  
□ Switcher lists memberships  
□ Active workspace persists across reload  
□ Errors shown for invalid slugs  
Dependencies: TASK-003  
**Estimated Time:** 6 hours  
**Assigned Phase:** Phase 1  
**Assigned Sprint:** Sprint 1  
**Priority:** P0  
**Required Skills:** Frontend  
**Complexity:** Medium

TASK-005: Implement RBAC middleware  
Description: Add role checks for APIs and pages.  
Acceptance Criteria:  
□ Admin-only routes blocked for member/viewer  
□ Viewer has read-only access  
□ Unauthorized access returns 403  
Dependencies: TASK-003  
**Estimated Time:** 6 hours  
**Assigned Phase:** Phase 1  
**Assigned Sprint:** Sprint 1  
**Priority:** P0  
**Required Skills:** Backend  
**Complexity:** Medium

#### 16.C.3 PHASE 2 TASKS (Core Features)
TASK-006: Stripe checkout + webhook sync  
Description: Create checkout endpoint and webhook handler.  
Acceptance Criteria:  
□ Checkout returns Stripe URL  
□ Webhook updates subscription status  
□ Failed signature returns 400  
Dependencies: TASK-003  
**Estimated Time:** 9 hours  
**Assigned Phase:** Phase 2  
**Assigned Sprint:** Sprint 2  
**Priority:** P0  
**Required Skills:** Backend  
**Complexity:** High

TASK-007: Billing settings page  
Description: Show current plan and upgrade options.  
Acceptance Criteria:  
□ Plan displayed with limits  
□ Upgrade opens checkout  
□ Portal opens for cancellations  
Dependencies: TASK-006  
**Estimated Time:** 6 hours  
**Assigned Phase:** Phase 2  
**Assigned Sprint:** Sprint 2  
**Priority:** P0  
**Required Skills:** Frontend  
**Complexity:** Medium

TASK-008: Invite members flow  
Description: Create invite APIs and UI with Resend email.  
Acceptance Criteria:  
□ Invite email sent  
□ Accept link creates membership  
□ Expired invites rejected  
Dependencies: TASK-005  
**Estimated Time:** 8 hours  
**Assigned Phase:** Phase 2  
**Assigned Sprint:** Sprint 2  
**Priority:** P0  
**Required Skills:** Fullstack  
**Complexity:** Medium

TASK-009: Notification center  
Description: In-app notifications list + mark read.  
Acceptance Criteria:  
□ Notifications fetched by user  
□ Mark-as-read updates state  
□ Unread count badge  
Dependencies: TASK-008  
**Estimated Time:** 5 hours  
**Assigned Phase:** Phase 2  
**Assigned Sprint:** Sprint 3  
**Priority:** P1  
**Required Skills:** Frontend  
**Complexity:** Low

TASK-010: Core test suite  
Description: Unit + integration tests for auth, workspace, billing.  
Acceptance Criteria:  
□ Coverage >80% on core modules  
□ Critical flows have integration tests  
□ CI green  
Dependencies: TASK-006, TASK-008  
**Estimated Time:** 8 hours  
**Assigned Phase:** Phase 3  
**Assigned Sprint:** Sprint 3  
**Priority:** P0  
**Required Skills:** Testing  
**Complexity:** Medium

## 16.D TASK PRIORITY MATRIX
P0: TASK-000, TASK-001, TASK-003, TASK-004, TASK-005, TASK-006, TASK-007, TASK-008, TASK-010  
P1: TASK-009  
P2: SSO/SCIM starter  
P3: Usage-based billing add-ons

## 16.E CRITICAL PATH ANALYSIS
TASK-000 -> TASK-001 -> TASK-003 -> TASK-005 -> TASK-006 -> TASK-007 -> TASK-010  
**Total Critical Path Time:** 50 hours

## 16.F EXAMPLE COMPLETE TASK WITH 21-STEP STATUS
TASK-006: Stripe checkout + webhook sync  
- □ Define Stripe products/prices  
- □ Store price IDs in config  
- □ Implement checkout API  
- □ Validate workspace permissions  
- □ Create Stripe customer on demand  
- □ Attach metadata for workspaceId  
- □ Return checkout URL  
- □ Create webhook handler route  
- □ Verify webhook signature  
- □ Handle checkout.session.completed  
- □ Handle invoice.paid  
- □ Handle customer.subscription.updated  
- □ Persist subscription status  
- □ Update plan limits cache  
- □ Send billing notification email  
- □ Add idempotency keys  
- □ Log webhook events  
- □ Add unit tests for webhook parser  
- □ Add integration test for checkout  
- □ Add retry job for failed webhooks  
- □ Document env vars  
- □ Update billing UI states

---

# SECTION 17: GIT BRANCH PLAN + COMMIT MESSAGE PLAN

## 17.1 Branch Naming Convention
feature/saaskit-<area> (e.g., feature/saaskit-billing)

## 17.2 Branching Strategy
Trunk-based with short-lived feature branches.

## 17.3 Commit Message Format
`type(scope): message` (e.g., feat(billing): add checkout endpoint)

## 17.4 Commit Types
feat, fix, chore, refactor, test, docs

## 17.5 Pull Request Requirements
- Linked issue
- Passing CI
- At least one reviewer

## 17.6 Code Review Checklist
- Permissions verified
- Input validation present
- Tests included

## 17.6 CODE QUALITY STANDARDS
### 17.6.1 Linting Configuration
ESLint + TypeScript strict

### 17.6.2 Code Formatting Rules
Prettier, 100-char line limit

### 17.6.3 Naming Conventions
camelCase vars, PascalCase components

### 17.6.4 Comment & Documentation Requirements
Comments only for non-obvious logic

### 17.6.5 Code Review Checklist
Auth, data access, and error handling verified

### 17.6.6 Pre-commit Hooks Setup
Husky with lint-staged

---

# SECTION 18: DEVELOPMENT ROADMAP (ENHANCED)

## 18.A TIMELINE (Week-by-Week Breakdown)
Week 1: Setup + auth  
Week 2: Workspaces + RBAC  
Week 3: Billing + invites  
Week 4: Notifications + testing

## 18.B MILESTONE SCHEDULE
- M1: Auth + workspace creation
- M2: RBAC + invites
- M3: Billing live
- M4: OSS release + docs

## 18.C RESOURCE ALLOCATION
- 1 backend, 1 frontend, 0.5 DevOps

## 18.D VELOCITY TRACKING PLAN
- Track story points per sprint (target 30)

## 18.E BUFFER TIME ALLOCATION
- 20% buffer per sprint

## 18.F CRITICAL DEADLINES
- Stripe integration ready by Week 3

---

# SECTION 19: DEPLOYMENT & HOSTING PLAN

## 19.1 Hosting Provider Selection
- Vercel for Next.js
- Neon for PostgreSQL

## 19.2 Environment Setup
- Preview, staging, production environments
- Separate Clerk/Stripe keys per env

## 19.3 CI/CD Pipeline Configuration
- GitHub Actions: lint, test, build
- Vercel preview deploys on PR

## 19.4 Deployment Automation
- `vercel deploy --prod` on main

## 19.5 Rollback Procedures
- Use Vercel rollback to previous deployment

## 19.6 Zero-Downtime Deployment Strategy
- Blue/green via Vercel + migration-safe schema changes

---

# SECTION 20: TEST PLAN

## 20.1 Unit Test Strategy
Vitest for utilities and RBAC checks

## 20.2 Integration Test Scenarios
- Workspace creation
- Invite acceptance
- Stripe webhook updates

## 20.3 End-to-End Test Flows
Playwright: signup -> create workspace -> upgrade -> invite

## 20.4 Performance Testing
k6 baseline: p95 <200ms for core APIs

## 20.5 Security Testing
OWASP ZAP scans + dependency audit

## 20.6 User Acceptance Testing (UAT)
Founders test onboarding and billing

## 20.7 Test Data Management
Seed script creates demo workspace and member

## 20.8 QUALITY GATES & VERIFICATION CHECKPOINTS
### 20.8.1 When to Apply 21-Step Verification
All P0 tasks and before release

### 20.8.2 Quality Metrics per Phase
- Phase 1: 70% unit test coverage
- Phase 2: 80% coverage + 5 e2e tests

### 20.8.3 Review Schedule
Weekly code review and UX review

### 20.8.4 Acceptance Criteria Validation Points
Before merging each feature PR

---

# SECTION 21: SECURITY GUIDELINES + PERFORMANCE OPTIMIZATION

## 21.1 Security Best Practices
- Strict RBAC checks
- Input validation on every endpoint
- Secure cookies and CSRF protection

## 21.2 OWASP Top 10 Mitigation
- AuthZ checks for IDOR
- Rate limits for brute force

## 21.3 Data Encryption
- TLS in transit
- AES-256 at rest (Neon)

## 21.4 Performance Optimization Techniques
- Prisma query optimization
- Server Component caching

## 21.5 Caching Strategy
- ISR for marketing pages
- Redis cache for plan limits

## 21.6 Database Optimization
- Index on membership/workspace and subscriptions

---

# SECTION 22: NON-FUNCTIONAL REQUIREMENTS

## 22.1 Performance Targets
- p95 API response <200ms

## 22.2 Scalability Requirements
- 10k workspaces with <5% query regression

## 22.3 Availability & Uptime Goals (SLA)
- 99.9% uptime

## 22.4 Privacy & Compliance
- GDPR-ready data export and deletion

## 22.5 Accessibility Standards (WCAG 2.1 Level AA)
- All forms keyboard accessible

## 22.6 Browser & Device Compatibility
- Latest Chrome, Safari, Firefox

## 22.7 Production-Ready Definition
- CI green, security scan clean, core flows tested

---

# SECTION 23: RISKS & MITIGATION STRATEGIES

## 23.1 Technical Risks
- Stripe webhook delays -> retry queue

## 23.2 Timeline Risks
- RBAC edge cases -> add extra test buffer

## 23.3 Resource Risks
- Single maintainer -> automate releases

## 23.4 External Dependency Risks
- Clerk outage -> limited read-only fallback

## 23.5 Contingency Plans
- Feature flag to disable billing if needed

---

# SECTION 24: FINAL HANDOFF PACKAGE (ENHANCED)

## 24.A CODE REPOSITORY STRUCTURE
```
saaskit/
├── app/
├── components/
├── lib/
├── prisma/
├── scripts/
├── docs/
└── tests/
```

## 24.B DOCUMENTATION PACKAGE
- README with setup + quick start
- docs/ARCHITECTURE.md
- docs/API.md
- docs/DEPLOYMENT.md

## 24.C DEPLOYMENT SCRIPTS & CONFIGURATIONS
- scripts/deploy.sh runs tests, migrations, and vercel deploy

## 24.D ENVIRONMENT SETUP GUIDE
Required env vars:
- CLERK_SECRET_KEY
- DATABASE_URL
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- RESEND_API_KEY

## 24.E RUNBOOK (Operations Manual)
- Deploy via Vercel
- Rollback via last stable deployment
- Monitor error rate and webhook failures

## 24.F MONITORING & ALERT SETUP
- Sentry alerts for >1% errors
- PostHog for key product events

## 24.G BACKUP & DISASTER RECOVERY PLAN
- Nightly Postgres backups (Neon)
- RPO 24h, RTO 4h

## 24.H MAINTENANCE & SUPPORT PLAN
- Weekly dependency updates
- Monthly security audit

## 24.I TRAINING MATERIALS (If Team Handoff)
- 30-min architecture walkthrough
- Onboarding checklist

---

# SECTION 25: COST ESTIMATION & BUDGET

## 25.1 Infrastructure Cost Calculator
| Resource | Provider | Pricing Model | Estimated Cost |
|----------|----------|---------------|----------------|
| Web | Vercel | Pro | $20/mo |
| DB | Neon | Usage | $0-25/mo |
| Email | Resend | 3k free | $0/mo |
| Monitoring | Sentry | Events | $26/mo |

## 25.2 Third-Party Service Costs
- Clerk: $0-25/mo
- Stripe: 2.9% + 30 cents per charge

## 25.3 Scaling Cost Projections
- 1k workspaces: ~$80/mo
- 10k workspaces: ~$220/mo

## 25.4 Cost Optimization Strategies
- Cache heavy reads
- Use Stripe portal to reduce support

## 25.5 Monthly Burn Rate Tracking
Track infra + tools; target <$250/mo at 10k workspaces.

---

# SECTION 26: ANALYTICS & METRICS IMPLEMENTATION

## 26.1 Product Analytics Requirements
- Onboarding completion
- Workspace creation
- Upgrade conversion

## 26.2 Funnel Analysis Setup
Signup -> workspace created -> invite sent -> upgrade

## 26.3 Business Metrics Dashboard
MRR, active workspaces, churn

## 26.4 Analytics Tools Selection
PostHog + Stripe metrics

## 26.5 Implementation Checklist
□ Capture signup event  
□ Capture upgrade event  
□ Weekly churn report

---

# SECTION 27: ERROR HANDLING & LOGGING STRATEGY

## 27.1 Error Classification Taxonomy
- Validation, Auth, Business, External, System

## 27.2 Error Response Format
```json
{ "error": { "code": "AUTH_REQUIRED", "message": "Authentication required" } }
```

## 27.3 Retry Policies
- Stripe webhooks: 3 retries with exponential backoff

## 27.4 Circuit Breaker Pattern
- Disable billing calls if Stripe errors >5% in 5m

## 27.5 Structured Logging Specification
- JSON logs with requestId, userId, workspaceId

## 27.6 Log Levels & Retention
- error, warn, info, debug; 30-day retention

## 27.7 Centralized Logging Architecture
- Vercel logs + Sentry breadcrumbs

## 27.8 Distributed Tracing
- Request IDs propagated via headers

---

# SECTION 28: LEGAL & COMPLIANCE PACKAGE

## 28.1 Terms of Service Structure
- Usage rules, billing terms, liability

## 28.2 Privacy Policy Structure (GDPR/CCPA Ready)
- Data types, retention, deletion

## 28.3 Cookie Policy
- Analytics cookies disclosure

## 28.4 Data Processing Addendum (DPA)
- Stripe, Clerk, Resend sub-processors

## 28.5 Compliance Checklist by Region
- GDPR, CCPA, UK GDPR

---

# SECTION 29: SEO & DISCOVERABILITY

## 29.1 Technical SEO Checklist
- Metadata, OpenGraph, sitemap

## 29.2 Meta Tags Strategy
- Product + keywords "SaaS starter, multi-tenant"

## 29.3 Structured Data (Schema.org)
- SoftwareApplication schema

## 29.4 URL Structure Guidelines
- /features, /pricing, /docs

## 29.5 Core Web Vitals Targets
- LCP <2.5s, CLS <0.1

## 29.6 Sitemap & Robots.txt
- Auto-generated sitemap, allow index

---

# SECTION 30: INTERNATIONALIZATION (i18n)

## 30.1 Multi-Language Architecture
- next-intl with locale subpaths

## 30.2 Translation Key Structure
- locales/en/common.json, locales/es/common.json

## 30.3 Locale-Specific Formatting
- Intl for dates and currency

## 30.4 RTL Language Support
- Tailwind RTL plugin

## 30.5 Language Detection Strategy
- Accept-Language header + user preference

## 30.6 Translation Workflow
- PR-based translation updates

---

# SECTION 31: FEATURE FLAGS & EXPERIMENTATION

## 31.1 Feature Flag Infrastructure
- Unleash or simple DB flags

## 31.2 Flag Naming Convention
- billing.new_portal, ui.sidebar_v2

## 31.3 Flag Types
- boolean, percentage rollout, user targeting

## 31.4 Gradual Rollout Strategy
- Start at 5%, increase weekly

## 31.5 A/B Testing Framework
- PostHog experiments

## 31.6 Kill Switch Design
- Admin-only toggle in dashboard

---

# SECTION 32: REAL-TIME FEATURES ARCHITECTURE

## 32.1 WebSocket vs SSE Trade-offs
- SSE for notifications; simpler infra

## 32.2 Real-Time Notification System
- Server pushes invite/billing updates

## 32.3 Live Data Synchronization
- Revalidate workspace data on event

## 32.4 Presence Indicators
- Optional: show active admins in settings

## 32.5 Conflict Resolution (Offline-First)
- Last write wins for settings

## 32.6 Scaling Real-Time Connections
- Use managed service (Ably) if >5k concurrent

---

# SECTION 33: CUSTOMER SUPPORT INTEGRATION

## 33.1 Help Center Structure
- Docs, FAQ, Billing support

## 33.2 Support Ticket System
- HelpScout or Zendesk integration

## 33.3 Live Chat Implementation
- Intercom widget on app pages

## 33.4 AI/Chatbot Support
- FAQ bot for common issues

## 33.5 Customer Feedback Loop
- In-app feedback modal

## 33.6 Support SLA Definitions
- Critical: 4h response, 24h resolution

---

# SECTION 34: AI/ML INTEGRATION (Modern SaaS)

## 34.1 LLM API Integration Patterns
- Optional AI onboarding assistant

## 34.2 Embedding Storage (Vector Databases)
- Store docs embeddings in pgvector

## 34.3 AI Feature Implementation Guidelines
- Human review for critical actions

## 34.4 Rate Limiting for AI Features
- 10 requests/min per user

## 34.5 Cost Management for AI APIs
- Soft cap $50/mo per workspace

## 34.6 Fallback Strategies
- Disable AI if budget exceeded
