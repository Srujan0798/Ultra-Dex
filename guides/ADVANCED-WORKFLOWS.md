# Advanced Workflow Examples

> Real-world implementations with complete agent workflows

These examples show how to use Ultra-Dex agents for complex features with concrete commands and expected outputs.

---

## Example 1: Payment Integration (Stripe)

**Goal:** Allow users to upgrade to paid plan

### Workflow

**User Request:**
```
"Add Stripe payment integration for Pro plan ($29/month)"
```

---

### @Planner: Task Breakdown

```markdown
## Tasks
1. Stripe account setup & API keys
2. Database schema for subscriptions
3. Stripe webhook endpoints
4. Checkout page UI
5. Subscription management page

## Dependencies
Research → CTO → Database → Backend → Frontend → Security → Deploy

Handoff to @Research for Stripe integration patterns.
```

---

### @Research: Stripe Integration Research

```markdown
## Research: Stripe Integration Best Practices

### Options Compared

| Approach | Pros | Cons |
|----------|------|------|
| **Stripe Checkout** | Pre-built UI, PCI compliant | Less customization |
| **Stripe Elements** | Full control | More code to maintain |
| **Stripe Pricing Table** | No code needed | Limited customization |

### Recommendation: Stripe Checkout
**Why:**
- Pre-built, secure payment UI
- Automatic tax calculation
- Supports one-time and subscriptions
- Mobile optimized
- PCI compliance handled by Stripe

### Implementation Pattern
```typescript
// 1. Create Checkout Session (Backend)
const session = await stripe.checkout.sessions.create({
  mode: 'subscription',
  line_items: [{ price: 'price_xxx', quantity: 1 }],
  success_url: 'https://app.com/success',
  cancel_url: 'https://app.com/pricing'
});

// 2. Redirect to Stripe (Frontend)
window.location.href = session.url;

// 3. Handle webhook events (Backend)
stripe.webhooks.constructEvent(body, signature, secret);
```

### Resources
- [Stripe Checkout Docs](https://stripe.com/docs/payments/checkout)
- [Webhook Events Guide](https://stripe.com/docs/webhooks)

Handoff to @CTO for architecture approval.
```

---

### @CTO: Architecture Review

```markdown
## Stripe Integration Architecture

### Tech Decisions

**1. Subscription Model**
- Use Stripe Checkout for payment UI
- Store subscription data in our database (sync from Stripe)
- Webhook-driven state updates

**2. Database Schema**
```prisma
model Subscription {
  id                String   @id @default(uuid())
  userId            String   @unique
  stripeCustomerId  String   @unique
  stripePriceId     String
  status            String   // active, canceled, past_due
  currentPeriodEnd  DateTime
  cancelAtPeriodEnd Boolean  @default(false)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  user User @relation(fields: [userId], references: [id])
}
```

**3. Security**
- Validate webhook signatures (prevent fake events)
- Store Stripe keys in environment variables
- Never expose secret key to frontend

**4. Edge Cases**
- Handle failed payments (email user, retry)
- Allow subscription cancellation (cancel_at_period_end)
- Prorate upgrades/downgrades

Architecture approved. Handoff to @Database.
```

---

### @Database: Schema Implementation

**Command to run:**
```bash
# Add Subscription model to schema.prisma and run migration
npx prisma migrate dev --name add_stripe_subscriptions
```

**Expected output:**
```
✔ Generated Prisma Client
✔ Migration created successfully
✔ Migration applied: 20260120_add_stripe_subscriptions
```

---

### @Backend: Stripe Endpoints

**Command to test:**
```bash
curl -X POST http://localhost:4000/api/stripe/create-checkout-session \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"priceId": "price_xxx"}'
```

**Expected Response:**
```json
{
  "url": "https://checkout.stripe.com/c/pay/cs_test_xxx"
}
```

---

### @DevOps: Deployment

```bash
# 1. Set Stripe environment variables on Vercel/Railway
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx

# 2. Deploy to staging
git push staging main

# 3. Test with Stripe test card: 4242 4242 4242 4242

# 4. Verify webhook
stripe listen --forward-to https://staging-api.myapp.com/api/stripe/webhook

# 5. Deploy to production
git push production main
```

---

## Example 2: Email Notification System

**Goal:** Send transactional emails (welcome, password reset, etc.)

### @Research: Email Provider Comparison

```markdown
| Provider | Cost | Pros | Cons |
|----------|------|------|------|
| **Resend** | $20/mo (50k emails) | Modern API, React email | Newer service |
| **SendGrid** | $15/mo (40k emails) | Established, templates | Complex UI |
| **AWS SES** | $0.10/1k emails | Cheapest | Requires AWS setup |

### Recommendation: Resend
- React Email for type-safe templates
- Best developer experience
- Automatic DKIM/SPF setup
- Generous free tier (3k emails/month)
```

---

### @CTO: Email Architecture

```markdown
### Design Decisions
1. **Async Processing:** Queue emails with BullMQ (don't block API responses)
2. **Template Storage:** React Email components in codebase
3. **Retry Logic:** 3 retries with exponential backoff
4. **Tracking:** Log all sent emails in database
```

---

### @Database: Email Tracking Schema

```prisma
model EmailLog {
  id        String   @id @default(uuid())
  userId    String?
  to        String
  subject   String
  type      String   // welcome, reset, verification
  status    String   // sent, failed, bounced
  sentAt    DateTime @default(now())

  user User? @relation(fields: [userId], references: [id])
  @@index([userId, type])
}
```

---

### @Backend: Email Service Implementation

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendWelcomeEmail(user: User) {
  const { data } = await resend.emails.send({
    from: 'noreply@myapp.com',
    to: user.email,
    subject: 'Welcome to MyApp!',
    react: WelcomeEmail({ name: user.name })
  });

  // Log to database
  await prisma.emailLog.create({
    data: {
      userId: user.id,
      to: user.email,
      subject: 'Welcome to MyApp!',
      type: 'welcome',
      status: 'sent'
    }
  });
}
```

**Test command:**
```bash
npm run email:test -- --to=your@email.com --type=welcome
```

---

## Example 3: Database Migration (Add User Profile Fields)

**Goal:** Add 'name' and 'bio' fields to User model

### @Database: Schema Change

**Step 1: Update schema.prisma**
```prisma
model User {
  id       String  @id @default(uuid())
  email    String  @unique
  name     String? // NEW
  bio      String? // NEW
  ...
}
```

**Step 2: Create migration**
```bash
npx prisma migrate dev --name add_user_profile_fields
```

**Step 3: Test migration**
```bash
npx prisma studio
# Verify: name and bio columns exist in User table
```

---

### @Backend: Update API

**Test command:**
```bash
curl -X PUT http://localhost:4000/api/user/profile \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "bio": "Software developer"}'
```

---

### @Reviewer: Migration Safety Check

```markdown
### ✅ Passed
- [x] Fields are nullable (won't break existing users)
- [x] No default values required
- [x] Backward compatible
- [x] Rollback plan: Can safely remove fields

### Deployment Plan
1. Deploy backend first (handles new fields)
2. Run migration on production
3. Deploy frontend (shows new fields)
```

---

## Example 4: Real-Time Feature (Live Notifications)

**Goal:** Show live notifications when events happen

### Workflow Summary

```markdown
@Planner: Break down into WebSocket server + notification system
@CTO: Decide on Socket.io vs native WebSockets (chose Socket.io)
@Backend: Implement Socket.io server + event emitters
@Frontend: Add Socket.io client + notification toast UI
@Testing: Test connection handling, reconnection, event delivery
@Reviewer: Check performance (1000+ concurrent connections)
@DevOps: Deploy with WebSocket support on Railway/Render
```

**Key Implementation:**

```typescript
// Backend: Emit event
io.to(userId).emit('notification', {
  type: 'new_message',
  message: 'You have a new message'
});

// Frontend: Listen for events
socket.on('notification', (data) => {
  showToast(data.message);
});
```

---

## Common Patterns

### 1. Always Start with @Planner
Break down complex features into discrete tasks before implementing.

### 2. Get Architecture Approval from @CTO
Validate technical decisions before building.

### 3. Test at Each Step
Every agent provides test commands to verify their work.

### 4. Document Decisions
Record WHY choices were made, not just WHAT was built.

---

## Next Steps

For more workflow examples, see:
- [Project Orchestration Guide](./PROJECT-ORCHESTRATION.md)
- [Database Decision Framework](./DATABASE-DECISION-FRAMEWORK.md)
- [Architecture Patterns](./ARCHITECTURE-PATTERNS.md)

---

*Part of [Ultra-Dex v1.6.1](https://github.com/Srujan0798/Ultra-Dex) - Professional AI Orchestration Meta Layer*
