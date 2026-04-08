# Ultra-Dex Production Deployment Guide

## 🎯 Quick Start

This guide walks you through deploying Ultra-Dex with Better Stack logging, Clerk authentication, and Stripe billing.

---

## 📋 Prerequisites

1. **Accounts Required:**
   - [ ] Better Stack account (https://betterstack.com/)
   - [ ] Clerk account (https://clerk.com/)
   - [ ] Stripe account (https://stripe.com/)
   - [ ] Hosting (Render, Heroku, AWS, etc.)

2. **Tools:**
   - [ ] Node.js ≥18
   - [ ] npm or yarn
   - [ ] Git

---

## 🔧 Step 1: Better Stack Setup

### 1.1 Create Source Token

1. Go to https://betterstack.com/
2. Sign up or log in
3. Navigate to **Logs** → **Sources**
4. Click **Add Source**
5. Select **Node.js** or **Custom**
6. Copy the **Source Token** (starts with `bttr_...`)

### 1.2 Configure

Add to `.env.production`:
```env
BETTER_STACK_SOURCE_TOKEN=bttr_xxxxxxxxxxxxxxxx
LOG_LEVEL=info
```

### 1.3 Verify

After deployment, make an API call:
```bash
curl https://your-app.onrender.com/health
```

Check https://logs.betterstack.com/ - you should see the request within 60 seconds.

---

## 🔐 Step 2: Clerk Authentication Setup

### 2.1 Create Application

1. Go to https://dashboard.clerk.com/
2. Click **Create Application**
3. Choose:
   - **Name:** Ultra-Dex Production
   - **Authentication:** Email + Password
   - Click **Create**

### 2.2 Get API Keys

1. In Clerk Dashboard, go to **API Keys**
2. Copy:
   - **Publishable Key** (starts with `pk_live_...`)
   - **Secret Key** (starts with `sk_live_...`)

### 2.3 Configure

Add to `.env.production`:
```env
CLERK_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxxxxx
CLERK_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxx
```

### 2.4 Test

Register a user:
```bash
curl -X POST https://your-app.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "name": "Test User"
  }'
```

Response:
```json
{
  "user": {
    "id": "user_xxx",
    "email": "test@example.com",
    "name": "Test User",
    "tier": "free",
    "apiKey": "ud_xxx"
  },
  "session": {
    "token": "sess_xxx",
    "expiresAt": "2026-04-15T..."
  }
}
```

Verify in:
- ✅ Clerk Dashboard → Users (new user appears)
- ✅ Better Stack Logs (user_signup event)

---

## 💳 Step 3: Stripe Billing Setup

### 3.1 Create Products

1. Go to https://dashboard.stripe.com/products
2. Click **Add Product**

**Product 1: Pro**
- Name: `Ultra-Dex Pro`
- Description: `Professional tier with 10K requests/month`
- Pricing: `$29.00 USD / month`
- Click **Save**
- Copy **Price ID** (e.g., `price_1ABC...`)

**Product 2: Enterprise**
- Name: `Ultra-Dex Enterprise`
- Description: `Enterprise tier with unlimited requests`
- Pricing: `$99.00 USD / month`
- Click **Save**
- Copy **Price ID** (e.g., `price_1DEF...`)

### 3.2 Get API Keys

1. Go to https://dashboard.stripe.com/apikeys
2. Toggle to **Live mode** (important!)
3. Copy:
   - **Publishable Key** (starts with `pk_live_...`)
   - **Secret Key** (starts with `sk_live_...`)

### 3.3 Configure Webhook

1. Go to https://dashboard.stripe.com/webhooks
2. Click **Add Endpoint**
3. Configure:
   - **Endpoint URL:** `https://your-app.onrender.com/api/billing/webhook`
   - **Events to send:**
     - [x] `invoice.paid`
     - [x] `customer.subscription.created`
     - [x] `customer.subscription.updated`
     - [x] `customer.subscription.deleted`
4. Click **Add Endpoint**
5. Copy **Signing Secret** (starts with `whsec_...`)

### 3.4 Environment Variables

Add to `.env.production`:
```env
# Stripe Keys
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxx

# Price IDs (from products created above)
STRIPE_PRICE_PRO=price_1ABC...
STRIPE_PRICE_ENTERPRISE=price_1DEF...
```

### 3.5 Test Subscription Flow

**3.5.1 Login:**
```bash
TOKEN=$(curl -X POST https://your-app.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePass123!"}' \
  | jq -r '.session.token')
```

**3.5.2 Subscribe to Pro:**
```bash
curl -X POST https://your-app.onrender.com/api/billing/subscribe \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tierId":"pro"}'
```

Response:
```json
{
  "subscription": {
    "id": "sub_xxx",
    "userId": "user_xxx",
    "tierId": "pro",
    "status": "active",
    "currentPeriodEnd": "2026-05-08T..."
  }
}
```

**3.5.3 Verify:**
- ✅ Stripe Dashboard → Subscriptions (new subscription)
- ✅ Better Stack Logs (subscription_created event)
- ✅ Stripe webhook logs (all events received)

---

## 🚀 Step 4: Deploy to Production

### Option A: Render

1. **Connect Repository:**
   - Go to https://render.com/
   - Click **New** → **Web Service**
   - Connect GitHub repo

2. **Configure:**
   - **Name:** ultra-dex-production
   - **Environment:** Node
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run start:server`
   - **Instance Type:** Starter ($7/month) or higher

3. **Environment Variables:**
   Click **Environment** and add all variables from `.env.production`:
   ```
   NODE_ENV=production
   PORT=3000
   BETTER_STACK_SOURCE_TOKEN=bttr_...
   CLERK_PUBLISHABLE_KEY=pk_live_...
   CLERK_SECRET_KEY=sk_live_...
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_PUBLISHABLE_KEY=pk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   STRIPE_PRICE_PRO=price_...
   STRIPE_PRICE_ENTERPRISE=price_...
   ```

4. **Deploy:**
   - Click **Create Web Service**
   - Wait for deployment (3-5 minutes)
   - Note the URL: `https://ultra-dex-production.onrender.com`

5. **Update Stripe Webhook:**
   - Go back to Stripe Dashboard → Webhooks
   - Edit endpoint URL to: `https://ultra-dex-production.onrender.com/api/billing/webhook`
   - Save

### Option B: Heroku

```bash
# Install Heroku CLI
brew install heroku

# Login
heroku login

# Create app
heroku create ultra-dex-production

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set BETTER_STACK_SOURCE_TOKEN=bttr_...
heroku config:set CLERK_PUBLISHABLE_KEY=pk_live_...
heroku config:set CLERK_SECRET_KEY=sk_live_...
heroku config:set STRIPE_SECRET_KEY=sk_live_...
heroku config:set STRIPE_PUBLISHABLE_KEY=pk_live_...
heroku config:set STRIPE_WEBHOOK_SECRET=whsec_...
heroku config:set STRIPE_PRICE_PRO=price_...
heroku config:set STRIPE_PRICE_ENTERPRISE=price_...

# Deploy
git push heroku main

# Check logs
heroku logs --tail
```

---

## ✅ Step 5: Verification

### 5.1 Health Check
```bash
curl https://your-app.onrender.com/health
```
Expected: `{"status":"ok","version":"3.0.0",...}`

### 5.2 Authentication
```bash
# Register
curl -X POST https://your-app.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"verify@test.com","password":"Test123!","name":"Verify User"}'
```

Check:
- ✅ Clerk Dashboard → Users (new user)
- ✅ Better Stack → `user_signup` event

### 5.3 Billing
```bash
# Login first
TOKEN=...

# Get pricing
curl https://your-app.onrender.com/api/billing/pricing

# Subscribe to Pro
curl -X POST https://your-app.onrender.com/api/billing/subscribe \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tierId":"pro"}'
```

Check:
- ✅ Stripe Dashboard → Subscriptions (new subscription)
- ✅ Better Stack → `subscription_created` event
- ✅ Stripe webhook logs (events received)

### 5.4 Monitoring
Go to https://logs.betterstack.com/ and verify events:
- ✅ `http_request` - API calls
- ✅ `user_signup` - New users
- ✅ `user_login` - User logins
- ✅ `subscription_created` - New subscriptions
- ✅ `payment_succeeded` - Payments

---

## 📊 Step 6: Set Up Alerts

### Better Stack Alerts

1. Go to https://betterstack.com/alerts
2. Click **Create Alert**
3. **Error Rate Alert:**
   - Name: "High Error Rate"
   - Condition: `level:error`
   - Threshold: > 10 errors in 5 minutes
   - Notify: Email/Slack

4. **Failed Payments:**
   - Name: "Payment Failures"
   - Condition: `event:payment_failed`
   - Threshold: Any occurrence
   - Notify: Email (urgent)

### Stripe Notifications

1. Go to https://dashboard.stripe.com/settings/notifications
2. Enable:
   - [x] Failed payments
   - [x] Subscription cancellations
   - [x] Disputes

---

## 🔍 Troubleshooting

### Logs not appearing in Better Stack
```bash
# Check environment variable
echo $BETTER_STACK_SOURCE_TOKEN

# Test locally
BETTER_STACK_SOURCE_TOKEN=bttr_xxx npm run start:server

# Make a request
curl http://localhost:3000/health

# Wait 60 seconds, check Better Stack
```

### Clerk authentication errors
```bash
# Verify keys
curl https://api.clerk.com/v1/users \
  -H "Authorization: Bearer $CLERK_SECRET_KEY"

# Check Clerk Dashboard for error logs
```

### Stripe webhook failures
```bash
# Test webhook locally with Stripe CLI
stripe listen --forward-to localhost:3000/api/billing/webhook

# Trigger test event
stripe trigger customer.subscription.created

# Check logs
tail -f logs/production.log | grep webhook
```

---

## 🎉 Success Criteria

Your deployment is successful when:

- [x] Health endpoint returns `200 OK`
- [x] User registration works → Clerk Dashboard shows user
- [x] Login returns valid session token
- [x] Subscription creation → Stripe Dashboard shows subscription
- [x] Webhook events logged in Better Stack
- [x] All API endpoints respond correctly
- [x] No errors in Better Stack logs

---

## 📈 Next Steps

1. **Database:** Migrate from in-memory to PostgreSQL/MongoDB
2. **Caching:** Add Redis for session storage
3. **Email:** Integrate SendGrid for transactional emails
4. **Monitoring:** Add uptime monitoring with Better Stack
5. **CDN:** Use Cloudflare for static assets
6. **Backups:** Automated database backups
7. **Scaling:** Horizontal scaling with load balancer

---

## 🆘 Support

- **Documentation:** See `INTEGRATIONS.md`
- **Issues:** GitHub Issues
- **Slack:** Join community
- **Email:** support@ultra-dex.com

---

## 📚 Resources

- [Better Stack Docs](https://betterstack.com/docs/logs/)
- [Clerk Docs](https://clerk.com/docs)
- [Stripe Docs](https://stripe.com/docs)
- [Render Docs](https://render.com/docs)
- [Ultra-Dex GitHub](https://github.com/yourusername/ultra-dex)
