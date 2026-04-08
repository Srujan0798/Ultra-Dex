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

````markdown
## Research: Stripe Integration Best Practices

### Options Compared

| Approach                 | Pros                        | Cons                  |
| ------------------------ | --------------------------- | --------------------- |
| **Stripe Checkout**      | Pre-built UI, PCI compliant | Less customization    |
| **Stripe Elements**      | Full control                | More code to maintain |
| **Stripe Pricing Table** | No code needed              | Limited customization |

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
  cancel_url: 'https://app.com/pricing',
});

// 2. Redirect to Stripe (Frontend)
window.location.href = session.url;

// 3. Handle webhook events (Backend)
stripe.webhooks.constructEvent(body, signature, secret);
```
````

### Resources

- [Stripe Checkout Docs](https://stripe.com/docs/payments/checkout)
- [Webhook Events Guide](https://stripe.com/docs/webhooks)

Handoff to @CTO for architecture approval.

````

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
````

**3. Security**

- Validate webhook signatures (prevent fake events)
- Store Stripe keys in environment variables
- Never expose secret key to frontend

**4. Edge Cases**

- Handle failed payments (email user, retry)
- Allow subscription cancellation (cancel_at_period_end)
- Prorate upgrades/downgrades

Architecture approved. Handoff to @Database.

````

---

### @Database: Schema Implementation

**Command to run:**
```bash
# Add Subscription model to schema.prisma and run migration
npx prisma migrate dev --name add_stripe_subscriptions
````

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
# 1. Set Stripe environment variables on Vercel/Render
STRIPE_SECRET_KEY=ST_LIVE_xxx
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
| Provider     | Cost                | Pros                    | Cons               |
| ------------ | ------------------- | ----------------------- | ------------------ |
| **Resend**   | $20/mo (50k emails) | Modern API, React email | Newer service      |
| **SendGrid** | $15/mo (40k emails) | Established, templates  | Complex UI         |
| **AWS SES**  | $0.10/1k emails     | Cheapest                | Requires AWS setup |

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
    react: WelcomeEmail({ name: user.name }),
  });

  // Log to database
  await prisma.emailLog.create({
    data: {
      userId: user.id,
      to: user.email,
      subject: 'Welcome to MyApp!',
      type: 'welcome',
      status: 'sent',
    },
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
@DevOps: Deploy with WebSocket support on Render/Render
```

**Key Implementation:**

```typescript
// Backend: Emit event
io.to(userId).emit('notification', {
  type: 'new_message',
  message: 'You have a new message',
});

// Frontend: Listen for events
socket.on('notification', (data) => {
  showToast(data.message);
});
```

---

## Example 5: Supabase Authentication Setup

**Goal:** Set up complete authentication with Supabase including email/password, OAuth, and Row Level Security

### Workflow

**User Request:**

```
"Add authentication to my SaaS using Supabase with Google OAuth and Row Level Security"
```

---

### @Planner: Task Breakdown

```markdown
## Tasks

1. Create Supabase project and get API keys
2. Set up database schema with RLS policies
3. Configure authentication providers (email + Google OAuth)
4. Implement backend auth middleware
5. Build frontend auth UI components
6. Test authentication flow

## Dependencies

Planner → Research → CTO → Database → Backend → Frontend → Security → DevOps

Handoff to @Research for authentication provider comparison.
```

---

### @Research: Authentication Provider Research

````markdown
## Research: Supabase vs Auth0 vs Custom Auth

### Options Compared

| Provider          | Pros                                                     | Cons                            | Cost            |
| ----------------- | -------------------------------------------------------- | ------------------------------- | --------------- |
| **Supabase Auth** | Built-in with database, RLS policies, free tier generous | Newer, less enterprise features | Free (50k MAU)  |
| **Auth0**         | Most features, enterprise-ready                          | Complex, expensive              | $23/mo (7k MAU) |
| **Custom JWT**    | Full control                                             | Have to build everything        | Dev time cost   |

### Recommendation: Supabase Auth

**Why:**

- PostgreSQL database included (no separate service)
- Row Level Security (RLS) for multi-tenant apps
- Pre-built auth UI components
- Social OAuth built-in (Google, GitHub, etc.)
- Free tier: 50,000 monthly active users
- JWT tokens with auto-refresh

### Implementation Pattern

```typescript
// 1. Initialize Supabase client
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// 2. Sign up user
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'secure-password',
});

// 3. Sign in with OAuth
const { data } = await supabase.auth.signInWithOAuth({
  provider: 'google',
});
```
````

### Resources

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

Handoff to @CTO for architecture review.

````

---

### @CTO: Architecture Review

```markdown
## Supabase Authentication Architecture

### Tech Decisions

**1. Authentication Strategy**
- Use Supabase Auth for user management
- JWT tokens stored in httpOnly cookies
- Google OAuth for social login
- Email confirmation required for signups

**2. Database Schema**
```sql
-- Supabase creates auth.users table automatically
-- We add a public.profiles table for user data

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can only update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);
````

**3. Security Considerations**

- RLS policies on all user tables (prevent data leaks)
- API keys environment-specific (dev/staging/prod)
- Email verification required (prevent fake accounts)
- Password requirements: min 8 chars

**4. Edge Cases**

- Handle email already exists error
- OAuth email mismatch (user signs up with email, then OAuth)
- Session expiry and auto-refresh
- Password reset flow

Architecture approved. Handoff to @Database for RLS implementation.

````

---

### @Database: Row Level Security Implementation

**Step 1: Create profiles table migration**
```bash
npx supabase migration new create_profiles_table
````

**Edit migration file:**

```sql
-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

**Step 2: Apply migration**

```bash
npx supabase migration up
```

**Expected output:**

```
Applying migration 20260124_create_profiles_table...
✔ Migration applied successfully
```

**Step 3: Test RLS policies**

```sql
-- Test as authenticated user
SELECT auth.uid(); -- Returns your user ID
SELECT * FROM profiles; -- Should only see your own profile
```

Handoff to @Backend for auth API implementation.

---

### @Backend: Authentication API

**Install Supabase:**

```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
```

**Create API route for signup:**

```typescript
// app/api/auth/signup/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  const { email, password, full_name } = await request.json();

  const supabase = createRouteHandlerClient({ cookies });

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name,
      },
    },
  });

  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  return Response.json({
    message: 'Check your email for confirmation link',
    user: data.user,
  });
}
```

**Create API route for login:**

```typescript
// app/api/auth/login/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  const { email, password } = await request.json();

  const supabase = createRouteHandlerClient({ cookies });

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return Response.json({ error: error.message }, { status: 401 });
  }

  return Response.json({
    message: 'Logged in successfully',
    user: data.user,
  });
}
```

**Create middleware for protected routes:**

```typescript
// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session && req.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return res;
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
```

**Test commands:**

```bash
# Test signup
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "securepassword123",
    "full_name": "Test User"
  }'

# Test login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "securepassword123"
  }'
```

**Expected Response:**

```json
{
  "message": "Logged in successfully",
  "user": {
    "id": "uuid-here",
    "email": "test@example.com",
    "user_metadata": {
      "full_name": "Test User"
    }
  }
}
```

Handoff to @Frontend for UI components.

---

### @Frontend: Authentication UI

**Create signup form:**

```tsx
// app/signup/page.tsx
'use client';
import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    if (error) {
      alert(error.message);
    } else {
      alert('Check your email for confirmation!');
      router.push('/login');
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSignUp} className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Sign Up</h1>

      <input
        type="text"
        placeholder="Full Name"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        className="w-full px-4 py-2 mb-4 border rounded"
        required
      />

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full px-4 py-2 mb-4 border rounded"
        required
      />

      <input
        type="password"
        placeholder="Password (min 8 chars)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full px-4 py-2 mb-4 border rounded"
        minLength={8}
        required
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
      >
        {loading ? 'Signing up...' : 'Sign Up'}
      </button>
    </form>
  );
}
```

**Add Google OAuth button:**

```tsx
// components/GoogleSignIn.tsx
'use client';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export function GoogleSignIn() {
  const supabase = createClientComponentClient();

  const handleGoogleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <button
      onClick={handleGoogleSignIn}
      className="flex items-center gap-2 px-4 py-2 border rounded hover:bg-gray-50"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        {/* Google icon SVG */}
      </svg>
      Continue with Google
    </button>
  );
}
```

**Test in browser:**

1. Visit http://localhost:3000/signup
2. Fill form and submit
3. Check email for confirmation link
4. Click confirmation link
5. Redirected to login page
6. Test Google OAuth button

Handoff to @Security for security audit.

---

### @Security: Security Audit

```markdown
## Supabase Auth Security Review

### ✅ Security Checklist

**Authentication:**

- [x] Email confirmation required before login
- [x] Password minimum 8 characters enforced
- [x] JWT tokens expire after 1 hour (Supabase default)
- [x] Refresh tokens stored securely (httpOnly cookies)
- [x] OAuth redirect URLs whitelisted in Supabase dashboard

**Database Security:**

- [x] Row Level Security enabled on all tables
- [x] RLS policies restrict users to own data only
- [x] Foreign key constraints prevent orphaned records
- [x] Database credentials not exposed to frontend

**API Security:**

- [x] ANON key used (not SERVICE_ROLE key in frontend)
- [x] Protected routes use middleware authentication check
- [x] API routes validate authentication before operations

**OAuth Security:**

- [x] Redirect URLs validated (prevent open redirect)
- [x] State parameter used (prevent CSRF)
- [x] Google OAuth configured with correct scopes

### Recommendations

1. **Add rate limiting** - Prevent brute force login attempts
2. **Enable MFA** - Add two-factor authentication option
3. **Audit logs** - Track authentication events

### Approval Status

✅ **APPROVED** - Authentication implementation is secure for production

Critical issues: None
Recommendations: 3 (non-blocking)

Handoff to @DevOps for deployment.
```

---

### @DevOps: Deployment

**Step 1: Configure Supabase project**

```bash
# In Supabase Dashboard:
# 1. Go to Authentication → Providers
# 2. Enable Email provider (confirmation required: ON)
# 3. Enable Google OAuth provider
#    - Add Google Client ID and Secret
#    - Add redirect URL: https://your-app.vercel.app/auth/callback
# 4. Go to Settings → API
#    - Copy Project URL and ANON key
```

**Step 2: Set environment variables**

```bash
# In Vercel/Render dashboard or .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Step 3: Deploy application**

```bash
# Deploy to Vercel
vercel --prod

# Or deploy to Render
render up
```

**Step 4: Test production authentication**

```bash
# Test signup
curl -X POST https://your-app.vercel.app/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "production@test.com",
    "password": "securepassword123",
    "full_name": "Production User"
  }'
```

**Step 5: Verify in Supabase Dashboard**

1. Go to Authentication → Users
2. See new user listed
3. Click user to see metadata (full_name)
4. Go to Database → profiles table
5. Verify profile auto-created via trigger

**Expected outcome:**

```
✔ User created in auth.users
✔ Profile created in public.profiles
✔ Email confirmation sent
✔ Google OAuth functional
✔ RLS policies enforced
✔ Protected routes work
```

**Deployment complete!** Authentication is now live in production.

---

## Example 6: Vercel Deployment Pipeline

**Goal:** Deploy Next.js SaaS application from local development to production on Vercel

### Workflow

**User Request:**

```
"Deploy my Next.js SaaS to Vercel with staging and production environments"
```

---

### @Planner: Task Breakdown

```markdown
## Tasks

1. Set up Vercel project and link Git repository
2. Configure environment variables for staging/production
3. Set up custom domain
4. Configure preview deployments for PRs
5. Set up deployment protection rules
6. Test deployment pipeline

## Dependencies

Planner → CTO → Frontend → DevOps

Handoff to @CTO for deployment architecture.
```

---

### @CTO: Deployment Architecture

```markdown
## Vercel Deployment Strategy

### Tech Decisions

**1. Git-Based Deployments**

- **Production branch:** `main` → deploys to production
- **Staging branch:** `staging` → deploys to staging
- **Feature branches:** `feature/*` → deploys to preview URLs
- Auto-deploy on push (no manual intervention)

**2. Environment Strategy**
```

Development (local) → localhost:3000
Preview (PRs) → unique-url-git-branch.vercel.app
Staging → staging.myapp.com
Production → myapp.com

````

**3. Build Configuration**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm ci",
  "framework": "nextjs"
}
````

**4. Environment Variables**

- **Development:** `.env.local` (not committed)
- **Preview:** Vercel dashboard (shared across previews)
- **Production:** Vercel dashboard (production only)
- **Secrets:** Use Vercel's encrypted secrets for API keys

**5. Edge Cases**

- Build failures → notify team via Slack integration
- Database migrations → run before deployment
- Cache invalidation → automatic on new deployment
- Rollback strategy → redeploy previous commit

Architecture approved. Handoff to @Frontend for build optimization.

````

---

### @Frontend: Build Optimization

**Update Next.js config for Vercel:**
```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable SWC minification (faster builds)
  swcMinify: true,

  // Image optimization
  images: {
    domains: ['your-domain.com', 'cdn.example.com'],
    formats: ['image/avif', 'image/webp']
  },

  // Enable React strict mode
  reactStrictMode: true,

  // Optimize fonts
  optimizeFonts: true,

  // Compression
  compress: true,

  // Custom headers for security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          }
        ]
      }
    ];
  }
};

module.exports = nextConfig;
````

**Add build verification script:**

```json
// package.json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "build:check": "npm run lint && npm run build"
  }
}
```

**Test build locally:**

```bash
npm run build
npm run start

# Visit http://localhost:3000 to verify
```

**Expected output:**

```
✓ Creating an optimized production build
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages (12/12)
✓ Finalizing page optimization

Route (app)                              Size     First Load JS
┌ ○ /                                    142 B          87.2 kB
├ ○ /dashboard                          1.23 kB         88.3 kB
└ ○ /login                              891 B           87.9 kB
```

Handoff to @DevOps for Vercel deployment.

---

### @DevOps: Vercel Deployment

**Step 1: Install Vercel CLI**

```bash
npm i -g vercel
```

**Step 2: Login to Vercel**

```bash
vercel login
```

**Step 3: Link project to Vercel**

```bash
# Run from project root
vercel link

# Follow prompts:
# ? Set up and deploy "~/myapp"? Yes
# ? Which scope? Your Team Name
# ? Link to existing project? No
# ? What's your project's name? myapp
# ? In which directory is your code located? ./
```

**Expected output:**

```
✔ Linked to your-team/myapp (created .vercel directory)
```

**Step 4: Configure environment variables**

```bash
# Add production environment variables
vercel env add DATABASE_URL production
# Paste your production database URL when prompted

vercel env add NEXT_PUBLIC_API_URL production
# Paste your production API URL

# Add preview environment variables (for PR previews)
vercel env add DATABASE_URL preview
# Paste your staging database URL

# Pull env vars locally for testing
vercel env pull .env.local
```

**Step 5: Deploy to preview (test deployment)**

```bash
vercel

# Or specify environment
vercel --env preview
```

**Expected output:**

```
🔗  Inspect: https://vercel.com/your-team/myapp/abc123
✅  Preview: https://myapp-abc123.vercel.app
📝  Deployed to preview. Copy URL to clipboard? Yes
```

**Step 6: Test preview deployment**

```bash
# Visit preview URL
curl https://myapp-abc123.vercel.app

# Check API endpoint
curl https://myapp-abc123.vercel.app/api/health
```

**Expected response:**

```json
{
  "status": "ok",
  "environment": "preview",
  "version": "1.0.0"
}
```

**Step 7: Deploy to production**

```bash
vercel --prod

# Or push to main branch (auto-deploys)
git push origin main
```

**Expected output:**

```
🔗  Inspect: https://vercel.com/your-team/myapp/prod123
✅  Production: https://myapp.vercel.app
```

**Step 8: Configure custom domain**

```bash
# Add custom domain via CLI
vercel domains add myapp.com

# Or in Vercel Dashboard:
# Project Settings → Domains → Add Domain
```

**Configure DNS records:**

```
Type    Name    Value                           TTL
A       @       76.76.21.21                     Auto
CNAME   www     cname.vercel-dns.com            Auto
```

**Step 9: Set up deployment protection (optional)**

```bash
# In Vercel Dashboard:
# Project Settings → Deployment Protection
# - Enable "Password Protection" for preview deployments
# - Enable "Trusted IPs" for production (optional)
```

**Step 10: Configure GitHub integration**

```yaml
# Vercel automatically:
# 1. Deploys on every push to main (production)
# 2. Deploys preview on every PR
# 3. Comments on PR with deployment URL
# 4. Shows deployment status in GitHub checks
```

**Step 11: Verify production deployment**

```bash
# Check production URL
curl https://myapp.com

# Check deployment status
vercel ls

# View deployment logs
vercel logs myapp.com
```

**Expected output:**

```
myapp.com     Ready    Production    2m ago
├── abc123    Ready    Preview       5m ago
└── def456    Ready    Preview       1h ago

✔ Production deployment successful
✔ Custom domain configured
✔ SSL certificate active
✔ Preview deployments working
```

---

### Deployment Pipeline Diagram

```
Feature Branch Push
      ↓
  Vercel Preview Deploy
      ↓
  https://myapp-git-feature.vercel.app
      ↓
  Team Reviews → Merge to Main
      ↓
  Vercel Production Deploy
      ↓
  https://myapp.com (Live in <30s)
```

---

### Troubleshooting Common Issues

**Build fails on Vercel but works locally:**

```bash
# Check Node.js version matches
# In vercel.json:
{
  "buildCommand": "npm run build",
  "installCommand": "npm ci",
  "devCommand": "npm run dev",
  "framework": "nextjs",
  "nodeVersion": "18.x"
}
```

**Environment variables not working:**

```bash
# Redeploy after adding env vars
vercel --prod --force

# Or check env vars are set
vercel env ls
```

**Custom domain not working:**

```bash
# Check DNS propagation
dig myapp.com

# Wait up to 48 hours for DNS propagation
# Use nslookup to verify
nslookup myapp.com
```

---

**Deployment complete!** Application is now live on Vercel with automatic deployments.

---

## Example 7: GitHub Actions CI/CD Pipeline

**Goal:** Set up automated testing, linting, building, and deployment with GitHub Actions

### Workflow

**User Request:**

```
"Create a CI/CD pipeline that runs tests on every PR and deploys to production on merge to main"
```

---

### @Planner: Task Breakdown

```markdown
## Tasks

1. Create workflow file for CI (tests + lint)
2. Add build verification job
3. Add deployment job for production
4. Configure secrets for deployment
5. Add status badges to README
6. Test workflow on PR

## Dependencies

Planner → CTO → Testing → DevOps

Handoff to @CTO for CI/CD architecture.
```

---

### @CTO: CI/CD Architecture

```markdown
## GitHub Actions Pipeline Design

### Tech Decisions

**1. Workflow Strategy**

- **On PR:** Run tests, lint, build (CI only)
- **On push to main:** Run CI + deploy to production (CI/CD)
- **Manual:** Allow manual deployment trigger
- **Scheduled:** Run tests nightly to catch dependency issues

**2. Pipeline Stages**
```

Pull Request Opened
↓
Install Dependencies (cache npm)
↓
Lint Code (ESLint)
↓
Run Tests (Jest/Vitest)
↓
Build Application (Next.js)
↓
Comment PR with Status
↓
[If main branch] Deploy to Production

````

**3. Caching Strategy**
- Cache `node_modules` (speeds up by 60%)
- Cache Next.js build cache (speeds up by 40%)
- Use GitHub's built-in cache action

**4. Job Configuration**
```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x, 20.x]
````

**5. Security**

- Store deployment keys in GitHub Secrets
- Use GITHUB_TOKEN for PR comments (automatic)
- Don't expose secrets in logs

Architecture approved. Handoff to @Testing for workflow implementation.

````

---

### @Testing: CI Workflow Implementation

**Create workflow file:**
```bash
mkdir -p .github/workflows
touch .github/workflows/ci.yml
````

**Complete CI/CD workflow:**

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  # Run on pull requests
  pull_request:
    branches: [main, develop]

  # Run on pushes to main
  push:
    branches: [main]

  # Allow manual trigger
  workflow_dispatch:

jobs:
  # Job 1: Install dependencies
  install:
    name: Install Dependencies
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18.x'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Cache node modules
        uses: actions/cache@v3
        with:
          path: node_modules
          key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
          restore-keys: |
            ${{ runner.os }}-node-

  # Job 2: Lint code
  lint:
    name: Lint Code
    runs-on: ubuntu-latest
    needs: install

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18.x'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint

      - name: Check TypeScript
        run: npm run type-check

  # Job 3: Run tests
  test:
    name: Run Tests
    runs-on: ubuntu-latest
    needs: install

    strategy:
      matrix:
        node-version: [18.x, 20.x]

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:unit

      - name: Run integration tests
        run: npm run test:integration

      - name: Generate coverage report
        run: npm run test:coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          flags: unittests
          name: codecov-umbrella

  # Job 4: Build application
  build:
    name: Build Application
    runs-on: ubuntu-latest
    needs: [lint, test]

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18.x'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build Next.js application
        run: npm run build
        env:
          NEXT_PUBLIC_API_URL: ${{ secrets.NEXT_PUBLIC_API_URL }}

      - name: Check build size
        run: |
          du -sh .next
          echo "Build size:" $(du -sh .next | cut -f1)

  # Job 5: Deploy to production (only on main)
  deploy:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main'

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18.x'

      - name: Install Vercel CLI
        run: npm install -g vercel

      - name: Pull Vercel environment
        run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}

      - name: Build production artifacts
        run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}

      - name: Deploy to Vercel
        id: deploy
        run: |
          vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }} > deployment-url.txt
          echo "url=$(cat deployment-url.txt)" >> $GITHUB_OUTPUT

      - name: Comment deployment URL on commit
        uses: peter-evans/commit-comment@v3
        with:
          body: |
            🚀 **Deployed to production!**
            URL: ${{ steps.deploy.outputs.url }}

  # Job 6: Notify on failure
  notify-failure:
    name: Notify on Failure
    runs-on: ubuntu-latest
    needs: [lint, test, build, deploy]
    if: failure()

    steps:
      - name: Send Slack notification
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'CI/CD Pipeline Failed!'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

**Add scripts to package.json:**

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "test:unit": "jest --testPathPattern=unit",
    "test:integration": "jest --testPathPattern=integration",
    "test:coverage": "jest --coverage"
  }
}
```

---

### @DevOps: Configure GitHub Secrets

**Step 1: Add deployment secrets**

```bash
# In GitHub: Repository → Settings → Secrets and variables → Actions

# Add these secrets:
1. VERCEL_TOKEN
   - Get from: https://vercel.com/account/tokens
   - Value: Your Vercel token

2. VERCEL_ORG_ID
   - Get from: .vercel/project.json (after running `vercel link`)
   - Value: Your organization ID

3. VERCEL_PROJECT_ID
   - Get from: .vercel/project.json
   - Value: Your project ID

4. NEXT_PUBLIC_API_URL
   - Value: https://api.myapp.com

5. SLACK_WEBHOOK (optional)
   - Value: https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

**Step 2: Test workflow on PR**

```bash
# Create a test branch
git checkout -b test-ci-pipeline

# Make a small change
echo "# Test" >> README.md

# Commit and push
git add README.md
git commit -m "test: Verify CI/CD pipeline"
git push origin test-ci-pipeline

# Create PR on GitHub
gh pr create --title "Test CI/CD Pipeline" --body "Testing GitHub Actions workflow"
```

**Step 3: Monitor workflow execution**

```bash
# Watch workflow status
gh run watch

# Or view in GitHub:
# Repository → Actions → CI/CD Pipeline
```

**Expected output:**

```
✓ install          Install Dependencies    (1m 23s)
✓ lint             Lint Code               (45s)
✓ test (18.x)      Run Tests               (2m 15s)
✓ test (20.x)      Run Tests               (2m 18s)
✓ build            Build Application       (1m 45s)
⊘ deploy           Deploy to Production    (skipped - not main branch)

All checks have passed
```

**Step 4: Test production deployment**

```bash
# Merge PR to main
gh pr merge --merge

# Monitor deployment
gh run watch
```

**Expected output:**

```
✓ install          Install Dependencies    (1m 23s)
✓ lint             Lint Code               (45s)
✓ test (18.x)      Run Tests               (2m 15s)
✓ test (20.x)      Run Tests               (2m 18s)
✓ build            Build Application       (1m 45s)
✓ deploy           Deploy to Production    (2m 30s)

🚀 Deployed to production!
URL: https://myapp.vercel.app
```

---

### Add Status Badges to README

```markdown
<!-- Add to top of README.md -->

# My SaaS Application

[![CI/CD Pipeline](https://github.com/username/repo/actions/workflows/ci.yml/badge.svg)](https://github.com/username/repo/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/username/repo/branch/main/graph/badge.svg)](https://codecov.io/gh/username/repo)
[![Deploy Status](https://img.shields.io/badge/deploy-vercel-black)](https://myapp.vercel.app)
```

---

### Advanced: Parallel Testing with Matrix

**Test across multiple environments:**

```yaml
test:
  strategy:
    matrix:
      os: [ubuntu-latest, windows-latest, macos-latest]
      node-version: [18.x, 20.x]
      include:
        - os: ubuntu-latest
          node-version: 18.x
          experimental: false
        - os: ubuntu-latest
          node-version: 20.x
          experimental: true

  runs-on: ${{ matrix.os }}

  steps:
    - name: Run on ${{ matrix.os }} with Node ${{ matrix.node-version }}
      run: npm test
```

---

### Workflow Optimization Tips

**1. Cache dependencies:**

```yaml
- uses: actions/cache@v3
  with:
    path: |
      ~/.npm
      node_modules
      .next/cache
    key: ${{ runner.os }}-npm-${{ hashFiles('**/package-lock.json') }}
```

**2. Use concurrency to cancel old runs:**

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

**3. Add timeout to prevent hanging jobs:**

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 10
```

---

### Troubleshooting

**Build fails on CI but works locally:**

```yaml
# Add debug logging
- name: Debug environment
  run: |
    echo "Node version: $(node --version)"
    echo "NPM version: $(npm --version)"
    echo "Working directory: $(pwd)"
    ls -la
```

**Tests time out:**

```yaml
# Increase Jest timeout
- name: Run tests
  run: npm test -- --testTimeout=30000
```

**Deployment fails:**

```bash
# Check Vercel token is valid
vercel whoami --token=${{ secrets.VERCEL_TOKEN }}
```

---

**CI/CD pipeline complete!** Automated testing and deployment is now active.

---

## Example 8: Sentry Error Tracking

**Goal:** Set up error monitoring and performance tracking with Sentry for both frontend and backend

### Workflow

**User Request:**

```
"Add Sentry error tracking to catch and monitor production errors in our Next.js app"
```

---

### @Planner: Task Breakdown

```markdown
## Tasks

1. Create Sentry account and project
2. Install Sentry SDKs for frontend and backend
3. Configure error boundaries for React
4. Set up source maps for debugging
5. Configure alerts and notifications
6. Test error capture in development

## Dependencies

Planner → Research → CTO → Backend → Frontend → DevOps

Handoff to @Research for error tracking comparison.
```

---

### @Research: Error Tracking Comparison

````markdown
## Research: Sentry vs Rollbar vs LogRocket

### Options Compared

| Provider      | Pros                                        | Cons                      | Cost                 |
| ------------- | ------------------------------------------- | ------------------------- | -------------------- |
| **Sentry**    | Best error grouping, source maps, free tier | Can be expensive at scale | Free (5k errors/mo)  |
| **Rollbar**   | Good integrations, fast                     | Less features than Sentry | $12/mo (5k errors)   |
| **LogRocket** | Session replay included                     | Expensive, slow           | $99/mo (1k sessions) |

### Recommendation: Sentry

**Why:**

- Industry standard for error tracking
- Excellent error grouping and deduplication
- Source map support for debugging minified code
- Performance monitoring included
- Free tier: 5,000 errors/month + 10,000 performance events
- Supports release tracking and deployment notifications
- PII scrubbing built-in

### Key Features

```typescript
// 1. Automatic error capture
try {
  riskyOperation();
} catch (error) {
  Sentry.captureException(error);
}

// 2. Custom context
Sentry.setUser({ id: user.id, email: user.email });
Sentry.setTag('page', 'checkout');
Sentry.setContext('order', { id: '123', total: 99.99 });

// 3. Breadcrumbs (trail of events leading to error)
Sentry.addBreadcrumb({
  message: 'User clicked checkout',
  level: 'info',
});
```
````

### Resources

- [Sentry Next.js Docs](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Error Handling Best Practices](https://docs.sentry.io/platforms/javascript/best-practices/)

Handoff to @CTO for architecture review.

````

---

### @CTO: Error Monitoring Architecture

```markdown
## Sentry Error Tracking Architecture

### Tech Decisions

**1. Sentry Integration Strategy**
- **Frontend:** Capture React errors via ErrorBoundary + global handlers
- **Backend:** Capture API errors via Express middleware
- **Source Maps:** Upload to Sentry for production debugging
- **Performance:** Track slow API calls and page loads

**2. Error Capture Scope**
````

Frontend:

- Unhandled Promise rejections
- React component errors (ErrorBoundary)
- API fetch failures
- User interactions that trigger errors

Backend:

- Unhandled exceptions
- API endpoint errors
- Database query errors
- Third-party service failures

````

**3. PII Protection**
- Scrub sensitive data (passwords, credit cards, tokens)
- Use `beforeSend` hook to filter data
- Configure allowed URLs (don't track admin pages)

**4. Release Tracking**
```typescript
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  release: process.env.VERCEL_GIT_COMMIT_SHA,
  environment: process.env.NODE_ENV
});
````

**5. Alert Configuration**

- Email on new issues
- Slack notification for critical errors
- Weekly digest for team

Architecture approved. Handoff to @Backend for server-side setup.

````

---

### @Backend: Server-Side Sentry Setup

**Step 1: Install Sentry SDK**
```bash
npm install @sentry/nextjs
````

**Step 2: Initialize Sentry Wizard**

```bash
npx @sentry/wizard@latest -i nextjs
```

**This creates three config files:**

1. `sentry.client.config.ts` - Frontend configuration
2. `sentry.server.config.ts` - Backend configuration
3. `sentry.edge.config.ts` - Edge runtime configuration

**Step 3: Configure server-side Sentry**

```typescript
// sentry.server.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
  // We recommend adjusting this value in production (0.1 = 10%)
  tracesSampleRate: 0.1,

  // Capture 100% of errors
  environment: process.env.NODE_ENV,
  release: process.env.VERCEL_GIT_COMMIT_SHA,

  // Filter out sensitive data
  beforeSend(event, hint) {
    // Don't send events from admin panel
    if (event.request?.url?.includes('/admin')) {
      return null;
    }

    // Scrub sensitive headers
    if (event.request?.headers) {
      delete event.request.headers['authorization'];
      delete event.request.headers['cookie'];
    }

    return event;
  },

  // Ignore specific errors
  ignoreErrors: ['Non-Error promise rejection captured', 'Network request failed', /AbortError/],
});
```

**Step 4: Add error handling to API routes**

```typescript
// app/api/users/route.ts
import * as Sentry from '@sentry/nextjs';

export async function GET(request: Request) {
  try {
    const users = await db.user.findMany();
    return Response.json({ users });
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        endpoint: '/api/users',
        method: 'GET',
      },
      extra: {
        url: request.url,
        headers: Object.fromEntries(request.headers),
      },
    });

    return Response.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
```

**Test backend error capture:**

```bash
# Create test endpoint
# app/api/test-sentry/route.ts
export async function GET() {
  throw new Error('Test backend error for Sentry');
}

# Trigger error
curl http://localhost:3000/api/test-sentry
```

**Expected in Sentry Dashboard:**

```
New Issue: Error
Message: Test backend error for Sentry
Location: app/api/test-sentry/route.ts:2
Environment: development
```

Handoff to @Frontend for client-side setup.

---

### @Frontend: Client-Side Sentry Setup

**Configure client-side Sentry:**

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance monitoring
  tracesSampleRate: 0.1,

  // Session replay for debugging
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Release tracking
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
  environment: process.env.NODE_ENV,

  // Filter breadcrumbs
  beforeBreadcrumb(breadcrumb, hint) {
    // Don't log console.debug breadcrumbs
    if (breadcrumb.category === 'console' && breadcrumb.level === 'debug') {
      return null;
    }
    return breadcrumb;
  },

  // User context
  initialScope: {
    tags: {
      app_version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    },
  },
});
```

**Create Error Boundary component:**

```tsx
// components/ErrorBoundary.tsx
'use client';
import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to Sentry
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
      <p className="text-gray-600 mb-6">We've been notified and are working on a fix.</p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Try again
      </button>
    </div>
  );
}

// Use in layout or page
// app/error.tsx
export { ErrorBoundary as default } from '@/components/ErrorBoundary';
```

**Add user context:**

```typescript
// lib/sentry.ts
import * as Sentry from '@sentry/nextjs';

export function identifyUser(user: { id: string; email: string }) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
  });
}

export function clearUser() {
  Sentry.setUser(null);
}

// Use in auth flow
// After successful login:
identifyUser({ id: user.id, email: user.email });
```

**Test frontend error capture:**

```tsx
// Create test component
// app/test-error/page.tsx
'use client';

export default function TestErrorPage() {
  const triggerError = () => {
    throw new Error('Test frontend error for Sentry');
  };

  return <button onClick={triggerError}>Trigger Test Error</button>;
}
```

Handoff to @DevOps for source maps and deployment.

---

### @DevOps: Source Maps & Deployment

**Step 1: Configure Next.js for source maps**

```javascript
// next.config.js
const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Your existing config
};

module.exports = withSentryConfig(
  nextConfig,
  {
    // Sentry webpack plugin options
    silent: true,
    org: 'your-org-slug',
    project: 'your-project-slug',
  },
  {
    // Upload source maps during build
    widenClientFileUpload: true,
    transpileClientSDK: true,
    tunnelRoute: '/monitoring',
    hideSourceMaps: true,
    disableLogger: true,
  }
);
```

**Step 2: Set environment variables**

```bash
# In Vercel/Render dashboard
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_AUTH_TOKEN=your-auth-token-here
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=your-project-slug

# Get auth token from:
# Sentry → Settings → Auth Tokens → Create New Token
# Permissions: project:releases, project:write
```

**Step 3: Deploy and verify source maps**

```bash
# Build with source maps
npm run build

# Verify source maps uploaded
npx @sentry/cli releases files list VERSION

# Deploy to production
vercel --prod
```

**Step 4: Create release and notify Sentry**

```bash
# In CI/CD (GitHub Actions)
- name: Create Sentry release
  run: |
    npx @sentry/cli releases new "${{ github.sha }}"
    npx @sentry/cli releases set-commits "${{ github.sha }}" --auto
    npx @sentry/cli releases finalize "${{ github.sha }}"
    npx @sentry/cli releases deploys "${{ github.sha }}" new -e production
```

**Step 5: Test production error tracking**

```bash
# Trigger production error
curl https://myapp.com/api/test-sentry

# Check Sentry dashboard
# Should see:
# - Error with full stack trace
# - Source code snippets (from source maps)
# - User context
# - Breadcrumbs leading to error
```

**Expected Sentry Issue:**

```
Error: Test backend error for Sentry
  at GET (app/api/test-sentry/route.ts:2:9)
  at async NextRequest.handler

Environment: production
Release: abc123def456
User: user@example.com
Breadcrumbs:
  - Navigation to /api/test-sentry
  - HTTP request initiated
  - Error thrown
```

---

### Configure Alerts

**In Sentry Dashboard:**

```
1. Alerts → Create Alert Rule

2. Choose conditions:
   - When: An event is captured
   - If: issue.level equals error
   - Then: Send notification to #alerts Slack channel

3. Choose actions:
   - Email: team@myapp.com
   - Slack: #production-alerts
   - PagerDuty: On-call engineer (for critical errors)

4. Save alert rule
```

---

### Best Practices

**1. Set sample rates appropriately:**

```typescript
// Development: Capture everything
const tracesSampleRate = process.env.NODE_ENV === 'development' ? 1.0 : 0.1;

// Production: Sample 10% (reduces quota usage)
```

**2. Add context to errors:**

```typescript
Sentry.withScope((scope) => {
  scope.setTag('payment_method', 'stripe');
  scope.setContext('order', { id: orderId, total: orderTotal });
  Sentry.captureException(error);
});
```

**3. Ignore known errors:**

```typescript
ignoreErrors: [
  /^Network request failed$/,
  /^Timeout exceeded$/,
  'ResizeObserver loop limit exceeded',
];
```

---

**Error tracking complete!** Production errors are now monitored and debuggable with Sentry.

---

## Example 9: Shopify Product Integration

**Goal:** Sync products from Shopify store to your SaaS database with webhook updates

### Workflow

**User Request:**

```
"Integrate Shopify so products from our store automatically sync to our app's database"
```

---

### @Planner: Task Breakdown

```markdown
## Tasks

1. Create Shopify Partner account and development store
2. Set up Shopify app with Admin API access
3. Design database schema for products
4. Build product sync endpoint
5. Implement webhook handlers for product updates
6. Schedule full product sync (cron job)
7. Test with Shopify test store

## Dependencies

Planner → Research → CTO → Database → Backend → DevOps

Handoff to @Research for Shopify API comparison.
```

---

### @Research: Shopify API Options

````markdown
## Research: Shopify Admin API vs Storefront API

### Options Compared

| API                | Use Case                   | Pros                                         | Cons                          |
| ------------------ | -------------------------- | -------------------------------------------- | ----------------------------- |
| **Admin API**      | Backend product management | Full product data, webhooks, bulk operations | Requires app approval         |
| **Storefront API** | Customer-facing features   | Public data, GraphQL, fast                   | Limited to published products |
| **Multipass API**  | SSO login                  | Seamless authentication                      | Shopify Plus only             |

### Recommendation: Admin API

**Why:**

- Access to all product data (inventory, variants, images, metafields)
- Webhook support for real-time updates
- Bulk operations API for large catalogs (1000+ products)
- Rate limits: 2 requests/second (REST) or 1000 points/second (GraphQL)

### Implementation Pattern

```typescript
// Using @shopify/shopify-api package
import '@shopify/shopify-api/adapters/node';
import { shopifyApi, LATEST_API_VERSION } from '@shopify/shopify-api';

const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET,
  scopes: ['read_products', 'write_products'],
  hostName: process.env.SHOPIFY_HOST_NAME,
  apiVersion: LATEST_API_VERSION,
  isEmbeddedApp: false,
});

// Fetch products
const session = shopify.session.customAppSession(shop);
const client = new shopify.clients.Rest({ session });

const products = await client.get({
  path: 'products',
  query: { limit: 250 },
});
```
````

### Resources

- [Shopify Admin API Docs](https://shopify.dev/docs/api/admin-rest)
- [Building Shopify Apps](https://shopify.dev/docs/apps/build)

Handoff to @CTO for architecture review.

````

---

### @CTO: Shopify Integration Architecture

```markdown
## Shopify Product Sync Architecture

### Tech Decisions

**1. Sync Strategy**
- **Webhook-driven:** Real-time updates when products change
- **Full sync (daily):** Catch webhook misses, sync new products
- **On-demand sync:** Manual trigger for debugging

**2. Database Schema**
```prisma
model Product {
  id                String   @id @default(uuid())
  shopifyId         String   @unique // Shopify product ID
  shopifyHandle     String   @unique // URL-friendly identifier
  title             String
  description       String?  @db.Text
  vendor            String?
  productType       String?
  tags              String[] // Array of tags
  status            String   // active, draft, archived
  publishedAt       DateTime?
  images            Json     // Array of image URLs
  variants          Json     // Array of variants (price, sku, inventory)
  inventoryQuantity Int      @default(0)
  price             Decimal  @db.Decimal(10, 2)
  compareAtPrice    Decimal? @db.Decimal(10, 2)
  syncedAt          DateTime @default(now())
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([shopifyHandle])
  @@index([syncedAt])
}

model WebhookLog {
  id        String   @id @default(uuid())
  topic     String   // products/create, products/update
  shopifyId String
  payload   Json
  processed Boolean  @default(false)
  createdAt DateTime @default(now())

  @@index([processed, createdAt])
}
````

**3. Webhook Topics**

- `products/create` - New product created
- `products/update` - Product updated
- `products/delete` - Product deleted
- `inventory_levels/update` - Inventory changed

**4. Rate Limit Handling**

```typescript
// Implement exponential backoff
async function fetchWithRetry(url: string, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fetch(url);
    } catch (error) {
      if (i === retries - 1) throw error;
      await sleep(Math.pow(2, i) * 1000); // 1s, 2s, 4s
    }
  }
}
```

**5. Security**

- Verify webhook HMAC signatures (prevent fake webhooks)
- Store Shopify credentials in env variables
- Use private app tokens (not OAuth for this use case)

Architecture approved. Handoff to @Database for schema implementation.

````

---

### @Database: Schema Implementation

**Create migration:**
```bash
npx prisma migrate dev --name add_shopify_products
````

**Prisma schema:**

```prisma
// prisma/schema.prisma
model Product {
  id                String   @id @default(uuid())
  shopifyId         String   @unique
  shopifyHandle     String   @unique
  title             String
  description       String?  @db.Text
  vendor            String?
  productType       String?
  tags              String[]
  status            String
  publishedAt       DateTime?
  images            Json
  variants          Json
  inventoryQuantity Int      @default(0)
  price             Decimal  @db.Decimal(10, 2)
  compareAtPrice    Decimal? @db.Decimal(10, 2)
  syncedAt          DateTime @default(now())
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([shopifyHandle])
  @@index([syncedAt])
}

model WebhookLog {
  id        String   @id @default(uuid())
  topic     String
  shopifyId String
  payload   Json
  processed Boolean  @default(false)
  createdAt DateTime @default(now())

  @@index([processed, createdAt])
}
```

**Apply migration:**

```bash
npx prisma migrate deploy
npx prisma generate
```

**Expected output:**

```
✔ Generated Prisma Client
✔ Migration applied: 20260124_add_shopify_products
```

Handoff to @Backend for Shopify integration.

---

### @Backend: Shopify API Integration

**Step 1: Install Shopify SDK**

```bash
npm install @shopify/shopify-api
```

**Step 2: Create Shopify client utility**

```typescript
// lib/shopify.ts
import '@shopify/shopify-api/adapters/node';
import { shopifyApi, LATEST_API_VERSION } from '@shopify/shopify-api';

export const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY!,
  apiSecretKey: process.env.SHOPIFY_API_SECRET!,
  scopes: ['read_products', 'write_products'],
  hostName: process.env.SHOPIFY_HOST_NAME!,
  apiVersion: LATEST_API_VERSION,
  isEmbeddedApp: false,
});

export function getShopifySession() {
  return shopify.session.customAppSession(process.env.SHOPIFY_SHOP_DOMAIN!);
}
```

**Step 3: Create product sync function**

```typescript
// lib/shopify-sync.ts
import { shopify, getShopifySession } from './shopify';
import { prisma } from './prisma';

export async function syncAllProducts() {
  const session = getShopifySession();
  const client = new shopify.clients.Rest({ session });

  let hasNextPage = true;
  let pageInfo: string | undefined;
  let syncedCount = 0;

  while (hasNextPage) {
    const response = await client.get({
      path: 'products',
      query: {
        limit: 250,
        page_info: pageInfo,
      },
    });

    const products = response.body.products;

    // Upsert products to database
    for (const product of products) {
      await prisma.product.upsert({
        where: { shopifyId: product.id.toString() },
        create: {
          shopifyId: product.id.toString(),
          shopifyHandle: product.handle,
          title: product.title,
          description: product.body_html,
          vendor: product.vendor,
          productType: product.product_type,
          tags: product.tags.split(',').map((t: string) => t.trim()),
          status: product.status,
          publishedAt: product.published_at ? new Date(product.published_at) : null,
          images: product.images,
          variants: product.variants,
          inventoryQuantity: product.variants.reduce(
            (sum: number, v: any) => sum + (v.inventory_quantity || 0),
            0
          ),
          price: parseFloat(product.variants[0]?.price || '0'),
          compareAtPrice: product.variants[0]?.compare_at_price
            ? parseFloat(product.variants[0].compare_at_price)
            : null,
          syncedAt: new Date(),
        },
        update: {
          title: product.title,
          description: product.body_html,
          vendor: product.vendor,
          productType: product.product_type,
          tags: product.tags.split(',').map((t: string) => t.trim()),
          status: product.status,
          images: product.images,
          variants: product.variants,
          inventoryQuantity: product.variants.reduce(
            (sum: number, v: any) => sum + (v.inventory_quantity || 0),
            0
          ),
          price: parseFloat(product.variants[0]?.price || '0'),
          syncedAt: new Date(),
        },
      });

      syncedCount++;
    }

    // Check for next page
    const linkHeader = response.headers.get('link');
    hasNextPage = linkHeader?.includes('rel="next"') || false;
    pageInfo = extractPageInfo(linkHeader);
  }

  return { synced: syncedCount };
}

function extractPageInfo(linkHeader: string | null): string | undefined {
  if (!linkHeader) return undefined;
  const match = linkHeader.match(/page_info=([^&>]+)/);
  return match ? match[1] : undefined;
}
```

**Step 4: Create webhook handler**

```typescript
// app/api/shopify/webhooks/route.ts
import { NextRequest } from 'next/server';
import { shopify } from '@/lib/shopify';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const hmac = request.headers.get('x-shopify-hmac-sha256');
  const topic = request.headers.get('x-shopify-topic');
  const shopDomain = request.headers.get('x-shopify-shop-domain');

  // Verify webhook signature
  const generatedHash = crypto
    .createHmac('sha256', process.env.SHOPIFY_API_SECRET!)
    .update(body)
    .digest('base64');

  if (generatedHash !== hmac) {
    return Response.json({ error: 'Invalid webhook signature' }, { status: 401 });
  }

  const payload = JSON.parse(body);

  // Log webhook
  await prisma.webhookLog.create({
    data: {
      topic: topic!,
      shopifyId: payload.id.toString(),
      payload,
      processed: false,
    },
  });

  // Handle different webhook topics
  switch (topic) {
    case 'products/create':
    case 'products/update':
      await handleProductUpdate(payload);
      break;

    case 'products/delete':
      await handleProductDelete(payload);
      break;

    case 'inventory_levels/update':
      await handleInventoryUpdate(payload);
      break;
  }

  return Response.json({ received: true });
}

async function handleProductUpdate(product: any) {
  await prisma.product.upsert({
    where: { shopifyId: product.id.toString() },
    create: {
      shopifyId: product.id.toString(),
      shopifyHandle: product.handle,
      title: product.title,
      // ... full product data
      syncedAt: new Date(),
    },
    update: {
      title: product.title,
      // ... updated fields
      syncedAt: new Date(),
    },
  });
}

async function handleProductDelete(product: any) {
  await prisma.product.delete({
    where: { shopifyId: product.id.toString() },
  });
}

async function handleInventoryUpdate(inventoryLevel: any) {
  // Update inventory for specific variant
  // Implementation depends on your schema
}
```

**Step 5: Create manual sync endpoint**

```typescript
// app/api/shopify/sync/route.ts
import { syncAllProducts } from '@/lib/shopify-sync';

export async function POST() {
  try {
    const result = await syncAllProducts();
    return Response.json({
      message: 'Sync completed',
      synced: result.synced,
    });
  } catch (error) {
    return Response.json({ error: 'Sync failed', details: error.message }, { status: 500 });
  }
}
```

**Test sync:**

```bash
# Trigger manual sync
curl -X POST http://localhost:3000/api/shopify/sync

# Expected response:
{
  "message": "Sync completed",
  "synced": 150
}

# Verify products in database
npx prisma studio
```

Handoff to @DevOps for webhook configuration.

---

### @DevOps: Shopify Webhook Configuration

**Step 1: Get Shopify API credentials**

```
1. Go to Shopify Partner Dashboard: https://partners.shopify.com
2. Create App → Custom App
3. Get API Key and API Secret
4. Set Admin API access scopes:
   - read_products
   - write_products
5. Install app on development store
```

**Step 2: Set environment variables**

```bash
# .env.local
SHOPIFY_API_KEY=your-api-key
SHOPIFY_API_SECRET=your-api-secret
SHOPIFY_SHOP_DOMAIN=your-store.myshopify.com
SHOPIFY_HOST_NAME=your-app-domain.com
SHOPIFY_ACCESS_TOKEN=shpat_xxxxx
```

**Step 3: Register webhooks**

```bash
# Register webhook via Shopify API
curl -X POST "https://${SHOPIFY_SHOP_DOMAIN}/admin/api/2024-01/webhooks.json" \
  -H "X-Shopify-Access-Token: ${SHOPIFY_ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "webhook": {
      "topic": "products/create",
      "address": "https://your-app.com/api/shopify/webhooks",
      "format": "json"
    }
  }'

# Repeat for other topics:
# - products/update
# - products/delete
# - inventory_levels/update
```

**Step 4: Test webhook delivery**

```bash
# In Shopify admin, create a test product
# Check webhook logs
curl http://localhost:3000/api/shopify/webhook-logs

# Should see:
{
  "logs": [
    {
      "topic": "products/create",
      "shopifyId": "123456789",
      "processed": true,
      "createdAt": "2026-01-24T10:30:00Z"
    }
  ]
}
```

**Step 5: Set up cron job for daily full sync**

```typescript
// Using Vercel Cron or node-cron

// vercel.json
{
  "crons": [
    {
      "path": "/api/shopify/sync",
      "schedule": "0 2 * * *"
    }
  ]
}

// Runs daily at 2 AM UTC
```

**Step 6: Monitor sync status**

```bash
# Check last sync time
curl https://your-app.com/api/shopify/sync-status

# Expected response:
{
  "lastSync": "2026-01-24T02:00:00Z",
  "totalProducts": 150,
  "status": "healthy"
}
```

---

### Troubleshooting

**Webhooks not received:**

```bash
# Verify webhook registration
curl "https://${SHOPIFY_SHOP_DOMAIN}/admin/api/2024-01/webhooks.json" \
  -H "X-Shopify-Access-Token: ${SHOPIFY_ACCESS_TOKEN}"

# Re-register if missing
# Check webhook address is publicly accessible (not localhost)
```

**Rate limit errors:**

```typescript
// Check rate limit headers
const rateLimitRemaining = response.headers.get('x-shopify-shop-api-call-limit');
// Format: "32/40" (32 calls used, 40 limit)

// Implement backoff if approaching limit
if (rateLimitRemaining && parseInt(rateLimitRemaining.split('/')[0]) > 35) {
  await sleep(1000); // Wait 1 second
}
```

---

**Shopify integration complete!** Products now sync automatically from Shopify to your database.

---

## Example 10: PostHog Analytics Integration

**Goal:** Track user behavior and product metrics with PostHog for data-driven decisions

### Workflow

**User Request:**

```
"Add analytics to track user signups, feature usage, and conversion funnel with PostHog"
```

---

### @Planner: Task Breakdown

```markdown
## Tasks

1. Create PostHog account and project
2. Install PostHog SDKs for frontend and backend
3. Set up core event tracking (signup, login, feature usage)
4. Create conversion funnel dashboard
5. Set up feature flags (optional)
6. Configure user identification

## Dependencies

Planner → Research → CTO → Backend → Frontend → DevOps

Handoff to @Research for analytics platform comparison.
```

---

### @Research: Analytics Platform Comparison

````markdown
## Research: PostHog vs Mixpanel vs Amplitude

### Options Compared

| Platform             | Pros                                              | Cons                | Cost                |
| -------------------- | ------------------------------------------------- | ------------------- | ------------------- |
| **PostHog**          | Self-hosted option, feature flags, session replay | Newer platform      | Free (1M events/mo) |
| **Mixpanel**         | Mature, great UI, cohort analysis                 | Expensive at scale  | $28/mo (10k MTU)    |
| **Amplitude**        | Best for B2B, powerful analytics                  | Complex setup       | $49/mo (10k MTU)    |
| **Google Analytics** | Free, familiar                                    | Poor event tracking | Free                |

### Recommendation: PostHog

**Why:**

- Open source with self-hosted option (data privacy)
- All-in-one: analytics + feature flags + session replay + A/B testing
- Generous free tier: 1M events/month
- SQL access to raw data
- No need to learn complex analytics UI (similar to Mixpanel)
- Tracks both pageviews and custom events

### Key Features

```typescript
// 1. Event tracking
posthog.capture('user_signed_up', {
  plan: 'pro',
  source: 'landing_page',
});

// 2. User identification
posthog.identify(userId, {
  email: user.email,
  name: user.name,
  plan: 'pro',
});

// 3. Feature flags
const showNewFeature = posthog.isFeatureEnabled('new-checkout-flow');

// 4. Group analytics (for B2B)
posthog.group('company', companyId, {
  name: 'Acme Corp',
  employees: 50,
});
```
````

### Resources

- [PostHog Docs](https://posthog.com/docs)
- [Next.js Integration Guide](https://posthog.com/docs/libraries/next-js)

Handoff to @CTO for analytics architecture.

````

---

### @CTO: Analytics Architecture

```markdown
## PostHog Analytics Architecture

### Tech Decisions

**1. Tracking Strategy**
- **Client-side:** Page views, button clicks, form submissions
- **Server-side:** Backend events (purchases, API calls, cron jobs)
- **Hybrid:** Track both sides for complete picture

**2. Event Taxonomy**
````

User Lifecycle Events:

- user_signed_up
- user_logged_in
- subscription_started
- subscription_cancelled

Feature Usage Events:

- dashboard_viewed
- report_generated
- export_downloaded

Conversion Events:

- checkout_started
- payment_completed
- onboarding_completed

````

**3. User Properties**
```typescript
// Set on identification
{
  email: string,
  name: string,
  plan: 'free' | 'pro' | 'enterprise',
  signupDate: Date,
  mrr: number, // Monthly recurring revenue
  teamSize: number
}
````

**4. Privacy & GDPR**

- Respect Do Not Track (DNT) headers
- Allow users to opt out of tracking
- Don't track PII without consent
- Use PostHog's autocapture sparingly (disable for sensitive pages)

**5. Performance**

- Load PostHog async (don't block page load)
- Batch events (reduce network requests)
- Use capture buffering for high-volume events

Architecture approved. Handoff to @Backend for server-side tracking.

````

---

### @Backend: Server-Side PostHog Setup

**Step 1: Install PostHog Node SDK**
```bash
npm install posthog-node
````

**Step 2: Create PostHog client**

```typescript
// lib/posthog.ts
import { PostHog } from 'posthog-node';

export const posthogServer = new PostHog(process.env.POSTHOG_API_KEY!, {
  host: process.env.POSTHOG_HOST || 'https://app.posthog.com',
  flushAt: 20, // Batch 20 events before sending
  flushInterval: 10000, // Or flush every 10 seconds
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await posthogServer.shutdown();
});
```

**Step 3: Track backend events**

```typescript
// app/api/auth/signup/route.ts
import { posthogServer } from '@/lib/posthog';

export async function POST(request: Request) {
  const { email, name } = await request.json();

  // Create user in database
  const user = await createUser({ email, name });

  // Track signup event (server-side)
  posthogServer.capture({
    distinctId: user.id,
    event: 'user_signed_up',
    properties: {
      email: user.email,
      plan: 'free',
      source: 'api',
      $set: {
        email: user.email,
        name: user.name,
        signupDate: new Date().toISOString(),
      },
    },
  });

  return Response.json({ user });
}
```

**Step 4: Track subscription events**

```typescript
// lib/stripe-webhook-handler.ts
import { posthogServer } from '@/lib/posthog';

export async function handleSubscriptionCreated(subscription: any) {
  const userId = subscription.metadata.userId;

  // Track conversion event
  posthogServer.capture({
    distinctId: userId,
    event: 'subscription_started',
    properties: {
      plan: subscription.items.data[0].price.id,
      amount: subscription.items.data[0].price.unit_amount / 100,
      currency: subscription.currency,
      interval: subscription.items.data[0].price.recurring.interval,
      $set: {
        plan: subscription.items.data[0].price.nickname,
        mrr: subscription.items.data[0].price.unit_amount / 100,
      },
    },
  });

  // Update user properties
  posthogServer.identify({
    distinctId: userId,
    properties: {
      plan: subscription.items.data[0].price.nickname,
      mrr: subscription.items.data[0].price.unit_amount / 100,
      subscriptionStatus: 'active',
    },
  });
}
```

**Step 5: Create analytics utility functions**

```typescript
// lib/analytics.ts
import { posthogServer } from './posthog';

export async function trackFeatureUsage(
  userId: string,
  feature: string,
  metadata?: Record<string, any>
) {
  posthogServer.capture({
    distinctId: userId,
    event: `feature_used_${feature}`,
    properties: {
      feature,
      ...metadata,
    },
  });
}

export async function trackApiCall(userId: string, endpoint: string, duration: number) {
  posthogServer.capture({
    distinctId: userId,
    event: 'api_call',
    properties: {
      endpoint,
      duration,
      timestamp: new Date().toISOString(),
    },
  });
}

// Use in API routes
// trackFeatureUsage(user.id, 'export_pdf', { format: 'pdf', pages: 10 });
```

Handoff to @Frontend for client-side tracking.

---

### @Frontend: Client-Side PostHog Setup

**Step 1: Install PostHog React SDK**

```bash
npm install posthog-js posthog-react
```

**Step 2: Create PostHog provider**

```tsx
// app/providers.tsx
'use client';
import { PostHogProvider as PHProvider } from 'posthog-react';
import posthog from 'posthog-js';
import { useEffect } from 'react';

if (typeof window !== 'undefined') {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
    capture_pageview: false, // We'll capture manually
    capture_pageleave: true,
    autocapture: false, // Disable for privacy (track manually)
    loaded: (posthog) => {
      if (process.env.NODE_ENV === 'development') {
        posthog.debug();
      }
    },
  });
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Track page views on route change
    const handleRouteChange = () => posthog.capture('$pageview');
    window.addEventListener('popstate', handleRouteChange);
    return () => window.removeEventListener('popstate', handleRouteChange);
  }, []);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
```

**Step 3: Wrap app with provider**

```tsx
// app/layout.tsx
import { PostHogProvider } from './providers';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <PostHogProvider>{children}</PostHogProvider>
      </body>
    </html>
  );
}
```

**Step 4: Track user identification**

```tsx
// app/dashboard/page.tsx
'use client';
import { usePostHog } from 'posthog-react';
import { useEffect } from 'react';

export default function Dashboard({ user }: { user: User }) {
  const posthog = usePostHog();

  useEffect(() => {
    if (user) {
      // Identify user
      posthog.identify(user.id, {
        email: user.email,
        name: user.name,
        plan: user.plan,
        signupDate: user.createdAt,
      });
    }
  }, [user, posthog]);

  return <div>Dashboard</div>;
}
```

**Step 5: Track button clicks and events**

```tsx
// components/UpgradeButton.tsx
'use client';
import { usePostHog } from 'posthog-react';

export function UpgradeButton() {
  const posthog = usePostHog();

  const handleClick = () => {
    posthog.capture('upgrade_button_clicked', {
      location: 'pricing_page',
      currentPlan: 'free',
    });

    // Navigate to checkout
    window.location.href = '/checkout';
  };

  return <button onClick={handleClick}>Upgrade to Pro</button>;
}
```

**Step 6: Track page views with Next.js App Router**

```tsx
// app/components/PageViewTracker.tsx
'use client';
import { usePostHog } from 'posthog-react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const posthog = usePostHog();

  useEffect(() => {
    if (pathname) {
      let url = window.origin + pathname;
      if (searchParams?.toString()) {
        url = url + `?${searchParams.toString()}`;
      }

      posthog.capture('$pageview', {
        $current_url: url,
      });
    }
  }, [pathname, searchParams, posthog]);

  return null;
}

// Add to layout.tsx
<PageViewTracker />;
```

Handoff to @DevOps for deployment and dashboard setup.

---

### @DevOps: PostHog Deployment & Dashboard

**Step 1: Set environment variables**

```bash
# In Vercel/Render dashboard
POSTHOG_API_KEY=phc_xxxxxxxxxxxxxxxx
NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxxxxxxxxxxxxx
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# Get keys from: https://app.posthog.com/project/settings
```

**Step 2: Test event tracking**

```bash
# In browser console (after deployment)
posthog.capture('test_event', {
  property1: 'value1',
  property2: 'value2'
});

# Check PostHog dashboard: Activity → Live Events
# Should see event appear within seconds
```

**Step 3: Create conversion funnel**

```
In PostHog Dashboard:
1. Go to Insights → New Insight → Funnel
2. Add steps:
   - Step 1: user_visited_pricing (pageview /pricing)
   - Step 2: upgrade_button_clicked
   - Step 3: checkout_started
   - Step 4: payment_completed
3. Save as "Conversion Funnel"

Expected output:
100% → 40% → 30% → 25%
(Identify drop-off points to optimize)
```

**Step 4: Set up user retention cohorts**

```
In PostHog Dashboard:
1. Go to Persons → Cohorts → New Cohort
2. Create cohorts:
   - "Active Users" → Performed any event in last 7 days
   - "Pro Users" → plan equals "pro"
   - "Churned Users" → subscription_cancelled
3. Use cohorts in funnels and trends
```

**Step 5: Create dashboard**

```
1. Go to Dashboards → New Dashboard
2. Add tiles:
   - Line chart: Daily signups (event: user_signed_up)
   - Number: Total MRR (sum of user property: mrr)
   - Funnel: Conversion funnel (created above)
   - Bar chart: Feature usage (events: feature_used_*)
   - Table: Top users by activity
3. Save as "Product Analytics Dashboard"
```

---

### Best Practices

**1. Don't track everything:**

```typescript
// Bad: Too noisy
posthog.capture('mouse_moved');

// Good: Actionable events
posthog.capture('report_exported', { format: 'pdf' });
```

**2. Use consistent naming:**

```typescript
// Good: snake_case for events
posthog.capture('user_signed_up');
posthog.capture('subscription_started');

// Good: camelCase for properties
posthog.capture('purchase', {
  productId: '123',
  productName: 'Pro Plan',
  amount: 29.99,
});
```

**3. Add context to events:**

```typescript
posthog.capture('button_clicked', {
  buttonText: 'Upgrade Now',
  location: 'pricing_page',
  plan: 'free',
  experimentVariant: 'new_design',
});
```

---

### Verify Setup

**Check events are being tracked:**

```bash
# In PostHog dashboard
# Activity → Live Events
# Should see events streaming in real-time

# Common events to verify:
✓ $pageview (automatic)
✓ user_signed_up (backend)
✓ subscription_started (backend)
✓ feature_used_* (backend/frontend)
✓ Custom button clicks (frontend)
```

---

**Analytics integration complete!** PostHog is now tracking user behavior and product metrics.

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

_Part of [Ultra-Dex v6.0.0 OVERPOWERED](https://github.com/Srujan0798/Ultra-Dex) - Professional AI Orchestration Meta Layer_
