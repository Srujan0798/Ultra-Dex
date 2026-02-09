# CourseForge - Complete Implementation Plan

> **What is this?** A fully filled Ultra-Dex SaaS Implementation Template example.
> **Purpose:** Provide a course creation and cohort learning platform.
> **SaaS:** CourseForge - Build, sell, and run cohorts.

---

# SECTION 1: HIGH-LEVEL SUMMARY

## 1.1 Product Vision (One-liner)

Launch cohort-based courses with built-in scheduling and payments.

## 1.2 Problem Statement

Creators struggle to manage lessons, cohorts, and payments across separate tools, leading to drop-offs and admin overhead.

## 1.3 Solution Overview

CourseForge provides course authoring, cohort scheduling, live sessions, and payment gating on Remix + Supabase + Cloudflare R2.

## 1.4 Target Market

- Course creators and coaches
- Bootcamps and cohort-based programs

## 1.5 Unique Value Proposition

- Cohort scheduling + attendance tracking
- Integrated video asset storage
- Simple checkout + enrollment flow

## 1.6 Success Metrics (Key)

- 80% course completion rate
- <15 minutes time to publish a course
- $25K MRR by month 6

---

# SECTION 2: CORE FEATURES

## 2.1 Core Production Features (Critical - P0)

**Feature 1: Course Builder**

- Simple Description: Build lessons with markdown + embeds
- Industry Standard: Structured modules + lessons
- Acceptance Criteria:

  □ Lessons support video and downloads

  □ Autosave course edits

  □ Preview mode available

**Feature 2: Cohort Scheduling**

- Simple Description: Run cohorts with start/end dates
- Industry Standard: Calendar-based cohort sessions
- Acceptance Criteria:

  □ Cohorts have capacity limits

  □ Session reminders sent

  □ Attendance tracked

**Feature 3: Payments + Enrollment**

- Simple Description: Paid enrollments via Stripe
- Industry Standard: Checkout + access control
- Acceptance Criteria:

  □ Stripe checkout for courses

  □ Enrollment created on payment

  □ Access revoked on refund

**Feature 4: Student Portal**

- Simple Description: Student dashboard with progress
- Industry Standard: Progress tracking and completion certificates
- Acceptance Criteria:

  □ Progress tracked per lesson

  □ Completion status visible

  □ Certificate downloadable

## 2.2 Enhanced Features (Important - P1)

- Community discussions
- Live session integrations

## 2.3 Future Features (Nice-to-Have - P2/P3)

- Affiliate program
- AI-generated quizzes

---

# SECTION 3: PRODUCT DESCRIPTION (Industry Standard)

## 3.1 Elevator Pitch (30 seconds)

CourseForge helps creators run cohort-based courses with an integrated builder, scheduling, and payments.

## 3.2 Detailed Product Description

CourseForge centralizes content creation, cohort scheduling, and student engagement. Creators can host lessons, schedule live sessions, and manage enrollments without stitching together multiple tools.

## 3.3 Key Benefits

- Reduced admin overhead
- Higher completion rates
- Faster course launches

## 3.4 How It Works (User Perspective)

Step 1: Build course  
Step 2: Open cohort  
Step 3: Enroll students  
Step 4: Deliver sessions

## 3.5 Competitive Positioning

CourseForge focuses on cohort management rather than static course hosting.

---

# SECTION 4: USER PERSONAS

### Persona 1: Course Creator

**Demographics:**

- Age: 25-45
- Occupation: Educator/creator
- Tech Savviness: Medium

**Goals:**

- Launch a course quickly
- Keep students engaged

**Pain Points:**

- Fragmented tooling
- Manual scheduling

**Behaviors:**

- Runs weekly cohorts

**Motivations:**

- Increase revenue

---

# SECTION 5: USER STORIES

## 5.1 Basic User Stories (Epic Level)

**Epic 1: Course Creation**

- As a creator, I want to create lessons so I can publish a course

**Epic 2: Cohorts**

- As a creator, I want to schedule cohorts so I can deliver live sessions

## 5.2 Detailed User Stories (Task Level)

**Story: Enroll a Student**

- As a: Creator
- I want to: Enroll a student after payment
- So that: Access is granted
- Acceptance Criteria:

  □ Enrollment created on successful checkout

  □ Student receives confirmation email

  □ Access available immediately

- Priority: P0
- Estimated Effort: 6 hours

---

# SECTION 6: SCREEN / PAGE MAP

## 6.1 Public Pages (No Auth Required)

Landing (/)
Pricing (/pricing)
Course Catalog (/courses)
Login (/login)
Sign Up (/signup)

## 6.2 Authenticated Pages (Auth Required)

Creator Dashboard (/app)
Course Builder (/app/courses/:id)
Cohorts (/app/cohorts)
Students (/app/students)
Billing (/app/billing)

## 6.3 Page Component Breakdown

**Example: Course Builder**

```
/app/courses/:id
├── ModuleList
├── LessonEditor
└── PreviewPane
```

---

# SECTION 7: USER FLOW & SYSTEM FLOW

## 7.1 Simple User Flow (Happy Path)

Create course -> open cohort -> enroll students -> deliver sessions

## 7.2 Advanced System Flow (With Error Handling)

Checkout -> Stripe payment -> enrollment created -> access granted  
If payment fails -> no enrollment created

## 7.3 Critical User Journeys

**Journey 1:** First cohort launched  
**Journey 2:** Student completion certificate  
**Journey 3:** Refund removes access

---

# SECTION 8: OBJECTIVES

## 8.1 Primary Objectives (Must Achieve)

1. **Smooth cohort management**
   - Success Metric: 90% on-time session delivery
   - Timeline: Month 2
   - Owner: Product

2. **Reliable payments**
   - Success Metric: 0 payment sync errors
   - Timeline: Month 1
   - Owner: Engineering

## 8.2 Secondary Objectives (Should Achieve)

1. Improve completion rates

## 8.3 Tertiary Objectives (Nice to Achieve)

1. AI quizzes

## 8.4 Anti-Objectives (What We're NOT Doing)

1. No marketplace in V1

---

# SECTION 9: FULL FEATURE SPECIFICATIONS

### Feature 1: Course Builder

**Priority:** P0  
**Complexity:** Medium  
**Estimated Time:** 4 days

**Description:** Course authoring with modules and lessons.

**Acceptance Criteria:**  
□ Modules and lessons saved  
□ Preview mode available  
□ Autosave working

### Feature 2: Cohort Scheduling

**Priority:** P0  
**Complexity:** Medium  
**Estimated Time:** 3 days

**Description:** Cohorts with dates and capacity.

**Acceptance Criteria:**  
□ Capacity limits enforced  
□ Session reminders sent  
□ Attendance tracked

### Feature 3: Payments + Enrollment

**Priority:** P0  
**Complexity:** High  
**Estimated Time:** 4 days

**Description:** Stripe checkout with enrollment sync.

**Acceptance Criteria:**  
□ Enrollment created on payment  
□ Refund removes access  
□ Invoice stored

---

# SECTION 10: DATA MODEL

## 10.1 Entity Relationship Overview

```
User --< Workspace --< Course --< Module --< Lesson
Course --< Cohort --< Enrollment
```

## 10.2 Data Entities (JSON Schema)

**Course Entity:**

```json
{
  "id": "uuid",
  "workspaceId": "uuid",
  "title": "string",
  "status": "enum (draft, published)",
  "priceCents": "int",
  "createdAt": "timestamp"
}
```

**Cohort Entity:**

```json
{
  "id": "uuid",
  "courseId": "uuid",
  "startDate": "date",
  "endDate": "date",
  "capacity": "int",
  "createdAt": "timestamp"
}
```

**Enrollment Entity:**

```json
{
  "id": "uuid",
  "cohortId": "uuid",
  "studentId": "uuid",
  "status": "enum (active, completed, refunded)",
  "createdAt": "timestamp"
}
```

## 10.3 Relationships

- Course has many Cohorts and Modules
- Cohort has many Enrollments

## 10.4 Indexes

- Course.workspaceId + status
- Enrollment.cohortId + studentId

## 10.5 Data Validation Rules

- Capacity must be >0
- Published courses require price

---

# SECTION 11: API BLUEPRINT

## 11.1 API Architecture

Remix loaders/actions with Supabase auth.

## 11.2 Authentication Endpoints

Supabase Auth for creators.

## 11.3 Resource Endpoints

- POST /api/courses
- POST /api/cohorts
- POST /api/enrollments
- POST /api/billing/checkout

#### POST `/api/courses`

```json
{ "title": "Product Marketing" }
```

Response:

```json
{ "id": "course_123", "status": "draft" }
```

## 11.4 Authentication Flow

Supabase session -> authorize workspace -> perform action.

## 11.5 Error Handling Standards

| Code | Scenario      | Message          |
| ---- | ------------- | ---------------- |
| 401  | No session    | "Login required" |
| 409  | Capacity full | "Cohort full"    |

## 11.6 Rate Limiting

30 writes/min per creator.

---

# SECTION 12: SYSTEM ARCHITECTURE

## 12.1 Architecture Overview

Remix + Supabase + R2 storage.

## 12.2 Frontend Architecture

Remix routes with nested layouts.

## 12.3 Backend Architecture

Remix loaders/actions + Supabase RPC.

## 12.4 Database Architecture

Supabase Postgres with RLS.

## 12.5 Third-Party Integrations

Stripe, Resend, R2.

---

# SECTION 13: LOGIC FLOW (Engineering Format)

## 13.1 Authentication Logic Flow

Login -> session -> load workspace -> authorize.

## 13.2 Core Feature Logic Flows

**Enrollment Flow:**  
Checkout -> Stripe webhook -> enrollment created -> email sent.

## 13.3 State Management Flow

Remix loaders provide data, optimistic UI for enrollments.

---

# SECTION 14: PRD (Product Requirements Document)

## 14.1 Problem Statement

Creators need streamlined cohort management.

## 14.2 Solution Overview

Provide course builder + cohorts + payments.

## 14.3 Constraints & Assumptions

- Stripe is only payment provider

## 14.4 Success Metrics & KPIs

- 80% completion rates
- <15 minute publish time

## 14.5 Out of Scope (V1)

- Marketplace

---

# SECTION 15: TECH STACK RECOMMENDATIONS

## 15.1 Frontend Stack

Remix + TypeScript + Tailwind.

## 15.2 Backend Stack

Supabase + Postgres.

## 15.3 Database & Storage

Supabase Postgres + R2 for lesson assets.

## 15.4 DevOps & Infrastructure

Cloudflare Pages.

## 15.5 Development Tools

pnpm, ESLint, Playwright.

## 15.6 Third-Party Services

Stripe, Resend, Sentry.

### 15.6 TASK BREAKDOWN METHODOLOGY

Use template guidelines.

---

# SECTION 16: IMPLEMENTATION PLAN (ENHANCED)

## 16.A PHASES (High-Level Milestones)

Phase 0: Setup  
Phase 1: Course builder  
Phase 2: Cohorts + enrollment  
Phase 3: Payments + tests

## 16.B SPRINTS (2-Week Cycles)

Sprint 1: Course builder  
Sprint 2: Cohorts  
Sprint 3: Payments

## 16.C ATOMIC TASKS (21-Step Verifiable Units)

#### 16.C.1 PHASE 0 TASKS (Project Setup)

TASK-000: Bootstrap Remix + Supabase  
Description: Initialize Remix, configure auth.  
Acceptance Criteria:\n□ App runs\n□ Auth works\n□ Env template created  
Dependencies: None  
**Estimated Time:** 6 hours  
**Assigned Phase:** Phase 0  
**Priority:** P0  
**Required Skills:** Fullstack  
**Complexity:** Medium

TASK-001: Course schema + migrations  
Description: Create Course, Module, Lesson, Cohort tables.  
Acceptance Criteria:\n□ Migrations applied\n□ RLS policies created\n□ Seed data inserted  
Dependencies: TASK-000  
**Estimated Time:** 7 hours  
**Assigned Phase:** Phase 0  
**Priority:** P0  
**Required Skills:** Backend  
**Complexity:** Medium

#### 16.C.2 PHASE 1 TASKS (Foundation & Authentication)

TASK-002: Course builder UI  
Description: Build module/lesson editor.  
Acceptance Criteria:\n□ Modules addable\n□ Lessons saved\n□ Preview mode  
Dependencies: TASK-001  
**Estimated Time:** 8 hours  
**Assigned Phase:** Phase 1  
**Priority:** P0  
**Required Skills:** Frontend  
**Complexity:** Medium

TASK-003: Cohort scheduling API  
Description: Create cohort CRUD endpoints.  
Acceptance Criteria:\n□ Capacity enforced\n□ Dates validated\n□ Cohort list view  
Dependencies: TASK-001  
**Estimated Time:** 7 hours  
**Assigned Phase:** Phase 2  
**Priority:** P0  
**Required Skills:** Backend  
**Complexity:** Medium

TASK-004: Stripe checkout integration  
Description: Checkout + webhook to create enrollments.  
Acceptance Criteria:\n□ Checkout session created\n□ Webhook creates enrollment\n□ Refund revokes access  
Dependencies: TASK-003  
**Estimated Time:** 9 hours  
**Assigned Phase:** Phase 3  
**Priority:** P0  
**Required Skills:** Backend  
**Complexity:** High

TASK-005: Student portal  
Description: Progress tracking and certificates.  
Acceptance Criteria:\n□ Progress tracked\n□ Completion certificate generated\n□ Course materials gated  
Dependencies: TASK-002  
**Estimated Time:** 8 hours  
**Assigned Phase:** Phase 2  
**Priority:** P1  
**Required Skills:** Frontend  
**Complexity:** Medium

## 16.D TASK PRIORITY MATRIX

P0: TASK-000, TASK-001, TASK-002, TASK-003, TASK-004  
P1: TASK-005  
P2: Affiliate program  
P3: AI quizzes

## 16.E CRITICAL PATH ANALYSIS

TASK-000 -> TASK-001 -> TASK-002 -> TASK-004  
**Total Critical Path Time:** 30 hours

## 16.F EXAMPLE COMPLETE TASK WITH 21-STEP STATUS

TASK-004: Stripe checkout integration

- □ Define price IDs
- □ Create checkout session
- □ Add webhook handler
- □ Validate signature
- □ Create enrollment record
- □ Send confirmation email

---

# SECTION 17: GIT BRANCH PLAN + COMMIT MESSAGE PLAN

## 17.1 Branch Naming Convention

feature/courseforge-<area>

## 17.2 Branching Strategy

Trunk-based.

## 17.3 Commit Message Format

type(scope): message

## 17.4 Commit Types

feat, fix, chore, docs, test

## 17.5 Pull Request Requirements

CI green + reviewer approval.

## 17.6 Code Review Checklist

Enrollment logic, payment sync, access control.

## 17.6 CODE QUALITY STANDARDS

ESLint + Prettier + strict TS.

---

# SECTION 18: DEVELOPMENT ROADMAP (ENHANCED)

## 18.A TIMELINE (Week-by-Week Breakdown)

Week 1: Setup + builder  
Week 2: Cohorts + enrollment  
Week 3: Payments + QA

## 18.B MILESTONE SCHEDULE

- M1: Builder
- M2: Cohorts
- M3: Payments

## 18.C RESOURCE ALLOCATION

1 backend, 1 frontend.

## 18.D VELOCITY TRACKING PLAN

25 story points per sprint.

## 18.E BUFFER TIME ALLOCATION

20% buffer per sprint.

## 18.F CRITICAL DEADLINES

Payments ready by Week 3.

---

# SECTION 19: DEPLOYMENT & HOSTING PLAN

## 19.1 Hosting Provider Selection

Cloudflare Pages + Supabase.

## 19.2 Environment Setup

Dev, staging, production.

## 19.3 CI/CD Pipeline Configuration

GitHub Actions for lint/test.

## 19.4 Deployment Automation

Deploy on main.

## 19.5 Rollback Procedures

Rollback build + revert migration.

## 19.6 Zero-Downtime Deployment Strategy

Backward-compatible migrations.

---

# SECTION 20: TEST PLAN

## 20.1 Unit Test Strategy

Vitest for enrollment logic.

## 20.2 Integration Test Scenarios

Checkout -> enrollment -> access.

## 20.3 End-to-End Test Flows

Create course -> enroll -> complete.

## 20.4 Performance Testing

Lighthouse for course pages.

## 20.5 Security Testing

OWASP ZAP + RLS checks.

## 20.6 User Acceptance Testing (UAT)

Creators test cohort flows.

## 20.7 Test Data Management

Seed courses and cohorts.

## 20.8 QUALITY GATES & VERIFICATION CHECKPOINTS

Release checklists per sprint.

---

# SECTION 21: SECURITY GUIDELINES + PERFORMANCE OPTIMIZATION

## 21.1 Security Best Practices

RLS policies and secure enrollment.

## 21.2 OWASP Top 10 Mitigation

Prevent unauthorized access to courses.

## 21.3 Data Encryption

TLS + AES-256 at rest.

## 21.4 Performance Optimization Techniques

Cache course catalog pages.

## 21.5 Caching Strategy

CDN caching for lesson assets.

## 21.6 Database Optimization

Index enrollments by student and cohort.

---

# SECTION 22: NON-FUNCTIONAL REQUIREMENTS

## 22.1 Performance Targets

Course catalog p95 <300ms.

## 22.2 Scalability Requirements

10k enrollments per cohort.

## 22.3 Availability & Uptime Goals (SLA)

99.9% uptime.

## 22.4 Privacy & Compliance

GDPR-ready deletion.

## 22.5 Accessibility Standards (WCAG 2.1 Level AA)

Accessible lesson pages.

## 22.6 Browser & Device Compatibility

Latest Chrome, Safari, Firefox.

## 22.7 Production-Ready Definition

Payments and cohorts tested.

---

# SECTION 23: RISKS & MITIGATION STRATEGIES

## 23.1 Technical Risks

Payment webhook delays -> retry queue.

## 23.2 Timeline Risks

Builder scope creep -> MVP editor.

## 23.3 Resource Risks

Limited QA -> core flow testing.

## 23.4 External Dependency Risks

Supabase outage -> read-only mode.

## 23.5 Contingency Plans

Pause enrollments if payment sync fails.

---

# SECTION 24: FINAL HANDOFF PACKAGE (ENHANCED)

## 24.A CODE REPOSITORY STRUCTURE

courseforge/
app/ components/ supabase/ scripts/ docs/

## 24.B DOCUMENTATION PACKAGE

README + creator docs + cohort guides.

## 24.C DEPLOYMENT SCRIPTS & CONFIGURATIONS

deploy.sh with migrations.

## 24.D ENVIRONMENT SETUP GUIDE

SUPABASE_URL, SUPABASE_ANON_KEY, STRIPE_SECRET_KEY.

## 24.E RUNBOOK (Operations Manual)

Monitor cohort capacity and payment sync.

## 24.F MONITORING & ALERT SETUP

Alerts for enrollment failures.

## 24.G BACKUP & DISASTER RECOVERY PLAN

Daily DB backups.

## 24.H MAINTENANCE & SUPPORT PLAN

Monthly dependency updates.

## 24.I TRAINING MATERIALS (If Team Handoff)

Creator onboarding.

---

# SECTION 25: COST ESTIMATION & BUDGET

## 25.1 Infrastructure Cost Calculator

| Resource | Provider         | Pricing Model | Estimated Cost |
| -------- | ---------------- | ------------- | -------------- |
| Web      | Cloudflare Pages | Usage         | $0-20/mo       |
| DB       | Supabase         | Usage         | $25/mo         |
| Storage  | R2               | Usage         | $5-20/mo       |
| Email    | Resend           | Usage         | $0-20/mo       |

## 25.2 Third-Party Service Costs

Stripe 2.9% + 30 cents per payment.

## 25.3 Scaling Cost Projections

1k enrollments -> ~$100/mo.

## 25.4 Cost Optimization Strategies

Archive inactive cohorts.

## 25.5 Monthly Burn Rate Tracking

Target <$200/mo.

---

# SECTION 26: ANALYTICS & METRICS IMPLEMENTATION

## 26.1 Product Analytics Requirements

Track enrollments, completion rates.

## 26.2 Funnel Analysis Setup

Visit course -> checkout -> enroll -> complete.

## 26.3 Business Metrics Dashboard

Completion rates, revenue per cohort.

## 26.4 Analytics Tools Selection

PostHog + Stripe.

## 26.5 Implementation Checklist

□ Track enrollments  
□ Track completion  
□ Track refunds

---

# SECTION 27: ERROR HANDLING & LOGGING STRATEGY

## 27.1 Error Classification Taxonomy

Validation, Auth, Billing, Enrollment.

## 27.2 Error Response Format

```json
{ "error": { "code": "ENROLLMENT_FAILED", "message": "Enrollment failed" } }
```

## 27.3 Retry Policies

Webhook retries x3.

## 27.4 Circuit Breaker Pattern

Pause enrollment if errors >5%.

## 27.5 Structured Logging Specification

courseId, cohortId, studentId.

## 27.6 Log Levels & Retention

error, warn, info; 30 days.

## 27.7 Centralized Logging Architecture

Sentry + Supabase logs.

## 27.8 Distributed Tracing

Trace IDs per enrollment.

---

# SECTION 28: LEGAL & COMPLIANCE PACKAGE

## 28.1 Terms of Service Structure

Course access and refund policy.

## 28.2 Privacy Policy Structure (GDPR/CCPA Ready)

Student data retention policy.

## 28.3 Cookie Policy

Analytics cookies.

## 28.4 Data Processing Addendum (DPA)

Stripe + email provider.

## 28.5 Compliance Checklist by Region

GDPR, CCPA.

---

# SECTION 29: SEO & DISCOVERABILITY

## 29.1 Technical SEO Checklist

Course catalog indexing.

## 29.2 Meta Tags Strategy

"cohort course platform".

## 29.3 Structured Data (Schema.org)

Course schema.

## 29.4 URL Structure Guidelines

/courses/:slug

## 29.5 Core Web Vitals Targets

LCP <2.5s.

## 29.6 Sitemap & Robots.txt

Include course pages.

---

# SECTION 30: INTERNATIONALIZATION (i18n)

## 30.1 Multi-Language Architecture

Remix i18n.

## 30.2 Translation Key Structure

locales/en/common.json.

## 30.3 Locale-Specific Formatting

Intl for dates and currency.

## 30.4 RTL Language Support

Not in V1.

## 30.5 Language Detection Strategy

Profile setting.

## 30.6 Translation Workflow

PR-based translations.

---

# SECTION 31: FEATURE FLAGS & EXPERIMENTATION

## 31.1 Feature Flag Infrastructure

DB flags.

## 31.2 Flag Naming Convention

cohort.calendar_v2, checkout.flow_v2.

## 31.3 Flag Types

boolean + percentage.

## 31.4 Gradual Rollout Strategy

10% weekly rollout.

## 31.5 A/B Testing Framework

PostHog experiments.

## 31.6 Kill Switch Design

Admin toggle for enrollments.

---

# SECTION 32: REAL-TIME FEATURES ARCHITECTURE

## 32.1 WebSocket vs SSE Trade-offs

SSE for cohort reminders.

## 32.2 Real-Time Notification System

Live session reminders.

## 32.3 Live Data Synchronization

Enrollment counts updated every minute.

## 32.4 Presence Indicators

Show active students in live session.

## 32.5 Conflict Resolution (Offline-First)

Last write wins on progress.

## 32.6 Scaling Real-Time Connections

Use Supabase Realtime if needed.

---

# SECTION 33: CUSTOMER SUPPORT INTEGRATION

## 33.1 Help Center Structure

Creator docs + student FAQs.

## 33.2 Support Ticket System

Integrate with SupportDesk.

## 33.3 Live Chat Implementation

Intercom widget.

## 33.4 AI/Chatbot Support

FAQ bot.

## 33.5 Customer Feedback Loop

Post-course surveys.

## 33.6 Support SLA Definitions

Critical: 4h response.

---

# SECTION 34: AI/ML INTEGRATION (Modern SaaS)

## 34.1 LLM API Integration Patterns

Quiz generation assistant.

## 34.2 Embedding Storage (Vector Databases)

Course search via pgvector.

## 34.3 AI Feature Implementation Guidelines

Human approval for generated quizzes.

## 34.4 Rate Limiting for AI Features

5 requests/min per creator.

## 34.5 Cost Management for AI APIs

$50/mo cap per workspace.

## 34.6 Fallback Strategies

Disable AI if budget exceeded.
