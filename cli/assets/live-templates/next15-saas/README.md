# Next.js SaaS Starter

Production-ready SaaS template with:
- **Authentication**: Clerk
- **Payments**: Stripe (checkout, webhooks, subscriptions)
- **Database**: Prisma + PostgreSQL
- **Email**: Resend
- **File Upload**: AWS S3
- **Styling**: Tailwind CSS

## Quick Start

```bash
npm install
cp .env.example .env.local
# Add your API keys to .env.local
npx prisma migrate dev
npm run dev
```

## Environment Variables

See `.env.example` for all required variables.

## Features

- ✅ User authentication with Clerk
- ✅ Subscription management with Stripe
- ✅ Admin dashboard with analytics
- ✅ User dashboard with usage stats
- ✅ Webhook handlers for Stripe events
- ✅ Transactional emails with Resend
- ✅ File upload with S3 presigned URLs
- ✅ TypeScript types for all models
- ✅ Reusable UI components

## Stack

- Next.js 15
- React 19
- Prisma ORM
- PostgreSQL
- Tailwind CSS
- TypeScript

Generated with [Ultra-Dex CLI](https://github.com/Srujan0798/Ultra-Dex)
