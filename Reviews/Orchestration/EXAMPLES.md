# Multi-Agent Workflow Examples

> Real workflows showing how Ultra-Dex agents coordinate

---

## Example 1: Add User Authentication

**Goal:** Implement complete user authentication system

### Workflow

**User Request:**
```
"Add user authentication to my SaaS"
```

---

### @Planner: Task Breakdown

```markdown
Breaking down user authentication into tasks:

## Tasks
1. **Database Schema** (P0)
   - Create User model
   - Add authentication fields
   - Set up indexes

2. **Auth API Endpoints** (P0)
   - POST /api/auth/signup
   - POST /api/auth/login
   - POST /api/auth/logout
   - GET /api/auth/me

3. **Login/Signup UI** (P0)
   - Login page
   - Signup page
   - Protected route wrapper

4. **Session Management** (P1)
   - JWT token generation
   - Token refresh logic
   - Session expiration

## Dependencies
- Database → Backend → Frontend → Security Review → Deploy

Handoff to @CTO for architecture review.
```

---

### @CTO: Architecture Review

```markdown
Reviewed authentication requirements. Here's the architecture:

## Architecture Decisions

### Authentication Method: JWT Tokens
**Why:**
- Stateless (better for scaling)
- Works across multiple services
- Industry standard, well-supported

### Storage: httpOnly Cookies
**Why:**
- Prevents XSS attacks
- Automatic with requests
- Secure flag for HTTPS only

### Tech Stack
- Backend: bcrypt for password hashing (cost factor 12)
- Tokens: jsonwebtoken library
- Frontend: Context API for auth state

## Security Considerations
- Rate limit login attempts (5 per 15 min)
- Password requirements: 8+ chars, 1 uppercase, 1 number
- Email verification required before login
- HTTPS only in production

Architecture approved. Handoff to @Database.
```

---

### @Database: Schema Creation

```markdown
Creating User schema per CTO's architecture.

## User Model (Prisma Schema)
\`\`\`prisma
model User {
  id            String   @id @default(uuid())
  email         String   @unique
  passwordHash  String
  emailVerified Boolean  @default(false)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([email])
}
\`\`\`

## Quality Checklist
- [x] Migration created and tested
- [x] Index on email for fast lookups
- [x] UUID for primary key (security)
- [x] Timestamps included

Migration ready: `npx prisma migrate dev --name add_user_auth`

Handoff to @Backend.
```

---

### @Backend: API Implementation

```markdown
Implementing auth API endpoints per CTO architecture.

## Endpoints Created

### POST /api/auth/signup
\`\`\`typescript
- Validates email format
- Checks password strength
- Hashes password with bcrypt (cost 12)
- Creates user record
- Sends verification email
- Returns 201 Created
\`\`\`

### POST /api/auth/login
\`\`\`typescript
- Validates credentials
- Checks email verification
- Generates JWT token
- Sets httpOnly cookie
- Returns user data
\`\`\`

### GET /api/auth/me
\`\`\`typescript
- Verifies JWT from cookie
- Returns current user
- Returns 401 if not authenticated
\`\`\`

### POST /api/auth/logout
\`\`\`typescript
- Clears auth cookie
- Returns 200 OK
\`\`\`

## Quality Checklist
- [x] API endpoints tested (Jest tests passing)
- [x] Error handling implemented
- [x] Rate limiting added (5 attempts/15min)
- [x] API documented in Swagger

Handoff to @Frontend.
```

---

### @Frontend: Login UI

```markdown
Creating login/signup UI per design system.

## Components Created

### LoginPage.tsx
- Email/password form
- "Forgot password" link
- Social login buttons (Google, GitHub)
- Link to signup page
- Loading states
- Error messages

### SignupPage.tsx
- Email/password/confirm form
- Password strength indicator
- Terms of service checkbox
- Link to login page
- Success message (check email)

### useAuth Hook
- Login/logout/signup functions
- Current user state
- Loading state
- Error handling

### ProtectedRoute Component
- Redirects to login if not authenticated
- Shows loading spinner while checking

## Quality Checklist
- [x] Responsive on mobile
- [x] Keyboard accessible (tab navigation works)
- [x] Loading and error states
- [x] Component tests passing

Handoff to @Auth for security review.
```

---

### @Auth: Security Review

```markdown
Reviewing authentication implementation for security issues.

## Security Audit

### ✅ Passed
- Password hashing: bcrypt with cost 12 ✓
- JWT tokens: Signed with strong secret ✓
- httpOnly cookies: Prevents XSS ✓
- Secure flag: Set for production ✓
- Rate limiting: 5 attempts/15min ✓
- HTTPS only: Enforced in production ✓

### ⚠️ Recommendations
1. Add password reset flow (currently missing)
2. Consider adding 2FA for admin accounts
3. Add session timeout (currently tokens don't expire)

## Immediate Action Required
- Set JWT_SECRET environment variable
- Never commit secrets to git

## Quality Checklist
- [x] No critical security vulnerabilities
- [x] Authentication properly implemented
- [x] Authorization checks in place
- [x] Secrets not exposed in code

Security approved with recommendations for future. Handoff to @Reviewer.
```

---

### @Reviewer: Code Review

```markdown
Reviewing authentication implementation.

## Code Quality Review

### ✅ Strengths
- Clean separation of concerns
- Proper error handling
- Good test coverage (85%)
- Well-documented API

### 📝 Minor Issues
1. `authService.ts:45` - Magic number (12) should be config constant
2. `LoginPage.tsx:78` - Could extract form validation to custom hook
3. Missing JSDoc for some public functions

### 🎯 Suggestions
- Add integration tests for full auth flow
- Consider extracting auth logic to separate service layer

## Quality Checklist
- [x] Code quality acceptable
- [x] Tests passing (43/43)
- [x] No security issues
- [x] Follows project patterns

Code approved. Handoff to @DevOps for deployment.
```

---

### @DevOps: Deployment

```markdown
Deploying authentication feature.

## Deployment Steps

### 1. Environment Variables
\`\`\`bash
# Added to Vercel/Railway
JWT_SECRET=<generated-32-char-secret>
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12
\`\`\`

### 2. Database Migration
\`\`\`bash
# Run on staging
npx prisma migrate deploy

# Verified: User table created ✓
\`\`\`

### 3. Deploy to Staging
\`\`\`bash
git push staging main
# Build successful ✓
# Tests passing ✓
\`\`\`

### 4. Smoke Tests
- [x] Signup works
- [x] Login works
- [x] Protected routes redirect
- [x] Logout works

### 5. Deploy to Production
\`\`\`bash
git push production main
# Deployed ✓
\`\`\`

## Quality Checklist
- [x] Environment variables set
- [x] Build successful
- [x] Deployment verified
- [x] Health checks passing

## URLs
- Staging: https://myapp-staging.vercel.app
- Production: https://myapp.com

Authentication feature deployed successfully!
```

---

## Example 2: Build Analytics Dashboard

**Goal:** Create dashboard showing user metrics

### Workflow

**User Request:**
```
"Create an analytics dashboard showing user activity metrics"
```

---

### @Planner: Task Breakdown

```markdown
## Tasks
1. Define metrics to show
   - Active users (daily/weekly/monthly)
   - New signups over time
   - Feature usage stats

2. Backend API for analytics data
   - GET /api/analytics/overview
   - Aggregate user data
   - Date range filtering

3. Frontend dashboard components
   - Chart library integration (Chart.js)
   - Dashboard layout
   - Loading states

Handoff to @Backend for API implementation.
```

---

### @Backend: API Implementation

```markdown
Implementing analytics API.

## Endpoint: GET /api/analytics/overview

\`\`\`typescript
// Returns aggregated metrics
{
  activeUsers: {
    daily: 245,
    weekly: 1203,
    monthly: 3421
  },
  newSignups: [
    { date: "2026-01-01", count: 12 },
    { date: "2026-01-02", count: 18 },
    ...
  ],
  featureUsage: {
    taskCreated: 543,
    fileUploaded: 234,
    reportGenerated: 89
  }
}
\`\`\`

## Quality Checklist
- [x] Efficient query (uses aggregation)
- [x] Date range validation
- [x] Cached for 5 minutes (Redis)
- [x] Tests passing

API ready. Handoff to @Frontend.
```

---

### @Frontend: Dashboard UI

```markdown
Building analytics dashboard.

## Components Created

### DashboardPage.tsx
- Grid layout (responsive)
- Metric cards (total users, growth rate)
- Charts (line chart for signups, bar chart for features)

### AnalyticsChart.tsx
- Reusable chart component
- Uses Chart.js
- Configurable chart types

### MetricCard.tsx
- Shows metric value
- Comparison to previous period
- Up/down indicator

## Quality Checklist
- [x] Responsive on mobile (stacks vertically)
- [x] Charts load lazily
- [x] Loading skeleton while fetching
- [x] Error state if API fails

Dashboard complete. Handoff to @Reviewer.
```

---

### @Reviewer: Code Review

```markdown
## Review Summary

### ✅ Good
- Clean component structure
- Proper loading states
- Responsive design

### 📝 Suggestion
- Consider virtualization if chart has 1000+ data points

Approved for deployment.
```

---

## Example 3: Fix Performance Bug

**Goal:** Optimize slow page load

### Workflow

**User Report:**
```
"The user list page takes 5 seconds to load with 500 users"
```

---

### @Debugger: Investigation

```markdown
Investigating slow user list page.

## Findings

### Issue: N+1 Query Problem
The page fetches users, then makes separate queries for each user's profile data.

\`\`\`typescript
// Current (slow):
const users = await db.user.findMany();
for (const user of users) {
  user.profile = await db.profile.findUnique({ where: { userId: user.id } });
}
// Result: 1 query + 500 queries = 501 total queries
\`\`\`

### Performance Impact
- 500 users: 5 seconds
- 1000 users: Would be 10+ seconds

### Recommended Fix
Use eager loading with Prisma's `include`:

\`\`\`typescript
const users = await db.user.findMany({
  include: { profile: true }
});
// Result: 1 query total
\`\`\`

Handoff to @Database for optimization.
```

---

### @Database: Query Optimization

```markdown
Optimizing user list query.

## Implementation

\`\`\`typescript
// Old query (slow)
const users = await prisma.user.findMany();

// New query (fast)
const users = await prisma.user.findMany({
  include: {
    profile: true,
    _count: {
      select: { tasks: true }
    }
  },
  take: 50,  // Pagination
  skip: page * 50
});
\`\`\`

## Performance Results
- Before: 5000ms for 500 users
- After: 200ms for 500 users
- **25x faster**

## Quality Checklist
- [x] Migration not needed (query change only)
- [x] Index exists on userId (already present)
- [x] Tested with 1000 users (still fast)
- [x] Pagination added

Optimization complete. Handoff to @Reviewer.
```

---

### @Reviewer: Validation

```markdown
## Validation Results

### Performance Testing
- [x] Tested with 100 users: 50ms ✓
- [x] Tested with 1000 users: 300ms ✓
- [x] Tested with 10000 users: 1.2s ✓

### Code Quality
- [x] No breaking changes
- [x] Pagination implemented correctly
- [x] Error handling preserved

Performance fix validated and approved!
```

---

## Key Takeaways

1. **Clear Handoffs**: Each agent explicitly states who's next
2. **Quality Gates**: Every agent checks their work before passing
3. **Documentation**: Decisions and rationale are recorded
4. **Collaboration**: Agents review each other's work

---

## Example 4: Add Payment Integration (Stripe)

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

**Result:**
```markdown
## Schema Added

Created Subscription model with:
- [x] Stripe customer ID (unique index)
- [x] Subscription status tracking
- [x] Period end dates
- [x] Relation to User model

Handoff to @Backend.
```

---

### @Backend: Stripe Endpoints

**Implementation:**

```markdown
## Endpoints Created

### POST /api/stripe/create-checkout-session
**Purpose:** Start Stripe Checkout flow

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

### POST /api/stripe/webhook
**Purpose:** Receive Stripe events

**Events Handled:**
- `checkout.session.completed` - Create subscription
- `customer.subscription.updated` - Update status
- `customer.subscription.deleted` - Cancel subscription
- `invoice.payment_failed` - Alert user

**Verification:**
```bash
# Test webhook signature validation
stripe listen --forward-to localhost:4000/api/stripe/webhook
```

### GET /api/stripe/subscription
**Purpose:** Get user's current subscription

**Command to test:**
```bash
curl http://localhost:4000/api/stripe/subscription \
  -H "Authorization: Bearer YOUR_JWT"
```

**Expected Response:**
```json
{
  "status": "active",
  "plan": "Pro",
  "currentPeriodEnd": "2026-02-20",
  "cancelAtPeriodEnd": false
}
```

### POST /api/stripe/cancel-subscription
**Purpose:** Cancel user's subscription

**Implementation:**
```typescript
// Cancel at period end (user keeps access until end of billing period)
await stripe.subscriptions.update(subscriptionId, {
  cancel_at_period_end: true
});
```

## Quality Checklist
- [x] All endpoints tested with Stripe CLI
- [x] Webhook signature validation working
- [x] Error handling for network failures
- [x] Idempotent webhook processing (prevent duplicates)

Handoff to @Frontend.
```

---

### @Frontend: Payment UI

**Components Created:**

```markdown
## PricingPage.tsx
**Location:** `frontend/src/app/pricing/page.tsx`

**Features:**
- Free vs Pro plan comparison
- "Upgrade to Pro" button
- Redirects to Stripe Checkout

**Command to test:**
```bash
cd frontend && npm run dev
# Visit http://localhost:3000/pricing
```

## SubscriptionPage.tsx
**Location:** `frontend/src/app/settings/subscription/page.tsx`

**Features:**
- Current plan display
- Next billing date
- Cancel subscription button
- Download invoices link

## useSubscription Hook
**Location:** `frontend/src/hooks/useSubscription.ts`

```typescript
const { subscription, loading } = useSubscription();

if (subscription?.status === 'active') {
  // User has Pro access
}
```

## Quality Checklist
- [x] Loading states while redirecting
- [x] Success/cancel pages created
- [x] Subscription status updates in real-time
- [x] Mobile responsive

Handoff to @Security.
```

---

### @Security: Payment Security Audit

```markdown
## Security Review

### ✅ Passed
- Webhook signature validation ✓
- API keys in environment variables ✓
- No secret keys in frontend code ✓
- HTTPS enforced ✓
- User can only access their own subscription ✓

### ⚠️ Recommendations
1. Add rate limiting to checkout endpoint (prevent spam)
2. Log all payment events for audit trail
3. Alert on failed webhook deliveries

### Test Commands Run
```bash
# 1. Verified webhook signature check
curl -X POST http://localhost:4000/api/stripe/webhook \
  -d "fake_payload" # Should return 400 Bad Request

# 2. Verified authorization
curl http://localhost:4000/api/stripe/subscription # Should return 401
```

Security approved. Handoff to @Reviewer.
```

---

### @Reviewer: Code Review

```markdown
## Review Results

### ✅ Strengths
- Clean error handling
- Proper webhook verification
- Good test coverage (78%)

### 📝 Suggestions
1. Add integration test for full checkout flow
2. Document webhook retry logic
3. Add monitoring for webhook failures

Approved for deployment.
```

---

### @DevOps: Stripe Deployment

**Deployment Commands:**

```bash
# 1. Set Stripe environment variables on Vercel/Railway
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx

# 2. Deploy to staging
git push staging main

# 3. Test on staging
# Visit https://staging.myapp.com/pricing
# Complete test purchase with Stripe test card: 4242 4242 4242 4242

# 4. Verify webhook on staging
stripe listen --forward-to https://staging-api.myapp.com/api/stripe/webhook

# 5. Deploy to production
git push production main
```

**Verification Checklist:**
- [x] Test purchase completed on staging
- [x] Webhook events received
- [x] Subscription created in database
- [x] User sees "Pro" badge in UI
- [x] Cancellation flow works

**Production URLs:**
- Pricing page: https://myapp.com/pricing
- Subscription management: https://myapp.com/settings/subscription

Payment integration deployed successfully!
```

---

## Example 5: Email Notification System

**Goal:** Send transactional emails (welcome, password reset, etc.)

### Workflow

**User Request:**
```
"Add email notifications for signup and password reset"
```

---

### @Planner: Email System Breakdown

```markdown
## Tasks
1. Choose email provider (Resend, SendGrid, AWS SES)
2. Email templates design
3. Backend email service
4. Integration points (signup, password reset)
5. Email preferences table

Handoff to @Research.
```

---

### @Research: Email Provider Comparison

```markdown
## Email Provider Research

| Provider | Cost | Pros | Cons |
|----------|------|------|------|
| **Resend** | $20/mo (50k emails) | Modern API, React email | Newer service |
| **SendGrid** | $15/mo (40k emails) | Established, templates | Complex UI |
| **AWS SES** | $0.10/1k emails | Cheapest | Requires AWS setup |

### Recommendation: Resend
**Why:**
- React Email for type-safe templates
- Best developer experience
- Automatic DKIM/SPF setup
- Generous free tier (3k emails/month)

**Example Template:**
```tsx
import { Button, Html } from '@react-email/components';

export default function WelcomeEmail({ name }: { name: string }) {
  return (
    <Html>
      <h1>Welcome {name}!</h1>
      <Button href="https://app.com/login">Get Started</Button>
    </Html>
  );
}
```

Handoff to @CTO.
```

---

### @CTO: Email Architecture

```markdown
## Email System Architecture

### Design Decisions
1. **Async Processing:** Queue emails with BullMQ (don't block API responses)
2. **Template Storage:** React Email components in codebase
3. **Retry Logic:** 3 retries with exponential backoff
4. **Tracking:** Log all sent emails in database

### Email Types
- Welcome email (on signup)
- Email verification
- Password reset
- Subscription confirmation
- Weekly digest (optional)

Handoff to @Database.
```

---

### @Database: Email Tracking Schema

**Command:**
```bash
# Add EmailLog model
npx prisma migrate dev --name add_email_logs
```

**Schema:**
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

**File:** `backend/src/services/emailService.ts`

**Test command:**
```bash
# Send test email
npm run email:test -- --to=your@email.com --type=welcome
```

**Expected output:**
```
✔ Email queued successfully
✔ Email sent to your@email.com
✔ EmailLog created in database
```

**Code:**
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

Handoff to @Frontend (no UI changes needed for this feature).
Handoff to @Reviewer.
```

---

### @Reviewer: Email Review

```markdown
## Review Checklist

### ✅ Verified
- [x] Emails render correctly in Gmail, Outlook, Apple Mail
- [x] Unsubscribe link included (required by law)
- [x] Mobile responsive
- [x] Fallback text for images

### Test Results
```bash
# Sent test emails to 5 different providers
✔ Gmail: Delivered, looks good
✔ Outlook: Delivered, looks good
✔ Apple Mail: Delivered, looks good
✔ Yahoo: Delivered, looks good
✔ ProtonMail: Delivered, looks good
```

Approved for deployment.
```

---

## Example 6: Database Migration (Change User Table)

**Goal:** Add 'name' and 'bio' fields to User model

### Workflow

**User Request:**
```
"Add user profile fields: name and bio"
```

---

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

**Expected output:**
```
✔ Applying migration `20260120_add_user_profile_fields`
✔ Generated Prisma Client
```

**Step 3: Test migration**
```bash
# Check schema in database
npx prisma studio
# Verify: name and bio columns exist in User table
```

---

### @Backend: Update API

**Files to modify:**
```markdown
1. `src/routes/user.ts`
   - Add name/bio to GET /api/user/me response
   - Add PUT /api/user/profile endpoint

2. `src/validators/user.ts`
   - Add validation: name (max 50 chars), bio (max 500 chars)
```

**Test command:**
```bash
# Update profile
curl -X PUT http://localhost:4000/api/user/profile \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "bio": "Software developer"}'
```

**Expected response:**
```json
{
  "id": "xxx",
  "email": "john@example.com",
  "name": "John Doe",
  "bio": "Software developer"
}
```

---

### @Frontend: Profile Edit UI

**Component:** `ProfileEditPage.tsx`

```tsx
<form onSubmit={handleSubmit}>
  <input name="name" maxLength={50} placeholder="Your name" />
  <textarea name="bio" maxLength={500} placeholder="Bio" />
  <button type="submit">Save Profile</button>
</form>
```

**Test:** Visit http://localhost:3000/settings/profile

---

### @Reviewer: Migration Review

```markdown
## Migration Safety Check

### ✅ Passed
- [x] Fields are nullable (won't break existing users)
- [x] No default values required
- [x] Backward compatible
- [x] Rollback plan: Can safely remove fields

### Deployment Plan
1. Deploy backend first (handles new fields)
2. Run migration on production
3. Deploy frontend (shows new fields)

Approved for deployment.
```

---

## Example 7: Real-Time Feature (Live Notifications)

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

## Concrete Command Reference

### Starting a Feature

```bash
# 1. Open your AI tool (Claude Code, Cursor, ChatGPT)

# 2. Load the appropriate agent
"Load agents/1-leadership/planner.md and break down this feature: [your feature]"

# 3. Follow the agent workflow from PROJECT-ORCHESTRATION.md
```

### Running Migrations

```bash
# Create migration
npx prisma migrate dev --name [migration_name]

# Deploy to production
npx prisma migrate deploy

# Reset database (dev only, destructive!)
npx prisma migrate reset
```

### Testing API Endpoints

```bash
# GET request
curl http://localhost:4000/api/endpoint

# POST request with JSON
curl -X POST http://localhost:4000/api/endpoint \
  -H "Content-Type: application/json" \
  -d '{"key": "value"}'

# With authentication
curl http://localhost:4000/api/endpoint \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Deployment Commands

```bash
# Deploy to Vercel (frontend)
vercel --prod

# Deploy to Railway (backend)
railway up

# Check deployment status
railway status

# View logs
railway logs
```

---

## Key Patterns Across All Examples

### 1. Clear Handoffs
Every agent ends with: "Handoff to @[NextAgent]"

### 2. Quality Checklists
Before handoff, verify:
- [x] Code works
- [x] Tests pass
- [x] Documentation updated

### 3. Concrete Outputs
Every agent provides:
- Code snippets
- Test commands
- Expected results

### 4. Decision Documentation
Record WHY decisions were made, not just WHAT was built

---

*These patterns can be applied to any SaaS feature in Ultra-Dex*
