# Architecture Pattern Library

> Common architecture patterns for SaaS applications with decision guidance

---

## Quick Decision Tree

**Start here:** What are you building?

```
What's your project scope?
├─ MVP / Side Project → Monolith (Next.js Full-Stack) ⭐
│
├─ Small Team (1-5 devs) → Monolith (Separate Frontend/Backend)
│
├─ Growing SaaS (5-20 devs) → Modular Monolith
│
└─ Enterprise (20+ devs) → Microservices (only if you have the team)
```

**TL;DR:** Start with a monolith. 99% of projects should never become microservices.

---

## 1. The Monolith (Recommended for 90% of SaaS)

### Pattern 1A: Full-Stack Framework (Next.js, Remix)

**Best For:**

- MVPs and side projects
- Solo developers or small teams (1-3 people)
- Fast iteration and deployment

**Architecture:**

```
┌─────────────────────────────────────┐
│         Next.js Application         │
│                                     │
│  ┌──────────┐      ┌──────────┐   │
│  │  Pages   │      │   API    │   │
│  │ (React)  │◄────►│ Routes   │   │
│  └──────────┘      └──────────┘   │
│                         │          │
│                    ┌────▼────┐     │
│                    │ Prisma  │     │
│                    └────┬────┘     │
└─────────────────────────┼──────────┘
                          │
                    ┌─────▼──────┐
                    │ PostgreSQL │
                    └────────────┘
```

**Tech Stack:**

- **Frontend + Backend:** Next.js 14 (App Router)
- **Database:** PostgreSQL (Neon, Supabase)
- **ORM:** Prisma
- **Deployment:** Vercel (frontend + API routes)

**Pros:**

- ✅ Fastest to build and deploy
- ✅ No CORS issues (same origin)
- ✅ Shared TypeScript types
- ✅ One codebase, one deployment
- ✅ Perfect for MVPs

**Cons:**

- ⚠️ Hard to separate concerns later
- ⚠️ API routes have limitations (serverless functions)
- ⚠️ Not ideal for heavy backend processing

**When to Use:**

- Building an MVP in 1-4 weeks
- Solo developer or small team
- Standard CRUD operations
- Don't need background jobs (yet)

**Example Project Structure:**

```
my-saas/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── dashboard/page.tsx
│   └── api/
│       ├── auth/route.ts
│       ├── users/route.ts
│       └── projects/route.ts
├── components/
├── lib/
│   ├── db.ts (Prisma client)
│   └── auth.ts
├── prisma/
│   └── schema.prisma
└── package.json
```

**Example API Route:**

```typescript
// app/api/users/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const users = await prisma.user.findMany();
  return NextResponse.json(users);
}

export async function POST(request: Request) {
  const body = await request.json();
  const user = await prisma.user.create({ data: body });
  return NextResponse.json(user);
}
```

---

### Pattern 1B: Separate Frontend & Backend Monolith

**Best For:**

- Small to medium teams (3-10 people)
- Need background processing or long-running tasks
- Want clear separation of concerns

**Architecture:**

```
┌──────────────┐        ┌──────────────────────┐
│   Next.js    │        │   Backend (Node.js)  │
│   Frontend   │◄──────►│                      │
│              │  REST  │  ┌────────────────┐  │
│  (Vercel)    │  /API  │  │ Express API    │  │
└──────────────┘        │  │ Routes         │  │
                        │  └───────┬────────┘  │
                        │          │           │
                        │  ┌───────▼────────┐  │
                        │  │ Services       │  │
                        │  │ (Business Logic)│ │
                        │  └───────┬────────┘  │
                        │          │           │
                        │  ┌───────▼────────┐  │
                        │  │ Prisma ORM     │  │
                        │  └───────┬────────┘  │
                        │  (Render/Render)    │
                        └──────────┼───────────┘
                                   │
                             ┌─────▼──────┐
                             │ PostgreSQL │
                             └────────────┘
```

**Tech Stack:**

- **Frontend:** Next.js (React)
- **Backend:** Node.js + Express (or Fastify)
- **Database:** PostgreSQL + Prisma
- **Deployment:**
  - Frontend: Vercel
  - Backend: Render, Render, or AWS

**Pros:**

- ✅ Clear separation (frontend team / backend team)
- ✅ Can handle background jobs (BullMQ)
- ✅ Better for CPU-intensive tasks
- ✅ Independent scaling
- ✅ Can add WebSockets easily

**Cons:**

- ⚠️ Need to handle CORS
- ⚠️ Two deployments to manage
- ⚠️ More complex than full-stack framework

**When to Use:**

- You have background tasks (email sending, PDF generation)
- You need WebSockets or long-polling
- Team is growing (5+ developers)
- Need more control over backend

**Example Backend Structure:**

```
backend/
├── src/
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── users.routes.ts
│   │   └── projects.routes.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── email.service.ts
│   │   └── user.service.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   └── error.middleware.ts
│   ├── lib/
│   │   └── prisma.ts
│   └── index.ts (Express app)
├── prisma/
│   └── schema.prisma
└── package.json
```

**Example Express Setup:**

```typescript
// src/index.ts
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/users.routes';

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

app.listen(4000, () => {
  console.log('Backend running on port 4000');
});
```

---

## 2. Modular Monolith (For Growing Teams)

**Best For:**

- Medium to large teams (10-50 people)
- Established product with multiple features
- Want microservices benefits without the complexity

**Architecture:**

```
┌────────────────────────────────────────────┐
│          Modular Monolith Backend          │
│                                            │
│  ┌─────────────┐  ┌─────────────┐        │
│  │   Auth      │  │   Users     │        │
│  │   Module    │  │   Module    │        │
│  ├─────────────┤  ├─────────────┤        │
│  │ Controllers │  │ Controllers │        │
│  │ Services    │  │ Services    │        │
│  │ Repository  │  │ Repository  │        │
│  └─────────────┘  └─────────────┘        │
│                                            │
│  ┌─────────────┐  ┌─────────────┐        │
│  │  Projects   │  │  Billing    │        │
│  │   Module    │  │   Module    │        │
│  ├─────────────┤  ├─────────────┤        │
│  │ Controllers │  │ Controllers │        │
│  │ Services    │  │ Services    │        │
│  │ Repository  │  │ Repository  │        │
│  └─────────────┘  └─────────────┘        │
│                                            │
│         Shared: Database, Utils            │
└────────────────────────────────────────────┘
```

**Key Principle:** Modules are organized by domain, but deployed as one application.

**Pros:**

- ✅ Better code organization
- ✅ Team can own specific modules
- ✅ Easier to refactor than pure monolith
- ✅ Still one deployment (simpler than microservices)
- ✅ Can extract to microservices later if needed

**Cons:**

- ⚠️ Requires discipline (don't let modules depend on each other)
- ⚠️ Still scales as one unit

**Example Structure:**

```
backend/
├── modules/
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.repository.ts
│   │   └── auth.routes.ts
│   ├── users/
│   │   ├── user.controller.ts
│   │   ├── user.service.ts
│   │   ├── user.repository.ts
│   │   └── user.routes.ts
│   ├── projects/
│   └── billing/
├── shared/
│   ├── database/
│   ├── middleware/
│   └── utils/
└── index.ts
```

**Module Example:**

```typescript
// modules/users/user.service.ts
export class UserService {
  private repository = new UserRepository();

  async getUser(id: string) {
    return this.repository.findById(id);
  }

  async createUser(data: CreateUserDTO) {
    // Business logic here
    return this.repository.create(data);
  }
}

// modules/users/user.controller.ts
export class UserController {
  private service = new UserService();

  async getUser(req: Request, res: Response) {
    const user = await this.service.getUser(req.params.id);
    res.json(user);
  }
}
```

---

## 3. Microservices (Only for Large Teams)

**WARNING:** Don't use microservices unless you have:

- 50+ developers
- Established product with millions of users
- DevOps team to manage infrastructure
- Strong monitoring and observability

**Best For:**

- Large enterprises (100+ engineers)
- Independent team scaling
- Different languages per service

**Architecture:**

```
┌──────────┐
│ Frontend │
└────┬─────┘
     │
┌────▼──────────────────────────┐
│      API Gateway               │
│    (Kong, AWS API Gateway)     │
└───┬────────┬──────────┬────────┘
    │        │          │
┌───▼───┐ ┌──▼───┐  ┌──▼─────┐
│ Auth  │ │Users │  │Projects│
│Service│ │Service│ │Service │
└───┬───┘ └──┬───┘  └──┬─────┘
    │        │          │
┌───▼───┐ ┌──▼───┐  ┌──▼─────┐
│Auth DB│ │UsersDB│ │Projects│
└───────┘ └──────┘  │   DB   │
                     └────────┘
```

**Pros:**

- ✅ Independent deployment
- ✅ Technology flexibility (Node, Python, Go per service)
- ✅ Team autonomy

**Cons:**

- ❌ **Extreme complexity**
- ❌ Network latency between services
- ❌ Distributed transactions are hard
- ❌ Debugging is painful
- ❌ Need service mesh, API gateway, monitoring
- ❌ DevOps overhead

**When to Use:**

- You have 50+ engineers
- You've outgrown a monolith
- You understand the trade-offs
- You have a dedicated DevOps team

**DO NOT use microservices for:**

- MVPs
- Small teams
- Because it's "modern" or "best practice"

---

## 4. Serverless Architecture

**Best For:**

- Variable/spiky traffic
- Want zero infrastructure management
- Cost optimization (pay per request)

**Architecture:**

```
┌──────────────┐
│   Frontend   │
│  (Vercel)    │
└──────┬───────┘
       │
┌──────▼────────────────┐
│  Serverless Functions │
│  (Vercel Functions,   │
│   AWS Lambda)         │
└──────┬────────────────┘
       │
┌──────▼──────┐
│  Serverless │
│  Database   │
│ (Neon, etc) │
└─────────────┘
```

**Tech Stack:**

- **Frontend:** Next.js (Vercel)
- **API:** Vercel Edge Functions or AWS Lambda
- **Database:** Neon (serverless PostgreSQL)
- **Auth:** Clerk, Auth0

**Pros:**

- ✅ Automatic scaling
- ✅ Pay per request (cheap for low traffic)
- ✅ Zero server management

**Cons:**

- ⚠️ Cold starts (latency)
- ⚠️ Vendor lock-in
- ⚠️ Hard to debug locally
- ⚠️ Stateless (no WebSockets, long-running tasks)

**When to Use:**

- Unpredictable traffic patterns
- Want minimal ops work
- Building on Vercel/AWS ecosystem

---

## 5. Real-World Examples

### Example 1: SaaS Project Management Tool

**Requirements:**

- User authentication
- Projects, tasks, comments
- Real-time updates
- Team collaboration

**Recommended:** **Separate Frontend/Backend Monolith**

**Why:**

- Need WebSockets for real-time (Socket.io)
- Background jobs (email notifications)
- Clear separation for frontend/backend teams

**Tech Stack:**

- Frontend: Next.js (Vercel)
- Backend: Node.js + Express + Socket.io (Render)
- Database: PostgreSQL (Neon)
- Cache: Redis (Upstash)

---

### Example 2: E-Commerce Store

**Requirements:**

- Product catalog
- Shopping cart
- Checkout (Stripe)
- Order management
- Inventory tracking

**Recommended:** **Full-Stack Next.js** (for MVP) → **Separate Monolith** (for scale)

**Start with:**

- Next.js full-stack (Vercel)
- PostgreSQL (Neon)
- Stripe API

**Grow to:**

- Separate backend for inventory management
- Background jobs for order processing

---

### Example 3: Content Platform (Blog, CMS)

**Requirements:**

- Articles, authors
- Comments
- Search
- Static content (mostly reads)

**Recommended:** **Full-Stack Next.js + ISR**

**Why:**

- Mostly static content (use Incremental Static Regeneration)
- Simple CRUD operations
- No complex backend logic

**Tech Stack:**

- Next.js with ISR (Vercel)
- PostgreSQL or MongoDB
- Algolia (search)

---

## 6. Migration Paths

### From Full-Stack Next.js → Separate Backend

**When to migrate:**

- API routes becoming complex
- Need background jobs
- Team growing (5+ developers)

**Migration Steps:**

1. Create separate backend repo (Express)
2. Move API route logic to Express endpoints
3. Add CORS configuration
4. Update frontend to call new backend API
5. Deploy backend to Render/Render
6. Gradually migrate all API routes

---

### From Monolith → Modular Monolith

**When to migrate:**

- Codebase becoming hard to navigate
- Multiple teams working on same repo
- Want better organization

**Migration Steps:**

1. Create `modules/` directory
2. Group related code by domain (auth, users, billing)
3. Refactor to use module structure
4. Enforce module boundaries (no cross-imports)

---

## 7. The Ultra-Dex Recommendation

### For 90% of SaaS Projects:

**Start:** Full-Stack Next.js (Pattern 1A)

- Perfect for MVP
- Fastest to market
- One deployment

**Grow:** Separate Frontend/Backend (Pattern 1B)

- When you need background jobs
- When team grows to 5+ people
- When you need WebSockets

**Eventually:** Modular Monolith (Pattern 2)

- Only when you have 20+ developers
- When you need better code organization

**Never:** Microservices

- Unless you have 50+ developers and a DevOps team

---

## 8. Anti-Patterns (What NOT to Do)

### ❌ Starting with Microservices

**Problem:** Premature complexity. You'll spend more time on infrastructure than features.

**Solution:** Start with a monolith. Extract microservices only when you have clear boundaries and team structure.

---

### ❌ Over-Engineering the Database Layer

**Problem:** Adding repository pattern, unit of work, CQRS when you have 3 database models.

**Solution:** Use Prisma directly in your services. Add abstractions only when you feel pain.

---

### ❌ Building Your Own Auth

**Problem:** Security vulnerabilities, time waste.

**Solution:** Use Clerk, Auth0, or NextAuth. Build your product, not auth infrastructure.

---

### ❌ Not Using TypeScript

**Problem:** Runtime errors, poor developer experience.

**Solution:** Always use TypeScript. It pays for itself immediately.

---

## 9. Quick Start Templates

### Full-Stack Next.js

```bash
# Create Next.js app
npx create-next-app@latest my-saas --typescript --tailwind --app

cd my-saas

# Add Prisma
npm install prisma @prisma/client
npx prisma init

# Add authentication (optional)
npm install next-auth
```

### Separate Frontend/Backend

```bash
# Frontend
npx create-next-app@latest frontend --typescript

# Backend
mkdir backend && cd backend
npm init -y
npm install express cors prisma @prisma/client
npm install -D typescript @types/node @types/express ts-node

# Initialize TypeScript
npx tsc --init
```

---

## 10. Decision Matrix

| Pattern                | Team Size | Complexity  | Best For             |
| ---------------------- | --------- | ----------- | -------------------- |
| **Full-Stack Next.js** | 1-3       | Low         | MVPs, side projects  |
| **Separate Monolith**  | 3-10      | Medium      | Growing SaaS         |
| **Modular Monolith**   | 10-50     | Medium-High | Established products |
| **Microservices**      | 50+       | Very High   | Large enterprises    |
| **Serverless**         | Any       | Low-Medium  | Variable traffic     |

---

## Final Advice

**The best architecture is the one you can build and ship.**

Don't over-engineer. Start simple, add complexity only when needed.

**Golden Rule:** If you're unsure, start with **Full-Stack Next.js** (Pattern 1A).

---

## Need Help Deciding?

Use the [@CTO](../agents/1-leadership/cto.md) agent to review your architecture decisions.

Use the [@Research](../agents/1-leadership/research.md) agent to compare options for your specific use case.

---

## Related Guides

**Database & Tech Stack:**

- [Database Decision Framework](./DATABASE-DECISION-FRAMEWORK.md) - PostgreSQL vs MongoDB vs MySQL
- [AI Model Selection](./AI-MODEL-SELECTION.md) - Choose the right AI for each task

**Workflows & Implementation:**

- [Project Orchestration](./PROJECT-ORCHESTRATION.md) - Multi-agent workflows for building features
- [Advanced Workflows](./ADVANCED-WORKFLOWS.md) - Real-world examples (Stripe, emails, migrations)
- [Multi-Tool Workflow](./MULTI-TOOL-WORKFLOW.md) - Coordinate multiple AI tools together

---

_Part of [Ultra-Dex v6.0.0 OVERPOWERED](https://github.com/Srujan0798/Ultra-Dex) - Professional AI Orchestration Meta Layer_
