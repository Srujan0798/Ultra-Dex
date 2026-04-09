# Ultra-Dex Production Integrations

## ✅ Completed Integrations

### 1. Better Stack (Logtail) - Logging & Monitoring

**Status:** ✅ Fully Integrated

**Features:**

- Structured logging with Winston + Logtail transport
- Event tracking: `user_signup`, `user_login`, `ai_request`, `billing_upgrade`, errors
- HTTP request logging with duration, status codes, IP tracking
- Automatic log flushing on process exit
- 100k logs/month on free tier

**Setup:**

1. Create account at https://betterstack.com/
2. Get Source Token from https://logs.betterstack.com/team/<team>/sources
3. Add to `.env.production`:
   ```
   BETTER_STACK_SOURCE_TOKEN=your-token-here
   ```
4. Logs appear in Better Stack dashboard within 60 seconds

**Usage:**

```typescript
import { logEvent, logAIRequest, logUserSignup } from 'src/core/monitoring/better-stack-logger.js';

// Log custom events
logEvent('custom_event', { userId: '123', metadata: { key: 'value' } });

// Log AI requests
logAIRequest({
  userId: 'user_123',
  provider: 'openai',
  model: 'gpt-4',
  tokens: 1500,
  cost: 0.03,
  latency: 250,
});

// Log user signup
logUserSignup('user_123', 'user@example.com', { referral: 'google' });
```

**Files:**

- `src/core/monitoring/better-stack-logger.ts` - Main logger implementation
- `src/core/server/production-server.ts` - HTTP request logging

---

### 2. Clerk - Authentication

**Status:** ✅ Fully Integrated

**Features:**

- User registration via Clerk API
- Session management with Clerk sessions
- Secure login/logout
- API key support for local user records
- Auth event logging to Better Stack

**Setup:**

1. Create account at https://clerk.com/
2. Create application in Clerk Dashboard
3. Add to `.env.production`:
   ```
   CLERK_PUBLISHABLE_KEY=pk_live_xxx
   CLERK_SECRET_KEY=sk_live_xxx
   ```

**API Endpoints:**

- `POST /api/auth/register` - Create new user
- `POST /api/auth/login` - Login user
- `GET /api/user/profile` - Get user profile
- `POST /api/auth/logout` - Logout (revoke session)

**Example:**

```bash
# Register
curl -X POST https://ultra-dex.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"secure123","name":"John Doe"}'

# Login
curl -X POST https://ultra-dex.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"secure123"}'

# Get Profile
curl https://ultra-dex.onrender.com/api/user/profile \
  -H "Authorization: Bearer <session_token>"
```

**Files:**

- `src/core/auth/auth-service.ts` - Clerk integration
- `src/core/server/production-server.ts` - Auth endpoints

---

### 3. Stripe - Billing & Subscriptions

**Status:** ✅ Fully Integrated

**Features:**

- Real Stripe customer creation
- Subscription management (Free, Pro $29, Enterprise $99)
- Webhook handling for events: `invoice.paid`, `subscription.created`, `subscription.deleted`
- Billing event logging to Better Stack
- Usage tracking per tier

**Setup:**

#### Step 1: Stripe Dashboard Setup

1. Go to https://dashboard.stripe.com/
2. Create products:
   - **Pro**: $29/month recurring
   - **Enterprise**: $99/month recurring
3. Copy Price IDs (e.g., `price_1ABC...`)

#### Step 2: Environment Variables

Add to `.env.production`:

```
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRICE_PRO=price_xxx
STRIPE_PRICE_ENTERPRISE=price_xxx
```

#### Step 3: Webhook Configuration

1. Go to https://dashboard.stripe.com/webhooks
2. Add endpoint: `https://ultra-dex.onrender.com/api/billing/webhook`
3. Select events:
   - `invoice.paid`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy signing secret → `STRIPE_WEBHOOK_SECRET`

**API Endpoints:**

- `GET /api/billing/pricing` - Get pricing tiers
- `POST /api/billing/subscribe` - Create subscription
- `GET /api/billing/usage` - Get current month usage
- `POST /api/billing/cancel` - Cancel subscription
- `POST /api/billing/webhook` - Stripe webhook (internal)

**Example:**

```bash
# Get pricing
curl https://ultra-dex.onrender.com/api/billing/pricing

# Subscribe to Pro
curl -X POST https://ultra-dex.onrender.com/api/billing/subscribe \
  -H "Authorization: Bearer <session_token>" \
  -H "Content-Type: application/json" \
  -d '{"tierId":"pro"}'

# Check usage
curl https://ultra-dex.onrender.com/api/billing/usage \
  -H "Authorization: Bearer <session_token>"

# Cancel subscription
curl -X POST https://ultra-dex.onrender.com/api/billing/cancel \
  -H "Authorization: Bearer <session_token>"
```

**Files:**

- `src/core/billing/billing-service.ts` - Stripe integration
- `src/core/billing/pricing-tiers.ts` - Tier definitions
- `src/core/server/production-server.ts` - Billing endpoints + webhook

---

## 🧪 Testing

### Local Testing

```bash
# Run unit tests
npm test

# Run specific test
npm test -- tests/core/billing.test.js

# Test with coverage
npm run test:coverage
```

### Production Testing

1. **Better Stack Logs:**
   - Trigger any API call
   - Check https://logs.betterstack.com/ within 1 minute
   - Look for `http_request`, `user_signup`, etc.

2. **Clerk Auth:**
   - Register a test user
   - Verify in Clerk Dashboard: https://dashboard.clerk.com/
   - Check Better Stack for `user_signup` event

3. **Stripe Billing:**
   - Use Stripe test mode: `sk_test_xxx`
   - Test card: `4242 4242 4242 4242`
   - Subscribe to Pro tier
   - Verify in Stripe Dashboard: https://dashboard.stripe.com/test/subscriptions
   - Check Better Stack for `subscription_created` event

---

## 📊 Monitoring Dashboard

All events are logged to Better Stack:

**User Events:**

- `user_signup` - New user registration
- `user_login` - User login
- `billing_upgrade` - Tier upgrade

**AI Events:**

- `ai_request` - AI provider calls (provider, model, tokens, cost, latency)

**Billing Events:**

- `subscription_created` - New subscription
- `payment_succeeded` - Successful payment
- `subscription_cancelled` - Cancelled subscription

**System Events:**

- `http_request` - All HTTP requests
- `error` - Application errors

---

## 🔧 Troubleshooting

### Better Stack logs not appearing

- ✅ Check `BETTER_STACK_SOURCE_TOKEN` is set
- ✅ Verify token at https://logs.betterstack.com/
- ✅ Wait 60 seconds for logs to appear
- ✅ Check console for "Better Stack logging error"

### Clerk authentication failing

- ✅ Check `CLERK_SECRET_KEY` is set
- ✅ Verify app in Clerk Dashboard
- ✅ Test with Clerk development keys first
- ✅ Check Better Stack logs for auth errors

### Stripe webhook not working

- ✅ Check `STRIPE_WEBHOOK_SECRET` is set
- ✅ Verify webhook endpoint in Stripe Dashboard
- ✅ Use Stripe CLI for local testing: `stripe listen --forward-to localhost:3000/api/billing/webhook`
- ✅ Check Better Stack logs for webhook errors

### Subscription creation failing

- ✅ Check `STRIPE_PRICE_PRO` and `STRIPE_PRICE_ENTERPRISE` are set
- ✅ Verify Price IDs exist in Stripe Dashboard
- ✅ Test with Stripe test mode first
- ✅ Check Better Stack logs for detailed error

---

## 🚀 Deployment Checklist

- [ ] Set all environment variables in Render/hosting platform
- [ ] Configure Stripe webhook URL
- [ ] Test authentication flow
- [ ] Test subscription flow
- [ ] Verify logs appear in Better Stack
- [ ] Set up Better Stack alerts for errors
- [ ] Test webhook with Stripe test events
- [ ] Switch to Stripe live mode
- [ ] Monitor first production transactions

---

## 📚 Resources

- **Better Stack Docs:** https://betterstack.com/docs/logs/
- **Clerk Docs:** https://clerk.com/docs
- **Stripe Docs:** https://stripe.com/docs/api
- **Stripe Testing:** https://stripe.com/docs/testing

---

## 💡 Next Steps

1. **Database Persistence:** Replace in-memory Maps with PostgreSQL
2. **Email Notifications:** Add SendGrid/Resend for transactional emails
3. **Analytics:** Add Mixpanel/PostHog for user analytics
4. **Error Tracking:** Add Sentry for error tracking
5. **Rate Limiting:** Implement Redis-based rate limiting
6. **API Documentation:** Add Swagger/OpenAPI docs
