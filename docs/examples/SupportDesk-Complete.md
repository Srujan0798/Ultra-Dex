# SupportDesk - Complete Implementation Plan

> **What is this?** A fully filled Ultra-Dex SaaS Implementation Template example.
> **Purpose:** Provide a helpdesk SaaS with SLAs, tickets, and knowledge base.
> **SaaS:** SupportDesk - B2B customer support hub.

---

# SECTION 1: HIGH-LEVEL SUMMARY

## 1.1 Product Vision (One-liner)

Resolve customer tickets fast with SLA-driven workflows.

## 1.2 Problem Statement

Growing SaaS teams struggle to manage multi-channel support, response SLAs, and consistent knowledge bases.

## 1.3 Solution Overview

SupportDesk provides ticketing, SLA timers, macros, and a knowledge base using Next.js 15, Prisma, PostgreSQL, and Stripe subscriptions.

## 1.4 Target Market

- B2B SaaS teams (5-100 agents)
- Agencies handling support for clients

## 1.5 Unique Value Proposition

- SLA automation and alerting baked in
- Unified inbox + knowledge base in one tool
- Simple pricing with per-agent billing

## 1.6 Success Metrics (Key)

- Median first response time <30 minutes
- 95% SLA compliance
- 1,000 active support teams in 12 months

---

# SECTION 2: CORE FEATURES

## 2.1 Core Production Features (Critical - P0)

**Feature 1: Ticketing System**

- Simple Description: Multi-channel support tickets
- Industry Standard: Threaded conversations with statuses
- Acceptance Criteria:

  □ Tickets created from email and web form

  □ Status transitions enforced (open, pending, resolved)

  □ SLA timers track response deadlines

**Feature 2: SLA Management**

- Simple Description: SLA policies and breach alerts
- Industry Standard: Per-priority SLA rules
- Acceptance Criteria:

  □ SLA policies by plan or priority

  □ Breach alerts sent to admins

  □ SLA metrics visible in dashboard

**Feature 3: Knowledge Base**

- Simple Description: Public help center articles
- Industry Standard: SEO-friendly article pages
- Acceptance Criteria:

  □ Articles searchable with tags

  □ Draft/review/published workflow

  □ Version history available

**Feature 4: Automation Rules**

- Simple Description: Auto-assign and auto-respond
- Industry Standard: Rules engine with triggers
- Acceptance Criteria:

  □ Rules trigger on ticket creation

  □ Macros apply canned responses

  □ Rule execution logged

## 2.2 Enhanced Features (Important - P1)

- CSAT surveys
- Saved views and filters
- Agent availability schedules

## 2.3 Future Features (Nice-to-Have - P2/P3)

- Voice support integrations
- AI-assisted draft replies

---

# SECTION 3: PRODUCT DESCRIPTION (Industry Standard)

## 3.1 Elevator Pitch (30 seconds)

SupportDesk helps SaaS teams manage tickets, SLAs, and help center content with a clean workflow and straightforward billing.

## 3.2 Detailed Product Description

SupportDesk unifies email and in-app support with ticketing, SLA tracking, automation rules, and a knowledge base. Teams can meet response targets while giving customers consistent answers.

## 3.3 Key Benefits

- Faster response times
- Fewer SLA breaches
- Better self-serve content

## 3.4 How It Works (User Perspective)

Step 1: Customer submits ticket  
Step 2: SLA timer starts and ticket assigned  
Step 3: Agent responds and resolves  
Step 4: Customer leaves CSAT feedback

## 3.5 Competitive Positioning

SupportDesk focuses on SLA automation and OSS-friendly workflows with a lightweight UI.

---

# SECTION 4: USER PERSONAS

### Persona 1: Support Manager

**Demographics:**

- Age: 30-50
- Occupation: Support manager
- Tech Savviness: Medium

**Goals:**

- Meet SLA targets
- Improve customer satisfaction

**Pain Points:**

- Manual SLA tracking
- Inconsistent responses

**Behaviors:**

- Reviews SLA dashboards daily

**Motivations:**

- Avoid escalations

### Persona 2: Support Agent

**Demographics:**

- Age: 22-40
- Occupation: Support agent
- Tech Savviness: Medium

**Goals:**

- Resolve tickets quickly
- Use macros for speed

**Pain Points:**

- Repetitive replies
- Poor ticket routing

**Behaviors:**

- Uses keyboard shortcuts and saved replies

**Motivations:**

- Higher CSAT scores

---

# SECTION 5: USER STORIES

## 5.1 Basic User Stories (Epic Level)

**Epic 1: Ticket Management**

- As an agent, I want to view assigned tickets so I can respond quickly
- As a manager, I want SLA dashboards so I can monitor performance

**Epic 2: Knowledge Base**

- As a customer, I want to search articles so I can self-serve

## 5.2 Detailed User Stories (Task Level)

**Story: Respond to Ticket**

- As a: Agent
- I want to: Reply to a ticket
- So that: The customer gets help
- Acceptance Criteria:

  □ Reply saved in ticket thread

  □ SLA timer pauses on response

  □ Customer receives email reply

- Priority: P0
- Estimated Effort: 6 hours

**Story: Create SLA Policy**

- As a: Manager
- I want to: Define SLA rules by priority
- So that: Breach alerts trigger correctly
- Acceptance Criteria:

  □ Policy defines first response and resolution targets

  □ SLA applied based on ticket priority

  □ Breach triggers notification

- Priority: P0
- Estimated Effort: 7 hours

---

# SECTION 6: SCREEN / PAGE MAP

## 6.1 Public Pages (No Auth Required)

Landing (/)
Pricing (/pricing)
Knowledge Base (/kb)
Login (/login)
Sign Up (/signup)

## 6.2 Authenticated Pages (Auth Required)

Dashboard (/app)
Tickets (/app/tickets)
Ticket Detail (/app/tickets/:id)
SLA Dashboard (/app/sla)
Automation (/app/automation)
KB Admin (/app/kb)
Settings (/app/settings)

## 6.3 Page Component Breakdown

**Example: Ticket Detail**

```
/app/tickets/:id
├── TicketHeader
├── MessageThread
└── ReplyComposer
```

---

# SECTION 7: USER FLOW & SYSTEM FLOW

## 7.1 Simple User Flow (Happy Path)

Signup -> create SLA -> receive ticket -> respond -> resolve -> CSAT survey

## 7.2 Advanced System Flow (With Error Handling)

Ticket inbound -> create ticket -> assign agent -> SLA timer starts  
If SLA breach -> notify manager + escalate

## 7.3 Critical User Journeys

**Journey 1:** First response within SLA  
**Journey 2:** Knowledge base article published  
**Journey 3:** Automation rule applied to new ticket

---

# SECTION 8: OBJECTIVES

## 8.1 Primary Objectives (Must Achieve)

1. **SLA compliance**
   - Success Metric: 95% SLA met
   - Timeline: Month 2
   - Owner: Support Ops

2. **Ticket resolution speed**
   - Success Metric: <12 hours average resolution
   - Timeline: Month 2
   - Owner: Support Team

## 8.2 Secondary Objectives (Should Achieve)

1. Reduce ticket volume via knowledge base

## 8.3 Tertiary Objectives (Nice to Achieve)

1. AI reply drafts

## 8.4 Anti-Objectives (What We're NOT Doing)

1. No phone support in V1

---

# SECTION 9: FULL FEATURE SPECIFICATIONS

### Feature 1: Ticketing

**Priority:** P0  
**Complexity:** Medium  
**Estimated Time:** 4 days

**Description:** Threaded ticket management with status and priority.

**Acceptance Criteria:**  
□ Tickets created from email + web  
□ Status transitions enforced  
□ SLA timers tracked

### Feature 2: SLA Management

**Priority:** P0  
**Complexity:** Medium  
**Estimated Time:** 3 days

**Description:** SLA policies with breach alerts.

**Acceptance Criteria:**  
□ SLA policies per priority  
□ Breach alerts sent  
□ SLA dashboard updated

### Feature 3: Knowledge Base

**Priority:** P1  
**Complexity:** Medium  
**Estimated Time:** 3 days

**Description:** Public articles with search.

**Acceptance Criteria:**  
□ SEO-friendly article pages  
□ Draft/review/publish workflow  
□ Version history

---

# SECTION 10: DATA MODEL

## 10.1 Entity Relationship Overview

```
User --< Workspace --< Ticket --< TicketMessage
Workspace --< SlaPolicy
Workspace --< Article
```

## 10.2 Data Entities (JSON Schema)

**Ticket Entity:**

```json
{
  "id": "uuid",
  "workspaceId": "uuid",
  "subject": "string",
  "priority": "enum (low, medium, high, urgent)",
  "status": "enum (open, pending, resolved)",
  "slaDeadlineAt": "timestamp",
  "createdAt": "timestamp"
}
```

**TicketMessage Entity:**

```json
{
  "id": "uuid",
  "ticketId": "uuid",
  "authorId": "uuid",
  "body": "string",
  "createdAt": "timestamp"
}
```

**SlaPolicy Entity:**

```json
{
  "id": "uuid",
  "workspaceId": "uuid",
  "priority": "enum (low, medium, high, urgent)",
  "firstResponseMinutes": "int",
  "resolutionMinutes": "int",
  "createdAt": "timestamp"
}
```

**Article Entity:**

```json
{
  "id": "uuid",
  "workspaceId": "uuid",
  "title": "string",
  "status": "enum (draft, review, published)",
  "slug": "string",
  "createdAt": "timestamp"
}
```

## 10.3 Relationships

- Workspace has many Tickets, Articles, SLA Policies

## 10.4 Indexes

- Ticket.workspaceId + status
- Article.slug (unique)

## 10.5 Data Validation Rules

- SLA deadlines must be in future
- Ticket subject required

---

# SECTION 11: API BLUEPRINT

## 11.1 API Architecture

Next.js Route Handlers + Prisma.

## 11.2 Authentication Endpoints

Clerk sessions for agents.

## 11.3 Resource Endpoints

- POST /api/tickets
- POST /api/tickets/:id/reply
- PATCH /api/tickets/:id/status
- POST /api/sla/policies
- POST /api/kb/articles

#### POST `/api/tickets`

```json
{ "subject": "Login issue", "priority": "high" }
```

Response:

```json
{ "id": "t_123", "status": "open" }
```

## 11.4 Authentication Flow

Clerk session -> load workspace -> authorize by role.

## 11.5 Error Handling Standards

| Code | Scenario      | Message                   |
| ---- | ------------- | ------------------------- |
| 401  | No session    | "Authentication required" |
| 403  | Not agent     | "Access denied"           |
| 409  | Duplicate SLA | "SLA already exists"      |

## 11.6 Rate Limiting

60 requests/min per agent.

---

# SECTION 12: SYSTEM ARCHITECTURE

## 12.1 Architecture Overview

Next.js 15 + Prisma + Postgres + Stripe.

## 12.2 Frontend Architecture

App Router with server actions for ticket updates.

## 12.3 Backend Architecture

Route handlers for ticketing and SLA rules.

## 12.4 Database Architecture

Postgres with workspace scoping.

## 12.5 Third-Party Integrations

Stripe, Clerk, Resend, Sentry.

---

# SECTION 13: LOGIC FLOW (Engineering Format)

## 13.1 Authentication Logic Flow

Session validated -> workspace loaded -> role enforced.

## 13.2 Core Feature Logic Flows

**Ticket Reply:**  
Agent replies -> message stored -> SLA timer pauses -> email sent.

**SLA Breach:**  
Timer hits deadline -> breach event -> notify manager.

## 13.3 State Management Flow

Server actions invalidate ticket cache on update.

---

# SECTION 14: PRD (Product Requirements Document)

## 14.1 Problem Statement

Support teams need SLA-driven ticket workflows.

## 14.2 Solution Overview

Provide ticketing + SLA + KB in one tool.

## 14.3 Constraints & Assumptions

- Stripe billing only
- Email as primary channel

## 14.4 Success Metrics & KPIs

- <30 min first response
- 95% SLA compliance

## 14.5 Out of Scope (V1)

- Voice support

---

# SECTION 15: TECH STACK RECOMMENDATIONS

## 15.1 Frontend Stack

| Layer     | Technology | Version | Justification |
| --------- | ---------- | ------- | ------------- |
| Framework | Next.js    | 15.x    | App Router    |
| Language  | TypeScript | 5.5+    | Type safety   |
| UI        | shadcn/ui  | Latest  | Accessible    |

## 15.2 Backend Stack

| Layer      | Technology | Version | Justification     |
| ---------- | ---------- | ------- | ----------------- |
| ORM        | Prisma     | 5.x     | Strong typing     |
| Validation | Zod        | 3.x     | Schema validation |

## 15.3 Database & Storage

PostgreSQL 15.

## 15.4 DevOps & Infrastructure

Vercel + GitHub Actions.

## 15.5 Development Tools

pnpm, ESLint, Prettier, Vitest, Playwright.

## 15.6 Third-Party Services

Clerk, Stripe, Resend, Sentry.

### 15.6 TASK BREAKDOWN METHODOLOGY

Use template guidelines.

---

# SECTION 16: IMPLEMENTATION PLAN (ENHANCED)

## 16.A PHASES (High-Level Milestones)

Phase 0: Setup  
Phase 1: Ticketing core  
Phase 2: SLA + automation  
Phase 3: KB + billing

## 16.B SPRINTS (2-Week Cycles)

Sprint 1: Auth + ticketing  
Sprint 2: SLA + automation  
Sprint 3: KB + billing

## 16.C ATOMIC TASKS (21-Step Verifiable Units)

#### 16.C.1 PHASE 0 TASKS (Project Setup)

TASK-000: Bootstrap Next.js 15 project  
Description: Setup app with Clerk and Prisma.  
Acceptance Criteria:\n□ App runs\n□ Clerk login works\n□ Env template created  
Dependencies: None  
**Estimated Time:** 6 hours  
**Assigned Phase:** Phase 0  
**Priority:** P0  
**Required Skills:** Fullstack  
**Complexity:** Medium

TASK-001: Ticket schema + migrations  
Description: Create Ticket, TicketMessage, SlaPolicy models.  
Acceptance Criteria:\n□ Migrations applied\n□ Seed demo tickets\n□ RLS-style checks in middleware  
Dependencies: TASK-000  
**Estimated Time:** 7 hours  
**Assigned Phase:** Phase 0  
**Priority:** P0  
**Required Skills:** Backend  
**Complexity:** Medium

#### 16.C.2 PHASE 1 TASKS (Foundation & Authentication)

TASK-002: Ticket creation API  
Description: Create ticket endpoints with validation.  
Acceptance Criteria:\n□ POST /api/tickets works\n□ Status defaults to open\n□ SLA deadline computed  
Dependencies: TASK-001  
**Estimated Time:** 6 hours  
**Assigned Phase:** Phase 1  
**Priority:** P0  
**Required Skills:** Backend  
**Complexity:** Medium

TASK-003: Ticket UI + inbox  
Description: Build ticket list and detail UI.  
Acceptance Criteria:\n□ Ticket list searchable\n□ Ticket detail shows thread\n□ Reply composer works  
Dependencies: TASK-002  
**Estimated Time:** 8 hours  
**Assigned Phase:** Phase 1  
**Priority:** P0  
**Required Skills:** Frontend  
**Complexity:** Medium

TASK-004: SLA policy engine  
Description: Apply SLA policies and breach alerts.  
Acceptance Criteria:\n□ SLA policy applies by priority\n□ Breach triggers notification\n□ SLA dashboard updates  
Dependencies: TASK-001  
**Estimated Time:** 8 hours  
**Assigned Phase:** Phase 2  
**Priority:** P0  
**Required Skills:** Backend  
**Complexity:** High

TASK-005: Knowledge base CRUD  
Description: Article create/edit/publish.  
Acceptance Criteria:\n□ Draft/review/published workflow\n□ Article search\n□ SEO-friendly slug  
Dependencies: TASK-001  
**Estimated Time:** 7 hours  
**Assigned Phase:** Phase 3  
**Priority:** P1  
**Required Skills:** Fullstack  
**Complexity:** Medium

TASK-006: Billing + plans  
Description: Stripe subscriptions for per-agent billing.  
Acceptance Criteria:\n□ Checkout session created\n□ Webhooks sync plan\n□ Seat limits enforced  
Dependencies: TASK-003  
**Estimated Time:** 8 hours  
**Assigned Phase:** Phase 3  
**Priority:** P0  
**Required Skills:** Backend  
**Complexity:** High

## 16.D TASK PRIORITY MATRIX

P0: TASK-000, TASK-001, TASK-002, TASK-003, TASK-004, TASK-006  
P1: TASK-005  
P2: AI reply drafts  
P3: Voice support

## 16.E CRITICAL PATH ANALYSIS

TASK-000 -> TASK-001 -> TASK-002 -> TASK-003 -> TASK-006  
**Total Critical Path Time:** 35 hours

## 16.F EXAMPLE COMPLETE TASK WITH 21-STEP STATUS

TASK-004: SLA policy engine

- □ Define SLA tables
- □ Calculate deadlines
- □ Schedule breach checks
- □ Send alerts
- □ Add dashboard metrics

---

# SECTION 17: GIT BRANCH PLAN + COMMIT MESSAGE PLAN

## 17.1 Branch Naming Convention

feature/supportdesk-<area>

## 17.2 Branching Strategy

Trunk-based.

## 17.3 Commit Message Format

type(scope): message

## 17.4 Commit Types

feat, fix, chore, docs, test

## 17.5 Pull Request Requirements

CI green + reviewer approval.

## 17.6 Code Review Checklist

SLA logic, ticket permissions, billing accuracy.

## 17.6 CODE QUALITY STANDARDS

ESLint + Prettier + strict TS.

---

# SECTION 18: DEVELOPMENT ROADMAP (ENHANCED)

## 18.A TIMELINE (Week-by-Week Breakdown)

Week 1: Setup + tickets  
Week 2: SLA + automation  
Week 3: KB + billing

## 18.B MILESTONE SCHEDULE

- M1: Ticketing
- M2: SLA dashboards
- M3: Billing

## 18.C RESOURCE ALLOCATION

1 backend, 1 frontend.

## 18.D VELOCITY TRACKING PLAN

25 story points per sprint.

## 18.E BUFFER TIME ALLOCATION

20% buffer per sprint.

## 18.F CRITICAL DEADLINES

SLA engine ready by Week 2.

---

# SECTION 19: DEPLOYMENT & HOSTING PLAN

## 19.1 Hosting Provider Selection

Vercel + Postgres.

## 19.2 Environment Setup

Dev, staging, production.

## 19.3 CI/CD Pipeline Configuration

GitHub Actions for lint/test.

## 19.4 Deployment Automation

Vercel deploy on main.

## 19.5 Rollback Procedures

Vercel rollback.

## 19.6 Zero-Downtime Deployment Strategy

Backward-compatible migrations.

---

# SECTION 20: TEST PLAN

## 20.1 Unit Test Strategy

Vitest for SLA calculations.

## 20.2 Integration Test Scenarios

Ticket creation, SLA breach alert, billing sync.

## 20.3 End-to-End Test Flows

Create ticket -> respond -> resolve -> CSAT.

## 20.4 Performance Testing

k6 for ticket list.

## 20.5 Security Testing

OWASP ZAP + dependency audit.

## 20.6 User Acceptance Testing (UAT)

Support team signs off on SLA workflow.

## 20.7 Test Data Management

Seed tickets + SLA policies.

## 20.8 QUALITY GATES & VERIFICATION CHECKPOINTS

Release checklists per sprint.

---

# SECTION 21: SECURITY GUIDELINES + PERFORMANCE OPTIMIZATION

## 21.1 Security Best Practices

RBAC for tickets, strict input validation.

## 21.2 OWASP Top 10 Mitigation

Prevent IDOR in ticket access.

## 21.3 Data Encryption

TLS + AES-256 at rest.

## 21.4 Performance Optimization Techniques

Pagination and caching for ticket lists.

## 21.5 Caching Strategy

Cache SLA dashboards.

## 21.6 Database Optimization

Index tickets by status + priority.

---

# SECTION 22: NON-FUNCTIONAL REQUIREMENTS

## 22.1 Performance Targets

Ticket list p95 <300ms.

## 22.2 Scalability Requirements

100k tickets per workspace.

## 22.3 Availability & Uptime Goals (SLA)

99.9% uptime.

## 22.4 Privacy & Compliance

GDPR-ready deletion.

## 22.5 Accessibility Standards (WCAG 2.1 Level AA)

Keyboard navigation in inbox.

## 22.6 Browser & Device Compatibility

Latest Chrome, Safari, Firefox.

## 22.7 Production-Ready Definition

SLA compliance dashboard live.

---

# SECTION 23: RISKS & MITIGATION STRATEGIES

## 23.1 Technical Risks

SLA timers at scale -> background job queue.

## 23.2 Timeline Risks

KB workflow scope -> start with MVP.

## 23.3 Resource Risks

Limited QA -> focus on SLA tests.

## 23.4 External Dependency Risks

Email delivery delays -> resend retries.

## 23.5 Contingency Plans

Disable automation rules if failure rate high.

---

# SECTION 24: FINAL HANDOFF PACKAGE (ENHANCED)

## 24.A CODE REPOSITORY STRUCTURE

supportdesk/
app/ components/ prisma/ scripts/ docs/

## 24.B DOCUMENTATION PACKAGE

README + SLA docs + KB docs.

## 24.C DEPLOYMENT SCRIPTS & CONFIGURATIONS

deploy.sh with migrations.

## 24.D ENVIRONMENT SETUP GUIDE

DATABASE_URL, CLERK_SECRET_KEY, STRIPE_SECRET_KEY.

## 24.E RUNBOOK (Operations Manual)

Monitor SLA breaches and ticket backlog.

## 24.F MONITORING & ALERT SETUP

Alerts on SLA breach spikes.

## 24.G BACKUP & DISASTER RECOVERY PLAN

Daily Postgres backups.

## 24.H MAINTENANCE & SUPPORT PLAN

Weekly updates, monthly SLA review.

## 24.I TRAINING MATERIALS (If Team Handoff)

Agent onboarding guide.

---

# SECTION 25: COST ESTIMATION & BUDGET

## 25.1 Infrastructure Cost Calculator

| Resource   | Provider | Pricing Model | Estimated Cost |
| ---------- | -------- | ------------- | -------------- |
| Web        | Vercel   | Pro           | $20/mo         |
| DB         | Postgres | Usage         | $25/mo         |
| Email      | Resend   | Usage         | $0-20/mo       |
| Monitoring | Sentry   | Events        | $26/mo         |

## 25.2 Third-Party Service Costs

Stripe 2.9% + 30 cents per payment.

## 25.3 Scaling Cost Projections

10k tickets/day -> ~$120/mo.

## 25.4 Cost Optimization Strategies

Archive old tickets and compress attachments.

## 25.5 Monthly Burn Rate Tracking

Target <$200/mo for 10k tickets/day.

---

# SECTION 26: ANALYTICS & METRICS IMPLEMENTATION

## 26.1 Product Analytics Requirements

Track ticket creation, SLA breaches, CSAT.

## 26.2 Funnel Analysis Setup

Ticket created -> first response -> resolution.

## 26.3 Business Metrics Dashboard

SLA compliance, resolution time, CSAT.

## 26.4 Analytics Tools Selection

PostHog + Stripe.

## 26.5 Implementation Checklist

□ Track ticket created  
□ Track SLA breach  
□ Track CSAT response

---

# SECTION 27: ERROR HANDLING & LOGGING STRATEGY

## 27.1 Error Classification Taxonomy

Validation, Auth, SLA, Billing, External.

## 27.2 Error Response Format

```json
{ "error": { "code": "SLA_BREACH", "message": "SLA breached" } }
```

## 27.3 Retry Policies

Email delivery retries x3.

## 27.4 Circuit Breaker Pattern

Pause automation if failures >5%.

## 27.5 Structured Logging Specification

ticketId, workspaceId, status.

## 27.6 Log Levels & Retention

error, warn, info; 30 days.

## 27.7 Centralized Logging Architecture

Sentry + Vercel logs.

## 27.8 Distributed Tracing

Request IDs per ticket update.

---

# SECTION 28: LEGAL & COMPLIANCE PACKAGE

## 28.1 Terms of Service Structure

Support usage terms + SLA commitments.

## 28.2 Privacy Policy Structure (GDPR/CCPA Ready)

Ticket data retention policy.

## 28.3 Cookie Policy

Analytics cookies.

## 28.4 Data Processing Addendum (DPA)

Stripe + email provider.

## 28.5 Compliance Checklist by Region

GDPR, CCPA.

---

# SECTION 29: SEO & DISCOVERABILITY

## 29.1 Technical SEO Checklist

Help center indexing, structured data.

## 29.2 Meta Tags Strategy

"support desk", "SLA software".

## 29.3 Structured Data (Schema.org)

FAQPage schema for KB.

## 29.4 URL Structure Guidelines

/kb/:slug

## 29.5 Core Web Vitals Targets

LCP <2.5s.

## 29.6 Sitemap & Robots.txt

Include KB pages.

---

# SECTION 30: INTERNATIONALIZATION (i18n)

## 30.1 Multi-Language Architecture

next-intl.

## 30.2 Translation Key Structure

locales/en/common.json, locales/es/common.json.

## 30.3 Locale-Specific Formatting

Intl for dates and numbers.

## 30.4 RTL Language Support

Not in V1.

## 30.5 Language Detection Strategy

User profile setting.

## 30.6 Translation Workflow

PR-based updates.

---

# SECTION 31: FEATURE FLAGS & EXPERIMENTATION

## 31.1 Feature Flag Infrastructure

DB flags.

## 31.2 Flag Naming Convention

sla.alerts, kb.search_v2.

## 31.3 Flag Types

boolean + percentage.

## 31.4 Gradual Rollout Strategy

10% weekly rollout.

## 31.5 A/B Testing Framework

PostHog experiments.

## 31.6 Kill Switch Design

Admin toggle for automation rules.

---

# SECTION 32: REAL-TIME FEATURES ARCHITECTURE

## 32.1 WebSocket vs SSE Trade-offs

SSE for live ticket updates.

## 32.2 Real-Time Notification System

Live SLA breach alerts.

## 32.3 Live Data Synchronization

Ticket list refresh every 30s.

## 32.4 Presence Indicators

Show active agents on ticket.

## 32.5 Conflict Resolution (Offline-First)

Last write wins on ticket tags.

## 32.6 Scaling Real-Time Connections

Use Pusher if >5k concurrent.

---

# SECTION 33: CUSTOMER SUPPORT INTEGRATION

## 33.1 Help Center Structure

KB, FAQs, onboarding.

## 33.2 Support Ticket System

SupportDesk internal.

## 33.3 Live Chat Implementation

Intercom widget.

## 33.4 AI/Chatbot Support

KB search bot.

## 33.5 Customer Feedback Loop

CSAT surveys.

## 33.6 Support SLA Definitions

Critical: 2h response.

---

# SECTION 34: AI/ML INTEGRATION (Modern SaaS)

## 34.1 LLM API Integration Patterns

Draft response suggestions.

## 34.2 Embedding Storage (Vector Databases)

Store KB embeddings in pgvector.

## 34.3 AI Feature Implementation Guidelines

Human review before sending replies.

## 34.4 Rate Limiting for AI Features

5 requests/min per agent.

## 34.5 Cost Management for AI APIs

$50/mo cap per workspace.

## 34.6 Fallback Strategies

Disable AI suggestions if budget exceeded.
