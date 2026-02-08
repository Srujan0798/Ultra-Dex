═══════════════════════════════════════════════════════════════

RAW IDEA: "[YOUR IDEA HERE - LITE VERSION]"

**⚡ LITE TEMPLATE (12 Sections)**

> For: Small projects, MVPs, quick prototypes
> Time: 2-3 hours to complete
> Sections: Core essentials only

═══════════════════════════════════════════════════════════════

## 📊 PROGRESS TRACKER

| Phase          | Sections | Est. Time | Status |
| -------------- | -------- | --------- | ------ |
| **Foundation** | 1-6      | 1 hour    | [ ]    |
| **Build**      | 7-9      | 1-2 hours | [ ]    |
| **Launch**     | 10-12    | 30 min    | [ ]    |

---

## SECTION 1: HIGH-LEVEL SUMMARY

### 1.1 Product Vision (One-liner)

[Clear, compelling statement ≤15 words]

### 1.2 Problem Statement

[What problem does this solve?]

### 1.3 Solution Overview

[How does your product solve this?]

### 1.4 Target Market

[Who is this for?]

### 1.5 Unique Value Proposition

[What makes this different?]

---

## SECTION 2: CORE FEATURES

### 2.1 MVP Features (Maximum 5)

| Feature   | Priority | User Story           | Est. Hours |
| --------- | -------- | -------------------- | ---------- |
| Feature 1 | P0       | As a user, I want... | 4-6h       |
| Feature 2 | P0       | As a user, I want... | 4-6h       |
| Feature 3 | P1       | As a user, I want... | 4-6h       |
| Feature 4 | P1       | As a user, I want... | 2-4h       |
| Feature 5 | P2       | As a user, I want... | 2-4h       |

### 2.2 Out of Scope (v1)

- [ ] Feature A (future release)
- [ ] Feature B (future release)

---

## SECTION 3: USER PERSONAS

### 3.1 Primary Persona

**Name:** [Persona Name]
**Role:** [e.g., Freelance Designer]
**Goals:**

- Goal 1
- Goal 2
  **Pain Points:**
- Pain 1
- Pain 2

---

## SECTION 4: USER FLOWS

### 4.1 Core Flow: [Main Action]

```
[Start] → [Step 1] → [Step 2] → [Step 3] → [Success]
```

**Success Criteria:**

- Criterion 1
- Criterion 2

---

## SECTION 5: SCREEN MAP

### 5.1 Pages/Screens

| Screen    | Purpose | Key Elements        |
| --------- | ------- | ------------------- |
| Home      | Landing | Hero, CTA, Features |
| Dashboard | Main UI | Navigation, Content |
| Settings  | Config  | Options, Save       |

### 5.2 Navigation

```
Home → Dashboard → [Feature Pages]
  ↓
Settings / Profile
```

---

## SECTION 6: TECH STACK

### 6.1 Core Stack

| Layer    | Technology         | Why      |
| -------- | ------------------ | -------- |
| Frontend | [e.g., Next.js 15] | [Reason] |
| Database | [e.g., Supabase]   | [Reason] |
| Auth     | [e.g., Clerk]      | [Reason] |
| Hosting  | [e.g., Vercel]     | [Reason] |

### 6.2 Key Dependencies

- [ ] Dependency 1
- [ ] Dependency 2
- [ ] Dependency 3

---

## SECTION 7: DATA MODEL

### 7.1 Core Entities

**Entity 1: [User/Primary]**

```
- id: uuid
- email: string (unique)
- name: string
- createdAt: timestamp
```

**Entity 2: [Main Resource]**

```
- id: uuid
- userId: foreign key
- title: string
- status: enum
- createdAt: timestamp
```

### 7.2 Relationships

- User (1) → (Many) Resources

---

## SECTION 8: API BLUEPRINT

### 8.1 Authentication

- POST /auth/signup
- POST /auth/login
- POST /auth/logout

### 8.2 Core Endpoints

| Endpoint          | Method | Auth | Description |
| ----------------- | ------ | ---- | ----------- |
| /api/resource     | GET    | Yes  | List all    |
| /api/resource     | POST   | Yes  | Create new  |
| /api/resource/:id | GET    | Yes  | Get one     |
| /api/resource/:id | PUT    | Yes  | Update      |
| /api/resource/:id | DELETE | Yes  | Delete      |

---

## SECTION 9: IMPLEMENTATION PLAN

### 9.1 Sprint 1: Foundation (Week 1)

- [ ] Setup project & repository
- [ ] Configure database schema
- [ ] Implement auth system
- [ ] Build home page

### 9.2 Sprint 2: Core Features (Week 2)

- [ ] Build dashboard
- [ ] Implement main feature
- [ ] Add CRUD operations
- [ ] Basic styling

### 9.3 Sprint 3: Polish (Week 3)

- [ ] Error handling
- [ ] Loading states
- [ ] Mobile responsive
- [ ] Deploy to production

---

## SECTION 10: DEPLOYMENT

### 10.1 Hosting Setup

- **Platform:** [e.g., Vercel]
- **Database:** [e.g., Supabase]
- **Domain:** [yourdomain.com]

### 10.2 Environment Variables

```
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
```

### 10.3 Launch Checklist

- [ ] Environment variables set
- [ ] Database migrated
- [ ] Build passes
- [ ] Deployed successfully
- [ ] Basic functionality tested

---

## SECTION 11: SECURITY

### 11.1 Essentials

- [ ] Auth implemented
- [ ] Input validation
- [ ] SQL injection prevention (ORM)
- [ ] XSS prevention
- [ ] HTTPS enabled

---

## SECTION 12: 21-STEP VERIFICATION

### 12.1 Per Task Checklist

| Step | Action                 | Status |
| ---- | ---------------------- | ------ |
| 1    | UNDERSTAND requirement | ☐      |
| 2    | ASSUMPTIONS listed     | ☐      |
| 3    | ANALYZE logic flow     | ☐      |
| 4    | DECOMPOSE into steps   | ☐      |
| 5    | PREPARE environment    | ☐      |
| 6    | IMPLEMENT code         | ☐      |
| 7    | DOCUMENT code          | ☐      |
| 8    | UNIT TEST written      | ☐      |
| 9    | DEBUG issues           | ☐      |
| 10   | INTEGRATE systems      | ☐      |
| 11   | VALIDATE output        | ☐      |
| 12   | UX CHECK performed     | ☐      |
| 13   | OPTIMIZE performance   | ☐      |
| 14   | SECURE check           | ☐      |
| 15   | REFACTOR quality       | ☐      |
| 16   | ERROR HANDLE added     | ☐      |
| 17   | DOCUMENT API           | ☐      |
| 18   | VERSION CONTROL commit | ☐      |
| 19   | BUILD validation       | ☐      |
| 20   | DEPLOY READY           | ☐      |
| 21   | FINAL VERIFY           | ☐      |

---

## 🚀 NEXT STEPS

1. Fill sections 1-6 (1 hour)
2. Start Sprint 1 development
3. Use `ultra-dex check` to verify completeness
4. Follow 21-step for each task
5. Ship MVP in 3 weeks!

---

_Ultra-Dex LITE Template v1.0 - For rapid MVP development_
