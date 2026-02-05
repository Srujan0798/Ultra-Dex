# Ultra-Dex Phase 16 - Enterprise & Advanced Workflows

> **Source:** ADVANCED-WORKFLOWS.md, 04-Imp-Template-ENTERPRISE.md, CLI-DOOMSDAY-THEME.md
> **Total:** 15 New Prompts (#171-185)
> **Date:** Feb 5, 2026

---

## 🏢 ENTERPRISE ARCHITECTURE

---

### PROMPT 171: Enterprise Template Generator
> **Source:** 04-Imp-Template-ENTERPRISE.md
> **Status:** Production Ready

```
## Task: Create Enterprise Template

**Files to create:**
- templates/04-Imp-Template-ENTERPRISE.md

**Requirement:**
- Generate the full 50+ section template.
- Include exclusive sections:
  - Data Governance & Residency
  - Disaster Recovery (RTO/RPO)
  - Cost Management (Unit Economics)
  - Compliance (SOC2, HIPAA, GDPR)
  - Multi-tenancy Strategy

**Commit:** "feat: Add 50-section Enterprise implementation template"
```

---

### PROMPT 172: Disaster Recovery System
> **Source:** 04-Imp-Template-ENTERPRISE.md (Section 25)
> **Status:** High Value

```
## Task: Implement Disaster Recovery Plan

**Files to create:**
- docs/ops/DISASTER-RECOVERY.md

**Requirement:**
- Define RTO (4h) and RPO (1h).
- Backup Strategy: Continuous replication + Daily fulls.
- Incident Response Protocol: Detection -> Assessment -> Containment -> Recovery.
- Automated rollback triggers.

**Commit:** "docs: Define disaster recovery and business continuity plan"
```

---

### PROMPT 173: Cost Management Module
> **Source:** 04-Imp-Template-ENTERPRISE.md (Section 26)
> **Status:** High Value

```
## Task: Implement Cost Management

**Files to create:**
- cli/lib/ops/cost-estimator.js

**Requirement:**
- CLI tool to estimate infrastructure costs based on usage.
- Inputs: Daily Active Users, Storage/User, Bandwidth.
- Outputs: Estimated monthly bill (Vercel + DB + Storage).
- Alert on budget thresholds.

**Commit:** "feat: Add infrastructure cost estimation module"
```

---

### PROMPT 174: Data Governance Engine
> **Source:** 04-Imp-Template-ENTERPRISE.md (Section 24)
> **Status:** Enterprise

```
## Task: Implement Data Governance

**Files to create:**
- cli/lib/governance/data-policy.js

**Requirement:**
- Define Data Classification (Public, Internal, Confidential, Restricted).
- Enforce Retention Policies (e.g., Logs: 30 days).
- Automation: Script to purge expired PII data.
- Audit Log generation for restricted data access.

**Commit:** "feat: Add data governance and retention logic"
```

---

### PROMPT 175: Multi-Tenant Architecture
> **Source:** 04-Imp-Template-ENTERPRISE.md (Section 23)
> **Status:** Enterprise

```
## Task: Design Multi-Tenant System

**Files to create:**
- docs/architecture/MULTI-TENANCY.md

**Requirement:**
- Strategy: Row-level security vs Schema-per-tenant.
- Implementation Plan using Postgres RLS.
- Tenant isolation verification tests.
- Tenant lifecycle management (Onboard, Suspend, Offboard).

**Commit:** "docs: Document multi-tenant architecture strategy"
```

---

## ⚡ ADVANCED WORKFLOWS

---

### PROMPT 176: Stripe Subscription System
> **Source:** ADVANCED-WORKFLOWS.md (Example 1)
> **Status:** Production Code

```
## Task: Implement Full Stripe Workflow

**Files to create:**
- src/lib/stripe.ts
- src/app/api/webhooks/stripe/route.ts

**Requirement:**
- Full subscription lifecycle flow (Start, Cancel, Upgrade).
- Database Schema: `Subscription` model with status tracking.
- Webhook Handler: Secure signature verification + event processing.
- Frontend: Pricing table to Checkout Session redirection.

**Commit:** "feat: Implement robust Stripe subscription workflow"
```

---

### PROMPT 177: Transactional Email System
> **Source:** ADVANCED-WORKFLOWS.md (Example 2)
> **Status:** Production Code

```
## Task: Implement Resend + BullMQ Email

**Files to create:**
- src/lib/email/sender.ts
- src/workers/email-worker.ts

**Requirement:**
- Async processing via BullMQ (don't block API).
- Provider: Resend (React Email templates).
- Features: Retry logic (backoff), Open/Click tracking logs.
- Database: `EmailLog` table for audit trail.

**Commit:** "feat: Add async transactional email system"
```

---

### PROMPT 178: Database Migration Workflow
> **Source:** ADVANCED-WORKFLOWS.md (Example 3)
> **Status:** Production Code

```
## Task: Automate Database Migrations

**Files to create:**
- scripts/db-migrate.sh

**Requirement:**
- Safe migration wrapper for Prisma/Drizzle.
- Pre-migration backup trigger.
- Zero-downtime deployment strategy (expand-contract).
- Rollback script in case of failure.

**Commit:** "ops: Automate safe database migration workflow"
```

---

### PROMPT 179: RBAC System Design
> **Source:** ADVANCED-WORKFLOWS.md (Security)
> **Status:** Security

```
## Task: Implement RBAC System

**Files to create:**
- src/lib/auth/permissions.ts

**Requirement:**
- Roles: Admin, Editor, Viewer.
- Permissions: Granular (e.g., `post:create`, `settings:manage`).
- Middleware for API route protection.
- Frontend hooks `usePermission('post:edit')`.

**Commit:** "feat: Implement Role-Based Access Control"
```

---

### PROMPT 180: Advanced Cache Strategy
> **Source:** ADVANCED-WORKFLOWS.md (Performance)
> **Status:** Performance

```
## Task: Implement Multi-Layer Caching

**Files to create:**
- src/lib/cache/redis.ts

**Requirement:**
- L1: In-memory cache (Request scope).
- L2: Distributed cache (Redis).
- Stale-While-Revalidate pattern for API data.
- Cache invalidation tags system (next-revalidate).

**Commit:** "perf: Implement advanced multi-layer caching"
```

---

## 🎨 VISUAL THEMES & GAMIFICATION

---

### PROMPT 181: Doomsday Theme (Avengers)
> **Source:** CLI-DOOMSDAY-THEME.md
> **Status:** Gamification

```
## Task: Implement 'Doomsday' CLI Theme

**Files to create:**
- cli/lib/themes/doomsday.js

**Requirement:**
- Visuals: Red/Purple/Gold gradients (Scarlet Witch/Thanos).
- Banner: ASCII Art "Avengers Assemble".
- Messaging: "The Multiverse of Code has a new defender."
- Colors: Primary `#dc2626`, Secondary `#7c3aed`.

**Commit:** "ui: Add Avengers Doomsday CLI theme"
```

---

### PROMPT 182: Thanos Snap Progress
> **Source:** CLI-DOOMSDAY-THEME.md
> **Status:** Gamification

```
## Task: Implement 'Snap' Progress Bar

**Files to create:**
- cli/lib/utils/snap-progress.js

**Requirement:**
- Progress Bar using Infinity Stones (6 steps).
- Animation: Light up stones as tasks complete.
- Success: "Perfectly balanced, as all code should be."
- Dust Effect: Particles for deleted files.

**Commit:** "ui: Add Thanos Snap progress bar animation"
```

---

### PROMPT 183: Agent Personas (Avengers)
> **Source:** CLI-DOOMSDAY-THEME.md
> **Status:** Gamification

```
## Task: Map Agents to Avengers

**Files to update:**
- cli/lib/agents/registry.js

**Requirement:**
- CTO -> Iron Man ("I am the architecture").
- Planner -> Nick Fury ("I have a plan").
- Backend -> Thor ("Bring me the API!").
- Frontend -> Spider-Man.
- Security -> Captain America.
- Add emoji and catchphrases to agent outputs.

**Commit:** "ui: Map agent personas to Avengers characters"
```

---

### PROMPT 184: Multiverse Help Screen
> **Source:** CLI-DOOMSDAY-THEME.md
> **Status:** Gamification

```
## Task: Redesign Help Screen

**Files to update:**
- cli/lib/commands/help.js

**Requirement:**
- Section: ⚡ ASSEMBLE THE CODE (Init/Gen).
- Section: 🛡️ DEFEND THE REALM (Review/Test).
- Section: 💎 HARNESS INFINITY (Serve/Deploy).
- Visual: Boxen borders with double lines.

**Commit:** "ui: Redesign help screen with Doomsday theme"
```

---

### PROMPT 185: Gradient Banner Engine
> **Source:** CLI-DOOMSDAY-THEME.md
> **Status:** UI Tooling

```
## Task: Implement Gradient Engine

**Files to create:**
- cli/lib/ui/gradients.js

**Requirement:**
- Reusable gradient generator (gradient-string).
- Presets: Doomsday (Red-Purple), Cyberpunk (Neon), Corporate (Blue-Grey).
- Support for detailed ASCII art rendering.

**Commit:** "feat: Add gradient text rendering engine"
```
