# SvelteKit SaaS Starter

Production-ready SvelteKit SaaS template with:
- **Authentication**: Clerk
- **Payments**: Stripe
- **Database**: Prisma + PostgreSQL
- **Styling**: Tailwind CSS

## Quick Start

```bash
npm install
cp .env.example .env
npx prisma migrate dev
npm run dev
```

## Environment Variables

```env
DATABASE_URL="postgresql://..."
STRIPE_SECRET_KEY="sk_..."
PUBLIC_CLERK_PUBLISHABLE_KEY="pk_..."
CLERK_SECRET_KEY="sk_..."
PUBLIC_APP_URL="http://localhost:5173"
```

## Features

- ✅ Clerk authentication
- ✅ Stripe subscriptions
- ✅ Prisma ORM
- ✅ Dashboard with usage stats
- ✅ Tailwind CSS

Generated with [Ultra-Dex CLI](https://github.com/Srujan0798/Ultra-Dex)
