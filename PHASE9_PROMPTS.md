# Ultra-Dex Phase 9 - Developer Guides & Templates

> **Source:** CUSTOM-AGENTS-GUIDE.md, ARCHITECTURE-PATTERNS.md, CICD-TEMPLATES.md
> **Total:** 15 New Prompts (#66-80)
> **Date:** Feb 5, 2026

---

## 🔵 DEVELOPER GUIDES (FROM ARCHIVES)

---

### PROMPT 66: Custom Domain Agent Generator

> **Source:** CUSTOM-AGENTS-GUIDE.md
> **Status:** Template exists, needs automated generator

````
## Task: Create Domain Agent Generator CLI

**Files to create:**
- cli/lib/commands/agent-gen.js (NEW)
- cli/templates/domain-agent.md (NEW)

**Requirements:**

1. Command to generate domain agents:
   - `ultra-dex agent generate --domain healthcare`
   - `ultra-dex agent generate --domain fintech`
   - `ultra-dex agent generate --domain ecommerce`

2. Domain templates:
   | Domain | Agent Name | Key Features |
   |--------|------------|--------------|
   | Healthcare | @HealthCompliance | HIPAA, patient data |
   | Fintech | @PaymentLogic | Fraud detection, payments |
   | E-commerce | @CatalogManager | Inventory, pricing |
   | Booking | @BookingEngine | Availability, conflicts |
   | Legal | @LegalCompliance | Contract generation |

3. Template structure:
   ```markdown
   # [Agent Name] Agent

   ## Your Responsibilities
   ### [Responsibility Area 1]

   ## Domain Rules
   ### Business Logic
   ### Constraints
   ### Edge Cases

   ## Code Patterns
````

4. Auto-add to agents/7-domain/

**Commit:** "feat: Add custom domain agent generator"

```

---

### PROMPT 67: Invoice Engine Agent (Complete)

> **Source:** CUSTOM-AGENTS-GUIDE.md - Full Example
> **Status:** Documentation complete, needs code

```

## Task: Implement Invoice Engine Agent

**Files to create:**

- agents/7-domain/invoice-engine.md (NEW)
- cli/lib/domain/invoice-calculator.js (NEW)
- cli/lib/domain/invoice-state.js (NEW)

**Requirements:**

1. Invoice calculation logic:

```typescript
interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number; // In cents
  taxRate: number; // e.g., 0.08 for 8%
}

function calculateInvoice(items: InvoiceLineItem[], discountPercent = 0) {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const discount = Math.round(subtotal * (discountPercent / 100));
  const taxableAmount = subtotal - discount;
  const tax = items.reduce((sum, item) => {
    const itemTotal = item.quantity * item.unitPrice;
    return sum + Math.round(itemTotal * (1 - discountPercent / 100) * item.taxRate);
  }, 0);
  return { subtotal, discount, tax, total: taxableAmount + tax };
}
```

2. Invoice status machine:
   - draft → sent → viewed → paid
   - draft → void
   - sent → overdue → paid/void

3. Recurring invoice generation:
   - Check nextGenerationDate
   - Create from template
   - Auto-send if configured

**Commit:** "feat: Add invoice engine domain agent"

```

---

### PROMPT 68: Booking Engine Agent (Complete)

> **Source:** CUSTOM-AGENTS-GUIDE.md
> **Status:** Documentation complete, needs code

```

## Task: Implement Booking Engine Agent

**Files to create:**

- agents/7-domain/booking-engine.md (NEW)
- cli/lib/domain/availability.js (NEW)
- cli/lib/domain/booking-conflict.js (NEW)

**Requirements:**

1. Availability check:
   - Get working hours per resource
   - Get existing bookings
   - Calculate available slots
   - Handle buffer times

2. Double-booking prevention:

```typescript
async function createBooking(data: BookingInput): Promise<Booking> {
  return await prisma.$transaction(async (tx) => {
    const conflicts = await tx.booking.findMany({
      where: {
        resourceId: data.resourceId,
        status: { in: ['confirmed', 'pending'] },
        OR: [
          {
            startTime: { lt: data.endTime },
            endTime: { gt: data.startTime },
          },
        ],
      },
    });
    if (conflicts.length > 0) {
      throw new ConflictError('Time slot no longer available');
    }
    return await tx.booking.create({ data });
  });
}
```

3. Business rules:
   - 24-hour minimum notice
   - 15-min buffer between appointments
   - 2-hour max duration
   - Cancellation policy (24h = full refund)

**Commit:** "feat: Add booking engine domain agent"

```

---

## 🟢 ARCHITECTURE PATTERNS

---

### PROMPT 69: Architecture Decision Tree CLI

> **Source:** ARCHITECTURE-PATTERNS.md
> **Status:** Full documentation exists

```

## Task: Implement Architecture Advisor Command

**Files to create:**

- cli/lib/commands/architect.js (NEW)
- cli/lib/architect/decision-tree.js (NEW)

**Requirements:**

1. Interactive decision tree:

```bash
ultra-dex architect
# What's your team size?
# > 1-3 [Solo/Small]
# > 3-10 [Small Team]
# > 10-50 [Growing]
# > 50+ [Enterprise]

# Recommendation: Full-Stack Next.js
```

2. Architecture patterns:
   | Pattern | Team Size | Use Case |
   |---------|-----------|----------|
   | Full-Stack Next.js | 1-3 | MVPs, side projects |
   | Separate Monolith | 3-10 | Growing SaaS |
   | Modular Monolith | 10-50 | Established products |
   | Microservices | 50+ | Large enterprises |
   | Serverless | Any | Variable traffic |

3. Output project structure template based on selection

**Commit:** "feat: Add architecture advisor CLI"

```

---

### PROMPT 70: Full-Stack Next.js Starter Template

> **Source:** ARCHITECTURE-PATTERNS.md Pattern 1A
> **Status:** Pattern documented, needs scaffold

```

## Task: Create Next.js Full-Stack Template

**Files to create:**

- templates/nextjs-fullstack/README.md (NEW)
- templates/nextjs-fullstack/package.json (NEW)
- templates/nextjs-fullstack/app/ (NEW directory)

**Requirements:**

1. Project structure:

```
my-saas/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── dashboard/page.tsx
│   └── api/
│       ├── auth/route.ts
│       └── users/route.ts
├── components/
├── lib/
│   ├── db.ts (Prisma client)
│   └── auth.ts
├── prisma/
│   └── schema.prisma
└── package.json
```

2. Included:
   - Next.js 14 App Router
   - Prisma ORM
   - Tailwind CSS
   - Authentication (NextAuth)

3. Command:
   - `ultra-dex init --template nextjs-fullstack`

**Commit:** "feat: Add Next.js full-stack starter template"

```

---

### PROMPT 71: Separate Monolith Template

> **Source:** ARCHITECTURE-PATTERNS.md Pattern 1B
> **Status:** Pattern documented, needs scaffold

```

## Task: Create Separate Frontend/Backend Template

**Files to create:**

- templates/separate-monolith/README.md (NEW)
- templates/separate-monolith/frontend/ (NEW)
- templates/separate-monolith/backend/ (NEW)

**Requirements:**

1. Backend structure:

```
backend/
├── src/
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   └── users.routes.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   └── user.service.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   └── error.middleware.ts
│   ├── lib/
│   │   └── prisma.ts
│   └── index.ts
├── prisma/
└── package.json
```

2. Features:
   - Express + TypeScript backend
   - CORS configuration
   - Next.js frontend
   - Shared Prisma types

3. Command:
   - `ultra-dex init --template separate-monolith`

**Commit:** "feat: Add separate monolith template"

```

---

### PROMPT 72: Modular Monolith Template

> **Source:** ARCHITECTURE-PATTERNS.md Pattern 2
> **Status:** Pattern documented, needs scaffold

```

## Task: Create Modular Monolith Template

**Files to create:**

- templates/modular-monolith/README.md (NEW)
- templates/modular-monolith/modules/ (NEW)

**Requirements:**

1. Module structure:

```
backend/
├── modules/
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.routes.ts
│   ├── users/
│   ├── projects/
│   └── billing/
├── shared/
│   ├── database/
│   ├── middleware/
│   └── utils/
└── index.ts
```

2. Key principles:
   - Modules organized by domain
   - No cross-module imports
   - Shared infrastructure

3. Command:
   - `ultra-dex init --template modular-monolith`

**Commit:** "feat: Add modular monolith template"

```

---

## 🟡 CI/CD TEMPLATES

---

### PROMPT 73: GitHub Actions Complete Pipeline

> **Source:** CICD-TEMPLATES.md
> **Status:** Full YAML exists, needs CLI integration

```

## Task: Add GitHub Actions Super Template

**Files to create:**

- cli/lib/commands/cicd.js (NEW)
- templates/cicd/github-advanced.yml (NEW)

**Requirements:**

1. 4-phase pipeline:
   - Phase 1: Validate (doctor, validate, brain)
   - Phase 2: Test (npm test, ultra-dex verify)
   - Phase 3: Build (npm build, export context)
   - Phase 4: Deploy (only on main)

2. Features:
   - Full git history checkout
   - npm cache
   - Artifact upload (CONTEXT.md, .ultra/)
   - Secrets for API keys

3. Command:
   - `ultra-dex cicd init --platform github --advanced`

**Commit:** "feat: Add GitHub Actions advanced template"

```

---

### PROMPT 74: GitLab CI Complete Pipeline

> **Source:** CICD-TEMPLATES.md
> **Status:** Full YAML exists

```

## Task: Add GitLab CI Template

**Files to create:**

- templates/cicd/gitlab-ci.yml (NEW)

**Requirements:**

1. Stages: validate → test → build → deploy
2. Cache .ultra/ directory
3. JUnit reports for validation
4. Artifacts with 1-week expiry

5. Command:
   - `ultra-dex cicd init --platform gitlab`

**Commit:** "feat: Add GitLab CI template"

```

---

### PROMPT 75: CircleCI Pipeline

> **Source:** CICD-TEMPLATES.md
> **Status:** Full YAML exists

```

## Task: Add CircleCI Template

**Files to create:**

- templates/cicd/circleci-config.yml (NEW)

**Requirements:**

1. Jobs: validate → test → build
2. Workspace persistence
3. Node orb integration
4. Artifact storage

5. Command:
   - `ultra-dex cicd init --platform circleci`

**Commit:** "feat: Add CircleCI template"

```

---

### PROMPT 76: Azure DevOps Pipeline

> **Source:** CICD-TEMPLATES.md
> **Status:** Full YAML exists

```

## Task: Add Azure DevOps Template

**Files to create:**

- templates/cicd/azure-pipelines.yml (NEW)

**Requirements:**

1. Stages: Validate → Test → Deploy
2. Node 20.x
3. Build artifacts publication
4. Conditional deployment (main branch)

5. Command:
   - `ultra-dex cicd init --platform azure`

**Commit:** "feat: Add Azure DevOps template"

```

---

### PROMPT 77: Jenkins Pipeline

> **Source:** CICD-TEMPLATES.md
> **Status:** Full Groovy exists

```

## Task: Add Jenkins Template

**Files to create:**

- templates/cicd/Jenkinsfile (NEW)

**Requirements:**

1. Stages: Validate → Test → Build → Deploy
2. Credentials management
3. Archive artifacts
4. Branch-based deployment

5. Command:
   - `ultra-dex cicd init --platform jenkins`

**Commit:** "feat: Add Jenkins template"

```

---

### PROMPT 78: Pre-commit Hooks Integration

> **Source:** CICD-TEMPLATES.md
> **Status:** Config exists, needs enhancement

```

## Task: Add Pre-commit Hooks

**Files to create:**

- cli/lib/commands/pre-commit.js (NEW)
- templates/pre-commit-config.yaml (NEW)

**Requirements:**

1. Pre-commit hooks:
   - ultra-dex-validate
   - ultra-dex-align

2. Command:
   - `ultra-dex pre-commit --install`
   - `ultra-dex pre-commit --uninstall`

3. Auto-add to .pre-commit-config.yaml

**Commit:** "feat: Add pre-commit hooks integration"

```

---

### PROMPT 79: PR Auto-Review with AI

> **Source:** CICD-TEMPLATES.md (PR Validation)
> **Status:** Workflow exists, needs enhancement

```

## Task: Add PR Auto-Review Workflow

**Files to create:**

- templates/cicd/pr-review.yml (NEW)
- cli/lib/ci/pr-reviewer.js (NEW)

**Requirements:**

1. PR validation:
   - Check alignment score
   - Block if < 50%
   - Run AI review on changed files

2. Auto-comment on PR:
   - Alignment score
   - Review summary
   - Suggestions

3. Command:
   - Part of `ultra-dex cicd init --pr-review`

**Commit:** "feat: Add PR auto-review workflow"

```

---

### PROMPT 80: Multi-Platform CI/CD Generator

> **Source:** CICD-TEMPLATES.md (All platforms)
> **Status:** All templates exist, need unified command

```

## Task: Create Unified CI/CD Generator

**Files to create:**

- cli/lib/commands/cicd.js (enhance)

**Requirements:**

1. Single command for all platforms:

```bash
ultra-dex cicd init --platform github
ultra-dex cicd init --platform gitlab
ultra-dex cicd init --platform circleci
ultra-dex cicd init --platform azure
ultra-dex cicd init --platform jenkins
```

2. Options:
   - `--basic` vs `--advanced`
   - `--pr-review` (add PR validation)
   - `--nightly` (add scheduled builds)

3. Auto-detect platform from repo

**Commit:** "feat: Add unified CI/CD generator command"

```

---

## 📊 PHASE 9 SUMMARY

| # | Feature | Source | Category |
|---|---------|--------|----------|
| 66 | Domain Agent Generator | CUSTOM-AGENTS-GUIDE | 🔵 Developer |
| 67 | Invoice Engine Agent | CUSTOM-AGENTS-GUIDE | 🔵 Developer |
| 68 | Booking Engine Agent | CUSTOM-AGENTS-GUIDE | 🔵 Developer |
| 69 | Architecture Advisor CLI | ARCHITECTURE-PATTERNS | 🟢 Architecture |
| 70 | Next.js Full-Stack Template | ARCHITECTURE-PATTERNS | 🟢 Architecture |
| 71 | Separate Monolith Template | ARCHITECTURE-PATTERNS | 🟢 Architecture |
| 72 | Modular Monolith Template | ARCHITECTURE-PATTERNS | 🟢 Architecture |
| 73 | GitHub Actions Pipeline | CICD-TEMPLATES | 🟡 CI/CD |
| 74 | GitLab CI Pipeline | CICD-TEMPLATES | 🟡 CI/CD |
| 75 | CircleCI Pipeline | CICD-TEMPLATES | 🟡 CI/CD |
| 76 | Azure DevOps Pipeline | CICD-TEMPLATES | 🟡 CI/CD |
| 77 | Jenkins Pipeline | CICD-TEMPLATES | 🟡 CI/CD |
| 78 | Pre-commit Hooks | CICD-TEMPLATES | 🟡 CI/CD |
| 79 | PR Auto-Review | CICD-TEMPLATES | 🟡 CI/CD |
| 80 | Unified CI/CD Generator | CICD-TEMPLATES | 🟡 CI/CD |

---

## 📁 FILES EXTRACTED (Can Move to completed/)

- `_old/archived_docs/excessive_documentation/CUSTOM-AGENTS-GUIDE.md` → Prompts 66-68
- `_old/archived_docs/excessive_documentation/ARCHITECTURE-PATTERNS.md` → Prompts 69-72
- `_old/archived_docs/excessive_documentation/CICD-TEMPLATES.md` → Prompts 73-80

---

**Total Prompts Now: 80**
- Phase 5: #1-15 (New Trends)
- Phase 6: #16-35 (Archive Tasks)
- Phase 7: #36-50 (Advanced AI)
- Phase 8: #51-65 (Specs + Moonshots)
- Phase 9: #66-80 (Developer Tools)

*All prompts are copy-paste ready for Codex/Claude/Gemini/Qwen!*
```
