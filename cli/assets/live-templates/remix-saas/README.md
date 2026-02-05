# Remix SaaS Starter

Production-ready Remix SaaS template with:
- **Authentication**: Clerk
- **Payments**: Stripe (checkout, webhooks, subscriptions)
- **Database**: Prisma + PostgreSQL
- **Styling**: Tailwind CSS

## Quick Start

```bash
npm install
cp .env.example .env
# Add your API keys
npx prisma migrate dev
npm run dev
```

## Environment Variables

```env
DATABASE_URL="postgresql://..."
CLERK_PUBLISHABLE_KEY="pk_..."
CLERK_SECRET_KEY="sk_..."
STRIPE_SECRET_KEY="sk_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
APP_URL="http://localhost:3000"
```

## Features

- ✅ Clerk authentication with SSR
- ✅ Stripe subscriptions with webhooks
- ✅ Prisma ORM with PostgreSQL
- ✅ Dashboard with usage stats
- ✅ Tailwind CSS styling

Generated with [Ultra-Dex CLI](https://github.com/Srujan0798/Ultra-Dex)
