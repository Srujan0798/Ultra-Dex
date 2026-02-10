# Phase 1 Foundation Template

> **Fill ONLY these 8 sections before coding.** (4-5 hours)
> Return to [04-Imp-Template.md](./04-Imp-Template.md) for remaining 26 sections as you build.

---

## Section 1: High-Level Summary

### 1.1 Product Vision (One-liner)
[What does this do in ≤15 words?]

### 1.2 Problem Statement
[What problem? Who has it? Why now?]

### 1.3 Solution Overview
[How does your product solve this?]

### 1.4 Target Market
[Who is this for? Market size?]

### 1.5 Unique Value Proposition
[What makes this different?]

---

## Section 2: Core Features (P0 Only)

**Feature 1: [Name]**
- Description: [One sentence]
- Acceptance Criteria:
  - [ ] [Specific, measurable]
  - [ ] [Specific, measurable]

**Feature 2: [Name]**
- Description: [One sentence]
- Acceptance Criteria:
  - [ ] [Specific, measurable]
  - [ ] [Specific, measurable]

**Feature 3: [Name]**
- Description: [One sentence]
- Acceptance Criteria:
  - [ ] [Specific, measurable]
  - [ ] [Specific, measurable]

---

## Section 4: User Personas

**Primary Persona: [Name]**
- Role: [Job title/type]
- Goals: [What they want to achieve]
- Pain Points: [Current frustrations]
- Tech Savviness: [Low/Medium/High]

**Secondary Persona: [Name]**
- Role: [Job title/type]
- Goals: [What they want to achieve]
- Pain Points: [Current frustrations]

---

## Section 6: Screen Map

```
Landing Page
    ↓
Login/Register
    ↓
Dashboard ─── [Feature 1] ─── [Sub-screen]
    │
    └─── [Feature 2] ─── [Sub-screen]
    │
    └─── Settings ─── Profile
                  ─── Billing
```

**Key Screens:**
1. Landing Page - [Purpose]
2. Dashboard - [Purpose]
3. [Feature 1 Screen] - [Purpose]
4. [Feature 2 Screen] - [Purpose]
5. Settings - [Purpose]

---

## Section 10: Data Model

```prisma
// Example Prisma schema - customize for your stack

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  // Add your fields
}

model [YourCoreEntity] {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  // Add your fields
  createdAt DateTime @default(now())
}
```

**Entities:**
| Entity | Purpose | Key Fields |
|--------|---------|------------|
| User | Authentication & profile | email, name, role |
| [Entity 2] | [Purpose] | [Fields] |
| [Entity 3] | [Purpose] | [Fields] |

---

## Section 11: API Blueprint

### Authentication
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/register` | POST | Create account |
| `/api/auth/login` | POST | Get session |
| `/api/auth/logout` | POST | End session |

### Core Feature 1
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/[resource]` | GET | List all |
| `/api/[resource]` | POST | Create new |
| `/api/[resource]/:id` | GET | Get one |
| `/api/[resource]/:id` | PUT | Update |
| `/api/[resource]/:id` | DELETE | Delete |

---

## Section 12: System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                   │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐    │
│  │ Landing │  │  Auth   │  │Dashboard│  │ Feature │    │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘    │
└─────────────────────────────────────────────────────────┘
                           │
                    API Routes (/api/)
                           │
┌─────────────────────────────────────────────────────────┐
│                    BACKEND                              │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                 │
│  │  Auth   │  │ Feature │  │ Payment │                 │
│  │ Service │  │ Service │  │ Service │                 │
│  └─────────┘  └─────────┘  └─────────┘                 │
└─────────────────────────────────────────────────────────┘
                           │
┌─────────────────────────────────────────────────────────┐
│                    DATABASE (PostgreSQL)                │
└─────────────────────────────────────────────────────────┘
```

---

## Section 15: Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| **Frontend** | Next.js 14 | SSR, App Router, fast |
| **Styling** | Tailwind CSS | Rapid prototyping |
| **Database** | PostgreSQL | Reliable, scalable |
| **ORM** | Prisma | Type-safe, great DX |
| **Auth** | NextAuth.js | Easy OAuth, sessions |
| **Payments** | Stripe | Industry standard |
| **Hosting** | Vercel | Zero-config deploy |
| **Database Host** | Neon / Supabase | Serverless PostgreSQL |

---

## ✅ Phase 1 Complete?

**Checklist:**
- [ ] Section 1: Can explain product in 2 sentences
- [ ] Section 2: 3-5 P0 features with acceptance criteria
- [ ] Section 4: Know your primary user
- [ ] Section 6: Screen flow mapped
- [ ] Section 10: Database schema sketched
- [ ] Section 11: API endpoints listed
- [ ] Section 12: Architecture diagram drawn
- [ ] Section 15: Tech stack chosen and justified

---

## 🚀 Ready to Code!

**Next Steps:**
1. Load cursor-rules: `./cursor-rules/load.sh core database api`
2. Create first tasks in [Section 16](./04-Imp-Template.md#section-16)
3. Start coding with [21-step verification](../CHECKLIST-21-STEP.md)

**Return to full template** for remaining sections as you build:
→ [04-Imp-Template.md](./04-Imp-Template.md)
